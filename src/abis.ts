// ABI del contrato Multisig (Entrega 2)
export const multisigAbi = [
  // ---- reads ----
  {
    type: "function",
    name: "threshold",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "totalSigners",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "getSigners",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address[]" }],
  },
  {
    type: "function",
    name: "proposalCount",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "isSigner",
    stateMutability: "view",
    inputs: [{ type: "address" }],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "approvedBy",
    stateMutability: "view",
    inputs: [{ type: "uint256" }, { type: "address" }],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "getProposal",
    stateMutability: "view",
    inputs: [{ type: "uint256" }],
    outputs: [
      { name: "proposer", type: "address" },
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
      { name: "data", type: "bytes" },
      { name: "approvals", type: "uint256" },
      { name: "executed", type: "bool" },
      { name: "cancelled", type: "bool" },
    ],
  },
  // ---- writes ----
  {
    type: "function",
    name: "propose",
    stateMutability: "nonpayable",
    inputs: [
      { type: "address" },
      { type: "uint256" },
      { type: "bytes" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [{ type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "execute",
    stateMutability: "nonpayable",
    inputs: [{ type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "cancel",
    stateMutability: "nonpayable",
    inputs: [{ type: "uint256" }],
    outputs: [],
  },
  // ---- eventos ----
  {
    type: "event",
    name: "ProposalCreated",
    anonymous: false,
    inputs: [
      { indexed: true, name: "id", type: "uint256" },
      { indexed: true, name: "proposer", type: "address" },
      { indexed: true, name: "to", type: "address" },
      { indexed: false, name: "value", type: "uint256" },
      { indexed: false, name: "data", type: "bytes" },
    ],
  },
  {
    type: "event",
    name: "Approved",
    anonymous: false,
    inputs: [
      { indexed: true, name: "id", type: "uint256" },
      { indexed: true, name: "signer", type: "address" },
      { indexed: false, name: "approvals", type: "uint256" },
    ],
  },
  {
    type: "event",
    name: "Executed",
    anonymous: false,
    inputs: [
      { indexed: true, name: "id", type: "uint256" },
      { indexed: true, name: "executor", type: "address" },
    ],
  },
  {
    type: "event",
    name: "Cancelled",
    anonymous: false,
    inputs: [
      { indexed: true, name: "id", type: "uint256" },
      { indexed: true, name: "by", type: "address" },
    ],
  },
] as const;

// ABI del contrato JobMarketplace (Entrega Final)
export const jobMarketplaceAbi = [
  {
    "type": "event",
    "name": "Completed",
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "name": "id",
        "type": "uint256"
      },
      {
        "indexed": true,
        "name": "provider",
        "type": "address"
      },
      {
        "indexed": false,
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "name": "reason",
        "type": "bytes32"
      }
    ]
  },
  {
    "type": "event",
    "name": "Expired",
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "name": "id",
        "type": "uint256"
      },
      {
        "indexed": false,
        "name": "amount",
        "type": "uint256"
      }
    ]
  },
  {
    "type": "event",
    "name": "Funded",
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "name": "id",
        "type": "uint256"
      },
      {
        "indexed": true,
        "name": "client",
        "type": "address"
      },
      {
        "indexed": false,
        "name": "amount",
        "type": "uint256"
      }
    ]
  },
  {
    "type": "event",
    "name": "JobCreated",
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "name": "id",
        "type": "uint256"
      },
      {
        "indexed": true,
        "name": "client",
        "type": "address"
      },
      {
        "indexed": true,
        "name": "evaluator",
        "type": "address"
      },
      {
        "indexed": false,
        "name": "provider",
        "type": "address"
      },
      {
        "indexed": false,
        "name": "budget",
        "type": "uint256"
      },
      {
        "indexed": false,
        "name": "expiresAt",
        "type": "uint64"
      },
      {
        "indexed": false,
        "name": "description",
        "type": "string"
      }
    ]
  },
  {
    "type": "event",
    "name": "ProviderSet",
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "name": "id",
        "type": "uint256"
      },
      {
        "indexed": true,
        "name": "provider",
        "type": "address"
      }
    ]
  },
  {
    "type": "event",
    "name": "Rejected",
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "name": "id",
        "type": "uint256"
      },
      {
        "indexed": true,
        "name": "by",
        "type": "address"
      },
      {
        "indexed": false,
        "name": "reason",
        "type": "bytes32"
      }
    ]
  },
  {
    "type": "event",
    "name": "Submitted",
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "name": "id",
        "type": "uint256"
      },
      {
        "indexed": false,
        "name": "deliverableRef",
        "type": "bytes32"
      }
    ]
  },
  {
    "type": "function",
    "name": "claimRefund",
    "stateMutability": "nonpayable",
    "inputs": [
      {
        "name": "id",
        "type": "uint256"
      }
    ],
    "outputs": []
  },
  {
    "type": "function",
    "name": "complete",
    "stateMutability": "nonpayable",
    "inputs": [
      {
        "name": "id",
        "type": "uint256"
      },
      {
        "name": "reason",
        "type": "bytes32"
      }
    ],
    "outputs": []
  },
  {
    "type": "function",
    "name": "createJob",
    "stateMutability": "nonpayable",
    "inputs": [
      {
        "name": "description",
        "type": "string"
      },
      {
        "name": "budget",
        "type": "uint256"
      },
      {
        "name": "evaluator",
        "type": "address"
      },
      {
        "name": "provider",
        "type": "address"
      },
      {
        "name": "expiresAt",
        "type": "uint64"
      }
    ],
    "outputs": [
      {
        "name": "id",
        "type": "uint256"
      }
    ]
  },
  {
    "type": "function",
    "name": "fund",
    "stateMutability": "nonpayable",
    "inputs": [
      {
        "name": "id",
        "type": "uint256"
      }
    ],
    "outputs": []
  },
  {
    "type": "function",
    "name": "getJob",
    "stateMutability": "view",
    "inputs": [
      {
        "name": "id",
        "type": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "client",
        "type": "address"
      },
      {
        "name": "provider",
        "type": "address"
      },
      {
        "name": "evaluator",
        "type": "address"
      },
      {
        "name": "budget",
        "type": "uint256"
      },
      {
        "name": "expiresAt",
        "type": "uint64"
      },
      {
        "name": "deliverableRef",
        "type": "bytes32"
      },
      {
        "name": "status",
        "type": "uint8"
      }
    ]
  },
  {
    "type": "function",
    "name": "jobCount",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [
      {
        "type": "uint256"
      }
    ]
  },
  {
    "type": "function",
    "name": "reject",
    "stateMutability": "nonpayable",
    "inputs": [
      {
        "name": "id",
        "type": "uint256"
      },
      {
        "name": "reason",
        "type": "bytes32"
      }
    ],
    "outputs": []
  },
  {
    "type": "function",
    "name": "setProvider",
    "stateMutability": "nonpayable",
    "inputs": [
      {
        "name": "id",
        "type": "uint256"
      },
      {
        "name": "provider",
        "type": "address"
      }
    ],
    "outputs": []
  },
  {
    "type": "function",
    "name": "submit",
    "stateMutability": "nonpayable",
    "inputs": [
      {
        "name": "id",
        "type": "uint256"
      },
      {
        "name": "deliverableRef",
        "type": "bytes32"
      }
    ],
    "outputs": []
  },
  {
    "type": "function",
    "name": "token",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [
      {
        "type": "address"
      }
    ]
  }
] as const;

// ABI minimo del ERC-20 de pago (solo lo que usa el front: approve/allowance/balance).
// mint esta solo porque el token es un MockERC20 de testnet y conviene poder darse fondos.
export const erc20Abi = [
  {
    "type": "function",
    "name": "approve",
    "stateMutability": "nonpayable",
    "inputs": [
      {
        "name": "spender",
        "type": "address"
      },
      {
        "name": "amount",
        "type": "uint256"
      }
    ],
    "outputs": [
      {
        "type": "bool"
      }
    ]
  },
  {
    "type": "function",
    "name": "allowance",
    "stateMutability": "view",
    "inputs": [
      {
        "name": "owner",
        "type": "address"
      },
      {
        "name": "spender",
        "type": "address"
      }
    ],
    "outputs": [
      {
        "type": "uint256"
      }
    ]
  },
  {
    "type": "function",
    "name": "balanceOf",
    "stateMutability": "view",
    "inputs": [
      {
        "name": "account",
        "type": "address"
      }
    ],
    "outputs": [
      {
        "type": "uint256"
      }
    ]
  },
  {
    "type": "function",
    "name": "decimals",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [
      {
        "type": "uint8"
      }
    ]
  },
  {
    "type": "function",
    "name": "symbol",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [
      {
        "type": "string"
      }
    ]
  },
  {
    "type": "function",
    "name": "mint",
    "stateMutability": "nonpayable",
    "inputs": [
      {
        "name": "to",
        "type": "address"
      },
      {
        "name": "amount",
        "type": "uint256"
      }
    ],
    "outputs": []
  }
] as const;
