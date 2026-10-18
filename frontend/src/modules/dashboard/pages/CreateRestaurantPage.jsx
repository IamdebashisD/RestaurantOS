import { useState } from "react"
import { useNavigate } from "react-router"
import { Store, MapPin, Utensils, ArrowRight, Globe, Compass, FileText, } from "lucide-react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { useAuth } from "../../../modules/auth/context/AuthContext"
import { api } from "../../../lib/axios"


export default function CreateRestaurantPage() {
    const { setActiveRestaurant, checkSession} = useAuth()
    const navigate = useNavigate()

    console.log("hello world")

    const [formData, setFormData] = useState({
        name: "", 
        slug: "", 
        description: "",
        street: "",
        city: "",
        state: "",
        postalCode: ""
    })

    const [isLoading, setIsLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState(null)

    // 🧠 AUTOMATED SLUG ENGINE: Converts "My Restaurant 123" into "my-restaurant-123" on the fly!
    const generateSlug = (text) => {
        return text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "") // Strip out special characters
        .replace(/\s+/g, "-")         // Replace spaces with hyphens
        .replace(/-+/g, "-")          // Deduplicate multiple consecutive hyphens
    }

    const handleInputChange = (e) => {
        const {name, value} = e.target
        setFormData((prev) => {
            const updatedState = { ...prev, [name]: value }

            if (name === "name") {
                updatedState.slug = generateSlug(value) 
            }
            return updatedState
        })
    }


    const handleFormSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setErrorMessage(null)

        const dynamicPayloadPackage = {
            name: formData.name,
            slug: formData.slug,
            description: formData.description,
            address: {
                street: formData.street,
                city: formData.city,
                state: formData.state,
                postalCode: formData.postalCode,
                country: formData.country || "India"
            }
        }

        try {
            const response = await api.post("/restaurants", dynamicPayloadPackage)
            const newRestaurant = response.data.data.restaurant
            const restaurantId = newRestaurant._id ?? newRestaurant.id
            const restaurantName = newRestaurant.name

            localStorage.setItem("active_restaurant_id", restaurantId)
            localStorage.setItem("active_restaurant_name", restaurantName)

            setActiveRestaurant({ id: restaurantId, name: restaurantName })

            if (checkSession) {
                await checkSession()
            }

            console.log("🟢 [Tenant Workspace Setup Success]:", restaurantId)
            navigate(`/dashboard/${restaurantId}`, { replace: true })
        
        } catch (error) {
            const backendMessage = error.response?.data?.message || "Failed to provision restaurant console node instance."
            setErrorMessage(backendMessage)            
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="w-full max-w-xl bg-neutral-900/80 backdrop-blur-xl border border-neutral-800/80 p-8 rounded-2xl shadow-2xl transition-all duration-500 hover:border-neutral-700/50 my-8">
            
            <div className="text-center mb-8">
                <h1 className="text-3xl font-extrabold text-white tracking-tight">
                    Setup <span className="text-emerald-500">Workspace</span>
                </h1>
                <p className="text-neutral-400 text-sm mt-2">
                    Initialize your restaurant control node layout architecture.
                </p>
            </div>

            {errorMessage && (
                <div className="mb-6 p-3 bg-red-900/30 border border-red-800 text-red-200 text-sm font-medium rounded-lg text-center animate-fade-in">
                    {errorMessage}
                </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-5">
                
                {/* Row 1: Restaurant Name & Real-time Auto-generated Slug */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-neutral-300 font-medium text-sm">Business Name</Label>
                        <div className="relative flex items-center">
                            <Store className="absolute left-3 w-4 h-4 text-neutral-500 pointer-events-none" />
                            <Input
                                id="name"
                                name="name"
                                type="text"
                                required
                                placeholder="Gourmet Bistro Hub"
                                className="pl-10 bg-neutral-950 border-neutral-800 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg w-full transition-all"
                                value={formData.name}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="slug" className="text-neutral-300 font-medium text-sm">System URL Slug</Label>
                        <div className="relative flex items-center">
                            <Globe className="absolute left-3 w-4 h-4 text-neutral-600 pointer-events-none" />
                            <Input
                                id="slug"
                                name="slug"
                                type="text"
                                required
                                disabled
                                placeholder="gourmet-bistro-hub"
                                className="pl-10 bg-neutral-950/40 border-neutral-800 text-neutral-400 font-mono text-xs rounded-lg w-full cursor-not-allowed select-none opacity-60"
                                value={formData.slug}
                            />
                        </div>
                    </div>
                </div>

                {/* Description Field */}
                <div className="space-y-2">
                    <Label htmlFor="description" className="text-neutral-300 font-medium text-sm">Brief System Description</Label>
                    <div className="relative flex items-center">
                        <FileText className="absolute left-3 top-3.5 w-4 h-4 text-neutral-500 pointer-events-none" />
                        <textarea
                            id="description"
                            name="description"
                            maxLength={1000}
                            placeholder="Enter kitchen parameters or business tagline details..."
                            className="pl-10 pt-2.5 min-h-[80px] bg-neutral-950 border border-neutral-800 text-white placeholder:text-neutral-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg w-full text-sm font-sans transition-all focus:outline-none"
                            value={formData.description}
                            onChange={handleInputChange}
                        />
                    </div>
                </div>

                {/* Address Sub-Section Matrix */}
                <div className="border-t border-neutral-800/80 pt-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-500 block mb-3">
                        Geographic Workspace Coordinates
                    </span>
                    
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="street" className="text-neutral-300 font-medium text-sm">Street Address</Label>
                            <div className="relative flex items-center">
                                <MapPin className="absolute left-3 w-4 h-4 text-neutral-500 pointer-events-none" />
                                <Input
                                    id="street"
                                    name="street"
                                    type="text"
                                    placeholder="Park Street, Block C, Suite 4B"
                                    className="pl-10 bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg w-full transition-all"
                                    value={formData.street}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="city" className="text-neutral-300 font-medium text-sm">City</Label>
                                <Input
                                    id="city"
                                    name="city"
                                    type="text"
                                    placeholder="Kolkata"
                                    className="bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg w-full transition-all"
                                    value={formData.city}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="state" className="text-neutral-300 font-medium text-sm">State</Label>
                                <Input
                                    id="state"
                                    name="state"
                                    type="text"
                                    placeholder="West Bengal"
                                    className="bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg w-full transition-all"
                                    value={formData.state}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="postalCode" className="text-neutral-300 font-medium text-sm">Postal PIN</Label>
                                <Input
                                    id="postalCode"
                                    name="postalCode"
                                    type="text"
                                    placeholder="700016"
                                    className="bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg w-full transition-all"
                                    value={formData.postalCode}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submission Action Button */}
                <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-lg cursor-pointer transition-all active:scale-[0.99] disabled:opacity-50 mt-4 shadow-lg shadow-emerald-950/20 inline-flex items-center justify-center gap-2"
                >
                    {isLoading ? "Provisioning Terminal Instance..." : "Deploy Active Workspace"}
                    {!isLoading && <ArrowRight className="w-4 h-4" />}
                </Button>
            </form>
        </div>
    )
}
