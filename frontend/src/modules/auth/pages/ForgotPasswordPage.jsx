import { useState } from "react"
import { Link } from "react-router"
// ⚡ Pulling down clear semantic indicators from Lucide (User icon added for Name)
import { Mail, ArrowLeft } from "lucide-react" 
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { api } from "../../../lib/axios"



export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState(null)
    const [successMessage, setSuccessMessage] = useState(null)

    const handleFormSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setErrorMessage(null)
        setSuccessMessage(null)

        try {
            const response = await api.post("/auth/forgot-password", { email })
            console.log("🟢 [Recovery Dispatched Success]:", response.data)
            setSuccessMessage(response.data.message)
            setEmail("") // Clear the form input box on successful execution
        } catch (error) {
            console.error("❌ [Recovery Failure] Axios caught an execution crash:", error)
            const backendMessage = error.response?.data?.message || "Connection to security server failed."
            setErrorMessage(backendMessage)
        } finally {
            setIsLoading(false)
        }

    }
 
    return (
        <div className="w-full max-w-md bg-neutral-900/80 backdrop-blur-xl border border-neutral-800/80 p-8 rounded-2xl shadow-2xl transition-all duration-500 hover:border-neutral-700/50">
      
        {/* Brand Header Header */}
        <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
                Recover <span className="text-emerald-500">Access</span>
            </h1>
            <p className="text-neutral-400 text-sm mt-2">
                Lost your master passcode? Request a recovery link.
            </p>
        </div>

        {/* ⚠️ Dynamic Alert: Backend Error Notification Banner */}
        {errorMessage && (
            <div className="mb-6 p-3 bg-red-900/30 border border-red-800 text-red-200 text-sm font-medium rounded-lg text-center animate-fade-in">
                {errorMessage}
            </div>
        )}

        {/* 🎉 Dynamic Alert: Success Dispatch Confirmation Banner */}
        {successMessage && (
            <div className="mb-6 p-4 bg-emerald-950/40 border border-emerald-800 text-emerald-200 text-sm font-medium rounded-xl text-center shadow-lg shadow-emerald-950/20 animate-fade-in">
                {successMessage}
            </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-6">
            
            {/* Email Address Parameter Input Box */}
            <div className="space-y-2">
                <Label htmlFor="email" className="text-neutral-300 font-medium text-sm">System Email Address</Label>
                <div className="relative flex items-center">
                    <Mail className="absolute left-3 w-4 h-4 text-neutral-500 pointer-events-none" />
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        disabled={isLoading || successMessage} // Lock down if process is successful
                        placeholder="manager@restaurant.com"
                        className="pl-10 bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg w-full transition-all disabled:opacity-40"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
            </div>

            {/* Submit Execution Action Trigger Button */}
            <Button
                type="submit"
                disabled={isLoading || successMessage}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-lg cursor-pointer transition-all active:scale-[0.99] disabled:opacity-50 shadow-lg shadow-emerald-950/20"
            >
                {isLoading ? "Dispatching Secret Link..." : "Send Reset Instructions"}
            </Button>
        </form>

        {/* Dynamic Navigation Return Anchor Grid Hook */}
        <div className="text-center mt-6 pt-6 border-t border-neutral-800/60">
            <Link 
                to="/signin" 
                className="inline-flex items-center gap-2 text-xs text-neutral-400 hover:text-white font-medium transition-colors group mx-auto"
            >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
                Back to Operational Sign In
            </Link>
        </div>

        </div>
    )
}
