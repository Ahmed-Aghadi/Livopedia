import { Client, ContentTypeId, ContentCodec } from "@xmtp/xmtp-js"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useAccount, useSigner } from "wagmi"
import {
    ActionIcon,
    Avatar,
    Badge,
    Box,
    Button,
    Center,
    Code,
    Container,
    Grid,
    Group,
    Input,
    Modal,
    Navbar,
    Paper,
    ScrollArea,
    Skeleton,
    Stack,
    Text,
    Tooltip,
    UnstyledButton,
} from "@mantine/core"
import { TextInput, createStyles } from "@mantine/core"
import {
    IconAlertCircle,
    IconBrandTwitter,
    IconBulb,
    IconCheck,
    IconCheckbox,
    IconPlus,
    IconSearch,
    IconSelector,
    IconSend,
    IconUpload,
    IconUser,
    IconVideo,
    IconVideoPlus,
    IconX,
} from "@tabler/icons"
import { ethers } from "ethers"
import { isEns } from "../helpers/string"
import { showNotification, updateNotification } from "@mantine/notifications"

import { useUploader } from "@w3ui/react-uploader"
import { AuthStatus, useAuth } from "@w3ui/react-keyring"
import { Dropzone, MIME_TYPES } from "@mantine/dropzone"
import { Player } from "@livepeer/react"

const useStyles = createStyles((theme, { floating }) => ({
    root: {
        position: "relative",
    },

    label: {
        position: "absolute",
        zIndex: 2,
        top: 7,
        left: theme.spacing.sm,
        pointerEvents: "none",
        color: floating
            ? theme.colorScheme === "dark"
                ? theme.white
                : theme.black
            : theme.colorScheme === "dark"
            ? theme.colors.dark[3]
            : theme.colors.gray[5],
        transition: "transform 150ms ease, color 150ms ease, font-size 150ms ease",
        transform: floating ? `translate(-${theme.spacing.sm}px, -28px)` : "none",
        fontSize: floating ? theme.fontSizes.xs : theme.fontSizes.sm,
        fontWeight: floating ? 500 : 400,
    },

    required: {
        transition: "opacity 150ms ease",
        opacity: floating ? 1 : 0,
    },

    input: {
        "&::placeholder": {
            transition: "color 150ms ease",
            color: !floating ? "transparent" : undefined,
        },
    },
    navbar: {
        paddingTop: 0,
        marginLeft: "80px",
    },

    section: {
        marginLeft: -theme.spacing.md,
        marginRight: -theme.spacing.md,
        marginBottom: theme.spacing.md,

        "&:not(:last-of-type)": {
            borderBottom: `1px solid ${
                theme.colorScheme === "dark" ? theme.colors.dark[4] : theme.colors.gray[3]
            }`,
        },
    },

    searchCode: {
        fontWeight: 700,
        fontSize: 10,
        backgroundColor: theme.colorScheme === "dark" ? theme.colors.dark[7] : theme.colors.gray[0],
        border: `1px solid ${
            theme.colorScheme === "dark" ? theme.colors.dark[7] : theme.colors.gray[2]
        }`,
    },

    mainLinks: {
        paddingLeft: theme.spacing.md - theme.spacing.xs,
        paddingRight: theme.spacing.md - theme.spacing.xs,
        paddingBottom: theme.spacing.md,
    },

    mainLink: {
        display: "flex",
        alignItems: "center",
        width: "100%",
        fontSize: theme.fontSizes.xs,
        padding: `8px ${theme.spacing.xs}px`,
        borderRadius: theme.radius.xl,
        fontWeight: 500,
        color: theme.colorScheme === "dark" ? theme.colors.dark[0] : theme.colors.gray[7],

        "&:hover": {
            backgroundColor:
                theme.colorScheme === "dark" ? theme.colors.dark[6] : theme.colors.gray[0],
            color: theme.colorScheme === "dark" ? theme.white : theme.black,
        },
    },

    mainLinkInner: {
        display: "flex",
        alignItems: "center",
        flex: 1,
        justifyContent: "center",
    },

    mainLinkIcon: {
        marginRight: theme.spacing.sm,
        color: theme.colorScheme === "dark" ? theme.colors.dark[2] : theme.colors.gray[6],
    },

    mainLinkBadge: {
        padding: 0,
        width: 20,
        height: 20,
        pointerEvents: "none",
    },

    collections: {
        paddingLeft: theme.spacing.md - 6,
        paddingRight: theme.spacing.md - 6,
        paddingBottom: theme.spacing.md,
    },

    collectionsHeader: {
        paddingLeft: theme.spacing.md + 2,
        paddingRight: theme.spacing.md,
        marginBottom: 5,
    },

    collectionLink: {
        display: "block",
        padding: `8px ${theme.spacing.xs}px`,
        textDecoration: "none",
        borderRadius: theme.radius.sm,
        fontSize: theme.fontSizes.xs,
        color: theme.colorScheme === "dark" ? theme.colors.dark[0] : theme.colors.gray[7],
        lineHeight: 1,
        fontWeight: 500,

        "&:hover": {
            backgroundColor:
                theme.colorScheme === "dark" ? theme.colors.dark[6] : theme.colors.gray[0],
            color: theme.colorScheme === "dark" ? theme.white : theme.black,
        },
    },
}))

const links = [
    { icon: IconBulb, label: "Activity", notifications: 3 },
    { icon: IconCheckbox, label: "Tasks", notifications: 4 },
    { icon: IconUser, label: "Contacts" },
]

const collections = [
    { emoji: "👍", label: "Sales" },
    { emoji: "🚚", label: "Deliveries" },
    { emoji: "💸", label: "Discounts" },
    { emoji: "💰", label: "Profits" },
    { emoji: "✨", label: "Reports" },
    { emoji: "🛒", label: "Orders" },
    { emoji: "📅", label: "Events" },
    { emoji: "🙈", label: "Debts" },
    { emoji: "💁‍♀️", label: "Customers" },
]

const ContentTypeVideoKey = new ContentTypeId({
    authorityId: "xmtp.test",
    typeId: "video-key",
    versionMajor: 1,
    versionMinor: 0,
})

class VideoCodec {
    get contentType() {
        return ContentTypeVideoKey
    }

    encode(key) {
        console.log("encode", key)
        return {
            type: ContentTypeVideoKey,
            parameters: {},
            content: new TextEncoder().encode(key),
        }
    }

    decode(content) {
        // console.log(content.content.toString())
        console.log("decode", content)
        const uint8Array = content.content
        const key = new TextDecoder().decode(uint8Array)
        console.log("key", key)
        return key
    }
}

const ethProvider = ethers.getDefaultProvider(process.env.NEXT_PUBLIC_ETH_RPC_URL)

export default function Chat() {
    const [focused, setFocused] = useState(false)
    const [value, setValue] = useState("")
    const { classes, theme } = useStyles({
        floating: value.trim().length !== 0 || focused,
    })
    const [chats, setChats] = useState([])
    const [conversations, setConversations] = useState([])
    const [xmtp, setXmtp] = useState()
    const { data: signer, isError, isLoading, isFetched, isRefetching, isSuccess } = useSigner()
    const { address } = useAccount()
    const [userAddress, setUserAddress] = useState("")
    const [isMessageLoading, setIsMessageLoading] = useState(true)
    const [isConversationsLoading, setIsConversationsLoading] = useState(true)
    const [isConversationSelected, setIsConversationSelected] = useState(false)
    const bottomScrollRef = useRef()
    const messageInputRef = useRef()
    const [userSigner, setUserSigner] = useState()

    const [isAddressInputEnabled, setIsAddressInputEnabled] = useState(false)
    const [addressInputOpened, setAddressInputOpened] = useState(false)
    const [addressInputValue, setAddressInputValue] = useState("")
    const isAddressInputValid =
        ethers.utils.isAddress(addressInputValue) || isEns(addressInputValue)
    const [conversationStream, setConversationStream] = useState()
    const [chatTitle, setChatTitle] = useState("")

    const [videoModelOpened, setVideoModelOpened] = useState(false)
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

    const [video, setVideo] = useState()
    const [videoUrl, setVideoUrl] = useState()

    useEffect(() => {
        if (isConversationSelected) {
            ;(async () => {
                setChatTitle(userAddress)
                const name = await ethProvider.lookupAddress(userAddress)
                console.log("name", name)
                if (name === null || name === undefined) {
                    setChatTitle(userAddress)
                } else {
                    setChatTitle(userAddress)
                }
            })()
        }
    }, [isConversationSelected, userAddress])
    console.log("chatTitle", chatTitle)

    const addressInput = (
        <Tooltip
            label={isAddressInputValid ? "All good!" : "Invalid wallet address or ENS name."}
            position="bottom-start"
            withArrow
            opened={addressInputOpened}
            color={isAddressInputValid ? "teal" : undefined}
        >
            <TextInput
                style={{ marginLeft: "80px" }}
                label="Enter wallet address or ENS name to start chatting."
                required
                placeholder="enter here"
                onFocus={() => setAddressInputOpened(true)}
                onBlur={() => setAddressInputOpened(false)}
                mt="md"
                value={addressInputValue}
                onChange={(event) => setAddressInputValue(event.currentTarget.value.trim())}
                onKeyDown={(e) => {
                    handleUserAddressKeyDown(e)
                }}
            />
        </Tooltip>
    )

    const messageSkeletons = Array(10).fill(
        <>
            <Skeleton style={{ marginLeft: "80px" }} height={25} width="40%" radius="xl" mt={15} />
            <Skeleton
                style={{ marginLeft: "auto", marginRight: 0 }}
                height={25}
                width="40%"
                radius="xl"
                mt={15}
            />
        </>
    )

    const conversationSkeletons = Array(10).fill(<Skeleton height={25} radius="xl" mt={15} />)

    const chatsRendered = isAddressInputEnabled
        ? addressInput
        : isConversationSelected && (
              <>
                  <Box style={{ marginLeft: "80px" }}>
                      <Center>
                          <ChatTitle address={userAddress} />
                          {/* <Badge size="lg">{userAddress}</Badge> */}
                      </Center>
                  </Box>
                  <ScrollArea style={{ width: "100%", height: "95%" }} type="never">
                      {isMessageLoading ? (
                          messageSkeletons
                      ) : (
                          <Stack
                              sx={(theme) => ({
                                  backgroundColor:
                                      theme.colorScheme === "dark"
                                          ? theme.colors.dark[8]
                                          : theme.colors.gray[0],
                                  height: 300,
                              })}
                          >
                              {console.log("chatsss", chats)}
                              {chats.map((chat) => {
                                  return (
                                      chat &&
                                      chat.contentType.typeId != "fallback" &&
                                      (chat.senderAddress != address ? (
                                          chat.contentType.typeId == ContentTypeVideoKey.typeId ? (
                                              <Video cid={chat.content} position="left" />
                                          ) : (
                                              <Text
                                                  key={chat.id}
                                                  style={{
                                                      textAlign: "left",
                                                      marginLeft: "80px",
                                                  }}
                                              >
                                                  {chat.content}
                                              </Text>
                                          )
                                      ) : chat.contentType.typeId == ContentTypeVideoKey.typeId ? (
                                          <Video cid={chat.content} position="right" />
                                      ) : (
                                          <Text
                                              key={chat.id}
                                              style={{
                                                  textAlign: "right",
                                                  marginLeft: "80px",
                                              }}
                                          >
                                              {chat.content}
                                          </Text>
                                      ))
                                  )
                              })}
                              <div ref={bottomScrollRef} />
                          </Stack>
                      )}
                  </ScrollArea>
                  <Input
                      ref={messageInputRef}
                      placeholder="Enter message"
                      onKeyDown={(e) => {
                          handleMessageKeyDown(e)
                      }}
                      style={{ marginLeft: "80px" }}
                      rightSection={
                          <div>
                              <IconVideoPlus
                                  size={18}
                                  onClick={() => {
                                      setVideoModelOpened(true)
                                      console.log("video")
                                  }}
                                  style={{ display: "block", opacity: 0.5, cursor: "pointer" }}
                              />
                          </div>
                      }
                  />
              </>
          )
    const conversationsRendered = (
        <>
            <ScrollArea style={{ height: "80vh" }}>
                {isConversationsLoading
                    ? conversationSkeletons
                    : conversations.map(
                          (conversation, index) =>
                              conversation &&
                              conversation.peerAddress && (
                                  <Paper key={index} mt={15} size={15} shadow="xl" radius="xl">
                                      <UnstyledButton
                                          onClick={() => {
                                              createConversation(conversation.peerAddress)
                                          }}
                                          key={conversation.peerAddress}
                                          className={classes.mainLink}
                                      >
                                          <div className={classes.mainLinkInner}>
                                              <ConversationTitle
                                                  address={conversation.peerAddress}
                                              />
                                              {/* <span style={{ fontSize: "medium" }}>
                                                  {conversation.peerAddress.substring(0, 8) +
                                                      "..." +
                                                      conversation.peerAddress.substring(34)}
                                              </span> */}
                                          </div>
                                      </UnstyledButton>
                                  </Paper>
                              )
                      )}
            </ScrollArea>
            <Center>
                <Badge size="lg" radius="xl" color="teal">
                    powered by XMTP
                </Badge>
            </Center>
        </>
    )

    const handleUserAddressKeyDown = async (e) => {
        if (e.key === "Enter") {
            let address = addressInputValue
            if (isEns(addressInputValue)) {
                address = await ethProvider.resolveName(addressInputValue)
                if (!address) {
                    showNotification({
                        id: "hello-there",
                        autoClose: 5000,
                        title: "Invalid ENS name",
                        message: "Please enter a valid ENS name",
                        color: "red",
                        icon: <IconX />,
                        className: "my-notification-class",
                        loading: false,
                    })
                    return
                }
                console.log("address from name", address)
            } else if (!isAddressInputValid) {
                return
            }
            console.log("addressInputValue", address)
            createConversation(address)
            console.log(e)
        }
    }

    const handleMessageKeyDown = async (e) => {
        if (e.key === "Enter") {
            // sendMessage(e.target.value)
            sendMessage(e.target.value)
            console.log(e)
            messageInputRef.current.value = ""
        }
    }

    useEffect(() => {
        // console.table(xmtp, signer, userSigner);
        console.log(signer)
        if (userSigner && userSigner._address !== signer._address) {
            console.log("a")
            setup(true)
            return
        }
        if (!xmtp && signer) {
            if (userSigner && userSigner._address === signer._address) {
                return
            }
            console.log("b")
            console.log(signer._address)
            console.log(userSigner)
            setUserSigner(signer)
            setup(false)
            return
        }
    }, [signer])

    const listenForMessage = async (conversationWithUser) => {
        conversationStream && conversationStream.return()
        // Listen for new messages in the conversation
        const stream = await conversationWithUser.streamMessages()
        console.log("stream", stream)
        setConversationStream(stream)
        for await (const message of stream) {
            console.log("New message received", message)
            setChats((chats) => [...chats, message])
            setTimeout(() => {
                bottomScrollRef &&
                    bottomScrollRef.current &&
                    bottomScrollRef.current.scrollIntoView({ behavior: "smooth" })
            }, 350)
        }
    }

    const listenForConversations = async (xmtpPassed) => {
        let client = xmtpPassed
        if (!client) {
            if (!xmtp) {
                client = await Client.create(signer, { codecs: [new VideoCodec()] })
                setXmtp(client)
            } else {
                client = xmtp
            }
        }
        // conversationsStream && conversationsStream.return();
        const stream = await client.conversations.stream()
        // setConversationsStream(stream);
        for await (const newConversation of stream) {
            console.log(`New conversation started with ${newConversation.peerAddress}`)
            console.log(newConversation)
            setConversations((oldConversations) => {
                for (let i = 0; i < oldConversations.length; i++) {
                    if (oldConversations[i].peerAddress === newConversation.peerAddress) {
                        return oldConversations
                    }
                }
                return (
                    !oldConversations.includes(newConversation) && [
                        newConversation,
                        ...oldConversations,
                    ]
                )
            })
        }
    }

    const clickHandle = async () => {
        createConversation("0x9e03C44b5A09db89bf152F8C5500dF3360c1C5bF")
    }

    const setup = async (reinitializeXmtp = false) => {
        console.log("setup")
        let client
        if (!xmtp || reinitializeXmtp) {
            client = await Client.create(signer, { codecs: [new VideoCodec()] })
            setXmtp(client)
        } else {
            client = xmtp
        }
        await createConversations(client)
    }
    const createConversations = async (xmtpPassed) => {
        setIsConversationsLoading(true)
        let client = xmtpPassed
        if (!client) {
            if (!xmtp) {
                client = await Client.create(signer, { codecs: [new VideoCodec()] })
                setXmtp(client)
            } else {
                client = xmtp
            }
        }
        const convList = await client.conversations.list()
        console.log("convList", convList)
        setConversations(convList)
        setIsConversationsLoading(false)
        listenForConversations(client)
    }

    const createConversation = async (addressOfUser2, xmtpPassed) => {
        let client = xmtpPassed
        console.log(xmtpPassed)
        if (!client) {
            console.log("undefined xmtpPassed")
            if (!xmtp) {
                console.log("undefined xmtp state")
                client = await Client.create(signer, { codecs: [new VideoCodec()] })
                setXmtp(client)
            } else {
                client = xmtp
            }
        }

        console.log("checking if user is on dev network")
        const isOnDevNetwork = await Client.canMessage(addressOfUser2)
        if (!isOnDevNetwork) {
            showNotification({
                id: "hello-there",
                autoClose: 5000,
                title: "User is not on the dev network",
                message: "Please enter a valid address or ENS name",
                color: "red",
                icon: <IconX />,
                className: "my-notification-class",
                loading: false,
            })
            return
        }
        setIsAddressInputEnabled(false)
        setIsConversationSelected(true)
        console.log("creating conversation")
        if (userAddress == addressOfUser2) {
            setTimeout(() => {
                bottomScrollRef &&
                    bottomScrollRef.current &&
                    bottomScrollRef.current.scrollIntoView({
                        behavior: "smooth",
                    })
            }, 750)
            return
        }

        bottomScrollRef &&
            bottomScrollRef.current &&
            bottomScrollRef.current.scrollIntoView({ behavior: "smooth" })

        setUserAddress(addressOfUser2)
        setIsMessageLoading(true)
        setChats([])
        console.log("newConversations with user")
        const conversationWithUser = await client.conversations.newConversation(addressOfUser2)
        console.log("conversationWithUser", conversationWithUser)
        const messages = await conversationWithUser.messages()
        console.log("messages", messages) // id and content and senderAddress and contentType.typeId == "text"
        setChats(messages)
        setIsMessageLoading(false)
        setTimeout(() => {
            bottomScrollRef &&
                bottomScrollRef.current &&
                bottomScrollRef.current.scrollIntoView({ behavior: "smooth" })
        }, 750)
        listenForMessage(conversationWithUser)
    }

    const renderChats = async (conversationWithUser) => {
        const messages = await conversationWithUser.messages()
        console.log(messages)
        setChats(messages)
    }

    const sendMessage = async (msg, addressOfUser2) => {
        if (!addressOfUser2) {
            addressOfUser2 = userAddress
        }
        // Start a conversation with addressOfUser2
        const conversation = await xmtp.conversations.newConversation(addressOfUser2)
        conversation.send(msg)
    }

    const sendVideoMessage = async (msg, addressOfUser2) => {
        if (!video) {
            showNotification({
                id: "load-data1",
                autoClose: 5000,
                title: "Unable to send video",
                message: "Select a video to upload",
                color: "red",
                icon: <IconX />,
                className: "my-notification-class",
                loading: false,
            })
            return
        }
        if (!addressOfUser2) {
            addressOfUser2 = userAddress
        }

        if (authStatus !== AuthStatus.SignedIn) {
            console.log("not signed in")
            showNotification({
                id: "load-data1",
                autoClose: 5000,
                title: "Unable to send video",
                message: "Sign in to Web3 Storage to upload a video",
                color: "red",
                icon: <IconX />,
                className: "my-notification-class",
                loading: false,
            })
            return
        }
        const client = await Client.create(signer, { codecs: [new VideoCodec()] })
        // Start a conversation with addressOfUser2
        const conversation = await client.conversations.newConversation(addressOfUser2)

        showNotification({
            id: "load-data",
            loading: true,
            title: "Uploading video to ipfs",
            message: "Please wait while we upload your content",
            autoClose: false,
            disallowClose: true,
        })
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
                title: "Unable to send video",
                message: "Check console for more details",
                color: "red",
                icon: <IconX />,
                className: "my-notification-class",
                loading: false,
            })
            return
        }

        conversation.send(cid.toString(), {
            contentType: ContentTypeVideoKey,
            contentFallback: "video message",
        })
        updateNotification({
            id: "load-data",
            color: "teal",
            title: "Success",
            message: "Video sent successfully",
            icon: <IconCheck size={16} />,
            autoClose: 2000,
        })
        resetVideoInputs()
    }

    const onDrop = useCallback(async (acceptedFiles) => {
        if (acceptedFiles && acceptedFiles.length > 0 && acceptedFiles?.[0]) {
            setVideoUrl(URL.createObjectURL(acceptedFiles[0]))
            setVideo(acceptedFiles[0])
        }
    }, [])

    const resetVideoInputs = () => {
        setVideoUrl("")
        setVideo(null)
        setVideoModelOpened(false)
    }

    return (
        <>
            <Navbar width={{ sm: 300 }} p="md" className={classes.navbar}>
                <Navbar.Section className={classes.section}>
                    <Group className={classes.collectionsHeader} position="apart">
                        <Text size="xs" weight={500} color="dimmed">
                            Conversations
                        </Text>
                        <Tooltip label="Create conversation" withArrow position="right">
                            <ActionIcon
                                variant="default"
                                size={18}
                                onClick={() => {
                                    setIsAddressInputEnabled(true)
                                }}
                            >
                                <IconPlus size={12} stroke={1.5} />
                            </ActionIcon>
                        </Tooltip>
                    </Group>
                </Navbar.Section>

                <Navbar.Section className={classes.section}>
                    <div className={classes.mainLinks}>{conversationsRendered}</div>
                </Navbar.Section>
            </Navbar>
            {chatsRendered}
            <Modal
                opened={videoModelOpened}
                onClose={() => {
                    resetVideoInputs()
                    setVideoModelOpened(false)
                }}
                title="Send Video Message"
                size="auto"
            >
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
                                    color={theme.colors.red[theme.colorScheme === "dark" ? 4 : 6]}
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
                                <video height="300" src={videoUrl} controls={true}></video>
                            </Center>
                        </>
                    )}
                    <Center>
                        <Button onClick={sendVideoMessage} mt="sm">
                            Send Video
                        </Button>
                    </Center>
                </>
            </Modal>
        </>
    )
}

const ConversationTitle = ({ address }) => {
    const [name, setName] = useState("")
    const [avatar, setAvatar] = useState("")
    // const [nameFound, setNameFound] = useState(false)
    console.log("addressPassed", address)
    const shortAddress = address.substring(0, 8) + "..." + address.substring(34)
    console.log("shortAddress", shortAddress)

    useEffect(() => {
        ;(async () => {
            ethProvider.lookupAddress(address).then((name) => {
                console.log("ConversationTitle name", name)
                if (name === null || name === undefined) {
                    setName("")
                } else {
                    setName(name)
                    ;(async () => {
                        const avatarUrl = await ethProvider.getAvatar(name)
                        console.log("avatarUrl", avatarUrl)
                        setAvatar(avatarUrl)
                    })()
                }
            })
        })()
    }, [])

    // <Avatar src={avatar} radius="xl" />

    return address ? (
        name && name !== "" ? (
            <span style={{ fontSize: "medium" }}>
                <Group spacing="sm">
                    <Avatar src={avatar} radius="xl" size="sm" />
                    {name}
                </Group>
            </span>
        ) : (
            <span style={{ fontSize: "medium" }}>{shortAddress}</span>
        )
    ) : null
}

const ChatTitle = ({ address }) => {
    const [name, setName] = useState("")
    const [avatar, setAvatar] = useState("")
    // const [nameFound, setNameFound] = useState(false)
    console.log("addressPassed", address)

    useEffect(() => {
        ;(async () => {
            ethProvider.lookupAddress(address).then((name) => {
                console.log("ChatTitle name", name)
                if (name === null || name === undefined) {
                    setName("")
                } else {
                    setName(name)
                    ;(async () => {
                        const avatarUrl = await ethProvider.getAvatar(name)
                        console.log("avatarUrl", avatarUrl)
                        setAvatar(avatarUrl)
                    })()
                }
            })
        })()
    }, [])
    return address ? (
        name && name !== "" ? (
            <Badge size="lg" leftSection={avatar && <Avatar src={avatar} radius="xl" size="sm" />}>
                {name}
            </Badge>
        ) : (
            <Badge size="lg">{address}</Badge>
        )
    ) : null
    // return <Badge size="lg">{address ? (name && name !== "" ? name : address) : null}</Badge>
}

function Video({ cid, position }) {
    console.log("cidPassed", cid, position)
    return (
        <>
            {cid && cid.includes("bafy") && (
                <Group position={position}>
                    <Box sx={{ height: "200px", marginLeft: "80px" }}>
                        <Player src={`ipfs://${cid}`} />
                    </Box>
                </Group>
            )}
        </>
    )
}

// const EnsAvator = ({ name }) => {
//     const [avatar, setAvatar] = useState("")
//     useEffect(() => {
//         ;(async () => {
//             const avatarUrl = await ethProvider.getAvatar(name)
//             console.log("avatarUrl", avatarUrl)
//             setAvatar(avatarUrl)
//         })()
//     }, [])
//     return <Avatar src={avatar} radius="xl" />
// }
