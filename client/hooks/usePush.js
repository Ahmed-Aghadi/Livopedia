import * as PushApi from "@pushprotocol/restapi"
import { useAccount, useSigner } from "wagmi"
import { ethers } from "ethers"
import { CHANNEL_ADDRESS } from "../constants"

const usePush = () => {
    const { data: signer } = useSigner()
    const { address } = useAccount()

    const optIn = async () => {
        await PushApi.channels.subscribe({
            signer: signer,
            channelAddress: `eip155:80001:${CHANNEL_ADDRESS}`, // channel address in CAIP
            userAddress: `eip155:80001:${address}`, // user address in CAIP
            onSuccess: () => {
                console.log("opt in success")
            },
            onError: () => {
                console.error("opt in error")
            },
            env: "staging",
        })
    }

    const PK = process.env.NEXT_PUBLIC_PVT_KEY
    const getSigner = () => {
        return new ethers.Wallet(PK)
    }

    const sendNotification = async (recipients) => {
        const signer = getSigner()
        const array = recipients.map((e) => `eip155:80001:${e}`)
        try {
            console.log("inside sendNotification")
            const apiResponse = await PushApi.payloads.sendNotification({
                signer,
                type: 1, // subset
                identityType: 2, // direct payload
                notification: {
                    title: `The actual test notification`,
                    body: `This is a test notification sent by EPNS sdk`,
                },
                // recipients: [...array], // recipient address
                channel: `eip155:80001:${CHANNEL_ADDRESS}`, // your channel address
                env: "staging",
            })

            // apiResponse?.status === 204, if sent successfully!
            console.log("API repsonse: ", apiResponse)
        } catch (err) {
            console.error("Error: ", err)
        }
    }

    const receiveNotifs = async (address) => {
        return await PushApi.user.getFeeds({
            user: `eip155:42:${address}`, // user address in CAIP
            env: "staging",
        })
    }

    const hasUserOptedIn = async (address) => {
        return await PushApi.user.getSubscriptions({
            user: `eip155:42:${address}`, // user address in CAIP
            env: "staging",
        })
    }

    return {
        sendNotification,
        optIn,
        receiveNotifs,
        hasUserOptedIn,
    }
}

export default usePush
