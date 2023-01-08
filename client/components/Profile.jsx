import React, { useContext, useEffect, useState } from "react"
// import Posts from "./Posts"
import { showNotification, updateNotification } from "@mantine/notifications"
import {
    IconCloudUpload,
    IconX,
    IconDownload,
    IconCheck,
    IconMessageCircle,
    IconPhoto,
    IconNote,
    IconChristmasTree,
    IconVideo,
    IconMessage2,
    IconUserCircle,
} from "@tabler/icons"
import {
    createStyles,
    SimpleGrid,
    Card,
    Image,
    Text,
    Tabs,
    Container,
    AspectRatio,
    Button,
    Center,
} from "@mantine/core"
// import NFTs from "./NFTs"
import { useAccount, useSigner } from "wagmi"
import { useRouter } from "next/router"
// import { climateNftTableName, nftTableName, postTableName } from "../constants"
import { Layout } from "./Layout"
import UserPage from "./UserPage"
import LivePage from "./LivePage"
import { lockAbi, tableName } from "../constants"
import { ethers } from "ethers"
import useSWR from "swr"
import { useUser } from "../hooks/useUser"
import { MembershipMetadata } from "../types"
import useLens from "../hooks/useLens"
import { Chat } from "@pushprotocol/uiweb"

function Profile() {
    const { logoutUser, user } = useUser()
    const { data } = useSWR("/api/memberships")
    const { address, isConnected } = useAccount()
    const router = useRouter()
    const { data: signer, isError, isLoading } = useSigner()
    const { getProfile } = useLens()
    const [isUserFollowing, setIsUserFollowing] = useState(false)
    const [image, setImage] = useState("")
    const [avatar, setAvatar] = useState("")
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [stats, setStats] = useState([
        { label: "Followers", value: "" },
        { label: "Following", value: "" },
        { label: "Subscribers", value: "" },
    ])
    const [userAddress, setUserAddress] = useState("")
    const [lockAddress, setLockAddress] = useState("")
    const [streamId, setStreamId] = useState("")
    const [profileId, setProfileId] = useState("")
    const [isUserCreator, setIsUserCreator] = useState(false)

    const isUserEligible =
        lockAddress &&
        userAddress &&
        address &&
        ((user?.isLoggedIn &&
            data?.memberships?.some(
                (m) =>
                    m.lockAddress.toLowerCase() === lockAddress.toLowerCase() &&
                    m.owner.toLowerCase() === address.toLowerCase()
            )) ||
            userAddress.toLowerCase() === address.toLowerCase())

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

    useEffect(() => {}, [signer])

    useEffect(() => {
        console.log("useEffect Profile.jsx check", { router, signer, isConnected })
        if (router.isReady) {
            console.log("router.isReady", router.isReady)
            if (router.query.userAddress) {
                console.log("userAddress", router.query.userAddress)
                fetchPosts()
            } else {
                handleUserProfile()
            }
        }
    }, [router, signer, isConnected])

    const handleUserProfile = async () => {
        if (!isConnected) {
            showNotification({
                id: "hello-there",
                // onClose: () => console.log("unmounted"),
                // onOpen: () => console.log("mounted"),
                autoClose: 5000,
                title: "Connect your wallet to view your profile",
                color: "red",
                icon: <IconX />,
                className: "my-notification-class",
                loading: false,
            })
            return
        } else {
            router.push("/profile/" + address)
            fetchPosts(address)
        }
    }

    const fetchPosts = async (userAddressArg) => {
        const userAddress = userAddressArg ? userAddressArg : router.query.userAddress[0]
        setUserAddress(userAddress.toLowerCase())
        // // const postsData = await fetch("https://testnet.tableland.network/query?s=" + "SELECT * FROM " + postTableName + " LIMIT 10")
        // const postsData = await fetch(
        //     "https://testnet.tableland.network/query?s=" +
        //         "SELECT * FROM " +
        //         postTableName +
        //         " WHERE userAddress = '" +
        //         userAddress.toLowerCase() +
        //         "'"
        // )
        // const postsDataJson = await postsData.json()
        // setPosts(postsDataJson)
        const usersData = await fetch(
            "https://testnet.tableland.network/query?s=" +
                "SELECT * FROM " +
                tableName +
                " WHERE userAddress = '" +
                userAddress.toLowerCase() +
                "'"
        )
        const usersDataJson = await usersData.json()
        console.log("usersDataJson", usersDataJson)
        if (
            usersDataJson.length === 0 ||
            usersDataJson.message === "Row not found" ||
            !usersDataJson[0]
        ) {
            setIsUserCreator(false)
            setStats((prev) => {
                return [
                    { label: "Followers", value: 0 },
                    { label: "Following", value: 0 },
                    { label: "Subscribers", value: 0 },
                ]
            })
            return
        }
        setIsUserCreator(true)
        setLockAddress(usersDataJson[0].lockAddress)
        setProfileId(usersDataJson[0].profileId)
        ;(async () => {
            const res = await fetch(
                `https://${usersDataJson[0].cid}.ipfs.nftstorage.link/data.json`
            )
            const data = await res.json()
            setDescription(data.description)
            setStreamId(data.streamId)
            console.log(data)
        })()
        // ;(async () => {
        // })()
        fetchFollowersFollowing(usersDataJson[0].profileId)
        // ;(async () => {
        // })()
        fetchSubscribers(usersDataJson)
        // ;(async () => {
        // })()
        // fetchIsFollowing(usersDataJson[0].profileId)
    }

    const fetchFollowersFollowing = async (profileId) => {
        const data = await getProfile(profileId)
        console.log("data", data)
        const handle = data.handle
        const username = handle.substring(0, handle.length - 5)
        setName(username)
        setAvatar(data.picture?.original?.url)
        setStats((prev) => {
            return [
                { label: "Followers", value: data.stats.totalFollowers },
                { label: "Following", value: data.stats.totalFollowing },
                { label: "Subscribers", value: prev[2].value },
            ]
        })
        // if (error) {
        //     setStats((prev) => {
        //         return [
        //             { label: "Followers", value: 0 },
        //             { label: "Following", value: 0 },
        //             { label: "Subscribers", value: prev[2].value },
        //         ]
        //     })
        //     console.log("error", error)
        //     return
        // }
        // console.log("followersFollowing: ", data)
        // setName(data.username)
        // setImage(data.details.profile.cover)
        // setAvatar(data.details.profile.pfp)
        // setStats((prev) => {
        //     return [
        //         { label: "Followers", value: data.count_followers },
        //         { label: "Following", value: data.count_following },
        //         { label: "Subscribers", value: prev[2].value },
        //     ]
        // })
        // console.log(data)
    }

    const fetchSubscribers = async (usersDataJson) => {
        // console.log("usersDataJson", usersDataJson)
        const contractInstance = new ethers.Contract(
            usersDataJson[0].lockAddress,
            lockAbi,
            ethers.getDefaultProvider(process.env.NEXT_PUBLIC_MUMBAI_RPC_URL)
        )

        console.log(contractInstance)

        const totalSubscribers = await contractInstance.totalSupply()
        setStats((prev) => {
            return [
                { label: "Followers", value: prev[0].value },
                { label: "Following", value: prev[1].value },
                { label: "Subscribers", value: totalSubscribers.toString() },
            ]
        })
    }

    const fetchIsFollowing = async (profileId) => {
        // let { data, error } = await getIsFollowing(profileId, signer, userAddress)
        // console.log("isFollowing: ", data)
        // if (data) {
        //     setIsUserFollowing(true)
        // } else {
        //     setIsUserFollowing(false)
        // }
    }

    const userProps = {
        isUserFollowing: isUserFollowing,
        image: image,
        avatar: avatar,
        name: name,
        description: description,
        stats: stats,
        userAddress: userAddress,
        streamId: streamId,
        lockAddress: lockAddress,
        profileId: profileId,
        fetchFollowersFollowing: fetchFollowersFollowing,
    }

    // const user = {
    //     image: "https://previews.123rf.com/images/karpenkoilia/karpenkoilia1806/karpenkoilia180600011/102988806-vector-line-web-concept-for-programming-linear-web-banner-for-coding-.jpg",
    //     avatar: "https://images.unsplash.com/photo-1623582854588-d60de57fa33f?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=250&q=80",
    //     name: "Bill Headbanger",
    //     description:
    //         "Fullstack engineer Fullstack engineer Fullstack engineer Fullstack engineer Fullstack engineer Fullstack engineer",
    //     stats: [
    //         { label: "Followers", value: "34K" },
    //         { label: "Following", value: "2K" },
    //         { label: "Subscribers", value: "5K" },
    //     ],
    //     address: "0x123456789",
    // }

    return (
        <Layout>
            <div>
                {isUserEligible ? (
                    isUserCreator ? (
                        <Tabs keepMounted={false} variant="pills" defaultValue="profile">
                            <Tabs.List>
                                <Tabs.Tab value="profile" icon={<IconUserCircle size={14} />}>
                                    Profile
                                </Tabs.Tab>
                                {/* <Tabs.Tab value="chatroom" icon={<IconMessage2 size={14} />}>
                                    Chat Room
                                </Tabs.Tab> */}
                                <Tabs.Tab value="live" icon={<IconVideo size={14} />}>
                                    Live
                                </Tabs.Tab>
                            </Tabs.List>

                            <Tabs.Panel value="profile" pt="xs">
                                <UserPage
                                    {...userProps}
                                    eligible={true}
                                    isUserCreator={isUserCreator}
                                />
                            </Tabs.Panel>

                            {/* <Tabs.Panel value="chatroom" pt="xs">
                                <ChatRoom {...chatProps} />
                            </Tabs.Panel> */}

                            <Tabs.Panel value="live" pt="xs">
                                <LivePage
                                    streamId={streamId}
                                    userAddress={userAddress}
                                    lockAddress={lockAddress}
                                />
                            </Tabs.Panel>
                        </Tabs>
                    ) : (
                        <div>
                            <UserPage
                                {...userProps}
                                eligible={false}
                                isUserCreator={isUserCreator}
                            />
                        </div>
                    )
                ) : (
                    <div>
                        <UserPage {...userProps} eligible={false} isUserCreator={isUserCreator} />
                    </div>
                )}
                <Chat
                    // @ts-ignore
                    account={address} //user address
                    supportAddress={userAddress} //support address
                    apiKey="jVPMCRom1B.iDRMswdehJG7NpHDiECIHwYMMv6k2KzkPJscFIDyW8TtSnk4blYnGa8DIkfuacU0"
                    env="staging"
                />
            </div>
        </Layout>
    )
}

export default Profile
