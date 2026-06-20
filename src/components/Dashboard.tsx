import React from "react";
import { usePublicClient, useReadContract } from "wagmi"
import { sepolia } from "wagmi/chains";
import { formatEther } from "viem";
import { jobMarketplaceAbi } from "../abis";
import { MARKETPLACE_ADDRESS } from "../contract";
import { useQuery } from "@tanstack/react-query";

export const Dashboard = () => {

    const publicClient = usePublicClient({ chainId: sepolia.id });

    const { data: events } = useQuery({
        queryKey: ["jobCreated"],
        queryFn: async () => {
            if (!publicClient) return [];
            return publicClient.getContractEvents({
                address: MARKETPLACE_ADDRESS,
                abi: jobMarketplaceAbi,
                eventName: "JobCreated",
                fromBlock: 0n,
            });
        },
        enabled: Boolean(publicClient),
    })

    const { data: total } = useReadContract({
        address: MARKETPLACE_ADDRESS,
        abi: jobMarketplaceAbi,
        functionName: "jobCount",
        chainId: sepolia.id,
    }); 

    const n = events?.length ?? 0;
    const resolveWording = (n: number): string => {
        return n === 1 ? 'trabajo' : 'trabajos'; 
    }

    return (
        <section>
            <h2>Tablero de trabajos</h2>

            {n === 0 && <p>No hay trabajos todavía.</p>}

            {events?.map((event) => {
                const { id, client, budget, description } = event.args;
                return (
                    <div className="prop" key={id?.toString()}>
                        <b>Trabajo #{id?.toString()}</b>
                        <p>{description}</p>
                        <p>Budget: {formatEther(budget ?? 0n)} LINK</p>
                        <p>Cliente: <code>{client}</code></p>
                    </div>
                );
            })}

            <p>Hay {n} {resolveWording(n)} publicados</p>
        </section>
    );
}