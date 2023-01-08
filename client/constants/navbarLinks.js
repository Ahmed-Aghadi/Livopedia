import { IconHome2, IconGauge, IconCirclePlus, IconMessages } from "@tabler/icons"

export default [
    { path: "profile", props: { icon: IconGauge, label: "Your Profile" } },
    {
        path: "upload",
        props: { icon: IconCirclePlus, label: "Become a creator" },
    },
    { path: "", props: { icon: IconHome2, label: "Home" } },
    { path: "chats", props: { icon: IconMessages, label: "Chats" } },
]
