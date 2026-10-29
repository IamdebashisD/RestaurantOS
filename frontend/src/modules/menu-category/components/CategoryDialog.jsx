import { useState, useEffect } from "react"
import { useParams } from "react-router"
import { X, FolderHeart, FileText, ArrowUpDown, ArrowRight } from "lucide-react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { api } from "../../../lib/axios"


export default function CategoryDialog({ isOpen, onClose, onRefresh, editingCategory = null }) {
    const { restaurantId } = useParams()
    const [formData, setFormData] = useState({ name: "", description: "", displayOrder: "0" })
    const [isLoading, setIsLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState(null)

    const isEditMode = !!editingCategory

    useEffect(() => {
        if (isEditMode && editingCategory) {
            setFormData({
                name: editingCategory.name || "",
                description: editingCategory.description || "",
                displayOrder: String(editingCategory.displayOrder || 0)
            })
        } else {
            setFormData({ name: "", description: "", displayOrder: "0" })
        }

        setErrorMessage(null)
    }, [isOpen, editingCategory, isEditMode])

    if (!isOpen) return null

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleFormSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setErrorMessage(null)

        const payload = {
            name: formData.name.trim(),
            description: formData.description.trim(),
            displayOrder: parseInt(formData.displayOrder, 10)
        }

        try {
            if (isEditMode) {
                await api.patch(`/restaurants/${restaurantId}/menu-categories/${editingCategory._id}`, payload)
            } else {
                await api.post(`/restaurants/${restaurantId}/menu-categories`, payload)
            }
            onRefresh()
            onClose()
        } catch (error) {
            console.error("[Category Save Failed]:", error)
            setErrorMessage(
                error.response?.data?.message ||
                "Failed to commit category schema properties to backend database registries."
            )
        } finally {
            setIsLoading(false)
        }

    }


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />

            <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 p-6 rounded-2xl shadow-2xl z-10 animate-scale-in">
                <button onClick={onClose} className="absolute right-4 top-4 p-1 rounded-md text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer">
                    <X className="w-4 h-4" />
                </button>

                <div className="mb-6">
                    <h3 className="text-xl font-black text-white tracking-tight">{isEditMode ? "Modify Category Partition" : "Deploy Menu Category"}</h3>
                    <p className="text-neutral-400 text-xs mt-1">Configure structural partition fields to index your restaurant menu collections.</p>
                </div>

                {errorMessage && 
                    <div className="mb-4 p-3 bg-red-900/30 border border-red-800 text-red-200 text-xs font-medium rounded-lg text-center">
                        {errorMessage}
                    </div>
                }

                <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="name" className="text-neutral-300 font-medium text-xs">Category Partition Name</Label>
                        <div className="relative flex items-center">
                            <FolderHeart className="absolute left-3 w-4 h-4 text-neutral-500 pointer-events-none" />
                            <Input 
                                id="name" 
                                name="name" 
                                type="text" 
                                required 
                                minLength={2} 
                                maxLength={100} 
                                placeholder="e.g., STARTERS, BEVERAGES" 
                                className="pl-10 bg-neutral-950 border-neutral-800 text-white rounded-xl text-sm w-full focus:border-emerald-500" 
                                value={formData.name} onChange={handleInputChange} 
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="description" className="text-neutral-300 font-medium text-xs">Description Summary (Optional)</Label>
                        <div className="relative flex items-center">
                            <FileText className="absolute left-3 top-3 w-4 h-4 text-neutral-500 pointer-events-none" />
                            <textarea 
                                id="description" 
                                name="description" 
                                maxLength={500} 
                                placeholder="Describe types of dishes in this section..." 
                                className="pl-10 pr-4 py-2.5 bg-neutral-950 border border-neutral-800 text-white placeholder:text-neutral-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-sm w-full transition-all outline-none min-h-20" 
                                value={formData.description} 
                                onChange={handleInputChange} 
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="displayOrder" className="text-neutral-300 font-medium text-xs">Sort Display Order Rank Index</Label>
                        <div className="relative flex items-center">
                            <ArrowUpDown className="absolute left-3 w-4 h-4 text-neutral-500 pointer-events-none" />
                            <Input 
                                id="displayOrder" 
                                name="displayOrder" 
                                type="number"
                                min="0" 
                                required 
                                placeholder="0" 
                                className="pl-10 bg-neutral-950 border-neutral-800 text-white rounded-xl text-sm w-full font-mono focus:border-emerald-500" 
                                value={formData.displayOrder} 
                                onChange={handleInputChange} 
                            />
                        </div>
                    </div>

                    <Button 
                        type="submit" 
                        disabled={isLoading} 
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl cursor-pointer mt-2 shadow-lg inline-flex items-center justify-center gap-2 text-sm focus:outline-none transition-all active:scale-[0.99] disabled:opacity-50"
                    >
                        {isLoading ? "Synchronizing Formulas..." : isEditMode ? "Commit Layout Updates" : "Deploy Menu Category"}
                        {!isLoading && <ArrowRight className="w-4 h-4" />}
                    </Button>
                </form>
            </div>
        </div>
    )
}
