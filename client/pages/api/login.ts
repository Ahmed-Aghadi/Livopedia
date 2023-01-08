import { withIronSessionApiRoute } from "iron-session/next"
import { NextApiRequest, NextApiResponse } from "next"
import { Membership, User } from "../../types"
import { getValidMemberships, hasMembership } from "../../utils"
import { network, paywallConfig } from "../../config/unlock"
import { ethers } from "ethers"
import { baseURL } from "../../config/site"
import crypto from "crypto"
import { sessionOptions } from "../../config/session"

export default withIronSessionApiRoute(loginRoute, sessionOptions)

async function loginRoute(request: NextApiRequest, response: NextApiResponse) {
    try {
        console.log("request.url", request.url)
        console.log("request.query", request.query)
        const signature = request.query.signature as string
        const digest = request.query.digest as string
        console.log("signature", signature)
        console.log("digest", digest)

        if (!signature) {
            const lockAddress = request.query.lockAddress as string
            const messageToSign = `I authorize to login (${lockAddress}): ${crypto
                .randomBytes(32)
                .toString("hex")}`

            return redirectToPurchase(messageToSign, request, response)
        } else {
            const address = ethers.utils.verifyMessage(digest, signature)
            console.log("address", address)

            let lockAddress = request.query.lockAddress as string
            if (!lockAddress) {
                lockAddress = digest.substring(digest.indexOf("(") + 1, digest.indexOf(")"))
            }
            const membership = await getValidMemberships(address, lockAddress)

            if (!membership) {
                return response
                    .status(401)
                    .send(
                        "You do not have a valid membership. You can purchase one by reloading this page and checking out a membership this time."
                    )
            }
            if (request.session.user) {
                request.session.user.memberships.push(membership)
            } else {
                const user: User = {
                    walletAddress: address,
                    isLoggedIn: true,
                    digest,
                    signature,
                    memberships: [membership],
                }

                request.session.user = user
            }
            await request.session.save()
            const redirect = request.query.redirect as string
            if (redirect) {
                return response.redirect(request.query.redirect as string)
            }
            response.redirect(baseURL)
        }
    } catch (error) {
        response.status(500).json({ message: (error as Error).message })
    }
}

function redirectToPurchase(digest: string, request: NextApiRequest, response: NextApiResponse) {
    const lockAddress = request.query.lockAddress as string
    const redirectBack = new URL(request.url!, baseURL)
    redirectBack.searchParams.append("digest", digest)
    const redirectUrl = new URL("https://app.unlock-protocol.com/checkout")
    paywallConfig.locks = {
        [lockAddress]: {
            name: "Membership",
            network: network,
        },
    }
    paywallConfig.messageToSign = digest
    redirectUrl.searchParams.append("paywallConfig", JSON.stringify(paywallConfig))
    redirectUrl.searchParams.append("redirectUri", redirectBack.toString())
    response.redirect(redirectUrl.toString())
}
