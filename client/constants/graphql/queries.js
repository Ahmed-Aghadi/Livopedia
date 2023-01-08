// query variables: profHex
export const fetchUserProfile =
    "query userProfile($profHex: [ProfileId!]) { profiles(request: { profileIds: $profHex }) { items { id ownedBy handle metadata dispatcher { address canUseRelay } followNftAddress stats { totalFollowers totalFollowing totalPosts totalComments totalMirrors totalPublications totalCollects } } } }"

// query variables: accHex
export const fetchOrganisationDetails =
    "query GetOrg($accHex: String){ account(id: $accHex){ id name metaURI members { id } projects { id name releases { id name metaURI } } } }"

export const fetchProjectDetails =
    "query GetProj ($projId: String){ project(id: $projId){ id name metaURI members{ id } releases {id name metaURI }}}"

export const ACCOUNTS_SEARCH__QUERY =
    "\n query AccountSearch($search: String){\n accounts(where:{name_contains: $search}){\n id\n name\n metaURI\n }\n }\n"

export const CHALLENGE_QUERY = `query Challenge ($address: EthereumAddress!) {challenge(request: { address: $address }){text}}`

export const AUTHENTICATE_MUTATION = `mutation Authenticate ($address: EthereumAddress!, $signature:Signature!) {authenticate(request: {address: $address signature: $signature}){accessToken refreshToken}}`

export const CREATE_PROFILE_MUTATION = `mutation CreateProfile($username: CreateHandle!, $img:Url) {createProfile(request:{ handle: $username,profilePictureUri: $img, followModule: {freeFollowModule: true}}) {... on RelayerResult {txHash}... on RelayError {reason}__typename}}`

export const LENS_PROFILE_EXISTS =
    "query AccountExists ($name:Handle){profile(request: {handle: $name}) {id}}"

export const LENS_PROFILE_DETAILS = `query Profile ($id:ProfileId!) {
  profile(request: { profileId: $id}) {
    id
    name
    bio
    attributes {
      displayType
      traitType
      key
      value
    }
    followNftAddress
    metadata
    isDefault
    picture {
      ... on NftImage {
        contractAddress
        tokenId
        uri
        verified
      }
      ... on MediaSet {
        original {
          url
          mimeType
        }
      }
      __typename
    }
    handle
    coverPicture {
      ... on NftImage {
        contractAddress
        tokenId
        uri
        verified
      }
      ... on MediaSet {
        original {
          url
          mimeType
        }
      }
      __typename
    }
    ownedBy
    dispatcher {
      address
      canUseRelay
    }
    stats {
      totalFollowers
      totalFollowing
      totalPosts
      totalComments
      totalMirrors
      totalPublications
      totalCollects
    }
    followModule {
      ... on FeeFollowModuleSettings {
        type
        amount {
          asset {
            symbol
            name
            decimals
            address
          }
          value
        }
        recipient
      }
      ... on ProfileFollowModuleSettings {
        type
      }
      ... on RevertFollowModuleSettings {
        type
      }
    }
  }
}`

export const CREATE_POST_MUTATION = `mutation CreatePostTypedData($profId: ProfileId!, $cid: Url!) {
    createPostTypedData(
      request: {
        profileId: $profId
        contentURI: $cid
        collectModule: { revertCollectModule: true }
        referenceModule: { followerOnlyReferenceModule: false }
      }
    ) {
      id
      expiresAt
      typedData {
        types {
          PostWithSig {
            name
            type
          }
        }
        domain {
          name
          chainId
          version
          verifyingContract
        }
        value {
          nonce
          deadline
          profileId
          contentURI
          collectModule
          collectModuleInitData
          referenceModule
          referenceModuleInitData
        }
      }
    }
  }
  `

export const CREATE_POST_TYPED_DATA = `
            mutation($request: CreatePublicPostRequest!) { 
                createPostTypedData(request: $request) {
                    id
                    expiresAt
                    typedData {
                        types {
                            PostWithSig {
                                name
                                type
                            }
                        }
                        domain {
                            name
                            chainId
                            version
                            verifyingContract
                        }
                        value {
                            nonce
                            deadline
                            profileId
                            contentURI
                            collectModule
                            collectModuleInitData
                            referenceModule
                            referenceModuleInitData
                        }
                    }
                }
            }
        `

export const GET_PUBLICATIONS = `
  query Publications($profileId: ProfileId) {
    publications(request: {
      profileId: $profileId,
      publicationTypes: [POST, COMMENT, MIRROR],
      sources:["testappid"],
      limit: 10
    }) {
      items {
        __typename 
        ... on Post {
          ...PostFields
        }
        ... on Comment {
          ...CommentFields
        }
        ... on Mirror {
          ...MirrorFields
        }
      }
      pageInfo {
        prev
        next
        totalCount
      }
    }
  }

  fragment MediaFields on Media {
    url
    mimeType
  }

  fragment ProfileFields on Profile {
    id
    name
    bio
    attributes {
      displayType
      traitType
      key
      value
    }
    isFollowedByMe
    isFollowing(who: null)
    followNftAddress
    metadata
    isDefault
    handle
    picture {
      ... on NftImage {
        contractAddress
        tokenId
        uri
        verified
      }
      ... on MediaSet {
        original {
          ...MediaFields
        }
      }
    }
    coverPicture {
      ... on NftImage {
        contractAddress
        tokenId
        uri
        verified
      }
      ... on MediaSet {
        original {
          ...MediaFields
        }
      }
    }
    ownedBy
    dispatcher {
      address
    }
    stats {
      totalFollowers
      totalFollowing
      totalPosts
      totalComments
      totalMirrors
      totalPublications
      totalCollects
    }
    followModule {
      ...FollowModuleFields
    }
  }

  fragment PublicationStatsFields on PublicationStats { 
    totalAmountOfMirrors
    totalAmountOfCollects
    totalAmountOfComments
    totalUpvotes
    totalDownvotes
  }

  fragment MetadataOutputFields on MetadataOutput {
    name
    description
    content
    media {
      original {
        ...MediaFields
      }
    }
    tags
    attributes {
      displayType
      traitType
      value
    }
  }

  fragment Erc20Fields on Erc20 {
    name
    symbol
    decimals
    address
  }

  fragment PostFields on Post {
    id
    profile {
      ...ProfileFields
    }
    stats {
      ...PublicationStatsFields
    }
    metadata {
      ...MetadataOutputFields
    }
    createdAt
    collectModule {
      ...CollectModuleFields
    }
    referenceModule {
      ...ReferenceModuleFields
    }
    appId
    hidden
    reaction(request: null)
    mirrors(by: null)
    hasCollectedByMe
  }

  fragment MirrorBaseFields on Mirror {
    id
    profile {
      ...ProfileFields
    }
    stats {
      ...PublicationStatsFields
    }
    metadata {
      ...MetadataOutputFields
    }
    createdAt
    collectModule {
      ...CollectModuleFields
    }
    referenceModule {
      ...ReferenceModuleFields
    }
    appId
    hidden
    reaction(request: null)
    hasCollectedByMe
  }

  fragment MirrorFields on Mirror {
    ...MirrorBaseFields
    mirrorOf {
    ... on Post {
        ...PostFields          
    }
    ... on Comment {
        ...CommentFields          
    }
    }
  }

  fragment CommentBaseFields on Comment {
    id
    profile {
      ...ProfileFields
    }
    stats {
      ...PublicationStatsFields
    }
    metadata {
      ...MetadataOutputFields
    }
    createdAt
    collectModule {
      ...CollectModuleFields
    }
    referenceModule {
      ...ReferenceModuleFields
    }
    appId
    hidden
    reaction(request: null)
    mirrors(by: null)
    hasCollectedByMe
  }

  fragment CommentFields on Comment {
    ...CommentBaseFields
    mainPost {
      ... on Post {
        ...PostFields
      }
      ... on Mirror {
        ...MirrorBaseFields
        mirrorOf {
          ... on Post {
            ...PostFields          
          }
          ... on Comment {
            ...CommentMirrorOfFields        
          }
        }
      }
    }
  }

  fragment CommentMirrorOfFields on Comment {
    ...CommentBaseFields
    mainPost {
      ... on Post {
        ...PostFields
      }
      ... on Mirror {
        ...MirrorBaseFields
      }
    }
  }

  fragment FollowModuleFields on FollowModule {
    ... on FeeFollowModuleSettings {
      type
      amount {
        asset {
          name
          symbol
          decimals
          address
        }
        value
      }
      recipient
    }
    ... on ProfileFollowModuleSettings {
      type
      contractAddress
    }
    ... on RevertFollowModuleSettings {
      type
      contractAddress
    }
    ... on UnknownFollowModuleSettings {
      type
      contractAddress
      followModuleReturnData
    }
  }

  fragment CollectModuleFields on CollectModule {
    __typename
    ... on FreeCollectModuleSettings {
      type
      followerOnly
      contractAddress
    }
    ... on FeeCollectModuleSettings {
      type
      amount {
        asset {
          ...Erc20Fields
        }
        value
      }
      recipient
      referralFee
    }
    ... on LimitedFeeCollectModuleSettings {
      type
      collectLimit
      amount {
        asset {
          ...Erc20Fields
        }
        value
      }
      recipient
      referralFee
    }
    ... on LimitedTimedFeeCollectModuleSettings {
      type
      collectLimit
      amount {
        asset {
          ...Erc20Fields
        }
        value
      }
      recipient
      referralFee
      endTimestamp
    }
    ... on RevertCollectModuleSettings {
      type
    }
    ... on TimedFeeCollectModuleSettings {
      type
      amount {
        asset {
          ...Erc20Fields
        }
        value
      }
      recipient
      referralFee
      endTimestamp
    }
    ... on UnknownCollectModuleSettings {
      type
      contractAddress
      collectModuleReturnData
    }
  }

  fragment ReferenceModuleFields on ReferenceModule {
    ... on FollowOnlyReferenceModuleSettings {
      type
      contractAddress
    }
    ... on UnknownReferenceModuleSettings {
      type
      contractAddress
      referenceModuleReturnData
    }
    ... on DegreesOfSeparationReferenceModuleSettings {
      type
      contractAddress
      commentsRestricted
      mirrorsRestricted
      degreesOfSeparation
    }
  }
`
