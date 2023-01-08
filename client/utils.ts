import { paywallConfig, network } from "./config/unlock"
import { networks } from "@unlock-protocol/networks"
import { Web3Service } from "@unlock-protocol/unlock-js"
import { Membership } from "./types"
interface GetHasValidKeyOptions {
    network: number
    lockAddress: string
    userAddress: string
}

export async function getValidKey({ network, lockAddress, userAddress }: GetHasValidKeyOptions) {
    const unlockWeb3Service = new Web3Service(networks)
    const key = await unlockWeb3Service.getKeyByLockForOwner(lockAddress, userAddress, network)
    const keyId = key.tokenId

    if (keyId <= 0) {
        return
    }

    return {
        id: keyId,
        lockAddress,
        network,
        userAddress,
    } as Membership
}

export async function getValidMemberships(userAddress: string, lockAddress: string) {
    // const promises = Object.keys(paywallConfig.locks as any).map((lockAddress) => {
    //     return getValidKey({
    //         lockAddress,
    //         userAddress,
    //         network: (paywallConfig.locks as any)[lockAddress].network,
    //     })
    // })
    // const results = await Promise.all(promises)
    // return results as Membership[]
    return getValidKey({
        lockAddress,
        userAddress,
        network: network as number,
    })
}

export async function hasMembership(userAddress: string, lockAddress: string) {
    const result = await getValidMemberships(userAddress, lockAddress)
    return !!result
}

export async function fetchJson<JSON = unknown>(
    input: RequestInfo,
    init?: RequestInit
): Promise<JSON> {
    const response = await fetch(input, init)
    const data = await response.json()
    if (response.ok) {
        return data
    }
    throw new FetchError({
        message: response.statusText,
        response,
        data,
    })
}

export class FetchError extends Error {
    response: Response
    data: {
        message: string
    }
    constructor({
        message,
        response,
        data,
    }: {
        message: string
        response: Response
        data: {
            message: string
        }
    }) {
        super(message)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, FetchError)
        }
        this.name = "FetchError"
        this.response = response
        this.data = data ?? { message: message }
    }
}

export function getCustomEncryptionRules(lockAddress: string) {
    // {
    //     conditionType: "evmBasic",
    //     contractAddress: "0x98d8f9ed358da1a2436c967f509a93807d9a42b9",
    //     standardContractType: "ERC721",
    //     chain: "mumbai",
    //     method: "balanceOf",
    //     parameters: [":userAddress"],
    //     returnValueTest: {
    //         comparator: ">=",
    //         value: "1",
    //     },
    // },

    // {
    //     contractAddress: lockAddress.toLowerCase(),
    //     standardContractType: "ERC721",
    //     chain: "mumbai",
    //     method: "balanceOf",
    //     parameters: [":userAddress"],
    //     returnValueTest: {
    //         comparator: ">",
    //         value: "0",
    //     },
    // },
    // { operator: "or" },
    // {
    //     contractAddress: lockAddress.toLowerCase(),
    //     standardContractType: "ERC721",
    //     chain: "mumbai",
    //     method: "isOwner",
    //     parameters: [":userAddress"],
    //     returnValueTest: {
    //         comparator: "=",
    //         value: "true",
    //     },
    // },
    const encryptionRulesCustom = {
        type: "custom",
        accessControlConditions: [
            {
                contractAddress: lockAddress.toLowerCase(),
                functionName: "balanceOf",
                functionParams: [":userAddress"],
                functionAbi: {
                    inputs: [{ internalType: "address", name: "_keyOwner", type: "address" }],
                    name: "balanceOf",
                    outputs: [{ internalType: "uint256", name: "balance", type: "uint256" }],
                    stateMutability: "view",
                    type: "function",
                },
                chain: "mumbai",
                returnValueTest: {
                    key: "",
                    comparator: ">",
                    value: "0",
                },
            },
            { operator: "or" },
            {
                contractAddress: lockAddress.toLowerCase(),
                functionName: "isOwner",
                functionParams: [":userAddress"],
                functionAbi: {
                    inputs: [{ internalType: "address", name: "account", type: "address" }],
                    name: "isOwner",
                    outputs: [{ internalType: "bool", name: "", type: "bool" }],
                    stateMutability: "view",
                    type: "function",
                },
                chain: "mumbai",
                returnValueTest: {
                    key: "",
                    comparator: "=",
                    value: "true",
                },
            },
        ],
    }
    return encryptionRulesCustom
}
