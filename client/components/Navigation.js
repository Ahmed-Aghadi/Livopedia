import React from "react"
import { useState } from "react"
import { Navbar, Center, Tooltip, UnstyledButton, createStyles, Stack } from "@mantine/core"
import { ActionToggle } from "./ActionToggle"
import navbarLinks from "../constants/navbarLinks"
import { useRouter } from "next/router"

const useStyles = createStyles((theme) => ({
    link: {
        width: 50,
        height: 50,
        borderRadius: theme.radius.md,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: theme.colorScheme === "dark" ? theme.colors.dark[0] : theme.colors.gray[7],

        "&:hover": {
            backgroundColor:
                theme.colorScheme === "dark" ? theme.colors.dark[5] : theme.colors.gray[0],
        },
    },

    active: {
        "&, &:hover": {
            backgroundColor: theme.fn.variant({
                variant: "light",
                color: theme.primaryColor,
            }).background,
            color: theme.fn.variant({
                variant: "light",
                color: theme.primaryColor,
            }).color,
        },
    },
}))

function NavbarLink({ icon: Icon, label, active, onClick }) {
    const { classes, cx } = useStyles()
    return (
        <Tooltip label={label} position="right" transitionDuration={0}>
            <UnstyledButton
                onClick={onClick}
                className={cx(classes.link, { [classes.active]: active })}
            >
                <Icon stroke={1.5} />
            </UnstyledButton>
        </Tooltip>
    )
}

export function NavbarMinimal() {
    const router = useRouter()
    const [active, setActive] = useState(-1)

    const links = navbarLinks.map((link, index) => (
        <NavbarLink
            {...link.props}
            key={link.props.label}
            active={index === active || router.pathname.slice(1).split("/")[0] === link.path}
            onClick={() => {
                router.push("/" + link.path)
                setActive(index)
            }}
        />
    ))

    return (
        <Navbar height={750} width={{ base: 80 }} p="md">
            <ActionToggle />
            <Navbar.Section grow mt={50}>
                <Stack justify="center" spacing={50}>
                    {links}
                </Stack>
            </Navbar.Section>
        </Navbar>
    )
}
