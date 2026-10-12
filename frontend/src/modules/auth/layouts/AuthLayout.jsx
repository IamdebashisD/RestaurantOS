import { Outlet } from "react-router"

export default function AuthLayout() {
    return (
        // ⚡ EXACT STYLE LOCKED: Combines a charcoal base with your perfect emerald ambient radial vignette background
        <div 
        className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden selection:bg-emerald-500/20 selection:text-emerald-400"
        style={{
            background: 'radial-gradient(circle at center, #06261c 0%, #09090b 70%)'
        }}
        >
        
        {/* 🔓 THE TRANSITION FRAMING HOOK CONTAINER */}
        <div className="relative z-10 w-full max-w-md flex justify-center items-center">
            {/* Swaps Signin, Signup, and ForgotPassword pages right here cleanly! */}
            <Outlet />
        </div>

        </div>
    )
}
