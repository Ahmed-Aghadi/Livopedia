import React, { useState } from "react"
import { useAuth, AuthStatus } from "@w3ui/react-keyring"
import { Button, TextInput } from "@mantine/core"
import { Layout } from "./Layout"

export default function Authenticator({ children }) {
    const {
        authStatus,
        identity,
        registerAndStoreIdentity,
        cancelRegisterAndStoreIdentity,
        unloadIdentity,
        unloadAndRemoveIdentity,
    } = useAuth()
    const [email, setEmail] = useState("")
    console.log("authStatus", authStatus)
    console.log("identity", identity)

    // if (authStatus === AuthStatus.SignedIn) {
    //     return <Button onClick={unloadAndRemoveIdentity}>Sign out</Button>
    // }

    if (authStatus === AuthStatus.SignedIn) {
        return children
    }

    if (authStatus === AuthStatus.EmailVerification) {
        return (
            <Layout>
                <h1 className="near-white">Verify your email address!</h1>
                <p>
                    Click the link in the email we sent to {identity && identity.email} to sign in.
                </p>
                <form
                    onSubmit={(e) => {
                        e.preventDefault()
                        cancelRegisterAndStoreIdentity()
                    }}
                >
                    <button type="submit" className="ph3 pv2">
                        Cancel
                    </button>
                </form>
            </Layout>
        )
    }

    const handleRegisterSubmit = async (e) => {
        e.preventDefault()
        try {
            await registerAndStoreIdentity(email)
        } catch (err) {
            throw new Error("failed to register", { cause: err })
        }
    }

    return (
        <Layout>
            <TextInput
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            />
            <Button onClick={handleRegisterSubmit} mt="md">
                Register
            </Button>
            {/* <form onSubmit={handleRegisterSubmit}>
                <div className="mb3">
                    <label htmlFor="email" className="db mb2">
                        Email address:
                    </label>
                    <input
                        id="email"
                        className="db pa2 w-100"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className="ph3 pv2">
                    Register
                </button>
            </form> */}
        </Layout>
    )
}

/**
 * Wrapping a component with this HoC ensures an identity exists.
 */
export function withIdentity(Component) {
    return (props) => (
        <Authenticator>
            <Component {...props} />
        </Authenticator>
    )
}
