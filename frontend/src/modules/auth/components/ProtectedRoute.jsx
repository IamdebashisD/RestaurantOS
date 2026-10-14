import { Navigate, Outlet } from "react-router"
import { useAuth } from "../context/AuthContext"


export default function ProtectedRoute() {
    const { user, loading } = useAuth()

    // 🔄 Renders a clean loading spinner frame while validating your secure session cookies
    if (loading) {
        return (
            <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-emerald-500 font-medium">
                Validating Security Terminal...
            </div>
        )
    }

    //  🛑 If user is no longer authenticated, intercept and bounce them back to /signin
    if (!user) {
        return <Navigate to="/signin" replace />
    }


    // 🔓 Safe to pass through: Renders the target private dashboard view screen content cleanly
    return <Outlet />

}