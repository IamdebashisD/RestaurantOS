import { useState, useEffect } from "react";
import { useParams } from "react-router";
import { X, Store, IndianRupee, Layers, FileText, ArrowRight } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { api } from "../../../lib/axios"


export default function AddDishDialog({ isOpen, onClose, onRefreshCatalog, categories = [], editingDish = null }) {
    const { restaurantId } = useParams()

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        price: "",
        category: "",
        isAvailable: true
    })
    const [isLoading, setIsLoading] = useState()
    const [errorMessage, setErrorMessage] = useState()

    const isEditMode = !!editingDish
    // Pre-fill form when editing an existing dish, or reset when creating a new one
    useEffect(() => {
        if (isOpen) {
            if (editingDish) {
                const resolvedCategoryId = typeof editingDish.category === "object" 
                    ? editingDish.category?._id 
                    : editingDish.category || ""

                setFormData({
                    name: editingDish.name || "",
                    description: editingDish.description || "",
                    price: editingDish.price ?? "",
                    category: resolvedCategoryId,
                    isAvailable: editingDish.isAvailable ?? true
                })
            } else {
                setFormData({
                    name: "",
                    description: "",
                    price: "",
                    category: "",
                    isAvailable: true
                })
            }
            setErrorMessage(null)
        }
    }, [isOpen, editingDish])

    if (!isOpen) return null

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleFormSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setErrorMessage(null)

        const menuCreationPayload = {
            name: formData.name.trim(),
            description: formData.description.trim(),
            price: parseFloat(formData.price),
            category: formData.category,
            isAvailable: formData.isAvailable
        }

        try {
            if (isEditMode) {
                const dishId = editingDish._id || editingDish.id
                await api.patch(`/restaurants/${restaurantId}/menu-items/${dishId}`, menuCreationPayload)
            } else {
                await api.post(`/restaurants/${restaurantId}/menu-items`, menuCreationPayload)
            }
            
            onRefreshCatalog()
            onClose()
        } catch (error) {
            console.error("[Menu Item Update Failure]:", error.response?.status, error.response?.data || error)
            setErrorMessage(
                error.response?.data?.message ||
                (isEditMode 
                    ? "Failed to update menu item record in backend registries." 
                    : "Failed to provision new recipe listing record in backend registries."
                )
            )
        } finally {
            setIsLoading(false)
        }
    }


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop Ambient Blur Vignette Mask */}
            <div
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            />

            {/* Primary Card Frame Core Container */}
            <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 p-6 rounded-2xl shadow-2xl z-10 animate-scale-in max-h-[90vh] overflow-y-auto scrollbar-none">

                {/* Absolute Upper Dismiss Button */}
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 p-1 rounded-md text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                    <X className="w-4 h-4" />
                </button>

                {/* Dialog Header Branding */}
                <div className="mb-6">
                    <h3 className="text-xl font-black text-white tracking-tight">
                        {isEditMode ? "Edit Recipe Node" : "Create Recipe Node"}
                    </h3>
                    <p className="text-neutral-400 text-xs mt-1">
                        {isEditMode 
                           ? "Update pricing, category mapping, description, or live kitchen availability."
                           : "Deploy a new culinary item listing directly into your kitchen console registries."}
                    </p>
                </div>

                {/* ⚠️ Exception Alerts Guard Banner */}
                {errorMessage && (
                    <div className="mb-4 p-3 bg-red-900/30 border border-red-800 text-red-200 text-xs font-medium rounded-lg text-center">
                        {errorMessage}
                    </div>
                )}

                <form onSubmit={handleFormSubmit} className="space-y-4">

                    {/* Dish Title Field */}
                    <div className="space-y-1.5">
                        <Label htmlFor="name" className="text-neutral-300 font-medium text-xs">Dish Listing Title</Label>
                        <div className="relative flex items-center">
                            <Store className="absolute left-3 w-4 h-4 text-neutral-500 pointer-events-none" />
                            <Input
                                id="name"
                                name="name"
                                type="text"
                                required
                                placeholder="Tandoori Smoked Salmon"
                                className="pl-10 bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-sm w-full transition-all"
                                value={formData.name}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>

                    {/* Price Input Field */}
                    <div className="space-y-1.5">
                        <Label htmlFor="price" className="text-neutral-300 font-medium text-xs">Menu Base Price (INR)</Label>
                        <div className="relative flex items-center">
                            <IndianRupee className="absolute left-3 w-4 h-4 text-neutral-500 pointer-events-none" />
                            <Input
                                id="price"
                                name="price"
                                type="number"
                                min="0"
                                step="0.01"
                                required
                                placeholder="499"
                                className="pl-10 bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-sm w-full transition-all font-mono"
                                value={formData.price}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>

                    {/* Categorical Option Selector Link Dropdown Grid */}
                    <div className="space-y-1.5">
                        <Label htmlFor="category" className="text-neutral-300 font-medium text-xs">Categorical Division Mapping</Label>
                        <div className="relative flex items-center">
                            <Layers className="absolute left-3 w-4 h-4 text-neutral-500 pointer-events-none" />
                            <select
                                id="category"
                                name="category"
                                required
                                className="pl-10 pr-4 py-2 bg-neutral-950 border border-neutral-800 text-neutral-300 focus:border-emerald-500 rounded-xl text-sm w-full transition-all appearance-none outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer h-10"
                                value={formData.category}
                                onChange={handleInputChange}
                            >
                                <option value="" disabled>Select a workspace module partition</option>
                                {/* Dynamically filters out the ALL tab option so it prints clean available collection links */}
                                {categories.map((cat) => (
                                    <option key={cat._id} value={cat._id}>
                                        {cat.name.toUpperCase()}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Recipe Description Textarea Box */}
                    <div className="space-y-1.5">
                        <Label htmlFor="description" className="text-neutral-300 font-medium text-xs">Recipe Descriptor / Culinary Details</Label>
                        <div className="relative flex items-center">
                            <FileText className="absolute left-3 top-3 w-4 h-4 text-neutral-500 pointer-events-none" />
                            <textarea
                                id="description"
                                name="description"
                                maxLength={1000}
                                placeholder="Detail key ingredient properties, allergen info, preparation tag lines..."
                                className="pl-10 pr-4 pt-2 min-h-20 bg-neutral-950 border border-neutral-800 text-white placeholder:text-neutral-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-xs w-full transition-all outline-none"
                                value={formData.description}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>

                    {/* System Availability Toggle Slide Switch */}
                    <div className="flex items-center justify-between p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-xs">
                        <div className="space-y-0.5">
                            <span className="font-semibold text-white block">Active Inventory Deployment</span>
                            <span className="text-neutral-500 text-[10px]">Instantly publish this dish as orderable on terminal nodes.</span>
                        </div>
                        <input
                            type="checkbox"
                            id="isAvailable"
                            name="isAvailable"
                            className="accent-emerald-500 w-4 h-4 rounded border-neutral-800 bg-neutral-950 cursor-pointer"
                            checked={formData.isAvailable}
                            onChange={(e) => setFormData(prev => ({ ...prev, isAvailable: e.target.checked }))}
                        />
                    </div>

                    {/* Primary Execution Submission Controls Trigger Button */}
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl cursor-pointer transition-all active:scale-[0.99] disabled:opacity-50 mt-2 shadow-lg shadow-emerald-950/20 inline-flex items-center justify-center gap-2 text-sm"
                    >
                        {isLoading ? 
                            isEditMode 
                                ? "Updating Recipe Node..." : "Provisioning Recipe Node..." 
                            : isEditMode 
                                ? "Save Dish Changes" : "Commit Dish Listing"}
                        {!isLoading && <ArrowRight className="w-4 h-4" />}
                    </Button>

                </form>
            </div>
        </div>
    )
}