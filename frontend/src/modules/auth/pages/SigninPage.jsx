import { useState } from "react"
import { Link } from "react-router" 
import { Mail, Lock, Eye, EyeOff } from "lucide-react" 
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { api } from "../../../lib/axios.js"


export default function SigninPage() {
	const [formData, setFormData] = useState({ email: "", password: "" })
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
			const response = await api.post("/auth/signin", formData)
			console.log(response?.data?.data?.user)
			alert(`Login Successful! Welcome back.`)
		} catch (error) {
			console.error("❌ Raw Axios Error Object:", error)
			const backendMessage = error?.response?.data?.message || "Connection to authentication server failed."
			console.log(backendMessage)
			setErrorMessage(backendMessage)
		} finally {
			setIsLoading(false)
		}
	}
	
	return (
		// 🔮 Glassmorphism style update to blend smoothly with your new animated background layout!
		<div className="w-full max-w-md bg-neutral-900/80 backdrop-blur-xl border border-neutral-800/80 p-8 rounded-2xl shadow-2xl transition-all duration-500 hover:border-neutral-700/50">
			<div className="text-center mb-8">
				<h1 className="text-3xl font-extrabold text-white tracking-tight">
					Restaurant<span className="text-emerald-500">OS</span>
				</h1>
				<p className="text-neutral-400 text-sm mt-2">
					Enter your system credentials to access the console.
				</p>
			</div>

			{errorMessage && (
				<div className="mb-6 p-3 bg-red-900/30 border border-red-800 text-red-200 text-sm font-medium rounded-lg text-center animate-fade-in">
					{errorMessage}
				</div>
			)}

			<form onSubmit={handleFormSubmit} className="space-y-6">
				{/* Email Parameter Input Area */}
				<div className="space-y-2">
					<Label htmlFor="email" className="text-neutral-300 font-medium text-sm">Email Address</Label>
					<div className="relative flex items-center">
						<Mail className="absolute left-3 w-4 h-4 text-neutral-500 pointer-events-none" />
						<Input
							id="email"
							name="email"
							type="email"
							required
							placeholder="manager@restaurant.com"
							className="pl-10 bg-neutral-950 border-neutral-800 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg w-full transition-all"
							value={formData.email}
							onChange={handleInputChange}
						/>
					</div>
				</div>

				{/* Password Parameter Input Area */}
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<Label htmlFor="password" className="text-neutral-300 font-medium text-sm">Password</Label>
						<Link to="/forgot-password" className="text-xs text-emerald-500 hover:text-emerald-400 transition-colors">Forgot password?</Link>
					</div>
					
					{/* ⚡ Relative frame wrapper with right-side padding tracking layout elements */}
					<div className="relative flex items-center">
						<Lock className="absolute left-3 w-4 h-4 text-neutral-500 pointer-events-none" />
						<Input
							id="password"
							name="password"
							// ⚡ STEP C: Dynamic runtime evaluation changes input type mask natively!
							type={showPassword ? "text" : "password"}
							required
							placeholder="••••••••"
							className="pl-10 pr-10 bg-neutral-950 border-neutral-800 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg w-full transition-all"
							value={formData.password}
							onChange={handleInputChange}
						/>
						
						{/* ⚡ STEP D: Interactive Toggle Button Trigger Container */}
						<button
							type="button" // Enforces that clicking this icon does NOT accidentally submit the form!
							onClick={() => setShowPassword((prev) => !prev)}
							className="absolute right-3 text-neutral-500 hover:text-neutral-300 transition-colors focus:outline-none cursor-pointer p-0.5 rounded"
						>
							{showPassword ? (
								<EyeOff className="w-4 h-4 select-none" />
							) : (
								<Eye className="w-4 h-4 select-none" />
							)}
						</button>
					</div>
				</div>

				<Button
					type="submit"
					disabled={isLoading}
					className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-lg cursor-pointer transition-all active:scale-[0.99] disabled:opacity-50"
				>
					{isLoading ? "Authenticating Session..." : "Sign In to System"}
				</Button>
			</form>

			<div className="text-center mt-6 pt-6 border-t border-neutral-800/60">
				<p className="text-xs text-neutral-500">
					Need an instance setup?{" "}
					<Link to="/signup" className="text-emerald-500 hover:text-emerald-400 font-medium transition-colors">Create an account</Link>
				</p>
			</div>
		</div>
	)
}
