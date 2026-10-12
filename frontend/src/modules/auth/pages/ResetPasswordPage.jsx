import { useState } from "react"
import { Link, useSearchParams } from "react-router"
import { Lock, Eye, EyeOff, CheckCircle } from "lucide-react" 
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { api } from "../../../lib/axios"



export default function ResetPasswordPage() {
    // Hook to read URL parameters automatically (e.g., ?token=abcdef123...)
    const [searchParams] = useSearchParams()
    const token = searchParams.get("token")

    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState(null)
    const [isSuccess, setIsSuccess] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const handleFormSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setErrorMessage(null)

        if (newPassword != confirmPassword) {
            setErrorMessage("Password do not match. Please verify your entries")
            setIsLoading(false)
            return
        }

        try {
            const response = api.post(
                `/auth/reset-password?token=${token}`, 
                { newPassword }
            )
            console.log("🟢 [Passcode Overwrite Success]:", response.data)
            setIsSuccess(true)
        } catch (error) {
            console.error("❌ [Reset Failure] Axios mapping caught an exception:", error)
            const backendMessage = error.response?.data?.message || "Invalid or expired reset token link."
            setErrorMessage(backendMessage)
        } finally {
            setIsLoading(false)
        }
    }

    // ⚡ Visual state return loop if the database update is completely verified
    if (isSuccess) {
        return (
            <div className="w-full max-w-md bg-neutral-900/80 backdrop-blur-xl border border-emerald-900/30 p-8 rounded-2xl shadow-2xl text-center space-y-6 animate-fade-in">

                <div className="flex justify-center">
                    <CheckCircle className="w-16 h-16 text-emerald-500 animate-bounce" />
                </div>

                <div>
                    <h1 className="text-2xl font-extrabold text-white">Password Updated!</h1>
                    <p className="text-neutral-400 text-sm mt-2">
                        Your new terminal passcode credentials are active. Old device sessions have been globally logged out.
                    </p>
                </div>

                <Link to="/signin" className="block w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-lg text-center transition-all">
                    Sign In with New Password
                </Link>
            </div>
        )
    }
    

    return (
        <div className="w-full max-w-md bg-neutral-900/80 backdrop-blur-xl border border-neutral-800/80 p-8 rounded-2xl shadow-2xl transition-all duration-500 hover:border-neutral-700/50">
        
        <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
                Reset <span className="text-emerald-500">Password</span>
            </h1>
            <p className="text-neutral-400 text-sm mt-2">
                Establish your new security access passcode parameters.
            </p>
        </div>

        {errorMessage && (
            <div className="mb-6 p-3 bg-red-900/30 border border-red-800 text-red-200 text-sm font-medium rounded-lg text-center">
                {errorMessage}
            </div>
        )}

        {/* ⚠️ Checks early if token exists in URL query parameters */}
        {!token ? (
            <div className="p-4 bg-red-900/20 border border-red-800/40 text-red-200 text-sm rounded-xl text-center space-y-4">
                <p>Security error: Authentication recovery token parameter is missing from the destination link.</p>
                <Link to="/signin" className="text-emerald-500 hover:underline block text-xs">Return to main sign in</Link>
            </div>
        ) : (
            <form onSubmit={handleFormSubmit} className="space-y-5">
            
                {/* New Password Entry Field */}
                <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-neutral-300 font-medium text-sm">New Passcode</Label>
                    <div className="relative flex items-center">
                    <Lock className="absolute left-3 w-4 h-4 text-neutral-500 pointer-events-none" />
                    <Input
                        id="newPassword"
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="••••••••"
                        className="pl-10 pr-10 bg-neutral-950 border-neutral-800 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg w-full transition-all"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 text-neutral-500 hover:text-neutral-300 transition-colors focus:outline-none cursor-pointer"
                    >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    </div>
                </div>

                {/* Confirm Password Entry Field */}
                <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-neutral-300 font-medium text-sm">Confirm Passcode</Label>
                    <div className="relative flex items-center">
                    <Lock className="absolute left-3 w-4 h-4 text-neutral-500 pointer-events-none" />
                    <Input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="••••••••"
                        className="pl-10 pr-10 bg-neutral-950 border-neutral-800 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg w-full transition-all"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    </div>
                </div>

                <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-lg cursor-pointer transition-all active:scale-[0.99] disabled:opacity-50 mt-2"
                >
                    {isLoading ? "Updating Security Credentials..." : "Commit New Password"}
                </Button>
            </form>
        )}
        </div>
    )
}