import { SemaphoreEthers } from "@semaphore-protocol/data";
import { BigNumber, utils } from "ethers";
import getNextConfig from "next/config";
import { useCallback, useState } from "react";
import { SemaphoreContextType } from "../context/SemaphoreContext";

const { publicRuntimeConfig: env } = getNextConfig();

const ethereumNetwork = env.DEFAULT_NETWORK === "scroll-sepolia" ? "https://scroll-sepolia-testnet.rpc.thirdweb.com/" : env.DEFAULT_NETWORK;

export default function useSemaphore(): SemaphoreContextType {
    const [_users, setUsers] = useState<any[]>([]);
    const [_feedback, setFeedback] = useState<string[]>([]);

    // Correct handling for groupId to ensure it's properly passed as a string
    const groupId = env.GROUP_ID ? String(env.GROUP_ID) : "";

    const refreshUsers = useCallback(async (): Promise<void> => {
        const semaphore = new SemaphoreEthers(ethereumNetwork, {
            address: env.SEMAPHORE_CONTRACT_ADDRESS,
        });

        if (!groupId) {
            console.error("GroupId is undefined or not a string.");
            return;
        }

        try {
            const members = await semaphore.getGroupMembers(groupId);
            setUsers(members);
        } catch (error) {
            console.error("Error fetching group members:", error);
        }
    }, [groupId]);

    const addUser = useCallback((user: any) => {
        setUsers((prevUsers) => [...prevUsers, user]);
    }, []);

    const refreshFeedback = useCallback(async (): Promise<void> => {
        const semaphore = new SemaphoreEthers(ethereumNetwork, {
            address: env.SEMAPHORE_CONTRACT_ADDRESS,
        });

        if (!groupId) {
            console.error("GroupId is undefined or not a string.");
            return;
        }

        try {
            const proofs = await semaphore.getGroupVerifiedProofs(groupId);
            setFeedback(proofs.map(({ signal }: any) => {
                try {
                    return utils.parseBytes32String(BigNumber.from(signal).toHexString());
                } catch (error) {
                    console.error("Error parsing signal to string:", error);
                    return "Invalid signal";
                }
            }));
        } catch (error) {
            console.error("Error fetching group verified proofs:", error);
        }
    }, [groupId]);

    const addFeedback = useCallback((feedback: string) => {
        setFeedback((prevFeedback) => [...prevFeedback, feedback]);
    }, []);

    return {
        _users,
        _feedback,
        refreshUsers,
        addUser,
        refreshFeedback,
        addFeedback,
    };
}
