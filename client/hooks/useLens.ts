import { ApolloClient, ApolloLink, gql, HttpLink, InMemoryCache } from "@apollo/client"
import {
    AUTHENTICATE_MUTATION,
    CHALLENGE_QUERY,
    CREATE_POST_MUTATION,
    CREATE_POST_TYPED_DATA,
    CREATE_PROFILE_MUTATION,
    GET_PUBLICATIONS,
    LENS_PROFILE_DETAILS,
    LENS_PROFILE_EXISTS,
} from "../constants/graphql/queries"
import { useProvider } from "wagmi"
import { BigNumber, ethers, Signer, utils } from "ethers"
import { PublicationMainFocus } from "../interfaces/publication"
import {
    BroadcastDocument,
    BroadcastRequest,
    CreatePostTypedDataDocument,
    CreatePostViaDispatcherDocument,
    CreatePublicPostRequest,
} from "../graphql/generated"
import { signedTypeData } from "../ethers.service"
import { pollUntilIndexed } from "../indexer/has-transaction-been-indexed"
import { lensAbi } from "../constants"

const APIURL = "https://api-mumbai.lens.dev/"

const apolloClient = new ApolloClient({
    uri: APIURL,
    cache: new InMemoryCache(),
})

export default function useLens() {
    const provider = useProvider()
    const login = async (address: `0x${string}`, signer: Signer) => {
        const response = await apolloClient.query({
            query: gql(CHALLENGE_QUERY),
            variables: {
                address: address,
            },
        })
        console.log("Lens example data: ", response)
        const signature = await signer.signMessage(response.data.challenge.text)
        console.log("signature", signature)
        const mutationRes = await apolloClient.mutate({
            mutation: gql(AUTHENTICATE_MUTATION),
            variables: {
                address: address,
                signature: signature,
            },
        })

        const httpLink = new HttpLink({ uri: "https://api-mumbai.lens.dev/" })

        const authLink = new ApolloLink((operation, forward) => {
            // Retrieve the authorization token from local storage.
            const token = mutationRes.data.authenticate.accessToken
            console.log("token", token)

            // Use the setContext method to set the HTTP headers.
            operation.setContext({
                headers: {
                    "x-access-token": token ? `Bearer ${token}` : "",
                },
            })

            // Call the next link in the middleware chain.
            return forward(operation)
        })
        return new ApolloClient({
            link: authLink.concat(httpLink), // Chain it with the HttpLink
            cache: new InMemoryCache(),
        })
    }

    const createProfile = async (
        username: string,
        address: `0x${string}`,
        signer: Signer,
        pfp?: string
    ) => {
        const client = await login(address, signer)
        const createProfRes = await client.mutate({
            mutation: gql(CREATE_PROFILE_MUTATION),
            variables: {
                username: username,
                img: pfp,
            },
        })
        console.log("createProfRes", createProfRes)
        const txHash = createProfRes.data.createProfile.txHash
        const txReceipt = await provider.waitForTransaction(txHash)
        console.log("txReceipt", txReceipt)
        return txReceipt
    }

    // const createPostViaDispatcherRequest = async (
    //     request: CreatePublicPostRequest,
    //     address,
    //     signer
    // ) => {
    //     const client = await login(address, signer)
    //     const result = await client.mutate({
    //         mutation: CreatePostViaDispatcherDocument,
    //         variables: {
    //             request,
    //         },
    //     })

    //     return result.data!.createPostViaDispatcher
    // }

    // const createPostTypedData = async (request: CreatePublicPostRequest, client) => {
    //     const result = await client.mutate({
    //         mutation: CreatePostTypedDataDocument,
    //         variables: {
    //             request,
    //         },
    //     })

    //     return result.data!.createPostTypedData
    // }

    // const broadcastRequest = async (request: BroadcastRequest, client) => {
    //     const result = await client.mutate({
    //         mutation: BroadcastDocument,
    //         variables: {
    //             request,
    //         },
    //     })

    //     return result.data!.broadcast
    // }

    // const signCreatePostTypedData = async (request: CreatePublicPostRequest, client) => {
    //     const result = await createPostTypedData(request, client)
    //     console.log("create post: createPostTypedData", result)

    //     const typedData = result.typedData
    //     console.log("create post: typedData", typedData)

    //     const signature = await signedTypeData(typedData.domain, typedData.types, typedData.value)
    //     console.log("create post: signature", signature)

    //     return { result, signature }
    // }

    // const post = async (createPostRequest: CreatePublicPostRequest, address, signer, client) => {
    //     const signedResult = await signCreatePostTypedData(createPostRequest, client)
    //     console.log("create post via broadcast: signedResult", signedResult)

    //     const broadcastResult = await broadcastRequest(
    //         {
    //             id: signedResult.result.id,
    //             signature: signedResult.signature,
    //         },
    //         client
    //     )

    //     if (broadcastResult.__typename !== "RelayerResult") {
    //         console.error("create post via broadcast: failed", broadcastResult)
    //         throw new Error("create post via broadcast: failed")
    //     }

    //     console.log("create post via broadcast: broadcastResult", broadcastResult)
    //     return { txHash: broadcastResult.txHash, txId: broadcastResult.txId }
    // }

    // const createPost = async (
    //     profId: string,
    //     address: `0x${string}`,
    //     signer: Signer,
    //     content: string
    // ) => {
    //     // const metadata = {
    //     //     version: "1.0.0",
    //     //     metadata_id: crypto.randomUUID(),
    //     //     content: content,
    //     //     locale: "en",
    //     //     tags: ["testTag"],
    //     //     mainContentFocus: "TEXT_ONLY",
    //     //     name: "testPost",
    //     // }
    //     const client = await login(address, signer)
    //     const metadata = {
    //         version: "2.0.0",
    //         mainContentFocus: PublicationMainFocus.TEXT_ONLY,
    //         metadata_id: crypto.randomUUID(),
    //         description: "testDescription",
    //         locale: "en-US",
    //         content: content,
    //         external_url: null,
    //         image: null,
    //         imageMimeType: null,
    //         name: "testName",
    //         attributes: [],
    //         tags: ["testTag"],
    //         appId: "testAppId",
    //     }
    //     const resForJsonCid = await fetch(
    //         process.env.NEXT_PUBLIC_API_URL + "/api/json-upload-ipfs",
    //         {
    //             method: "POST",
    //             body: JSON.stringify(metadata),
    //             headers: { "Content-Type": "application/json" },
    //         }
    //     )

    //     const jsonOfResForJsonCid = await resForJsonCid.json()

    //     const jsonCid = jsonOfResForJsonCid.cid
    //     console.log("stored metadata json with cid:", jsonCid)

    //     // hard coded to make the code example clear
    //     const createPostRequest = {
    //         profileId: profId,
    //         contentURI: `ipfs://${jsonCid}`,
    //         collectModule: {
    //             // feeCollectModule: {
    //             //   amount: {
    //             //     currency: currencies.enabledModuleCurrencies.map(
    //             //       (c: any) => c.address
    //             //     )[0],
    //             //     value: '0.000001',
    //             //   },
    //             //   recipient: address,
    //             //   referralFee: 10.5,
    //             // },
    //             // revertCollectModule: true,
    //             freeCollectModule: { followerOnly: true },
    //             // limitedFeeCollectModule: {
    //             //   amount: {
    //             //     currency: '0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889',
    //             //     value: '2',
    //             //   },
    //             //   collectLimit: '20000',
    //             //   recipient: '0x3A5bd1E37b099aE3386D13947b6a90d97675e5e3',
    //             //   referralFee: 0,
    //             // },
    //         },
    //         referenceModule: {
    //             followerOnlyReferenceModule: false,
    //         },
    //     }

    //     const result = await post(createPostRequest, address, signer, client)
    //     console.log("create post gasless", result)

    //     console.log("create post: poll until indexed")
    //     const indexedResult = await pollUntilIndexed({ txId: result.txId }, client)

    //     console.log("create post: profile has been indexed", result)

    //     const logs = indexedResult.txReceipt!.logs

    //     console.log("create post: logs", logs)

    //     const topicId = utils.id(
    //         "PostCreated(uint256,uint256,string,address,bytes,address,bytes,uint256)"
    //     )
    //     console.log("topicid we care about", topicId)

    //     const profileCreatedLog = logs.find((l: any) => l.topics[0] === topicId)
    //     console.log("create post: created log", profileCreatedLog)

    //     let profileCreatedEventLog = profileCreatedLog!.topics
    //     console.log("create post: created event logs", profileCreatedEventLog)

    //     const publicationId = utils.defaultAbiCoder.decode(
    //         ["uint256"],
    //         profileCreatedEventLog[2]
    //     )[0]

    //     console.log(
    //         "create post: contract publication id",
    //         BigNumber.from(publicationId).toHexString()
    //     )
    //     console.log(
    //         "create post: internal publication id",
    //         profId + "-" + BigNumber.from(publicationId).toHexString()
    //     )

    //     return result

    //     // const client = await login(address, signer)
    //     // const createPostRes = await client.mutate({
    //     //     mutation: gql(CREATE_POST_MUTATION),
    //     //     variables: {
    //     //         profId: profId,
    //     //         cid: `ipfs://${jsonCid}`,
    //     //     },
    //     // })
    //     // console.log("createPostRes", createPostRes)
    //     // // const txHash = createPostRes.data.createProfile.txHash
    //     // // const txReceipt = await provider.waitForTransaction(txHash)
    //     // // console.log("txReceipt", txReceipt)
    //     // // return txReceipt
    //     // return createPostRes
    // }

    const uploadPost = async (
        profileId: string,
        signer: Signer,
        address: `0x${string}`,
        title: string,
        description: string,
        postType: "post" | "video",
        isEncrypted: boolean,
        assetId?: string
    ) => {
        // // const metadata = {
        // //     version: "1.0.0",
        // //     mainContentFocus: "TEXT_ONLY",
        // //     metadata_id: crypto.randomUUID(),
        // //     description: "testDescription",
        // //     locale: "en-US",
        // //     content: "testContent",
        // //     external_url: null,
        // //     image: null,
        // //     imageMimeType: null,
        // //     name: "testName",
        // //     attributes: [],
        // //     tags: ["testTag"],
        // //     appId: "testAppId",
        // // }
        // const metadata = {
        //     version: "1.0.0",
        //     mainContentFocus: "VIDEO",
        //     metadata_id: crypto.randomUUID(),
        //     description: "testDescription",
        //     locale: "en-US",
        //     content: "testContent",
        //     external_url: null,
        //     image: null,
        //     imageMimeType: null,
        //     name: "testName",
        //     media: [
        //         {
        //             item: "ipfs://QmZbz15gV6bmAJkmmnnfZwsFreBvuz2LdfscaeMFZSNHU8",
        //             type: "video/mp4",
        //         },
        //     ],
        //     attributes: [],
        //     tags: ["testTag", "testVideoTag"],
        //     appId: "testAppId",
        // }
        const tags = isEncrypted ? ["encrypted", postType] : [postType]
        let metadata
        if (postType === "post") {
            metadata = {
                version: "2.0.0",
                mainContentFocus: "TEXT_ONLY",
                metadata_id: crypto.randomUUID(),
                description: null,
                locale: "en-US",
                content: description,
                external_url: null,
                image: null,
                imageMimeType: null,
                name: title,
                attributes: [],
                tags: tags,
                appId: "testAppId",
            }
        } else {
            metadata = {
                version: "2.0.0",
                mainContentFocus: "TEXT_ONLY",
                metadata_id: crypto.randomUUID(),
                description: description,
                locale: "en-US",
                content: assetId,
                external_url: null,
                image: null,
                imageMimeType: null,
                name: title,
                attributes: [],
                tags: tags,
                appId: "testAppId",
            }
        }
        const resForJsonCid = await fetch(
            process.env.NEXT_PUBLIC_API_URL + "/api/json-upload-ipfs",
            {
                method: "POST",
                body: JSON.stringify(metadata),
                headers: { "Content-Type": "application/json" },
            }
        )

        const jsonOfResForJsonCid = await resForJsonCid.json()

        const ipfsResult = "https://" + jsonOfResForJsonCid.cid + ".ipfs.nftstorage.link/data.json"
        console.log("stored metadata json with cid:", ipfsResult)
        console.log(ipfsResult)

        const createPostRequest = {
            profileId: profileId,
            contentURI: ipfsResult,
            collectModule: {
                // feeCollectModule: {
                //   amount: {
                //     currency: currencies.enabledModuleCurrencies.map(
                //       (c: any) => c.address
                //     )[0],
                //     value: '0.000001',
                //   },
                //   recipient: address,
                //   referralFee: 10.5,
                // },
                // revertCollectModule: true,
                freeCollectModule: { followerOnly: true },
                // limitedFeeCollectModule: {
                //   amount: {
                //     currency: '0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889',
                //     value: '2',
                //   },
                //   collectLimit: '20000',
                //   recipient: '0x3A5bd1E37b099aE3386D13947b6a90d97675e5e3',
                //   referralFee: 0,
                // },
            },
            referenceModule: {
                followerOnlyReferenceModule: false,
            },
        }

        // const CREATE_POST_TYPED_DATA = `
        //     mutation($request: CreatePublicPostRequest!) {
        //         createPostTypedData(request: $request) {
        //             id
        //             expiresAt
        //             typedData {
        //                 types {
        //                     PostWithSig {
        //                         name
        //                         type
        //                     }
        //                 }
        //                 domain {
        //                     name
        //                     chainId
        //                     version
        //                     verifyingContract
        //                 }
        //                 value {
        //                     nonce
        //                     deadline
        //                     profileId
        //                     contentURI
        //                     collectModule
        //                     collectModuleInitData
        //                     referenceModule
        //                     referenceModuleInitData
        //                 }
        //             }
        //         }
        //     }
        // `

        try {
            const apolloClient = await login(address, signer)
            const result = await apolloClient.mutate({
                mutation: gql(CREATE_POST_TYPED_DATA),
                variables: {
                    request: createPostRequest,
                },
            })
            const typedData = result.data.createPostTypedData.typedData
            const signature = await signedTypeData(
                typedData.domain,
                typedData.types,
                typedData.value
            )
            const { v, r, s } = ethers.utils.splitSignature(signature)
            const lensHub = new ethers.Contract(
                "0x60Ae865ee4C725cd04353b5AAb364553f56ceF82",
                lensAbi,
                signer
            )
            const tx = await lensHub.postWithSig({
                profileId: typedData.value.profileId,
                contentURI: typedData.value.contentURI,
                collectModule: typedData.value.collectModule,
                collectModuleInitData: typedData.value.collectModuleInitData,
                referenceModule: typedData.value.referenceModule,
                referenceModuleInitData: typedData.value.referenceModuleInitData,
                sig: {
                    v,
                    r,
                    s,
                    deadline: typedData.value.deadline,
                },
            })
            console.log("tx.hash", tx.hash)
            const receipt = await tx.wait()
            console.log("receipt", receipt)
        } catch (error) {
            console.log("error", error)
        }
    }

    const getPosts = async (profId: string, signer: Signer, address: `0x${string}`) => {
        const response = await apolloClient.query({
            query: gql(GET_PUBLICATIONS),
            variables: {
                profileId: profId,
            },
        })
        console.log("response", response)
        return response.data.publications.items
    }

    const profileExists = async (handle: string) => {
        console.log("handle", handle)
        const response = await apolloClient.query({
            query: gql(LENS_PROFILE_EXISTS),
            variables: {
                name: `${handle}.test`,
            },
        })
        console.log("profileExists", response)
        let exists = false
        if (response.data.profile !== null) {
            exists = true
        }
        return exists
    }

    const getProfileId = async (handle: string) => {
        console.log("handle", handle)
        const response = await apolloClient.query({
            query: gql(LENS_PROFILE_EXISTS),
            variables: {
                name: `${handle}.test`,
            },
        })
        return response.data.profile.id
    }

    const getProfile = async (hex: string) => {
        const response = await apolloClient.query({
            query: gql(LENS_PROFILE_DETAILS),
            variables: {
                id: hex,
            },
        })
        return response.data.profile
    }

    return {
        login,
        createProfile,
        // createPost,
        profileExists,
        getProfileId,
        getProfile,
        uploadPost,
        getPosts,
    }
}
