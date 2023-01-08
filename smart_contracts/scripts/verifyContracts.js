const { ethers, network, run } = require("hardhat")
const { networkConfig } = require("../helper-hardhat-config")
// const { Blob } = require("buffer")

async function verifyContracts() {
    accounts = await ethers.getSigners()
    deployer = accounts[0]
    const chainId = network.config.chainId
    let tablelandRegistry = networkConfig[chainId].tablelandRegistry
    let vrfCoordinatorV2Address = networkConfig[chainId].vrfCoordinatorV2
    let subscriptionId = networkConfig[chainId].subscriptionId
    console.log("Chain ID : " + chainId)
    try {
        const arguments = [tablelandRegistry]
        await run("verify:verify", {
            address: "0xe34225C371CBe8aA63c70333B71b0789c365Da00",
            constructorArguments: arguments,
        })
    } catch (e) {
        if (e.message.toLowerCase().includes("already verified")) {
            console.log("Already verified!")
        } else {
            console.log(e)
        }
    }
    try {
        const arguments = [
            tablelandRegistry,
            vrfCoordinatorV2Address,
            subscriptionId,
            networkConfig[chainId]["gasLane"],
            networkConfig[chainId]["callbackGasLimit"],
        ]
        await run("verify:verify", {
            address: "0xF9f29B620A6f1CC071EA466C59696291195bf996",
            constructorArguments: arguments,
        })
    } catch (e) {
        if (e.message.toLowerCase().includes("already verified")) {
            console.log("Already verified!")
        } else {
            console.log(e)
        }
    }
}

verifyContracts()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
