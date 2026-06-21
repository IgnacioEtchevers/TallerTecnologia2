import React from "react";
import { usePublicClient } from "wagmi"
import { sepolia } from "wagmi/chains";
import { jobMarketplaceAbi } from "../abis";
import { MARKETPLACE_ADDRESS } from "../contract";
import { useQuery } from "@tanstack/react-query";
import { JobCard } from "./JobCard";

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

    const n = events?.length ?? 0;
    const resolveWording = (n: number): string => {
        return n === 1 ? 'trabajo' : 'trabajos'; 
    }

    return (
        <section className="card">
            <h2>Tablero de trabajos</h2>

            {n === 0 && <p>No hay trabajos todavía.</p>}

            {events?.map((event) => {
                const { id, client, budget, description } = event.args;
                if (id === undefined) return null;
                return (
                <JobCard
                    key={id.toString()}
                    id={id}
                    client={client ?? ""}
                    budget={budget ?? 0n}
                    description={description ?? ""}
                />
                );
            })}

            <p>Hay {n} {resolveWording(n)} publicados</p>
        </section>
    );
}