import { ReactNode, useEffect, useState } from "react"
import { AppShell, Navbar, Header, Text, Grid, Button, Modal, TextInput, Menu } from "@mantine/core"
import { NavbarMinimal } from "../components/Navigation"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useAccount } from "wagmi"
import { useRouter } from "next/router"
import { IconCircleDotted, IconX } from "@tabler/icons"
import { AuthStatus, useAuth } from "@w3ui/react-keyring"
import { showNotification } from "@mantine/notifications"
import usePush from "../hooks/usePush"
import { chainNameType, NotificationItem } from "@pushprotocol/uiweb"
import { CHANNEL_ADDRESS } from "../constants"

interface Props {
    children?: ReactNode
}

export function Layout({ children }: Props) {
    const { address, isConnected } = useAccount()
    const router = useRouter()
    const {
        authStatus,
        identity,
        registerAndStoreIdentity,
        cancelRegisterAndStoreIdentity,
        unloadIdentity,
        unloadAndRemoveIdentity,
        loadDefaultIdentity,
    } = useAuth()
    console.log("props", { authStatus, identity })
    const [email, setEmail] = useState("")
    const [modalOpened, setModalOpened] = useState(false)

    const { receiveNotifs, hasUserOptedIn, optIn } = usePush()

    const [notifications, setNotifications] = useState([])
    const [userSubscriptions, setUserSubscriptions] = useState<Array<{ channel: string }>>([])

    // const hasUserOptedIn
    // map in userSubscriptions and check if channel address is in there
    const hasUserOptedInToChannel = userSubscriptions.some(
        (subscription) => subscription.channel === CHANNEL_ADDRESS
    )
    const notif = (
        <div>
            {notifications &&
                notifications.map((oneNotification, i) => {
                    const { cta, title, message, app, icon, image, url, blockchain, notification } =
                        oneNotification

                    return (
                        <NotificationItem
                            key={crypto.randomUUID()} // any unique id
                            notificationTitle={title}
                            notificationBody={message}
                            cta={cta}
                            app={app}
                            icon={icon}
                            image={image}
                            url={url}
                            theme={"dark"}
                            chainName={blockchain as chainNameType} // if using Typescript
                        />
                    )
                })}
        </div>
    )

    const getNotifs = async () => {
        return await receiveNotifs(address)
    }

    useEffect(() => {
        if (!address) {
            return
        }
        getNotifs().then((res) => {
            setNotifications(res)
        })
        hasUserOptedIn(address).then((res) => {
            setUserSubscriptions(res)
            console.log("userSubscriptions", { res })
        })
    }, [address])

    useEffect(() => {
        loadDefaultIdentity()
    }, [])

    const titleClick = () => {
        router.push("/")
    }
    const handleRegisterSubmit = async (e) => {
        e.preventDefault()
        try {
            await unloadAndRemoveIdentity()
        } catch (error) {
            console.log("error", error)
        }
        try {
            await registerAndStoreIdentity(email)
        } catch (err) {
            // throw new Error("failed to register", { cause: err })
            console.log("failed to register", { err })
            showNotification({
                id: "hello-there",
                // onClose: () => console.log("unmounted"),
                // onOpen: () => console.log("mounted"),
                autoClose: 5000,
                title: "Error",
                message: "Failed to register, check console for details",
                color: "red",
                icon: <IconX />,
                className: "my-notification-class",
                loading: false,
            })
        }
    }
    return (
        <AppShell
            padding="md"
            navbar={<NavbarMinimal />}
            header={
                <Header height={60} p="xs">
                    <Grid justify="space-between" columns={2} align="center" pl={35} pr={35} mt={2}>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                            }}
                            onClick={() => {
                                titleClick()
                            }}
                        >
                            <Text size={25} weight={700} sx={{ marginRight: "5px" }}>
                                Livopedia
                            </Text>
                            <IconCircleDotted size={35} />
                        </div>
                        <div>
                            {authStatus === AuthStatus.SignedIn ? (
                                <Button onClick={() => unloadAndRemoveIdentity()}>
                                    Sign Out W3S
                                </Button>
                            ) : (
                                <Button onClick={() => setModalOpened(true)}>Sign In W3S</Button>
                            )}
                            <Modal
                                opened={modalOpened}
                                onClose={() => setModalOpened(false)}
                                title="Sign In"
                            >
                                {authStatus === AuthStatus.EmailVerification ? (
                                    <>
                                        <h1 className="near-white">Verify your email address!</h1>
                                        <p>
                                            Click the link in the email we sent to{" "}
                                            {identity && identity.email} to sign in.
                                        </p>
                                        <form
                                            onSubmit={(e) => {
                                                e.preventDefault()
                                                unloadAndRemoveIdentity()
                                                cancelRegisterAndStoreIdentity()
                                            }}
                                        >
                                            <button type="submit" className="ph3 pv2">
                                                Cancel
                                            </button>
                                        </form>
                                    </>
                                ) : (
                                    <>
                                        <TextInput
                                            label="Email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            type="email"
                                            required
                                        />
                                        <Button onClick={handleRegisterSubmit} mt="md">
                                            Register
                                        </Button>
                                    </>
                                )}
                            </Modal>
                        </div>
                        <div>
                            {!hasUserOptedInToChannel ? (
                                <Button
                                    onClick={() => {
                                        optIn()
                                    }}
                                >
                                    Opt In to Notifications
                                </Button>
                            ) : (
                                <Menu>
                                    <Menu.Target>
                                        <Button>Notifications</Button>
                                    </Menu.Target>
                                    <Menu.Dropdown>
                                        <Menu.Item>{notif}</Menu.Item>
                                    </Menu.Dropdown>
                                </Menu>
                            )}
                        </div>
                        <div>
                            <ConnectButton />
                        </div>
                        {/* <ConnectButton /> */}
                    </Grid>
                </Header>
            }
            styles={(theme) => ({
                main: {
                    backgroundColor:
                        theme.colorScheme === "dark" ? theme.colors.dark[8] : theme.colors.gray[0],
                },
            })}
        >
            {children}
        </AppShell>
    )
}
