import React, { useState, forwardRef, useEffect, useContext, useCallback, useMemo } from "react"
import {
    createStyles,
    Card,
    Avatar,
    Text,
    Group,
    Button,
    Stack,
    Input,
    Select,
    CloseButton,
    Tooltip,
    Textarea,
    TextInput,
    Center,
    Grid,
    Modal,
    Indicator,
    Image,
    Badge,
} from "@mantine/core"
import {
    IconChartDots3,
    IconCheck,
    IconCirclePlus,
    IconMessage2Share,
    IconPhoto,
    IconUpload,
    IconVideo,
    IconX,
} from "@tabler/icons"
import { showNotification, updateNotification } from "@mantine/notifications"
import { Election, EnvOptions, PlainCensus, VocdoniSDKClient, IChoice } from "@vocdoni/sdk"
import { useAccount, useSigner } from "wagmi"
import { DatePicker, TimeInput } from "@mantine/dates"
import { useRouter } from "next/router"
import { getCustomEncryptionRules } from "../utils"
import { Dropzone, FileWithPath, IMAGE_MIME_TYPE, MIME_TYPES } from "@mantine/dropzone"
const { Alchemy, Network } = require("alchemy-sdk")
import LitJsSdk from "@lit-protocol/sdk-browser"
import useLens from "../hooks/useLens"
import Video from "./Video"
import { title } from "process"
import { useUploader } from "@w3ui/react-uploader"
import { AuthStatus, useAuth } from "@w3ui/react-keyring"

const config = {
    apiKey: process.env.NEXT_PUBLIC_ALCHEMY_GOERLI_API_KEY,
    network: Network.MATIC_MUMBAI,
}
const alchemy = new Alchemy(config)

const data = [
    {
        image: <IconMessage2Share />,
        label: "Create a post",
        value: "post",
        description: "A post with title and description",
    },

    {
        image: <IconChartDots3 />,
        label: "Create a video",
        value: "video",
        description: "A video with title and description",
    },
    // {
    //     image: "https://img.icons8.com/clouds/256/000000/homer-simpson.png",
    //     label: "Homer Simpson",
    //     value: "Homer Simpson",
    //     description: "Overweight, lazy, and often ignorant",
    // },
    // {
    //     image: "https://img.icons8.com/clouds/256/000000/spongebob-squarepants.png",
    //     label: "Spongebob Squarepants",
    //     value: "Spongebob Squarepants",
    //     description: "Not just a sponge",
    // },
]

interface ItemProps extends React.ComponentPropsWithoutRef<"div"> {
    image: string
    label: string
    description: string
}

const SelectItem = forwardRef<HTMLDivElement, ItemProps>(
    ({ image, label, description, ...others }: ItemProps, ref) => (
        <div ref={ref} {...others}>
            <Group noWrap>
                {/* <Avatar src={image} /> */}
                {image}

                <div>
                    <Text size="sm">{label}</Text>
                    <Text size="xs" opacity={0.65}>
                        {description}
                    </Text>
                </div>
            </Group>
        </div>
    )
)

const useStyles = createStyles((theme) => ({
    card: {
        backgroundColor: theme.colorScheme === "dark" ? theme.colors.dark[7] : theme.white,
    },

    avatar: {
        border: `2px solid ${theme.colorScheme === "dark" ? theme.colors.dark[7] : theme.white}`,
    },
}))

export const pollTypes = [
    {
        label: "Type 1",
        value: 0,
    },
    {
        label: "Type 2",
        value: 1,
    },
    {
        label: "Type 3",
        value: 2,
    },
]

interface UserCardImageProps {
    isUserFollowing: boolean
    image: string
    avatar: string
    name: string
    description: string
    stats: { label: string; value: string }[]
    userAddress: string
    streamId: string
    lockAddress: string
    eligible: boolean
    profileId: string
    fetchFollowersFollowing: (profileId: string) => void
    isUserCreator: boolean
}

const DEMO_VOTE_CENSUS_SIZE = 1000

export default function UserPage({
    isUserFollowing,
    image,
    avatar,
    name,
    description,
    stats,
    userAddress,
    streamId,
    lockAddress,
    eligible,
    profileId,
    fetchFollowersFollowing,
    isUserCreator,
}: UserCardImageProps) {
    const { classes, theme } = useStyles()
    const router = useRouter()
    const { address, isConnected } = useAccount()
    const { data: signer } = useSigner()
    const { getPosts, uploadPost } = useLens()
    const [{ uploadedCarChunks }, uploader] = useUploader()
    const {
        authStatus,
        identity,
        registerAndStoreIdentity,
        cancelRegisterAndStoreIdentity,
        unloadIdentity,
        unloadAndRemoveIdentity,
        loadDefaultIdentity,
    } = useAuth()
    // console.log({
    //     image,
    //     avatar,
    //     name,
    //     description,
    //     stats,
    //     userAddress,
    //     streamId,
    //     groupId,
    //     mainChannelId,
    //     usersChannelId,
    // })

    const [editProfileModalOpened, setEditProfileModalOpened] = useState(false)
    const [profileUsername, setProfileUsername] = useState(name)
    const [isProfilePfpChanged, setIsProfilePfpChanged] = useState(false)
    const [isProfileCoverChanged, setIsProfileCoverChanged] = useState(false)
    const [profilePfp, setProfilePfp] = useState<FileWithPath[]>()
    const profilePfpImageUrl =
        profilePfp && profilePfp.length != 0 ? URL.createObjectURL(profilePfp[0]) : null
    const [profileCover, setProfileCover] = useState<FileWithPath[]>()
    const profileCoverImageUrl =
        profileCover && profileCover.length != 0 ? URL.createObjectURL(profileCover[0]) : null

    const [posts, setPosts] = useState([])

    const [buttonClicked, setButtonClicked] = useState(false)
    const [postType, setPostType] = useState("post")

    const [postTitleOpened, setPostTitleOpened] = useState(false)
    const [postTitle, setPostTitle] = useState("")
    const postTitleValid = postTitle.trim().length > 0

    const [postDescriptionOpened, setPostDescriptionOpened] = useState(false)
    const [postDescription, setPostDescription] = useState("")
    const postDescriptionValid = postDescription.trim().length > 0

    const [video, setVideo] = useState<File | undefined>()
    const [videoUrl, setVideoUrl] = useState<string | undefined>()

    const resetInputs = () => {
        setPostTitle("")
        setPostDescription("")
        setPostType("post")
        setVideo(undefined)
        setVideoUrl(undefined)
    }

    const valid = postTitleValid && postDescriptionValid && (postType == "post" ? true : !!videoUrl)

    useEffect(() => {
        if (!eligible) return
        if (!userAddress || !isConnected) return
        console.log("abcd123", { userAddress, isConnected })
        fetchPostsFromLens()
        console.log("fetching posts from orbis")
    }, [userAddress, isConnected])

    const fetchPostsFromLens = async () => {
        console.log("lockAddress", lockAddress)

        const data = await getPosts(profileId, signer, address)
        console.log("data", data)
        try {
            const client = new LitJsSdk.LitNodeClient()
            const authSig = await LitJsSdk.checkAndSignAuthMessage({ chain: "mumbai" })
            await client.connect()
        } catch (error) {
            console.log("error: ", error)
        }
        const decryptedPosts = await Promise.all(
            data.map(async (post, index) => {
                if (
                    post.metadata?.tags?.includes("video") ||
                    post.metadata?.tags?.includes("post")
                ) {
                    if (post.metadata?.tags?.includes("video")) {
                        if (post.metadata?.tags?.includes("encrypted")) {
                            try {
                                const assetId = await decryptContent(
                                    JSON.parse(post.metadata.content)
                                )
                                const body = await decryptContent(
                                    JSON.parse(post.metadata.description)
                                )
                                // if (!body) return
                                // if (body.status != 200) return
                                return {
                                    id: post.id,
                                    postType: "video",
                                    title: post.metadata.name,
                                    description: body,
                                    assetId: assetId,
                                    postedAt: new Date(post.createdAt).toLocaleString(),
                                    encrypted: true,
                                }
                            } catch (error) {
                                console.log("error decrypt", error)
                                return
                            }
                        }
                        return {
                            id: post.id,
                            postType: "video",
                            title: post.metadata.name,
                            description: post.metadata.description,
                            assetId: post.metadata.content,
                            postedAt: new Date(post.createdAt).toLocaleString(),
                            encrypted: false,
                        }
                    }
                    if (post.metadata?.tags?.includes("encrypted")) {
                        try {
                            const body = await decryptContent(JSON.parse(post.metadata.content))
                            // if (!body) return
                            // if (body.status != 200) return
                            return {
                                id: post.id,
                                postType: "post",
                                title: post.metadata.name,
                                description: body,
                                postedAt: new Date(post.createdAt).toLocaleString(),
                                encrypted: true,
                            }
                        } catch (error) {
                            console.log("error decrypt", error)
                            return
                        }
                    }
                    return {
                        id: post.id,
                        postType: "post",
                        title: post.metadata.name,
                        description: post.metadata.content,
                        postedAt: new Date(post.createdAt).toLocaleString(),
                        encrypted: false,
                    }
                }
            })
        )
        console.log("decryptedPosts", decryptedPosts)
        setPosts(decryptedPosts.filter((post) => post))
    }

    const handleSubmit = async () => {
        console.log("submitting")
        if (!isConnected) {
            showNotification({
                id: "hello-there",
                autoClose: 5000,
                title: "Connect Wallet",
                message: "Please connect your wallet to post content",
                color: "red",
                icon: <IconX />,
                className: "my-notification-class",
                loading: false,
            })
            return
        }
        if (!valid) {
            showNotification({
                id: "hello-there",
                autoClose: 5000,
                title: "Cannot create",
                message: "Filled in all the required fields",
                color: "red",
                icon: <IconX />,
                className: "my-notification-class",
                loading: false,
            })
            return
        }
        showNotification({
            id: "load-data",
            loading: true,
            title: "Posting...",
            message: "Please wait while we upload your content",
            autoClose: false,
            disallowClose: true,
        })
        try {
            console.log({ postTitle, postDescription, postType })
            const encryptionRulesCustom = getCustomEncryptionRules(lockAddress)
            console.log("encryptionRulesCustom: ", encryptionRulesCustom)
            if (postType === "post") {
                const encryptedContent = await encryptContent(postDescription)
                await uploadPost(
                    profileId,
                    signer,
                    address,
                    postTitle,
                    JSON.stringify(encryptedContent),
                    "post",
                    true
                )
            } else {
                // const res = await fetch("https://livepeer.studio/api/asset/request-upload", {
                //     method: "POST",
                //     headers: {
                //         "Content-Type": "application/json",
                //         Authorization: "Bearer " + process.env.NEXT_PUBLIC_STUDIO_API_KEY,
                //     },
                //     body: JSON.stringify({
                //         name: "Test Name",
                //     }),
                // })
                // console.log("res", res)
                // const data = await res.json()
                // console.log("data", data)
                // console.log("video", video)
                // const res2 = await fetch(data.url, {
                //     method: "PUT",
                //     headers: {
                //         "Content-Type": "video/mp4",
                //     },
                //     body: video,
                // })
                // console.log("res2", res2)
                // if (res2.status !== 200) {
                //     console.log("error uploading video")
                //     updateNotification({
                //         id: "load-data",
                //         autoClose: 5000,
                //         title: "Unable to create a " + postType,
                //         message: "Check console for more details",
                //         color: "red",
                //         icon: <IconX />,
                //         className: "my-notification-class",
                //         loading: false,
                //     })
                //     return
                // }
                // const encryptedDescription = await encryptContent(postDescription)
                // const encryptedAssetId = await encryptContent(data.asset.id)
                // await uploadPost(
                //     profileId,
                //     signer,
                //     address,
                //     postTitle,
                //     JSON.stringify(encryptedDescription),
                //     "video",
                //     true,
                //     JSON.stringify(encryptedAssetId)
                // )
                if (authStatus !== AuthStatus.SignedIn) {
                    console.log("not signed in")
                    updateNotification({
                        id: "load-data",
                        autoClose: 5000,
                        title: "Unable to create a " + postType,
                        message: "Sign in to Web3 Storage to upload a video",
                        color: "red",
                        icon: <IconX />,
                        className: "my-notification-class",
                        loading: false,
                    })
                    return
                }
                let cid
                try {
                    cid = await uploader.uploadFile(video)
                    console.log("cid", cid)
                    console.log("cidString", cid.toString())
                } catch (error) {
                    console.log("error uploading video", error)
                    updateNotification({
                        id: "load-data",
                        autoClose: 5000,
                        title: "Unable to create a " + postType,
                        message: "Check console for more details",
                        color: "red",
                        icon: <IconX />,
                        className: "my-notification-class",
                        loading: false,
                    })
                    return
                }
                const encryptedDescription = await encryptContent(postDescription)
                const encryptedCid = await encryptContent(cid.toString())
                await uploadPost(
                    profileId,
                    signer,
                    address,
                    postTitle,
                    JSON.stringify(encryptedDescription),
                    "video",
                    true,
                    JSON.stringify(encryptedCid)
                )
            }
            setButtonClicked(false)
            resetInputs()
            updateNotification({
                id: "load-data",
                color: "teal",
                title: "Posted Successfully",
                message: postType.charAt(0).toUpperCase() + postType.slice(1) + " has been created",
                icon: <IconCheck size={16} />,
                autoClose: 2000,
            })

            router.reload()
            // setTimeout(() => {
            //     console.log("fetching posts after 5 seconds")
            //     fetchPostsFromLens().then(() => {
            //         console.log("fetched posts after 5 seconds")
            //     })
            // }, 5000)

            // setTimeout(() => {
            //     console.log("fetching posts after 10 seconds")
            //     fetchPostsFromLens().then(() => {
            //         console.log("fetched posts after 10 seconds")
            //     })
            // }, 10000)

            // setTimeout(() => {
            //     console.log("fetching posts after 15 seconds")
            //     fetchPostsFromLens().then(() => {
            //         console.log("fetched posts after 15 seconds")
            //     })
            // }, 15000)

            // setTimeout(() => {
            //     console.log("fetching posts after 20 seconds")
            //     fetchPostsFromLens().then(() => {
            //         console.log("fetched posts after 20 seconds")
            //     })
            // }, 20000)

            // setTimeout(() => {
            //     console.log("fetching posts after 25 seconds")
            //     fetchPostsFromLens().then(() => {
            //         console.log("fetched posts after 25 seconds")
            //     })
            // }, 25000)
        } catch (error) {
            console.log("error: ", error)
            updateNotification({
                id: "load-data",
                autoClose: 5000,
                title: "Unable to create a " + postType,
                message: "Check console for more details",
                color: "red",
                icon: <IconX />,
                className: "my-notification-class",
                loading: false,
            })
        }
    }
    // useEffect(() => {
    //     if (lockAddress) {
    //         console.log("lockAddress: ", lockAddress)
    //         getOwnersOfNFTContract(lockAddress)
    //     }
    // }, [lockAddress])

    const items = stats.map((stat) => (
        <div key={stat.label}>
            <Text align="center" size="lg" weight={500}>
                {stat.value}
            </Text>
            <Text align="center" size="sm" color="dimmed">
                {stat.label}
            </Text>
        </div>
    ))

    // const posts = [
    //     {
    //         id: 1,
    //         title: "Post 1",
    //         description: "Post 1 description",
    //         postedAt: "2021-01-01",
    //     },
    //     {
    //         id: 2,
    //         title: "Post 2",
    //         description:
    //             "Post 2 description Lorem ipsum dolor sit amet, consectetur adipiscing elit. ",
    //         postedAt: "2021-01-01",
    //     },
    //     {
    //         id: 3,
    //         title: "Post 3",
    //         description:
    //             "Post 3 description Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi at sapien et sapien egestas egestas ac ac justo. Donec efficitur placerat felis ac molestie. Suspendisse egestas vitae turpis et faucibus. Nam sodales congue risus, vitae tincidunt est blandit quis. Nullam sed suscipit leo. Vivamus maximus mauris velit, vitae suscipit lectus dictum sit amet. Aliquam porta finibus pulvinar. Pellentesque gravida accumsan rutrum. Nam at tellus nec elit viverra viverra. Suspendisse blandit nibh eget fermentum dictum. Etiam fringilla mattis ante, ac blandit dui mollis nec.",
    //         postedAt: "2021-01-01",
    //     },
    //     {
    //         id: 4,
    //         title: "Post 4",
    //         description:
    //             "Post 4 description Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi at sapien et sapien egestas egestas ac ac justo. Donec efficitur placerat felis ac molestie. Suspendisse egestas vitae turpis et faucibus. Nam sodales congue risus, vitae tincidunt est blandit quis. Nullam sed suscipit leo. Vivamus maximus mauris velit, vitae suscipit lectus dictum sit amet. Aliquam porta finibus pulvinar. Pellentesque gravida accumsan rutrum. Nam at tellus nec elit viverra viverra. Suspendisse blandit nibh eget fermentum dictum. Etiam fringilla mattis ante, ac blandit dui mollis nec.",
    //         postedAt: "2021-01-01",
    //     },
    // ]

    // only render posts if they are changed
    const postItems = useMemo(() => {
        return posts.map((post) => (
            <Card
                key={post.id}
                withBorder
                p="xl"
                radius="md"
                className={classes.card}
                sx={{ width: "50%" }}
            >
                {post.postType == "video" ? (
                    <div key={post.id}>
                        <Text align="center" size="lg" weight={500}>
                            {post.title}
                        </Text>
                        <Text align="center" size="xs" color="dimmed">
                            {post.postedAt}
                        </Text>
                        {post.encrypted && (
                            <Center>
                                <Badge variant="gradient" gradient={{ from: "orange", to: "red" }}>
                                    ENCRYPTED
                                </Badge>
                            </Center>
                        )}
                        <Text align="center" size="sm" color="dimmed">
                            {post.description}
                        </Text>
                        <Video assetId={post.assetId} />
                    </div>
                ) : (
                    <div key={post.id}>
                        <Text align="center" size="lg" weight={500}>
                            {post.title}
                        </Text>
                        <Text align="center" size="xs" color="dimmed">
                            {post.postedAt}
                        </Text>
                        {post.encrypted && (
                            <Center>
                                <Badge variant="gradient" gradient={{ from: "orange", to: "red" }}>
                                    ENCRYPTED
                                </Badge>
                            </Center>
                        )}
                        <Text align="center" size="sm" color="dimmed">
                            {post.description}
                        </Text>
                    </div>
                )}
            </Card>
        ))
    }, [posts])

    const getOwnersOfNFTContract = async (address: string) => {
        console.log("lockAddress: ", address)
        // Get owners
        const owners: { owners: [string] } = await alchemy.nft.getOwnersForContract(address)
        console.log("owners", owners)
        return owners
    }

    const handleFollowUnfollow = async () => {
        // if (isUserFollowing) {
        //     let res = await setFollow(userAddress, signer, address, false)
        //     if (res.status == 200) {
        //         showNotification({
        //             id: "hello-there",
        //             autoClose: 5000,
        //             title: "Success!",
        //             message: "Successfully unfollowed",
        //             color: "teal",
        //             icon: <IconCheck size={16} />,
        //             className: "my-notification-class",
        //             loading: false,
        //         })
        //     } else {
        //         showNotification({
        //             id: "hello-there",
        //             autoClose: 5000,
        //             title: "Unable to unfollow",
        //             message: "Please try again",
        //             color: "red",
        //             icon: <IconX />,
        //             className: "my-notification-class",
        //             loading: false,
        //         })
        //     }
        // } else {
        //     let res = await setFollow(userAddress, signer, address, true)
        //     if (res.status == 200) {
        //         showNotification({
        //             id: "hello-there",
        //             autoClose: 5000,
        //             title: "Success!",
        //             message: "Successfully followed",
        //             color: "teal",
        //             icon: <IconCheck size={16} />,
        //             className: "my-notification-class",
        //             loading: false,
        //         })
        //     } else {
        //         showNotification({
        //             id: "hello-there",
        //             autoClose: 5000,
        //             title: "Unable to follow",
        //             message: "Please try again",
        //             color: "red",
        //             icon: <IconX />,
        //             className: "my-notification-class",
        //             loading: false,
        //         })
        //     }
        // }
        // setTimeout(() => {
        //     fetchFollowersFollowing(profileId)
        // }, 1000)
    }

    const encryptContent = async (body: string) => {
        const encryptionRulesCustom = getCustomEncryptionRules(lockAddress).accessControlConditions
        const client = new LitJsSdk.LitNodeClient()
        const chain = "mumbai"
        const authSig = await LitJsSdk.checkAndSignAuthMessage({ chain: "mumbai" })
        const { encryptedString, symmetricKey } = await LitJsSdk.encryptString(body)
        await client.connect()
        const encryptedSymmetricKey = await client.saveEncryptionKey({
            evmContractConditions: encryptionRulesCustom,
            symmetricKey,
            authSig,
            chain,
        })
        console.log({ encryptedSymmetricKey })
        let encryptedContentBase64 = await LitJsSdk.blobToBase64String(encryptedString)
        console.log({ encryptedContentBase64 })
        const encryptedContent = {
            toDecrypt: LitJsSdk.uint8arrayToString(encryptedSymmetricKey, "base16"),
            encrypted: encryptedContentBase64,
        }
        console.log({ encryptedContent })
        return encryptedContent
    }

    const decryptContent = async (encryptedContent) => {
        const encryptionRulesCustom = getCustomEncryptionRules(lockAddress).accessControlConditions
        const client = new LitJsSdk.LitNodeClient()
        const authSig = await LitJsSdk.checkAndSignAuthMessage({ chain: "mumbai" })
        await client.connect()
        console.log("getting symmetric key 2")
        const symmetricKey2 = await client.getEncryptionKey({
            evmContractConditions: encryptionRulesCustom,
            toDecrypt: encryptedContent.toDecrypt,
            chain: "mumbai",
            authSig,
        })
        console.log("symmetric key 2: ", symmetricKey2)
        const decryptedContent = await LitJsSdk.decryptString(
            await LitJsSdk.base64StringToBlob(encryptedContent.encrypted),
            symmetricKey2
        )
        console.log("decrypted content: ", decryptedContent)
        return decryptedContent
    }

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles && acceptedFiles.length > 0 && acceptedFiles?.[0]) {
            setVideoUrl(URL.createObjectURL(acceptedFiles[0]))
            setVideo(acceptedFiles[0])
        }
    }, [])

    return (
        <>
            <Card withBorder p="xl" radius="md" className={classes.card}>
                <Card.Section sx={{ backgroundImage: `url(${image})`, height: 140 }} />
                <Avatar
                    src={avatar}
                    size={80}
                    radius={80}
                    mx="auto"
                    mt={-30}
                    className={classes.avatar}
                />
                <Text align="center" size="lg" weight={500} mt="sm">
                    {name}
                </Text>
                <Text align="center" size="sm" color="dimmed">
                    {description}
                </Text>
                <Group mt="md" position="center" spacing={30}>
                    {items}
                </Group>
                <Group mt="md" position="center" spacing={30}>
                    <div>
                        <Button
                            fullWidth
                            radius="md"
                            mt="xl"
                            size="md"
                            color={theme.colorScheme === "dark" ? undefined : "dark"}
                            onClick={handleFollowUnfollow}
                        >
                            {isUserFollowing ? "Unfollow" : "Follow"}
                        </Button>
                    </div>
                    {isUserCreator && (
                        <div>
                            {eligible ? (
                                <Button
                                    fullWidth
                                    radius="md"
                                    mt="xl"
                                    size="md"
                                    color={theme.colorScheme === "dark" ? undefined : "dark"}
                                >
                                    {address &&
                                    userAddress &&
                                    userAddress.toLowerCase() === address.toLowerCase()
                                        ? "Owner"
                                        : "Subscribed!"}
                                </Button>
                            ) : (
                                <Button
                                    fullWidth
                                    radius="md"
                                    mt="xl"
                                    size="md"
                                    color={theme.colorScheme === "dark" ? undefined : "dark"}
                                    component="a"
                                    href={
                                        "/api/login?lockAddress=" +
                                        lockAddress +
                                        "&redirect=" +
                                        router.asPath
                                    }
                                >
                                    Subscribe
                                </Button>
                            )}
                        </div>
                    )}
                </Group>
            </Card>
            <Stack align="center" mt="md" spacing={30}>
                {isUserCreator &&
                    address &&
                    userAddress &&
                    address.toLowerCase() === userAddress.toLowerCase() && (
                        <Button
                            radius="md"
                            mt="xl"
                            size="md"
                            color="yellow"
                            onClick={() => setButtonClicked(true)}
                        >
                            Create
                        </Button>
                    )}
                {buttonClicked && (
                    <Card
                        withBorder
                        p="xl"
                        radius="md"
                        className={classes.card}
                        sx={{ width: "50%" }}
                    >
                        <Group position="right">
                            <CloseButton
                                title="Close"
                                size="xl"
                                iconSize={20}
                                onClick={() => {
                                    resetInputs()
                                    setButtonClicked(false)
                                }}
                            />
                        </Group>
                        <Select
                            label="Type"
                            placeholder="Pick one"
                            required
                            value={postType}
                            onChange={(value) => setPostType(value)}
                            itemComponent={SelectItem}
                            data={data}
                            // searchable
                            maxDropdownHeight={400}
                            nothingFound="Nobody here"
                            filter={(value, item) =>
                                item.label.toLowerCase().includes(value.toLowerCase().trim()) ||
                                item.description.toLowerCase().includes(value.toLowerCase().trim())
                            }
                        />
                        <Text align="center" mt={5} size="lg" weight={500}>
                            {postType.charAt(0).toUpperCase() + postType.slice(1)}
                        </Text>
                        <Tooltip
                            label={postTitleValid ? "All good!" : "Title shouldn't be empty"}
                            position="bottom-start"
                            withArrow
                            opened={postTitleOpened}
                            color={postTitleValid ? "teal" : undefined}
                        >
                            <TextInput
                                label="Title"
                                required
                                placeholder="Your title"
                                onFocus={() => setPostTitleOpened(true)}
                                onBlur={() => setPostTitleOpened(false)}
                                mt="md"
                                value={postTitle}
                                onChange={(event) => setPostTitle(event.currentTarget.value)}
                            />
                        </Tooltip>
                        <Tooltip
                            label={
                                postDescriptionValid
                                    ? "All good!"
                                    : "Description shouldn't be empty"
                            }
                            position="bottom-start"
                            withArrow
                            opened={postDescriptionOpened}
                            color={postDescriptionValid ? "teal" : undefined}
                        >
                            <Textarea
                                label="Description"
                                required
                                placeholder="Your description"
                                autosize
                                minRows={2}
                                maxRows={4}
                                onFocus={() => setPostDescriptionOpened(true)}
                                onBlur={() => setPostDescriptionOpened(false)}
                                mt="md"
                                value={postDescription}
                                onChange={(event) => setPostDescription(event.currentTarget.value)}
                            />
                        </Tooltip>
                        {postType === "video" && (
                            <>
                                <Text size="sm" weight="bold" mt="sm">
                                    Upload Video:
                                </Text>
                                <Dropzone
                                    onDrop={(files) => {
                                        console.log("accepted files", files)
                                        onDrop(files)
                                    }}
                                    onReject={(files) => console.log("rejected files", files)}
                                    // maxSize={3 * 1024 ** 2}
                                    accept={[MIME_TYPES.mp4]}
                                >
                                    <Group
                                        position="center"
                                        spacing="xl"
                                        style={{ minHeight: 220, pointerEvents: "none" }}
                                    >
                                        <Dropzone.Accept>
                                            <IconUpload
                                                size={50}
                                                stroke={1.5}
                                                color={
                                                    theme.colors[theme.primaryColor][
                                                        theme.colorScheme === "dark" ? 4 : 6
                                                    ]
                                                }
                                            />
                                        </Dropzone.Accept>
                                        <Dropzone.Reject>
                                            <IconX
                                                size={50}
                                                stroke={1.5}
                                                color={
                                                    theme.colors.red[
                                                        theme.colorScheme === "dark" ? 4 : 6
                                                    ]
                                                }
                                            />
                                        </Dropzone.Reject>
                                        <Dropzone.Idle>
                                            <IconVideo size={50} stroke={1.5} />
                                        </Dropzone.Idle>

                                        <div>
                                            <Text size="xl" inline>
                                                Drag video here or click to select files
                                            </Text>
                                            <Text size="sm" color="dimmed" inline mt={7}>
                                                Attach video of mp3 format
                                            </Text>
                                        </div>
                                    </Group>
                                </Dropzone>
                                {video && (
                                    <>
                                        <Text size="sm" weight="bold" mt="sm">
                                            Uploaded Video:
                                        </Text>
                                        <Center>
                                            <video
                                                height="300"
                                                src={videoUrl}
                                                controls={true}
                                            ></video>
                                        </Center>
                                    </>
                                )}
                            </>
                        )}

                        <Button
                            radius="md"
                            mt="xl"
                            size="md"
                            color="orange"
                            onClick={() => {
                                handleSubmit()
                            }}
                        >
                            Submit
                        </Button>
                    </Card>
                )}
                {isUserCreator ? (
                    eligible ? (
                        postItems
                    ) : (
                        <Text size="xl" weight="bold" align="center" mt="xl" color="gray">
                            Look like you don't have membership to access the content. Click
                            subscribe to get a membership or to verify your membership.
                        </Text>
                    )
                ) : (
                    <Text size="xl" weight="bold" align="center" mt="xl" color="gray">
                        {address &&
                        userAddress &&
                        userAddress.toLowerCase() !== address.toLowerCase()
                            ? "Look like this user is not a creator."
                            : "Look like you are not a creator. Click on plus icon to become a creator."}
                    </Text>
                )}
            </Stack>
        </>
    )
}
