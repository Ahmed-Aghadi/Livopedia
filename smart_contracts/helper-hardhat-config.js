const networkConfig = {
    default: {
        name: "hardhat",
        // keepersUpdateInterval: "30",
    },
    31337: {
        name: "localhost",
        // subscriptionId: "588",
        // gasLane: "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc", // 30 gwei
        // keepersUpdateInterval: "30",
        // raffleEntranceFee: "100000000000000000", // 0.1 ETH
        // callbackGasLimit: "500000", // 500,000 gas
        // title: "My Donate Entry",
        // description: "Please Donate us",
        // goal: "100",
    },
    80001: {
        name: "mumbai",
        vrfCoordinatorV2: "0x7a1BaC17Ccc5b313516C5E16fb24f7659aA5ebed",
        gasLane: "0x4b09e658ed251bcafeebbc69400383d49f344ace09b9576fe248bb02c003fe9f",
        callbackGasLimit: "500000", // 500,000 gas
        // mintFee: "10000000000000000", // 0.01 ETH
        subscriptionId: "1919", // add your ID here!
        tablelandRegistry: "0x4b48841d4b32c4650e4abc117a03fe8b51f38f68",
        // nftCreatePrice: "10000000000000000", // 0.01 ETH
        anycallcontract: "0x6afCFF9189e8ed3fCc1CFfa184FEB1276f6A82A5",
        destchain: "4002",
    },
    4002: {
        name: "fantom testnet",
        vrfCoordinatorV2: "0xbd13f08b8352a3635218ab9418e340c60d6eb418",
        gasLane: "0x121a143066e0f2f08b620784af77cccb35c6242460b4a8ee251b4b416abaebd4",
        callbackGasLimit: "500000", // 500,000 gas
        // mintFee: "10000000000000000", // 0.01 ETH
        subscriptionId: "119", // add your ID here!
        // nftCreatePrice: "10000000000000000", // 0.01 ETH
        anycallcontract: "0xfCea2c562844A7D385a7CB7d5a79cfEE0B673D99",
        destchain: "5",
    },
    5: {
        name: "goerli",
        vrfCoordinatorV2: "0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D",
        gasLane: "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
        callbackGasLimit: "500000", // 500,000 gas
        // mintFee: "10000000000000000", // 0.01 ETH
        subscriptionId: "7819", // add your ID here!
        // nftCreatePrice: "10000000000000000", // 0.01 ETH
        anycallcontract: "0x965f84D915a9eFa2dD81b653e3AE736555d945f4",
        destchain: "4002",
    },
    // 4: {
    //     name: "rinkeby",
    //     subscriptionId: "8868",
    //     gasLane: "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc", // 30 gwei
    //     keepersUpdateInterval: "30",
    //     raffleEntranceFee: "100000000000000000", // 0.1 ETH
    //     callbackGasLimit: "500000", // 500,000 gas
    // },
    // 1: {
    //     name: "mainnet",
    //     keepersUpdateInterval: "30",
    // },
}

const developmentChains = ["hardhat", "localhost"]
const VERIFICATION_BLOCK_CONFIRMATIONS = 6
// const frontEndContractsFile = "../nextjs-nft-marketplace-moralis/constants/networkMapping.json"
// const frontEndContractsFile2 = "../nextjs-nft-marketplace-thegraph/constants/networkMapping.json"
// const frontEndAbiLocation = "../nextjs-nft-marketplace-moralis/constants/"
// const frontEndAbiLocation2 = "../nextjs-nft-marketplace-thegraph/constants/"

module.exports = {
    networkConfig,
    developmentChains,
    VERIFICATION_BLOCK_CONFIRMATIONS,
    // frontEndContractsFile,
    // frontEndContractsFile2,
    // frontEndAbiLocation,
    // frontEndAbiLocation2,
}
