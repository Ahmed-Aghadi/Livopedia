import "../../styles/Home.module.css"
import Profile from "../../components/Profile"

export default function Home() {
    // should have query params less than or equal to 1 (i.e. /profile/0x1234) or (i.e. /profile/) , for 0 query params, it will redirect to /profile/userAddress
    return (
        <div>
            <Profile />
        </div>
    )
}
