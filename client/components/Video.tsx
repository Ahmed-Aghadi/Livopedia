import { Player, useAsset } from "@livepeer/react"
import { Box, Button, Center } from "@mantine/core"
import { EnvOptions, VocdoniSDKClient, Vote, IChoice } from "@vocdoni/sdk"
import React, { useContext, useEffect, useState } from "react"
import { useSigner } from "wagmi"

interface VideoProps {
    assetId: string
}
export default function Video({ assetId }: VideoProps) {
    const { data: signer } = useSigner()
    const { data: asset } = useAsset(assetId)
    console.log("asset", asset)
    console.log("assetId", assetId)

    return (
        <>
            {(asset?.playbackId || !assetId.includes("-")) && (
                <Center mt="sm">
                    <Box sx={{ height: "300px" }}>
                        {assetId.includes("-") ? (
                            <Player playbackId={asset?.playbackId} showPipButton />
                        ) : (
                            <Player src={`ipfs://${assetId}`} showPipButton />
                        )}
                    </Box>
                </Center>
            )}
        </>
    )
}
