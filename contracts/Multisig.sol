// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Multisig programatico: guarda una lista de signers y un threshold.
// Cualquier signer puede proponer una tx; cuando se juntan threshold aprobaciones,
// cualquier signer puede ejecutarla. El proposer puede cancelarla antes de ejecutar.
//
// Los signers son FIJOS en el deploy (no hay funciones para agregar/quitar).
contract Multisig {
    address[] public signers;
    mapping(address => bool) public isSigner;
    uint256 public threshold;

    struct Propuesta {
        address proposer;
        address to;
        uint256 value;
        bytes data;
        uint256 approvals;
        bool executed;
        bool cancelled;
    }

    Propuesta[] private propuestas;
    // id => signer => aprobo?
    mapping(uint256 => mapping(address => bool)) public approvedBy;

    event ProposalCreated(
        uint256 indexed id,
        address indexed proposer,
        address indexed to,
        uint256 value,
        bytes data
    );
    event Approved(uint256 indexed id, address indexed signer, uint256 approvals);
    event Executed(uint256 indexed id, address indexed executor);
    event Cancelled(uint256 indexed id, address indexed by);
    event Deposit(address indexed from, uint256 amount);

    modifier onlySigner() {
        require(isSigner[msg.sender], "No sos signer");
        _;
    }

    modifier existeProp(uint256 id) {
        require(id < propuestas.length, "Propuesta no existe");
        _;
    }

    constructor(address[] memory _signers, uint256 _threshold) {
        require(_signers.length > 0, "Sin signers");
        require(_threshold > 0 && _threshold <= _signers.length, "Threshold invalido");

        for (uint256 i = 0; i < _signers.length; i++) {
            address s = _signers[i];
            require(s != address(0), "Signer cero");
            require(!isSigner[s], "Signer repetido");
            isSigner[s] = true;
            signers.push(s);
        }
        threshold = _threshold;
    }

    function propose(address to, uint256 value, bytes calldata data)
        external
        onlySigner
        returns (uint256 id)
    {
        require(to != address(0), "Destino cero");

        propuestas.push(Propuesta({
            proposer: msg.sender,
            to: to,
            value: value,
            data: data,
            approvals: 0,
            executed: false,
            cancelled: false
        }));

        id = propuestas.length - 1;
        emit ProposalCreated(id, msg.sender, to, value, data);
    }

    function approve(uint256 id) external onlySigner existeProp(id) {
        Propuesta storage p = propuestas[id];
        require(!p.executed, "Ya ejecutada");
        require(!p.cancelled, "Cancelada");
        require(!approvedBy[id][msg.sender], "Ya aprobaste");

        approvedBy[id][msg.sender] = true;
        p.approvals += 1;

        emit Approved(id, msg.sender, p.approvals);
    }

    function execute(uint256 id) external onlySigner existeProp(id) {
        Propuesta storage p = propuestas[id];
        require(!p.executed, "Ya ejecutada");
        require(!p.cancelled, "Cancelada");
        require(p.approvals >= threshold, "Faltan aprobaciones");
        require(address(this).balance >= p.value, "Sin fondos");

        // Effects antes que interactions
        p.executed = true;

        (bool ok, ) = p.to.call{value: p.value}(p.data);
        require(ok, "Call fallo");

        emit Executed(id, msg.sender);
    }

    function cancel(uint256 id) external existeProp(id) {
        Propuesta storage p = propuestas[id];
        require(msg.sender == p.proposer, "Solo el proposer");
        require(!p.executed, "Ya ejecutada");
        require(!p.cancelled, "Ya cancelada");

        p.cancelled = true;
        emit Cancelled(id, msg.sender);
    }

    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }

    // ---- getters ----

    function totalSigners() external view returns (uint256) {
        return signers.length;
    }

    function getSigners() external view returns (address[] memory) {
        return signers;
    }

    function proposalCount() external view returns (uint256) {
        return propuestas.length;
    }

    // Devolvemos los campos sueltos porque structs con bytes no son tan comodos
    // de leer desde afuera en algunos clientes.
    function getProposal(uint256 id)
        external
        view
        existeProp(id)
        returns (
            address proposer,
            address to,
            uint256 value,
            bytes memory data,
            uint256 approvals,
            bool executed,
            bool cancelled
        )
    {
        Propuesta storage p = propuestas[id];
        return (p.proposer, p.to, p.value, p.data, p.approvals, p.executed, p.cancelled);
    }
}
