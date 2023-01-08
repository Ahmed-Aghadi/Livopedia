import { Button, Text } from "@mantine/core"
import type { NextPage } from "next"
import Chat from "../components/Chat"
import { Layout } from "../components/Layout"

const Home: NextPage = () => {
    return (
        <Layout>
            <Chat />
        </Layout>
    )
}

export default Home
