import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router"
import { Building, Sliders, MapPin, AlertTriangle, Save, Trash2 } from "lucide-react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { useAuth } from "../../../modules/auth/context/AuthContext"
import { api } from "../../../lib/axios"


export default function SettingsPage() {
    const { restaurantId } = useParams()
    const { user, setUser, setActiveRestaurant } = useAuth()
    const navigate = useNavigate()

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        phone: "",
        email: "",
        address: {
            street: "",
            city: "",
            state: "",
            postalCode: "",
            country: "India"
        }
    })

    const [isLoading, setIsLoading] = useState(true)
    const [isUpdating, setIsUpdating] = useState(false)
    const [isDeactivating, setIsDeactivating] = useState(false)
    const [statusMessage, setStatusMessage] = useState({ type: null, text: null })

    // Fetch active profile configuration
    useEffect(() => {
        async function loadWorkspaceProfile() {
            setIsLoading(true)

            try {
                const response = await api.get(`restaurants/${restaurantId}`)
                const rest = response.data?.data?.restaurant || {}

                setFormData({
                    name: rest.name || "",
                    description: rest.description || "",
                    phone: rest.phone || "",
                    email: rest.email || "",
                    address: {
                        street: rest.address?.street || "",
                        city: rest.address?.city || "",
                        state: rest.address?.state || "",
                        postalCode: rest.address?.postalCode || "",
                        country: rest.address?.country || "India"
                    }
                })
            } catch (error) {
                setStatusMessage({ type: "error", text: "Failed to pull down console node" })
            } finally {
                setIsLoading(false)
            }
        }

        if (restaurantId) loadWorkspaceProfile()
    }, [restaurantId])

    const handleInputChange = (e) => {
        const { name, value } = e.target
        if (["street", "city", "state", "postalCode", "country"].includes(name)) {
            setFormData((prev) => ({
                ...prev,
                address: {
                    ...prev.address,
                    [name]: value
                }

            }))
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }))
        }
    }

    // DISPATCH UPDATE ENVELOP      
    const handleFormSubmit = async (e) => {
        e.preventDefault()
        setIsUpdating(true)
        setStatusMessage({ type: null, text: null })

        // Unpack data and construct your backend nested address object matrix cleanly
        const updatedPayload = {
            name: formData.name.trim(),
            description: formData.description.trim(),
            phone: formData.phone.trim(),
            email: formData.email.trim(),
            address: {
                street: formData.address.street.trim(),
                city: formData.address.city.trim(),
                state: formData.address.state.trim(),
                postalCode: formData.address.postalCode.trim(),
                country: formData.address.country || "India"
            }
        }

        try {
            const response = await api.patch(`restaurants/${restaurantId}`, updatedPayload)

            const savedName = response.data?.data?.restaurant?.name || formData?.name
            setActiveRestaurant({ id: restaurantId, name: savedName })
            localStorage.setItem("active_restaurant_name", savedName)
            setStatusMessage({
                type: "success",
                text: "Workspace configuration properties updated successfully!"
            })
        } catch (error) {
            console.log("Update failed: ", error)
            setStatusMessage({
                type: "error",
                text: error.response?.data?.message || "Failed to commit configuration mutations"
            })
        } finally {
            setIsUpdating(false)
        }
    }

    const handleDeactivateWorkspace = async () => {
        if (!window.confirm(
            "⚠️ WARNING: This operation is destructive and irreversible. Are you absolutely certain you want to globally deactivate this software node terminal?"
        )) return

        setIsDeactivating(true)

        try {
            await api.patch(`restaurants/${restaurantId}/deactivate`)
            alert("Terminal node successfully deactivated. All system sessions are cleared.")
            setUser(null)
            localStorage.clear()
            navigate("/signup", { replace: true })
        } catch (error) {
            console.error("Deactivation block failed:", error)
            alert(error.response?.data?.message || "Failed to execute deactivation routines.")
        } finally {
            setIsDeactivating(false)
        }
    }

    if (isLoading) {
        return (
            <div className="text-center py-20 text-neutral-500 font-mono text-xs animate-pulse">
                Aggregating Workspace Parameters...
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">

            {/* Title Dashboard Section Header */}
            <div className="border-b border-neutral-800 pb-5">
                <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-emerald-500" />
                    Workspace Configuration Control Desk
                </h2>
                <p className="text-neutral-400 text-sm mt-1">Manage system metadata parameters, telephone channels, and regional settings arrays.</p>
            </div>

            {statusMessage.text && (
                <div className={`p-4 rounded-xl text-xs font-bold text-center border ${
                    statusMessage.type === "success"
                        ? "bg-emerald-950/30 border-emerald-900/40 text-emerald-400"
                        : "bg-red-950/30 border-red-900/40 text-red-400"
                }`}>
                    {statusMessage.text}
                </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-6">

                {/* Module Box 1: Core Business Variables */}
                <div className="bg-neutral-900/40 backdrop-blur-md border border-neutral-800 p-6 rounded-2xl space-y-4">
                    <h3 className="text-sm font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-2">
                        <Building className="w-4 h-4" /> Core Business Variables
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="name" className="text-neutral-400 text-xs font-medium">Business Registered Name</Label>
                            <Input
                                id="name"
                                name="name"
                                className="bg-neutral-950 border-neutral-800 text-white rounded-xl text-sm"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="slug" className="text-neutral-400 text-xs font-medium">System Domain Link Slug</Label>
                            <Input
                                id="slug"
                                className="bg-neutral-950/40 border-neutral-800 text-neutral-500 font-mono text-xs rounded-xl cursor-not-allowed select-none"
                                value={formData.slug}
                                disabled
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="phone" className="text-neutral-400 text-xs font-medium">Communication Phone String</Label>
                            <Input
                                id="phone"
                                name="phone"
                                placeholder="+91 98765 43210"
                                className="bg-neutral-950 border-neutral-800 text-white rounded-xl text-sm"
                                value={formData.phone}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="email" className="text-neutral-400 text-xs font-medium">Support Contact Domain Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="bistro@support.com"
                                className="bg-neutral-950 border-neutral-800 text-white rounded-xl text-sm"
                                value={formData.email}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="description" className="text-neutral-400 text-xs font-medium">Business Tagline Description</Label>
                        <textarea
                            id="description"
                            name="description"
                            className="w-full bg-neutral-950 border border-neutral-800 text-white placeholder:text-neutral-600 rounded-xl text-xs p-3 min-h-20 focus:border-emerald-500 outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                            value={formData.description}
                            onChange={handleInputChange}
                        />
                    </div>
                </div>

                {/* Module Box 2: Regional Coordinates Grid */}
                <div className="bg-neutral-900/40 backdrop-blur-md border border-neutral-800 p-6 rounded-2xl space-y-4">
                    <h3 className="text-sm font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-2">
                        <MapPin className="w-4 h-4" /> Regional Coordinates Grid
                    </h3>

                    <div className="space-y-1.5">
                        <Label htmlFor="street" className="text-neutral-400 text-xs font-medium">Street Axis Line Details</Label>
                        <Input
                            id="street"
                            name="street"
                            className="bg-neutral-950 border-neutral-800 text-white rounded-xl text-sm"
                            value={formData.street}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="city" className="text-neutral-400 text-xs font-medium">City Node</Label>
                            <Input
                                id="city"
                                name="city"
                                className="bg-neutral-950 border-neutral-800 text-white rounded-xl text-sm"
                                value={formData.city}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="state" className="text-neutral-400 text-xs font-medium">State Domain</Label>
                            <Input
                                id="state"
                                name="state"
                                className="bg-neutral-950 border-neutral-800 text-white rounded-xl text-sm"
                                value={formData.state}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="postalCode" className="text-neutral-400 text-xs font-medium">Postal PIN Code</Label>
                            <Input
                                id="postalCode"
                                name="postalCode"
                                className="bg-neutral-950 border-neutral-800 text-white rounded-xl text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 w-full transition-all"
                                value={formData.postalCode}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>
                </div>

                {/* Save Mutation Buttons Action Control */}
                <div className="flex justify-end">
                    <Button
                        type="submit"
                        disabled={isUpdating}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-xl cursor-pointer transition-all inline-flex items-center gap-2 shadow-lg shadow-emerald-950/20 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 active:scale-[0.99] disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        {isUpdating ? "Saving Configurations..." : "Commit Setup Modifications"}
                    </Button>
                </div>
            </form>

            {/* ⚠️ RESTRICTED DANGER SYSTEM ZONE CONTAINER CARD */}
            {user?.role === "OWNER" && (
                <div className="bg-red-950/10 border border-red-900/40 p-6 rounded-2xl space-y-4 animate-scale-in mt-6">
                    <div className="flex items-center gap-2 text-red-400">
                        <AlertTriangle className="w-5 h-5 shrink-0" />
                        <h4 className="text-sm font-bold uppercase tracking-wider">Infrastructure Danger Zone</h4>
                    </div>
                    <p className="text-neutral-400 text-xs leading-relaxed max-w-2xl">
                        Deactivating this restaurant console node will instantly lock access channels, freeze live kitchen ticket feeds, and globally terminate all staff membership connection profiles associated with this branch.
                    </p>
                    <div className="pt-2">
                        <Button
                            onClick={handleDeactivateWorkspace}
                            disabled={isDeactivating}
                            className="bg-red-900/20 border border-red-800/40 hover:bg-red-600 hover:text-white text-red-400 font-bold px-4 py-2 rounded-xl cursor-pointer text-xs inline-flex items-center gap-2 transition-all focus:outline-none focus:ring-1 focus:ring-red-500 disabled:opacity-50"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            {isDeactivating ? "Globally Purging Infrastructure..." : "Globally Deactivate Terminal Node"}
                        </Button>
                    </div>
                </div>
            )}

        </div>
    )
}
