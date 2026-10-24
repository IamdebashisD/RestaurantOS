import { useState } from "react"
import { useParams } from "react-router"
import { X, Mail, ShieldCheck, ArrowRight } from "lucide-react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { api } from "../../../lib/axios"


export default function InviteStaffDialog({ isOpen, onClose, onRefreshRoster }) {
    const { restaurantId } = useParams()
    const [formData, setFormData] = useState({ email: "", role: "" })
    const [isLoading, setIsLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState(null)

    if (!isOpen) return null

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleFormSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setErrorMessage(null)

        const invitationPayload = {
            email: formData.email.trim().toLowerCase(),
            role: formData.role
        }

        try {
            await api.post(`/restaurants/${restaurantId}/staff`, invitationPayload)
            setFormData({ email: "", role: "" })
            onRefreshRoster()
            onClose()
        } catch (error) {
            console.error("[Staff Invitation Crash]:", error)
            setErrorMessage(
                error.response?.data?.message ||
                "Failed to dispatch system invitation to backend clearance registries."
            )
        } finally {
            setIsLoading(false)
        }
    }


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Ambient Blur Vignette Backdrop Backdrop */}
            <div onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />

            {/* Primary Modal Card Container Frame */}
            <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 p-6 rounded-2xl shadow-2xl z-10 animate-scale-in">

                {/* Upper Dismiss Action Trigger */}
                <button onClick={onClose} className="absolute right-4 top-4 p-1 rounded-md text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer focus:outline-none">
                    <X className="w-4 h-4" />
                </button>

                {/* Form Header Branding */}
                <div className="mb-6">
                    <h3 className="text-xl font-black text-white tracking-tight">Invite Staff Member</h3>
                    <p className="text-neutral-400 text-xs mt-1">Provision a secure clearance role link to add a team member into this console hub.</p>
                </div>

                {/* ⚠️ Alert Banner Interceptor Container */}
                {errorMessage && (
                    <div className="mb-4 p-3 bg-red-900/30 border border-red-800 text-red-200 text-xs font-medium rounded-lg text-center">
                        {errorMessage}
                    </div>
                )}

                <form onSubmit={handleFormSubmit} className="space-y-4">

                    {/* User Email Input Field */}
                    <div className="space-y-1.5">
                        <Label htmlFor="email" className="text-neutral-300 font-medium text-xs">Account Email Address</Label>
                        <div className="relative flex items-center">
                            <Mail className="absolute left-3 w-4 h-4 text-neutral-500 pointer-events-none" />
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                required
                                placeholder="crew.member@gmail.com"
                                className="pl-10 bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-sm w-full transition-all"
                                value={formData.email}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>

                    {/* Role Choice Enum Dropdown Selector Selector */}
                    <div className="space-y-1.5">
                        <Label htmlFor="role" className="text-neutral-300 font-medium text-xs">Staff System Role Clearance</Label>
                        <div className="relative flex items-center">
                            <ShieldCheck className="absolute left-3 w-4 h-4 text-neutral-500 pointer-events-none" />

                            <select
                                id="role"
                                name="role"
                                required
                                className="pl-10 pr-4 py-2 bg-neutral-950 border border-neutral-800 text-neutral-300 focus:border-emerald-500 rounded-xl text-sm w-full transition-all appearance-none outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer h-10"
                                value={formData.role}
                                onChange={handleInputChange}
                            >
                                <option value="" disabled>Select clearance permissions mapping</option>
                                {/* EXACT ENUM MATCH: Emits precisely what your backend validators enforce! */}
                                <option value="MANAGER">Manager (Full Ops Control)</option>
                                <option value="CASHIER">Cashier (Billing Counter)</option>
                                <option value="KITCHEN_STAFF">Kitchen Staff / Chef</option>
                                <option value="WAITER">Waiter / Server Roster</option>
                            </select>
                        </div>
                    </div>

                    {/* Action Submit Control Button */}
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl cursor-pointer transition-all active:scale-[0.99] disabled:opacity-50 mt-2 shadow-lg shadow-emerald-950/20 inline-flex items-center justify-center gap-2 text-sm focus:outline-none"
                    >
                        {isLoading ? "Provisioning System Invitation..." : "Grant Workspace Access"}
                        {!isLoading && <ArrowRight className="w-4 h-4" />}
                    </Button>

                </form>
            </div>
        </div>
    )
}
