# Livopedia

## Details

Token gated platform for content creators and other users to chat with each others.

Content creators can create normal posts or videos posts on Lens.

The Graph is used to do all the queries and mutations for Lens Protocol.

Everything is encrypted using Lit Protocol.

Unlock protocol is used to create membership and only susbcribers can access the contents.

Thus, content creators can share exclusive contents to their subscribers.

Web3.storage’s w3ui and w3up is used to upload videos and Livepeer playback tool is used to play the videos.

Users can opt-in to notifications channel or can use chat support to contact creators.

Token Gated live streams can be created using Livepeer.

There is a chatroom for all the users to chat using XMTP which supports video chats too ( uses Web3.storage’s & Livepeer playback )

User can also use ENS domain while adding other's to their conversations list to chat and if they own an ENS domain then it will be rendered too.

Tableland is used as a decentralized sql database.

Contract is deployed on polygon mumbai. And contract is verified.

[smart contract address](https://github.com/Ahmed-Aghadi/Livopedia/blob/main/client/constants/contractAddress.json#L3)


| Tech stack used           |
| ------------------------- |
| [Livepeer](#livepeer) |
| [Lens Protocol](#lens-protocol) |
| [The Graph](#the-graph) |
| [Lit Protocol](#lit-protocol) |
| [Web3 Storage](#web3-storage) |
| [XMTP](#xmtp) |
| [Push Protocol](#push-protocol) |
| [ENS](#ens) |
| [Polygon](#polygon)       |
| [Unlock Protocol](#unlock-protocol)       |
| [Tableland](#tableland) |
| [Mantine UI](#mantine-ui) |

## Deployements

Deployed website at Vercel: [Livopedia](https://livopedia.vercel.app/)

## Getting Started

To run frontend :

```bash
cd client/my-app

yarn run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

To deploy smart contracts to localhost :

```bash
cd smart_contracts/

yarn hardhat deploy --network localhost
```

## Sponsors Used

### Livepeer

Token gated livestreams can be created using Livepeer and livepeer playback tools are used to play all the video posts and chats .

#### Atleast one example:

[Token Gated Streams](https://github.com/Ahmed-Aghadi/Livopedia/blob/main/client/pages/api/sign-jwt.ts)

[Player to play video stored in IPFS](https://github.com/Ahmed-Aghadi/Livopedia/blob/main/client/components/Video.tsx#L24)

### Lens Protocol

All the text posts and videos posts are created on Lens. Creators will have a lens profile.

#### Atleast one example:

[Lens Hook](https://github.com/Ahmed-Aghadi/Livopedia/blob/main/client/hooks/useLens.ts)

### The Graph

All the queries and mutations for Lens Protocol are done using The Graph.

#### Atleast one example:

[useLens hook where The Graph is used](https://github.com/Ahmed-Aghadi/Livopedia/blob/main/client/hooks/useLens.ts#L28)

### Lit Protocol

Everything is encrypted using lit actions ( using Lit js sdk ). Only the owner of the membership NFT contract or the user who is subscribed to the membership can decrypt the contents.

#### Atleast one example:

[Encrypt Content](https://github.com/Ahmed-Aghadi/Livopedia/blob/main/client/components/UserPage.tsx#L697)

[Decrypt Content](https://github.com/Ahmed-Aghadi/Livopedia/blob/main/client/components/UserPage.tsx#L721)

[Encryption Rules](https://github.com/Ahmed-Aghadi/Livopedia/blob/main/client/utils.ts#L92)

### Web3 Storage

All videos are uploaded using web3.storage’s w3ui and w3up.

#### Atleast one example:

[video uploade example code](https://github.com/Ahmed-Aghadi/Livopedia/blob/main/client/components/UserPage.tsx#L439)

[Sign in example code](https://github.com/Ahmed-Aghadi/Livopedia/blob/main/client/components/Layout.tsx#L101)

### XMTP

One on one normal and video chats can be done using XMTP.

#### Atleast one example:

[Chat Component using XMTP](https://github.com/Ahmed-Aghadi/Livopedia/blob/main/client/components/Chat.jsx)

[Custom Video Condec](https://github.com/Ahmed-Aghadi/Livopedia/blob/main/client/components/Chat.jsx#L203)

### Push Protocol

User can opt in to notification channel and can use chat support to contact creators using Push Protocol

#### Atleast one example:

[hook for push protocol](https://github.com/Ahmed-Aghadi/Livopedia/blob/main/client/hooks/usePush.js)

### ENS

ENS domain name and avator will be resolved. User can use ENS name to add conversations in xmtp chats and if there's an avator then it will be rendered too.

#### Atleast one example:

[Lookup address example](https://github.com/Ahmed-Aghadi/Livopedia/blob/main/client/components/Chat.jsx#L926)

[Avator example](https://github.com/Ahmed-Aghadi/Livopedia/blob/main/client/components/Chat.jsx#L933)

[Avator example](https://github.com/Ahmed-Aghadi/Livopedia/blob/main/client/components/Chat.jsx#L933)

### Polygon

All the smart contracts are deployed on polygon mumbai.

#### Atleast one example:

[Deployements](https://github.com/Ahmed-Aghadi/Livopedia/tree/main/smart_contracts/deployments/mumbai)

[Smart Contract](https://github.com/Ahmed-Aghadi/Livopedia/tree/main/smart_contracts/contracts)

### Unlock Protocol

Unlock Protocol is used to create membership for content creators. So everything is token gated.

#### Atleast one example:

[deploy lock function](https://github.com/Ahmed-Aghadi/Livopedia/blob/main/client/pages/upload.js#L96)

[register lock function in smart contract](https://github.com/Ahmed-Aghadi/Livopedia/blob/main/smart_contracts/contracts/Main.sol#L44)

[token gated access](https://github.com/Ahmed-Aghadi/Livopedia/blob/main/client/pages/api/login.ts)

### Tableland

Tableland is used as a decentralized sql database so content is smart contract is indexed using tableland.

#### Atleast one example:

[Tablename](https://github.com/Ahmed-Aghadi/Livopedia/blob/main/client/constants/index.js#L16)

[Tableland Result](https://testnet.tableland.network/query?s=SELECT%20*%20FROM%20main_80001_5192)

### Mantine UI

Mantine ui is heavily used in front end for styling.
