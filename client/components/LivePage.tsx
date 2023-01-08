import React from "react"
import { Player, useCreateStream, useStream, getPlaybackInfo } from "@livepeer/react"

import { usePlaybackInfo } from "@livepeer/react/hooks"
import { Box, Button, Modal, Stack, Text, TextInput } from "@mantine/core"

import { useMutation } from "@tanstack/react-query"
import { useEffect, useMemo, useState } from "react"

import {
    CreateSignedPlaybackBody,
    CreateSignedPlaybackResponse,
    ApiError,
} from "../pages/api/sign-jwt"
import { useAccount, useSigner } from "wagmi"

export default function LivePage({
    streamId,
    userAddress,
    lockAddress,
}: {
    streamId: string
    userAddress: string
    lockAddress: string
}) {
    console.log("props", { streamId, userAddress })
    const { address } = useAccount()
    const { data: signer } = useSigner()
    const [modelOpened, setModelOpened] = useState(false)
    const { data: stream } = useStream({
        streamId: streamId,
        refetchInterval: (stream) => (!stream?.isActive ? 5000 : false),
    })

    console.log("stream", stream)

    const { mutate: createJwt, data: createdJwt } = useMutation({
        mutationFn: async () => {
            if (!stream?.playbackId) {
                throw new Error("No playback ID yet.")
            }

            const message = "Sigining a message for Liveopedia " + Date.now()
            const signature = await signer.signMessage(message)

            const body: CreateSignedPlaybackBody = {
                playbackId: stream.playbackId,
                // we pass along a "secret key" to demonstrate how gating can work
                message: message,
                userAddress: address,
                lockAddress: lockAddress,
                signature: signature,
            }

            // we make a request to the Next.JS API route shown above
            const response = await fetch("/api/sign-jwt", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            })

            return response.json() as Promise<CreateSignedPlaybackResponse | ApiError>
        },
    })

    console.log("createdJwt", createdJwt)

    useEffect(() => {
        console.log("stream?.isActive", stream?.isActive)
        if (stream?.playbackId) {
            console.log("createJwt...")
            // when we have a playbackId for the stream, create a JWT
            createJwt()
        }
    }, [stream?.playbackId, createJwt, stream?.isActive])

    // const isLoading = useMemo(() => status === "loading", [status])

    const createGatedStream = async () => {
        setModelOpened(true)
    }

    return (
        <Box>
            {!stream?.isActive ? (
                <>
                    {/* <TextInput onChange={(e) => setStreamName(e.target.value)} /> */}
                    <Box>
                        {userAddress &&
                            address &&
                            userAddress.toLowerCase() === address.toLowerCase() && (
                                <Button
                                    onClick={() => {
                                        createGatedStream()
                                    }}
                                >
                                    Create Gated Stream
                                </Button>
                            )}
                        <Stack
                            align="center"
                            sx={(theme) => ({
                                backgroundColor:
                                    theme.colorScheme === "dark"
                                        ? theme.colors.dark[8]
                                        : theme.colors.gray[0],
                            })}
                        >
                            <Text size="xl" weight="bold">
                                Stream hasn't started yet
                            </Text>
                        </Stack>
                    </Box>
                </>
            ) : (
                <Player
                    title={stream?.name}
                    playbackId={stream?.playbackId}
                    autoPlay
                    muted
                    showPipButton
                    jwt={(createdJwt as CreateSignedPlaybackResponse)?.token}
                />
            )}
            <Modal
                opened={modelOpened}
                onClose={() => setModelOpened(false)}
                title="OBS Streaming Details for Gated Stream"
            >
                <Text>SERVER:</Text>
                <TextInput value="rtmp://live.livepeer.com/live" />
                <Text mt="md">STREAM KEY:</Text>
                <TextInput value={stream?.streamKey} />
            </Modal>
        </Box>
    )
}
