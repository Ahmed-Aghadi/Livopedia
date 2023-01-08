import Head from "next/head"
import Image from "next/image"
import styles from "../styles/Home.module.css"
import { AppShell, Navbar, Header, Button, SimpleGrid, Text } from "@mantine/core"
import { NavbarMinimal } from "../components/Navigation"
import { Layout } from "../components/Layout"
import { useContext, useEffect, useState } from "react"
import { UserCard, UserCardImageProps } from "../components/UserCard"
import { tableName } from "../constants"

export default function Home() {
    const [users, setUsers] = useState([])

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        // const postsData = await fetch("https://testnet.tableland.network/query?s=" + "SELECT * FROM " + postTableName + " LIMIT 10")
        const usersData = await fetch(
            "https://testnet.tableland.network/query?s=" + "SELECT * FROM " + tableName
        )
        const usersDataJson = await usersData.json()
        console.log("usersDataJson", usersDataJson)
        setUsers(usersDataJson)
    }

    const Users = [
        {
            image: "https://previews.123rf.com/images/karpenkoilia/karpenkoilia1806/karpenkoilia180600011/102988806-vector-line-web-concept-for-programming-linear-web-banner-for-coding-.jpg",
            avatar: "https://images.unsplash.com/photo-1623582854588-d60de57fa33f?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=250&q=80",
            name: "Bill Headbanger",
            description:
                "Fullstack engineer Fullstack engineer Fullstack engineer Fullstack engineer Fullstack engineer Fullstack engineer",
            stats: [
                { label: "Followers", value: "34K" },
                { label: "Following", value: "2K" },
                { label: "Subscribers", value: "5K" },
            ],
            address: "0x123456789",
        },
        {
            image: "https://previews.123rf.com/images/karpenkoilia/karpenkoilia1806/karpenkoilia180600011/102988806-vector-line-web-concept-for-programming-linear-web-banner-for-coding-.jpg",
            avatar: "https://images.unsplash.com/photo-1623582854588-d60de57fa33f?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=250&q=80",
            name: "Bill Headbanger",
            description: "Fullstack engineer",
            stats: [
                { label: "Followers", value: "34K" },
                { label: "Following", value: "2K" },
                { label: "Subscribers", value: "5K" },
            ],
            address: "0x123456789",
        },
        {
            image: "https://previews.123rf.com/images/karpenkoilia/karpenkoilia1806/karpenkoilia180600011/102988806-vector-line-web-concept-for-programming-linear-web-banner-for-coding-.jpg",
            avatar: "https://images.unsplash.com/photo-1623582854588-d60de57fa33f?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=250&q=80",
            name: "Bill Headbanger",
            description: "Fullstack engineer",
            stats: [
                { label: "Followers", value: "34K" },
                { label: "Following", value: "2K" },
                { label: "Subscribers", value: "5K" },
            ],
            address: "0x123456789",
        },
    ]

    return (
        <Layout>
            <div className={styles.container}>
                <SimpleGrid cols={3}>
                    {users && !users.message && users.length > 0
                        ? users.map((user, index) => <UserCard key={user.id} {...user} />)
                        : null}
                </SimpleGrid>
            </div>
        </Layout>
    )
}
