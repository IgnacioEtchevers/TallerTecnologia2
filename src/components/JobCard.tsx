import React from "react";
import { useReadContract } from "wagmi";
import { MARKETPLACE_ADDRESS } from "../contract";
import { jobMarketplaceAbi } from "../abis";
import { sepolia } from "viem/chains";
import { formatEther } from "viem";

type JobCardProps = {
    id: bigint;
    client: string;
    budget: bigint;
    description: string;
    onOpenJob: (id: bigint) => void;
}

const STATE = ["Open", "Funded", "Submitted", "Completed", "Rejected", "Expired"] as const;

export const JobCard = ({
    id,
    client,
    budget,
    description,
    onOpenJob,
}: JobCardProps) => {

    const { data: job } = useReadContract({
        address: MARKETPLACE_ADDRESS,
        abi: jobMarketplaceAbi,
        functionName: "getJob",
        args: [id],
        chainId: sepolia.id,
    });

    const status = job ? Number(job[6]) : undefined;
    const state = status !== undefined ? STATE[status] : "...";

    return (
        <div
          className="prop jobCard"
          onClick={() => onOpenJob(id)}
        >
          <div className="propTop">
            <b>Trabajo #{id.toString()}</b>
            <span className="badge">{state}</span>
          </div>
          <p>{description}</p>
          <p>Budget: {formatEther(budget)} LINK</p>
          <p>Cliente: <code>{client}</code></p>
        </div>
      );
}