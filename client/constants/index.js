const contractAddress = require("./contractAddress.json")
const mainAbi = require("./main.abi.json")
const lockAbi = require("./lock.abi.json")
const lensAbi = require("./lens.abi.json")
const groupId = ""
const channelId = ""
const currency = "MATIC"
const ipfsGateway = (cid, suffixUrl) => {
    return "https://" + cid + ".ipfs.w3s.link/" + suffixUrl
}
const ipfsGateway1 = (cid, suffixUrl) => {
    return "https://ipfs.io/ipfs/" + cid + "/" + suffixUrl
}
const mainContractAddress = contractAddress.main

const tableName = "main_80001_5192"
const CHANNEL_ADDRESS = "0xA476f7f388f47062A4c24241922AC91Ac25DaCE2"

module.exports = {
    mainContractAddress,
    tableName,
    mainAbi,
    lockAbi,
    lensAbi,
    groupId,
    channelId,
    currency,
    ipfsGateway,
    ipfsGateway1,
    CHANNEL_ADDRESS,
}
