import React from "react";
import { useReadContract } from "wagmi"
import { sepolia } from "wagmi/chains";
import { jobMarketplaceAbi } from "../abis";
import { MARKETPLACE_ADDRESS } from "../contract";

export const Dashboard = () => {

    const { data: total } = useReadContract({
        address: MARKETPLACE_ADDRESS,
        abi: jobMarketplaceAbi,
        functionName: "jobCount",
        chainId: sepolia.id,
    }); 

    const n = total ? Number(total) : 0;
    const resolveWording = (n: number): string => {
        return n === 1 ? 'trabajo' : 'trabajos'; 
    }

    return (
        <section>
            <h2>Tablero de trabajos</h2>
            <p>Hay {n} {resolveWording(n)} publicados</p>
        </section>
    );
}