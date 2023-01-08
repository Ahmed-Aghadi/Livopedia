// use the signAccessJwt export from `livepeer` in Node.JS
import { ethers } from "ethers"
import { withIronSessionApiRoute } from "iron-session/next"
import { signAccessJwt } from "livepeer/crypto"
import { NextApiRequest, NextApiResponse } from "next"
import { sessionOptions } from "../../config/session"
import { lockAbi } from "../../constants"

// import { ApiError } from "../../lib/error"

export type ApiError = {
    message: string
}

export type CreateSignedPlaybackBody = {
    playbackId: string
    message: string
    userAddress: string
    lockAddress: string
    signature: string
}

export type CreateSignedPlaybackResponse = {
    token: string
}

// to get private and public key for livepeer
// const getSigningKey = async () => {
//     const response = await fetch("https://livepeer.studio/api/access-control/signing-key", {
//         method: "POST",
//         headers: {
//             "Content-Type": "application/json",
//             Authorization: "Bearer " + process.env.NEXT_PUBLIC_STUDIO_API_KEY,
//         },
//     })
//     const data = await response.json()
//     console.log("data", data)
// }

const accessControlPrivateKey = process.env.ACCESS_CONTROL_PRIVATE_KEY
const accessControlPublicKey = process.env.NEXT_PUBLIC_ACCESS_CONTROL_PUBLIC_KEY

export default withIronSessionApiRoute(handler, sessionOptions)

async function handler(
    req: NextApiRequest,
    res: NextApiResponse<CreateSignedPlaybackResponse | ApiError>
) {
    try {
        const method = req.method

        if (method === "POST") {
            if (!accessControlPrivateKey || !accessControlPublicKey) {
                return res.status(500).json({ message: "Missing env vars." })
            }

            const {
                playbackId,
                message,
                lockAddress,
                userAddress,
                signature,
            }: CreateSignedPlaybackBody = req.body

            if (!playbackId || !message || !lockAddress || !userAddress || !signature) {
                return res.status(400).json({ message: "Missing data in body." })
            }

            // we check that the "supersecretkey" was passed in the body
            // this could be a more complex check, like taking a signed payload,
            // getting the address for that signature, and fetching if they own an NFT
            //
            // https://docs.ethers.io/v5/single-page/#/v5/api/utils/signing-key/-%23-SigningKey--other-functions

            // if (secret !== "supersecretkey") {
            //     return res.status(401).json({ message: "Incorrect secret." })
            // }

            if (!message.includes("Sigining a message for Liveopedia ")) {
                return res.status(401).json({ message: "Incorrect message." })
            }
            const dateFromMessage = parseInt(message.substring(34))
            const dateNow = Date.now()
            // check if message is expired or not (5 minutes)
            if (dateNow - dateFromMessage > 1000 * 60 * 5) {
                return res.status(401).json({ message: "Message expired." })
            }
            const address = ethers.utils.verifyMessage(message, signature)
            if (address.toLowerCase() !== userAddress.toLowerCase()) {
                return res.status(401).json({ message: "Incorrect signature." })
            }

            // check if user is logged in or not
            let userLoggedIn = false
            if (req.session.user) {
                req.session.user.memberships?.forEach((membership) => {
                    if (membership.lockAddress.toLowerCase() === lockAddress.toLowerCase()) {
                        userLoggedIn = true
                    }
                })
            } else {
                userLoggedIn = false
            }

            if (!userLoggedIn) {
                let isUserOwner = false

                const contractInstance = new ethers.Contract(
                    lockAddress,
                    lockAbi,
                    ethers.getDefaultProvider(process.env.NEXT_PUBLIC_MUMBAI_RPC_URL)
                )

                const res = await contractInstance.isOwner(userAddress)
                console.log("res", res)
                isUserOwner = res

                if (!isUserOwner) {
                    return res.status(401).json({
                        message: "User not logged in.",
                    })
                }
            }

            // we sign the JWT and return it to the user
            const token = await signAccessJwt({
                privateKey: accessControlPrivateKey,
                publicKey: accessControlPublicKey,
                issuer: "https://docs.livepeer.org",
                // playback ID to include in the JWT
                playbackId,
                // expire the JWT in 1 hour
                expiration: "1h",
                // custom metadata to include
                custom: {
                    userId: "user-id-1",
                },
            })

            console.log("token", token)

            return res.status(200).json({
                token,
            })
        }

        res.setHeader("Allow", ["POST"])
        return res.status(405).end(`Method ${method} Not Allowed`)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: (err as Error)?.message ?? "Error" })
    }
}
