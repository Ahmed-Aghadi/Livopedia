// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
const { Web3Storage, File } = require("web3.storage")

export default async function handler(req, res) {
    if (req.method === "POST") {
        // const title = req.body.title
        // const description = req.body.description
        // const images = req.body.images
        console.log("uploading json to ipfs")
        const client = new Web3Storage({ token: process.env.WEB3STORAGE_TOKEN })
        const obj = req.body

        const buffer = Buffer.from(JSON.stringify(obj))
        const files = [new File([buffer], "data.json")]

        const cid = await client.put(files)
        console.log("uploaded json to ipfs: ", cid)
        res.status(201).json({ cid: cid })
    }
}
