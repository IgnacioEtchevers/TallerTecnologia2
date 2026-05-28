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
