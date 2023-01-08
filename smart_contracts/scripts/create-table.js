const { ethers, network } = require("hardhat")
const { networkConfig } = require("../helper-hardhat-config")
// const { Blob } = require("buffer")

async function createEntry() {
    accounts = await ethers.getSigners()
    deployer = accounts[0]
    const chainId = network.config.chainId
    console.log("Chain ID : " + chainId)
    console.log("Creating Donate3 contract")
    const sosolVideosContract = await ethers.getContract("SosolVideos")
    console.log("Donate3 contract created")
    console.log("Connecting user to Donate3 contract")
    const sosolVideos = await sosolVideosContract.connect(deployer)
    console.log("User connected to Donate3 contract")
    const tx = await sosolVideos.create("sosol3")
    console.log("----------------------------------")
    console.log(tx)
    const response = await tx.wait()
    console.log("----------------------------------")
    console.log(response)
    // console.log("address of entry : " + response.events[0].data)
}

createEntry()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
