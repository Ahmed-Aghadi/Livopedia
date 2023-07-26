import styles from "../styles/Home.module.css"
import { Layout } from "../components/Layout"
import { useContext, useEffect, useMemo, useState } from "react"
import {
    Avatar,
    Button,
    Center,
    Group,
    Image,
    Text,
    Textarea,
    TextInput,
    Tooltip,
    useMantineTheme,
} from "@mantine/core"
import { mainAbi, mainContractAddress, tableName } from "../constants"
import { useAccount, useSigner } from "wagmi"
import { useCreateStream } from "@livepeer/react"
import { showNotification, updateNotification } from "@mantine/notifications"
import { IconCheck, IconUpload, IconX, IconPhoto } from "@tabler/icons"
import { useRouter } from "next/router"
const ethers = require("ethers")
const abis = require("@unlock-protocol/contracts")
import useLens from "../hooks/useLens"
import { Dropzone, IMAGE_MIME_TYPE } from "@mantine/dropzone"

export default function Home() {
    const theme = useMantineTheme()
    const { address, isConnected } = useAccount()
    const { data: signer } = useSigner()
    const [profilePfp, setProfilePfp] = useState()
    // const profilePfpImageUrl =
    //     profilePfp && profilePfp.length != 0 ? URL.createObjectURL(profilePfp[0]) : null
    // calculate profilePfpImageUrl only when profilePfp changes and save it in memo
    const profilePfpImageUrl = useMemo(() => {
        return profilePfp && profilePfp.length != 0 ? URL.createObjectURL(profilePfp[0]) : null
    }, [profilePfp])
    const [userNameOpened, setUserNameOpened] = useState(false)
    const [userName, setUserName] = useState("")
    const userNameValid = /^[a-z0-9]{5,31}$/.test(userName)
    // check if userName only containg a-z and 0-9 and no spaces and no special characters and no uppercase letters and length is minimum 5 and maximum 31
    // const userNameValid1 = /^[a-z0-9]{5,31}$/.test(userName)

    const [descriptionOpened, setDescriptionOpened] = useState(false)
    const [description, setDescription] = useState("")
    const descriptionValid = description.trim().length > 0

    const [priceOpened, setPriceOpened] = useState(false)
    const [price, setPrice] = useState("")
    const priceValid = !!price && Number.isInteger(parseInt(price)) && price > 0

    const [numberOfMembershipOpened, setNumberOfMembershipOpened] = useState(false)
    const [numberOfMembership, setNumberOfMembership] = useState("")
    const numberOfMembershipValid =
        !!numberOfMembership &&
        Number.isInteger(parseInt(numberOfMembership)) &&
        numberOfMembership > 0

    const valid = descriptionValid && priceValid && numberOfMembershipValid && userNameValid

    const [isSubmitted, setIsSubmitted] = useState(false)

    const { createProfile, profileExists } = useLens()
    const router = useRouter()

    const {
        mutate: createStream,
        data: createdStream,
        status,
    } = useCreateStream({
        name: address,
        playbackPolicy: { type: "jwt" },
    })

    useEffect(() => {
        console.log("status", status)
        if (createdStream) {
            console.log("createdStream", createdStream)
            handleSubmitRemaining()
        }
    }, [createdStream, status])

    const deleteStream = async () => {
        const response = await fetch(`https://livepeer.studio/api/stream/${createdStream.id}`, {
            method: "DELETE",
            headers: {
                authorization: `Bearer ${process.env.NEXT_PUBLIC_STUDIO_API_KEY}`,
            },
        })
        console.log("response deleteStream", response)
        // const data = await response.json()
        // console.log("deleteStream", data)
    }

    // Wrapping all calls in an async block
    const deployLock = async () => {
        // Here we use a Rinkeby provider. We will be able to read the state, but not send transactions.
        const provider = new ethers.providers.JsonRpcProvider(
            "https://rpc.unlock-protocol.com/80001"
        )

        // On polygon mumbai Unlock is at
        const unlockAddress = "0x1FF7e338d5E582138C46044dc238543Ce555C963"

        // const signerWithProvider = signer.connect(provider)

        // // Instantiate the Unlock contract
        // const unlock = new ethers.Contract(address, abis.UnlockV11.abi, signerWithProvider)

        // Instantiate the Unlock contract
        const unlock = new ethers.Contract(unlockAddress, abis.UnlockV11.abi, signer)

        // Lock params:
        const lockInterface = new ethers.utils.Interface(abis.PublicLockV11.abi)
        const params = lockInterface.encodeFunctionData(
            "initialize(address,uint256,address,uint256,uint256,string)",
            [
                address,
                31 * 60 * 60 * 24, // 30 days in seconds
                ethers.constants.AddressZero, // We use the base chain currency
                ethers.utils.parseUnits(price.toString(), 18), // 0.01 Eth
                numberOfMembership,
                "New Membership",
            ]
        )

        const transaction = await unlock.createUpgradeableLockAtVersion(params, 11)
        console.log("transaction", transaction)
        console.log("transaction.hash", transaction.hash)
        const receipt = await transaction.wait()
        console.log("receipt", receipt)
        const lockAddress = receipt.logs[0].address
        console.log("lockAddress", lockAddress)
        return lockAddress
    }
    const handleSubmitRemaining = async () => {
        try {
            // const accHex = await createProfile(userName, address, signer)
            console.log("createdStream", createdStream)

            const body = new FormData()
            body.append("file", profilePfp[0])
            const resForImageCid = await fetch(
                process.env.NEXT_PUBLIC_API_URL + "/api/image-upload-ipfs",
                {
                    method: "POST",
                    body: body,
                }
            )
            const jsonOfResForImageCid = await resForImageCid.json()
            const imageCid = jsonOfResForImageCid.cid
            const pfp = `https://${imageCid}.ipfs.nftstorage.link/image`

            const res1 = await createProfile(userName, address, signer, pfp)
            console.log("res1", res1)
            const profId = res1?.logs[0].topics[3]
            console.log("profId", profId) // 0x0000000000000000000000000000000000000000000000000000000000006127
            console.log("modified", `0x${profId.substring(profId.length - 4)}`) // 0x6127
            const profIdParsed = `0x${profId.substring(profId.length - 4)}`

            console.log("ipfs json: ", {
                description: description,
                streamId: createdStream.id,
            })

            const resForJsonCid = await fetch(
                process.env.NEXT_PUBLIC_API_URL + "/api/json-upload-ipfs",
                {
                    method: "POST",
                    body: JSON.stringify({
                        description: description,
                        streamId: createdStream.id,
                    }),
                    headers: { "Content-Type": "application/json" },
                }
            )

            const jsonOfResForJsonCid = await resForJsonCid.json()

            const jsonCid = jsonOfResForJsonCid.cid
            console.log("stored json with cid:", jsonCid)

            // const parsedAmount = ethers.utils.parseUnits(price, "ether")
            // console.log("parsedAmount", parsedAmount)

            const lockAddress = await deployLock()

            const contractInstance = new ethers.Contract(mainContractAddress, mainAbi, signer)

            console.log("args: ", { lockAddress, profileId: profIdParsed, jsonCid })

            const tx = await contractInstance.registerLock(lockAddress, profIdParsed, jsonCid)
            console.log("tx done")

            console.log("tx hash")
            console.log(tx.hash)
            console.log("-----------------------------")

            const response = await tx.wait()
            console.log("DONE!!!!!!!!!!!!!!!!!!")

            console.log("response")
            console.log(response)

            // console.log("response hash")
            // console.log(response.hash)
            console.log("-----------------------------")

            updateNotification({
                id: "load-data",
                color: "teal",
                title: "Posted Successfully",
                icon: <IconCheck size={16} />,
                autoClose: 2000,
            })

            // for (let i = 0; i < response.events.length; i++) {
            //     const event = response.events[i]
            //     if (event.event === "NFTCreated") {
            //         router.push(`/post/${event.args[0]}`)
            //     }
            // }

            // // setPostModalOpened(false)
            // // navigate("/profile")
            // router.push("/profile")
        } catch (error) {
            console.log("error", error)
            deleteStream()
            updateNotification({
                id: "load-data",
                autoClose: 5000,
                title: "Unable to create membership contract on the blockchain",
                message: "Check console for more details",
                color: "red",
                icon: <IconX />,
                className: "my-notification-class",
                loading: false,
            })
        }
    }

    const handleSubmit = async () => {
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
        if (!profilePfp || profilePfp.length === 0) {
            showNotification({
                id: "hello-there",
                // onClose: () => console.log("unmounted"),
                // onOpen: () => console.log("mounted"),
                autoClose: 5000,
                title: "Cannot post",
                message: "Please upload a profile picture",
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
                // onClose: () => console.log("unmounted"),
                // onOpen: () => console.log("mounted"),
                autoClose: 5000,
                title: "Cannot post",
                message:
                    "Filled in all the required fields (click on the input field to see which ones are valid entries)",
                color: "red",
                icon: <IconX />,
                className: "my-notification-class",
                loading: false,
            })
            return
        }

        const usersData = await fetch(
            "https://testnets.tableland.network/api/v1/query?statement=" +
                "SELECT * FROM " +
                tableName +
                " WHERE userAddress = '" +
                address.toLowerCase() +
                "'"
        )
        const usersDataJson = await usersData.json()
        console.log("usersDataJson", usersDataJson)
        if (
            !(
                usersDataJson.length === 0 ||
                usersDataJson.message === "Row not found" ||
                !usersDataJson[0]
            )
        ) {
            showNotification({
                id: "hello-there",
                // onClose: () => console.log("unmounted"),
                // onOpen: () => console.log("mounted"),
                autoClose: 5000,
                title: "Cannot create membership contract",
                message: "You have already created a membership contract",
                color: "red",
                icon: <IconX />,
                className: "my-notification-class",
                loading: false,
            })
            return
        }
        const isProfileExist = await profileExists(userName)
        console.log("isProfileExist", isProfileExist)
        if (isProfileExist) {
            showNotification({
                id: "hello-there",
                // onClose: () => console.log("unmounted"),
                // onOpen: () => console.log("mounted"),
                autoClose: 5000,
                title: "Cannot post",
                message: "Username already exists",
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
            message: "Please wait while we are creating membership contract on the blockchain",
            autoClose: false,
            disallowClose: true,
        })
        return
        try {
            setIsSubmitted(true)
            createStream()
        } catch (error) {
            console.log("error", error)
            updateNotification({
                id: "load-data",
                autoClose: 5000,
                title: "Unable to create membership contract on the blockchain",
                message: "Check console for more details",
                color: "red",
                icon: <IconX />,
                className: "my-notification-class",
                loading: false,
            })
        }
    }

    return (
        <Layout>
            <div className={styles.container}>
                <Text size="xl" weight="bold">
                    Your PFP:
                </Text>
                <Dropzone
                    accept={IMAGE_MIME_TYPE}
                    onDrop={(acceptedFiles) => {
                        setProfilePfp(acceptedFiles)
                    }}
                    sx={
                        profilePfp
                            ? {
                                  maxWidth: 150,
                                  maxHeight: 150,
                                  padding: 0,
                                  border: "none",
                                  backgroundColor: "transparent",
                              }
                            : {
                                  maxWidth: 150,
                                  maxHeight: 150,
                                  padding: 0,
                                  border: "1px dashed #ccc",
                              }
                    }
                >
                    {profilePfp ? (
                        <>
                            <Avatar src={profilePfpImageUrl} size={150} radius={80} />
                        </>
                    ) : (
                        <Group
                            position="center"
                            spacing="xl"
                            style={{ minHeight: 150, pointerEvents: "none" }}
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
                                <IconPhoto size={50} stroke={1.5} />
                            </Dropzone.Idle>
                        </Group>
                    )}
                </Dropzone>
                <Tooltip
                    label={
                        userNameValid
                            ? "All good!"
                            : "User Name should only contains lowercase letters & numbers and must be of 5 to 31 characters long"
                    }
                    position="bottom-start"
                    withArrow
                    opened={userNameOpened}
                    color={userNameValid ? "teal" : undefined}
                >
                    <TextInput
                        label="User Name"
                        required
                        placeholder="Your User Name"
                        onFocus={() => setUserNameOpened(true)}
                        onBlur={() => setUserNameOpened(false)}
                        mt="md"
                        value={userName}
                        onChange={(event) => setUserName(event.currentTarget.value)}
                    />
                </Tooltip>
                <Tooltip
                    label={descriptionValid ? "All good!" : "Description shouldn't be empty"}
                    position="bottom-start"
                    withArrow
                    opened={descriptionOpened}
                    color={descriptionValid ? "teal" : undefined}
                >
                    <Textarea
                        label="Description"
                        required
                        placeholder="Your description"
                        autosize
                        minRows={2}
                        maxRows={4}
                        onFocus={() => setDescriptionOpened(true)}
                        onBlur={() => setDescriptionOpened(false)}
                        mt="md"
                        value={description}
                        onChange={(event) => setDescription(event.currentTarget.value)}
                    />
                </Tooltip>
                <Tooltip
                    label={priceValid ? "All good!" : "Price should be greater than 0"}
                    position="bottom-start"
                    withArrow
                    opened={priceOpened}
                    color={priceValid ? "teal" : undefined}
                >
                    <TextInput
                        label="Price"
                        required
                        placeholder="Your price"
                        onFocus={() => setPriceOpened(true)}
                        onBlur={() => setPriceOpened(false)}
                        mt="md"
                        type="number"
                        min="0"
                        step="1"
                        onWheel={(e) => e.target.blur()}
                        value={price}
                        onChange={(event) => setPrice(event.currentTarget.value)}
                    />
                </Tooltip>
                <Tooltip
                    label={
                        numberOfMembershipValid
                            ? "All good!"
                            : "Number of memberships should be greater than 0"
                    }
                    position="bottom-start"
                    withArrow
                    opened={numberOfMembershipOpened}
                    color={numberOfMembershipValid ? "teal" : undefined}
                >
                    <TextInput
                        label="Number of memberships"
                        required
                        placeholder="Your number of memberships"
                        onFocus={() => setNumberOfMembershipOpened(true)}
                        onBlur={() => setNumberOfMembershipOpened(false)}
                        mt="md"
                        type="number"
                        min="0"
                        step="1"
                        onWheel={(e) => e.target.blur()}
                        value={numberOfMembership}
                        onChange={(event) => setNumberOfMembership(event.currentTarget.value)}
                    />
                </Tooltip>
                <Center>
                    <Button variant="outline" mt="md" size="md" onClick={() => handleSubmit()}>
                        Submit
                    </Button>
                </Center>
            </div>
        </Layout>
    )
}
