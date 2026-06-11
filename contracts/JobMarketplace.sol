// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Marketplace de empleos con escrow, inspirado en ERC-8183 (Agentic Commerce Protocol).
// Cada trabajo tiene tres roles: cliente (paga), proveedor (entrega) y evaluador
// (libera el pago o reembolsa). El pago es en UN solo token ERC-20, fijado en el deploy.
//
// Igual que en el Multisig (Entrega 2), el contrato es "fijo y facil de auditar":
// el token no se puede cambiar despues del deploy y no traemos OpenZeppelin; usamos
// una interfaz minima del ERC-20 y un lock anti-reentrancy hecho a mano.

// Interfaz minima del ERC-20 que necesitamos. Asumimos un token estandar que
// devuelve bool en transfer/transferFrom (nuestro mock lo cumple).
interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract JobMarketplace {
    // ---- estados de un trabajo ----
    enum Status {
        Open, // creado, todavia sin fondear
        Funded, // el cliente deposito el budget en escrow
        Submitted, // el proveedor entrego el resultado
        Completed, // el evaluador libero el pago al proveedor
        Rejected, // se reembolso al cliente (cancelacion)
        Expired // vencio y se reembolso al cliente
    }

    struct Job {
        address client;
        address provider; // puede arrancar en address(0) si es opcional
        address evaluator;
        uint256 budget; // inmutable desde la creacion
        uint64 expiresAt;
        bytes32 deliverableRef; // puntero off-chain al entregable
        Status status;
    }

    // El token de pago se fija en el deploy y no cambia mas.
    IERC20 public immutable token;

    // Lista de trabajos. La dejamos privada y exponemos getJob/jobCount,
    // igual que con las propuestas del Multisig.
    Job[] private jobs;

    // Lock simple anti-reentrancy (mismo espiritu "a mano" que la Entrega 2).
    // 1 = libre, 2 = adentro de una funcion que mueve fondos.
    uint256 private locked = 1;

    // ---- errores personalizados (la consigna los prefiere sobre strings) ----
    error JobNotFound();
    error NotClient();
    error NotProvider();
    error NotEvaluator();
    error EvaluatorRequired();
    error ZeroAddress();
    error ZeroBudget();
    error InvalidExpiry();
    error ProviderAlreadySet();
    error WrongStatus();
    error NotExpired();
    error Reentrant();
    error TransferFailed();

    // ---- eventos ----
    // description va solo en el evento (no en storage): el Tablero la lee desde
    // los logs de JobCreated y asi nos ahorramos guardar un string caro on-chain.
    event JobCreated(
        uint256 indexed id,
        address indexed client,
        address indexed evaluator,
        address provider,
        uint256 budget,
        uint64 expiresAt,
        string description
    );
    event ProviderSet(uint256 indexed id, address indexed provider);
    event Funded(uint256 indexed id, address indexed client, uint256 amount);
    event Submitted(uint256 indexed id, bytes32 deliverableRef);
    event Completed(uint256 indexed id, address indexed provider, uint256 amount, bytes32 reason);
    event Rejected(uint256 indexed id, address indexed by, bytes32 reason);
    event Expired(uint256 indexed id, uint256 amount);

    modifier noReentrant() {
        if (locked != 1) revert Reentrant();
        locked = 2;
        _;
        locked = 1;
    }

    modifier existeJob(uint256 id) {
        if (id >= jobs.length) revert JobNotFound();
        _;
    }

    constructor(address _token) {
        if (_token == address(0)) revert ZeroAddress();
        token = IERC20(_token);
    }

    // Cualquiera puede crear un trabajo. evaluator es obligatorio, provider opcional.
    function createJob(
        string calldata description,
        uint256 budget,
        address evaluator,
        address provider,
        uint64 expiresAt
    ) external returns (uint256 id) {
        if (evaluator == address(0)) revert EvaluatorRequired();
        if (budget == 0) revert ZeroBudget();
        if (expiresAt <= block.timestamp) revert InvalidExpiry();

        jobs.push(
            Job({
                client: msg.sender,
                provider: provider, // puede ser address(0)
                evaluator: evaluator,
                budget: budget,
                expiresAt: expiresAt,
                deliverableRef: bytes32(0),
                status: Status.Open
            })
        );

        id = jobs.length - 1;
        emit JobCreated(id, msg.sender, evaluator, provider, budget, expiresAt, description);
    }

    // El cliente asigna proveedor a un trabajo Open que todavia no tiene uno.
    function setProvider(uint256 id, address provider) external existeJob(id) {
        Job storage j = jobs[id];
        if (msg.sender != j.client) revert NotClient();
        if (j.status != Status.Open) revert WrongStatus();
        if (provider == address(0)) revert ZeroAddress();
        if (j.provider != address(0)) revert ProviderAlreadySet();

        j.provider = provider;
        emit ProviderSet(id, provider);
    }

    // El cliente deposita el budget en escrow. Requiere approve previo del token.
    function fund(uint256 id) external existeJob(id) noReentrant {
        Job storage j = jobs[id];
        if (msg.sender != j.client) revert NotClient();
        if (j.status != Status.Open) revert WrongStatus();

        // Effects antes de la interaccion (CEI)
        j.status = Status.Funded;

        _pull(j.client, j.budget);
        emit Funded(id, j.client, j.budget);
    }

    // El proveedor entrega el resultado (un puntero off-chain como bytes32).
    function submit(uint256 id, bytes32 deliverableRef) external existeJob(id) {
        Job storage j = jobs[id];
        if (msg.sender != j.provider) revert NotProvider();
        if (j.status != Status.Funded) revert WrongStatus();

        j.deliverableRef = deliverableRef;
        j.status = Status.Submitted;
        emit Submitted(id, deliverableRef);
    }

    // El evaluador libera los fondos al proveedor.
    function complete(uint256 id, bytes32 reason) external existeJob(id) noReentrant {
        Job storage j = jobs[id];
        if (msg.sender != j.evaluator) revert NotEvaluator();
        if (j.status != Status.Submitted) revert WrongStatus();

        j.status = Status.Completed;

        _push(j.provider, j.budget);
        emit Completed(id, j.provider, j.budget, reason);
    }

    // Reembolsa al cliente.
    // - El cliente puede rechazar mientras esta en Open (todavia no fondeo nada).
    // - El evaluador puede rechazar en Funded o Submitted (devuelve el escrow).
    function reject(uint256 id, bytes32 reason) external existeJob(id) noReentrant {
        Job storage j = jobs[id];

        if (j.status == Status.Open) {
            if (msg.sender != j.client) revert NotClient();
            j.status = Status.Rejected;
            emit Rejected(id, msg.sender, reason);
            return;
        }

        if (j.status == Status.Funded || j.status == Status.Submitted) {
            if (msg.sender != j.evaluator) revert NotEvaluator();
            j.status = Status.Rejected;
            _push(j.client, j.budget);
            emit Rejected(id, msg.sender, reason);
            return;
        }

        revert WrongStatus();
    }

    // Reembolso por expiracion.
    // Sin control de acceso ni hooks: la consigna pide que NUNCA pueda quedar bloqueada.
    // No usa el modifier noReentrant; en su lugar aplica CEI (cambia el estado antes
    // de transferir), asi una reentrada cae en WrongStatus.
    function claimRefund(uint256 id) external existeJob(id) {
        Job storage j = jobs[id];
        if (j.status != Status.Funded && j.status != Status.Submitted) revert WrongStatus();
        if (block.timestamp <= j.expiresAt) revert NotExpired();

        uint256 amount = j.budget;
        j.status = Status.Expired;

        if (!token.transfer(j.client, amount)) revert TransferFailed();
        emit Expired(id, amount);
    }

    // ---- helpers internos de movimiento de fondos ----

    function _pull(address from, uint256 amount) private {
        if (!token.transferFrom(from, address(this), amount)) revert TransferFailed();
    }

    function _push(address to, uint256 amount) private {
        if (!token.transfer(to, amount)) revert TransferFailed();
    }

    // ---- getters ----

    function jobCount() external view returns (uint256) {
        return jobs.length;
    }

    // Devolvemos los campos sueltos (no el struct) por la misma razon que en el
    // Multisig: es mas comodo de leer desde el frontend.
    function getJob(uint256 id)
        external
        view
        existeJob(id)
        returns (
            address client,
            address provider,
            address evaluator,
            uint256 budget,
            uint64 expiresAt,
            bytes32 deliverableRef,
            Status status
        )
    {
        Job storage j = jobs[id];
        return (j.client, j.provider, j.evaluator, j.budget, j.expiresAt, j.deliverableRef, j.status);
    }
}
