import { useState, useEffect, useCallback } from "react"
import { useParams } from "react-router"
import {
    FolderHeart,
    Plus,
    RefreshCw,
    CheckCircle2,
    ShieldAlert,
    Pencil,
    Trash2,
    RotateCcw,
} from "lucide-react"
import { Button } from "../../../components/ui/button"
import CategoryDialog from "../components/CategoryDialog.jsx"
import { useAuth } from "../../../modules/auth/context/AuthContext"
import { api } from "../../../lib/axios"


export default function CategoriesPage() {
    const { restaurantId } = useParams()
    const { user } = useAuth()

    const [categoriesList, setCategoriesList] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState(null)

    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingCategory, setEditingCategory] = useState(false)
    const [processingId, setProcessingId] = useState(null)

    const isManagementTier = ["OWNER", "MANAGER"].includes(user?.role.toUpperCase())

    const fetchCategoriesCatalog = useCallback(async () => {
        setIsLoading(true)
        setErrorMessage(null)

        try {
            const response = await api.get(`/restaurants/${restaurantId}/menu-categories`)
            const dataPackage = response.data?.data?.categories || response.data?.data || []
            setCategoriesList(dataPackage)
        } catch (error) {
            console.error("[Categories Unboxing Failed]:", error)
            setErrorMessage(
                error.response?.data?.message ||
                "Failed to establish communication pipeline with backend category registries."
            )
        } finally {
            setIsLoading(false)
        }

    }, [restaurantId])

    useEffect(() => {
        if (restaurantId) fetchCategoriesCatalog()
    }, [fetchCategoriesCatalog])


    // HOOK: Soft-delete execution route mapping status dynamically to false
    const handleSoftDeleteCategory = async (categoryId, catName) => {
        if (!window.confirm(`⚠️ WARNING: Soft-deleting Category "${catName}" hides it from active menu filters. Proceed?`)) return
        
        setProcessingId(categoryId)
        try {
            await api.delete(`/restaurants/${restaurantId}/menu-categories/${categoryId}`)
            setCategoriesList(prev => prev.map(
                c => c._id === categoryId ? { ...c, isActive: false } : c
            ))
        } catch (error) {
            alert(error.response?.data?.message || "Failed to soft-deactivate category node.")
        } finally {
            setProcessingId(null)
        }
    }

    const handleToggleCategoryActive = async (categoryId, catName, currentIsActive) => {
        const nextActiveState = !currentIsActive

        if (nextActiveState === false) {
            if (!window.confirm(`⚠️ WARNING: Deactivating Category "${catName}" will hide it from active menu dish layouts. Proceed?`)) return
        }
        setProcessingId(categoryId)
        try {
            await api.patch(`/restaurants/${restaurantId}/menu-categories/${categoryId}`, { 
                isActive: nextActiveState 
            })

            setCategoriesList(prev => prev.map(c => 
                c._id === categoryId ? { ...c, isActive: nextActiveState } : c
            ))

        } catch (error) {
            console.error("[Category Toggle Failed]:", error)
            alert(error.response?.data?.message || "Failed to commit operational status mutation on server layers.")
        } finally {
            setProcessingId(null)
        }
    }

    const handleTriggerEditMode = (category) => {
        setEditingCategory(category)
        setIsDialogOpen(true)
    }

    const activeCategories = categoriesList.filter(c => c.isActive !== false)
    const inactiveCategories = categoriesList.filter(c => c.isActive === false)

    const actionButtonBaseStyle = 
        `flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-neutral-950/40 
        border border-neutral-800 text-neutral-400 text-[11px] font-bold uppercase tracking-wider 
        cursor-pointer outline-none transition-all duration-200`

        
    return (
        <div className="space-y-6 animate-fade-in pb-12 w-full">

            {/* Header Controls Title Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-800 pb-5">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                        <FolderHeart className="w-5 h-5 text-emerald-500" />
                        Menu Categories Desk
                    </h2>
                    <p className="text-neutral-400 text-sm mt-1">
                        Audit active menu division partitions, organize display hierarchies, and deploy structural layers.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button 
                        onClick={fetchCategoriesCatalog} 
                        variant="outline" 
                        className="border-neutral-800 text-neutral-400 hover:text-white bg-neutral-900/50 rounded-xl cursor-pointer"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                    </Button>
                    {isManagementTier && (
                        <Button 
                            onClick={() => { setEditingCategory(null); setIsDialogOpen(true); }} 
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-2 rounded-xl px-4 py-2 cursor-pointer shadow-lg shadow-emerald-950/20 text-xs transition-all active:scale-[0.99]"
                        >
                            <Plus className="w-4 h-4" />Deploy Category
                        </Button>
                    )}
                </div>
            </div>

            {errorMessage && 
                <div className="p-3 bg-red-900/30 border border-red-800 text-red-200 text-sm font-medium rounded-lg text-center">
                    {errorMessage}
                </div>
            }

            {isLoading ? (
                <div className="text-center py-20 text-neutral-500 font-mono text-xs animate-pulse">Aggregating Category Registry Grids...</div>
            ) : categoriesList.length === 0 ? (
                <div className="border border-dashed border-neutral-800 rounded-2xl p-16 text-center space-y-4 max-w-xl mx-auto mt-8 bg-neutral-900/10">
                    <div className="w-12 h-12 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center justify-center mx-auto text-emerald-500">
                        <FolderHeart className="w-5 h-5" />
                    </div>
                    <h4 className="text-white font-bold text-lg">No Categories Deployed</h4>
                    <p className="text-neutral-500 text-sm">Initialize restaurant menu structures using the action control button above.</p>
                </div>
            ) : (
                <div className="space-y-10 w-full">

                    {/* Section A: Live Active Partitions */}
                    <div className="space-y-4 w-full">
                        <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 uppercase tracking-wider px-1">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span>Active Menu Partitions ({activeCategories.length})</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full auto-rows-fr">
                            {activeCategories.map((cat) => {
                                const isProcessing = processingId === cat._id

                                return (
                                    <div 
                                        key={cat._id} 
                                        className={`bg-neutral-900/40 backdrop-blur-md border border-neutral-800/80 p-5 rounded-2xl flex 
                                            flex-col justify-between space-y-5 shadow-xl transition-all duration-300 hover:border-neutral-700 
                                            select-none group ${isProcessing ? "opacity-30 animate-pulse pointer-events-none" : ""}`
                                        }
                                    >

                                        <div className="space-y-2">
                                            <div className="flex justify-between items-start">
                                                <span className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 border bg-neutral-950 border-neutral-800/80 text-emerald-400 rounded-md shadow-sm select-none">RANK #{cat.displayOrder}</span>
                                                <span className="text-[10px] font-medium text-emerald-400 inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Active</span>
                                            </div>

                                            <div className="space-y-1 pt-1">
                                                <h4 className="text-white font-black text-lg tracking-tight group-hover:text-emerald-400 transition-colors uppercase">{cat.name}</h4>
                                                <p className="text-neutral-400 text-xs font-sans line-clamp-2 leading-relaxed min-h-8">{cat.description || "No description provided for this partition segment."}</p>
                                            </div>
                                        </div>

                                        {/* Inline Administrative Actions Dashboard */}
                                        {isManagementTier && (
                                            <div className="flex gap-2 pt-2 border-t border-neutral-800/40 w-full">
                                                <button 
                                                    onClick={() => handleTriggerEditMode(cat)} 
                                                    className={`${actionButtonBaseStyle} hover:text-amber-400 hover:border-amber-900/30 inline-flex items-center justify-center gap-1.5 outline-none focus:outline-none`}
                                                >
                                                    <Pencil className="w-3.5 h-3.5" /> Modify
                                                </button>
                                                <button 
                                                    onClick={() => handleSoftDeleteCategory(cat._id, cat.name)} 
                                                    className={`${actionButtonBaseStyle} hover:text-red-400 hover:border-red-900/30 inline-flex items-center justify-center gap-1.5 outline-none focus:outline-none`}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" /> Deactivate
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Section B: Inactive / Soft-Deleted Storage Rack */}
                    {inactiveCategories.length > 0 && (
                        <div className="space-y-4 pt-6 mt-6 border-t border-neutral-800/60 w-full">
                            <div className="flex items-center gap-2 text-xs font-bold text-neutral-500 uppercase tracking-wider px-1"><ShieldAlert className="w-4 h-4 text-neutral-600" /><span>Soft-Deactivated Inventory Partitions ({inactiveCategories.length})</span></div>

                            <div className="grid grid-cols-1 gap-3 w-full">
                                {inactiveCategories.map((cat) => {
                                    const isProcessing = processingId === cat._id
                                    
                                    return (
                                        <div 
                                            key={cat._id} 
                                            className={`border border-neutral-800/40 bg-neutral-950/20 px-5 py-3.5 rounded-xl 
                                                flex items-center justify-between text-neutral-500 opacity-50 font-mono text-xs 
                                                select-none w-full ${isProcessing ? "opacity-20 animate-pulse pointer-events-none" : ""}`
                                            }
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="w-1.5 h-1.5 rounded-full bg-neutral-600 animate-pulse" />
                                                <span className="font-bold text-neutral-300 uppercase">{cat.name}</span>
                                                <span className="text-neutral-600 text-[11px] font-sans">(Hidden from active dish catalogs)</span>
                                            </div>
                                            {/* <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600">OFFLINE</span> */}

                                            { isManagementTier && (
                                                <button
                                                    onClick={() => handleToggleCategoryActive(cat._id, cat.name, false)}
                                                    className="py-1 px-3 border border-emerald-800/60 hover:border-emerald-500 bg-emerald-950/20 text-emerald-400 hover:text-white rounded-lg font-sans text-[11px] font-bold tracking-tight cursor-pointer transition-colors shadow-sm outline-none focus:outline-none inline-flex items-center gap-1.5 active:scale-[0.98]"
                                                >
                                                    <RotateCcw className="w-3 h-3 text-emerald-400 shrink-0" />
                                                    <span>Restore Category</span>
                                                </button>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                </div>
            )}

            <CategoryDialog 
                isOpen={isDialogOpen} 
                onClose={() => { setIsDialogOpen(false); setEditingCategory(null); }} 
                onRefresh={fetchCategoriesCatalog} 
                editingCategory={editingCategory} 
            />
        </div>
    )
}
