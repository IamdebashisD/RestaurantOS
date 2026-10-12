import { useState } from "react"
import { Link } from "react-router"
// ⚡ Pulling down clear semantic indicators from Lucide (User icon added for Name)
import { User, Mail, Lock, Eye, EyeOff } from "lucide-react" 
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { api } from "../../../lib/axios"



export default function SignupPage() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: ""
    })
    const [isLoading, setIsLoading] = useState(false)
	const [errorMessage, setErrorMessage] = useState(null)
	const [showPassword, setShowPassword] = useState(false)

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleFormSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setErrorMessage(null)

        try {
            const response = await api.post("/auth/signup", formData)

            console.log("🟢 [Registration Success] Backend user built:", response.data)
            alert("Registration Successful! Please check your email sandbox for the activation link. 📧")
        } catch (error) {
            let backendMessage
            console.error("❌ [Registration Failure] Axios error caught:", error)
            backendMessage = error.response?.data?.message || "Connection to registration server failed."
            if (error.response?.data?.errors.password){
                backendMessage = error.response?.data?.errors.password
            }
            setErrorMessage(backendMessage)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="w-full max-w-md bg-neutral-900/80 backdrop-blur-xl border border-neutral-800/80 p-8 rounded-2xl shadow-2xl transition-all duration-500 hover:border-neutral-700/50">
        
            {/* Brand Header */}
            <div className="text-center mb-8">
                <h1 className="text-3xl font-extrabold text-white tracking-tight">
                Create <span className="text-emerald-500">Instance</span>
                </h1>
                <p className="text-neutral-400 text-sm mt-2">
                Deploy your RestaurantOS workspace terminal profile.
                </p>
            </div>

            {/* ⚠️ Dynamic Backend Error Alert Banner */}
            {errorMessage && (
                <div className="mb-6 p-3 bg-red-900/30 border border-red-800 text-red-200 text-sm font-medium rounded-lg text-center animate-fade-in">
                {errorMessage}
                </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-5">
                
                {/* Full Name Parameter Input Area */}
                <div className="space-y-2">
                <Label htmlFor="name" className="text-neutral-300 font-medium text-sm">Manager Full Name</Label>
                <div className="relative flex items-center">
                    <User className="absolute left-3 w-4 h-4 text-neutral-500 pointer-events-none" />
                    <Input
                        id="name"
                        name="name"
                        type="text"
                        required
                        placeholder="Chef Alexander"
                        className="pl-10 bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg w-full transition-all"
                        value={formData.name}
                        onChange={handleInputChange}
                    />
                </div>
                </div>

                {/* Email Address Parameter Input Area */}
                <div className="space-y-2">
                <Label htmlFor="email" className="text-neutral-300 font-medium text-sm">System Email Address</Label>
                <div className="relative flex items-center">
                    <Mail className="absolute left-3 w-4 h-4 text-neutral-500 pointer-events-none" />
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        placeholder="admin@restaurantos.com"
                        className="pl-10 bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg w-full transition-all"
                        value={formData.email}
                        onChange={handleInputChange}
                    />
                </div>
                </div>

                {/* Password Security Input Area */}
                <div className="space-y-2">
                <Label htmlFor="password" className="text-neutral-300 font-medium text-sm">Security Password</Label>
                <div className="relative flex items-center">
                    <Lock className="absolute left-3 w-4 h-4 text-neutral-500 pointer-events-none" />
                    <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="••••••••"
                        className="pl-10 pr-10 bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg w-full transition-all"
                        value={formData.password}
                        onChange={handleInputChange}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 text-neutral-500 hover:text-neutral-300 transition-colors focus:outline-none cursor-pointer p-0.5 rounded"
                    >
                    {showPassword ? <EyeOff className="w-4 h-4 select-none" /> : <Eye className="w-4 h-4 select-none" />}
                    </button>
                </div>
                </div>

                {/* Submit Execution Button */}
                <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-lg cursor-pointer transition-all active:scale-[0.99] disabled:opacity-50 mt-2 shadow-lg shadow-emerald-950/20"
                >
                {isLoading ? "Provisioning Instance..." : "Register Master Console"}
                </Button>
            </form>

            {/* Dynamic Client Handoff Navigation Link */}
            <div className="text-center mt-6 pt-6 border-t border-neutral-800/60">
                <p className="text-xs text-neutral-500">
                Already have an operational terminal?{" "}
                <Link to="/signin" className="text-emerald-500 hover:text-emerald-400 font-medium transition-colors">
                    Sign In here
                </Link>
                </p>
            </div>
        </div>
    )
}
