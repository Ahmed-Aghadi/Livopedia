import { createStyles, Card, Avatar, Text, Group, Button } from "@mantine/core"
import { ethers } from "ethers"
import { useRouter } from "next/router"
import { useContext, useEffect, useState } from "react"
import { useSigner } from "wagmi"
import { lockAbi } from "../constants/"
import useLens from "../hooks/useLens"

const useStyles = createStyles((theme) => ({
    card: {
        backgroundColor: theme.colorScheme === "dark" ? theme.colors.dark[7] : theme.white,
    },

    avatar: {
        border: `2px solid ${theme.colorScheme === "dark" ? theme.colors.dark[7] : theme.white}`,
    },
}))

// export interface UserCardImageProps {
//     image: string
//     avatar: string
//     name: string
//     description: string
//     stats: { label: string; value: string }[]
//     address: string
// }

export interface UserCardImageProps {
    id: number
    cid: string
    lockAddress: string
    profileId: string
    userAddress: string
}

// { image, avatar, name, description, stats, address }
export function UserCard({ id, cid, lockAddress, profileId, userAddress }: UserCardImageProps) {
    const { classes, theme } = useStyles()
    const router = useRouter()
    const { getProfile } = useLens()
    const { data: signer } = useSigner()
    const [image, setImage] = useState("")
    const [avatar, setAvatar] = useState("")
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [stats, setStats] = useState([
        { label: "Followers", value: "" },
        { label: "Following", value: "" },
        { label: "Subscribers", value: "" },
    ])

    useEffect(() => {
        if (cid && profileId && userAddress && lockAddress) {
            ;(async () => {
                const res = await fetch(`https://${cid}.ipfs.nftstorage.link/data.json`)
                const data = await res.json()
                setDescription(data.description)
                console.log(data)
            })()
            ;(async () => {
                const data = await getProfile(profileId)
                console.log("data", data)
                const handle: string = data.handle
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
                console.log(data)
            })()
            ;(async () => {
                const contractInstance = new ethers.Contract(
                    lockAddress,
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
            })()
        }
    }, [cid, profileId, lockAddress, userAddress])

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

    return (
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
            <Text align="center" size="sm" color="dimmed" lineClamp={1}>
                {description}
            </Text>
            <Group mt="md" position="center" spacing={30}>
                {items}
            </Group>
            <Button
                fullWidth
                radius="md"
                mt="xl"
                size="md"
                color={theme.colorScheme === "dark" ? undefined : "dark"}
                onClick={() => {
                    // window.open(`https://rinkeby.etherscan.io/address/${address}`)
                    router.push(`/profile/${userAddress}`)
                }}
            >
                View Profile
            </Button>
        </Card>
    )
}
