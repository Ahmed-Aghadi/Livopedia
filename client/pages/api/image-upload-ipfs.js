// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
const { Web3Storage, File } = require("web3.storage")
import formidable from "formidable"
import fs from "fs"

export const config = {
    api: {
        bodyParser: false,
    },
}

const uploadToWeb3Storage = async (file) => {
    const imageFile = fs.readFileSync(file.filepath)
    const imageFormat = file.mimetype.split("/")[1]
    const files = [new File([imageFile], "image")]
    const client = new Web3Storage({ token: process.env.WEB3STORAGE_TOKEN })

    const cid = await client.put(files)
    return cid
}

export default async function handler(req, res) {
    if (req.method === "POST") {
        console.log("uploading image to ipfs")
        const form = new formidable.IncomingForm()
        let cid
        form.parse(req, async function (err, fields, files) {
            cid = await uploadToWeb3Storage(files.file)
            console.log("uploaded image to ipfs: ", cid)
            return res.status(201).json({ cid: cid })
        })
    } else {
        res.status(404).send("Invalid Request!")
    }
}
