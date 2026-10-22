import { useState, useEffect, useCallback } from "react"
import { useParams } from "react-router"
import {
    Plus,
    UtensilsCrossed,
    RefreshCw,
    Tag,
    Search,
    ChevronLeft,
    ChevronRight,
    X
} from "lucide-react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { api } from "../../../lib/axios"
import AddDishDialog from "../components/AddDishDialog"


export default function MenuPage() {
    const { restaurantId } = useParams()

    const [menuItems, setMenuItems] = useState([])
    const [dbCategories, setDbCategories] = useState([])
    const [pagination, setPagination] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState(null)

    // SEARCH & FILTER STATES (Wired straight to your backend service parameters!)
    const [searchQuery, setSearchQuery] = useState("")
    const [activeCategory, setActiveCategory] = useState("ALL")
    const [currentPage, setCurrentPage] = useState(1)

    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

    const staticCategories = ["ALL", "STARTERS", "MAIN COURSE", "DESSERTS", "BEVERAGES", "FAST FOOD"]

    // HIGH-PERFORMANCE SERVER ACCESS PIPELINE
    const fetchMenuCatalog = useCallback(async () => {
        setIsLoading(true)
        setErrorMessage(null)
        try {
            // URL Query String Mapping: Matches your getRestaurantMenuItemsService structure perfectly!
            let endpointUrl = `/restaurants/${restaurantId}/menu-items?page=${currentPage}&limit=12&isAvailable=true`

            if (activeCategory !== "ALL") {
                endpointUrl += `&category=${encodeURIComponent(activeCategory.toLowerCase())}`
            }
            if (searchQuery.trim() !== "") {
                endpointUrl += `&search=${encodeURIComponent(searchQuery.trim())}`
            }

            const [itemResponse, categoryResponse] = await Promise.all([
                api.get(endpointUrl),
                api.get(`restaurants/${restaurantId}/menu-categories`)
            ])

            // Destructure your explicit service return keys: menuItems and pagination metadata object
            const { menuItems: fetchedItems, meta: metaData } = itemResponse.data?.data || {}
            const parsedCategories = 
                categoryResponse.data?.data?.categories ||
                categoryResponse.data?.data || 
                []

            setMenuItems(fetchedItems || [])
            setPagination(metaData)
            setDbCategories(parsedCategories)
        } catch (error) {
            setErrorMessage(error.response?.data?.message || "Failed to communicate with menu catalog registries.")
        } finally {
            setIsLoading(false)
        }
    }, [restaurantId, currentPage, activeCategory, searchQuery])

    // Automatically re-fetch whenever the user changes page tabs, clicks buttons, or types text queries
    useEffect(() => {
        if (restaurantId) {
            fetchMenuCatalog()
        }
    }, [fetchMenuCatalog])

    const handleCategorySwitch = (category) => {
        setActiveCategory(category)
        setCurrentPage(1)
    }

    return (
        <div className="space-y-6 animate-fade-in">

            {/* Module Title Action Frame Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-800 pb-5">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                        <UtensilsCrossed className="w-5 h-5 text-emerald-500" />
                        Restaurant Menu Catalog
                    </h2>
                    <p className="text-neutral-400 text-sm mt-1">
                        Configure dishes, control categorical layouts, and manage real-time menu card nodes.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        onClick={fetchMenuCatalog}
                        variant="outline"
                        className="border-neutral-800 text-neutral-400 hover:text-white cursor-pointer bg-neutral-900/50"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                    </Button>

                    <Button
                        onClick={() => setIsAddDialogOpen(true)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-2 rounded-xl px-4 py-2 cursor-pointer shadow-lg shadow-emerald-950/20"
                        >
                            <Plus className="w-4 h-4" />
                            Add New Dish
                    </Button>
                </div>
            </div>

            {/* 🔍 SERVER-SIDE SEARCH BAR BAR REGISTRY */}
            <div className="relative max-w-md flex items-center">
                <Search className="absolute left-3 w-4 h-4 text-neutral-500 pointer-events-none" />
                <Input
                    type="text"
                    placeholder="Search recipes, ingredients, or food descriptors..."
                    className="pl-10 pr-10 bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl w-full"
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value)
                        setCurrentPage(1) // Return back to first page index matrix bounds on lookup change
                    }}
                />

                {searchQuery && (
                    <button
                        type="button" // Prevents form submission flags from accidentally firing
                        onClick={() => {
                            setSearchQuery("") // Clears out the search text query state instantly
                            setCurrentPage(1)  // Resets the pagination counter safely back to page 1
                        }}
                        className="absolute right-3 p-1 rounded-md text-neutral-500 hover:text-white hover:bg-neutral-800/60 transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-neutral-700"
                        aria-label="Clear search query"
                        >
                        {/* ⚠️ Make sure to destructure 'X' alongside your other icons at the top of MenuPage.jsx */}
                        <X className="w-3.5 h-3.5 select-none" />
                    </button>
                )}
            </div>

            {/* 🗂️ HORIZONTAL CATEGORY NAVIGATION FILTER TABS MATRIX */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-neutral-800/40">
                {staticCategories.map((category) => (
                    <button
                        key={category}
                        onClick={() => handleCategorySwitch(category)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer border ${activeCategory === category
                                ? "bg-emerald-600/10 border-emerald-500/30 text-emerald-400 shadow-md"
                                : "bg-neutral-900/40 border-neutral-800/80 text-neutral-500 hover:text-neutral-300 hover:border-neutral-700"
                            }`}
                    >
                        {category.toLowerCase()}
                    </button>
                ))}
            </div>

            {/* Exception Alerts Display Guard */}
            {errorMessage && (
                <div className="p-3 bg-red-900/30 border border-red-800 text-red-200 text-sm font-medium rounded-lg text-center">
                    {errorMessage}
                </div>
            )}

            {/* INTERACTIVE CARDS CONTAINER GRIDS VIEWPORT */}
            {isLoading ? (
                <div className="text-center py-20 text-neutral-500 font-medium animate-pulse text-sm">
                    Loading Restaurant Menu Parameters...
                </div>
            ) : menuItems.length === 0 ? (
                <div className="border border-dashed border-neutral-800 rounded-2xl p-16 text-center space-y-4 max-w-xl mx-auto mt-8 bg-neutral-900/10">
                    <div className="w-12 h-12 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center justify-center mx-auto">
                        <Tag className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                        <h4 className="text-white font-bold text-lg">No Matching Dishes Located</h4>
                        <p className="text-neutral-500 text-sm mt-1">
                            Your server catalog search parameters returned zero matching results from MongoDB.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {menuItems.map((dish) => (
                            <div
                                key={dish._id || dish.id}
                                className="bg-neutral-900/60 backdrop-blur-md border border-neutral-800 rounded-2xl p-5 shadow-xl transition-all duration-300 hover:border-neutral-700/60 hover:-translate-y-0.5 group flex flex-col justify-between"
                            >
                                <div className="space-y-3">
                                    <div className="flex justify-between items-start gap-4">
                                        <span className="text-[10px] font-mono font-bold text-emerald-500 uppercase tracking-wider px-2 py-0.5 bg-emerald-950/30 border border-emerald-900/40 rounded-md">
                                            {dish.category?.name || "Uncategorized"}
                                        </span>
                                        <span className="text-white font-black text-xl font-mono shrink-0">
                                            ₹{dish.price}
                                        </span>
                                    </div>

                                    <div>
                                        <h4 className="text-white font-bold text-lg group-hover:text-emerald-400 transition-colors">
                                            {dish.name}
                                        </h4>
                                        <p className="text-neutral-400 text-xs mt-1.5 line-clamp-3 leading-relaxed">
                                            {dish.description || "No recipe documentation parameters declared yet."}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 pt-3 border-t border-neutral-800/40 flex items-center justify-between text-[11px]">
                                    <span className="text-neutral-500">Inventory Status</span>
                                    <span className={`font-semibold ${dish.isAvailable ? "text-emerald-400" : "text-amber-500"}`}>
                                        {dish.isAvailable ? "● Live In Kitchen" : "○ Sold Out"}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* SERVER PAGINATION CONTROLLER PANEL DESK (Only displays if multiple pages are required) */}
                    {pagination && pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between border-t border-neutral-800 pt-4 px-2 text-neutral-400 text-sm">
                            <span className="text-xs">
                                Showing page <strong className="text-white font-mono">{pagination.page}</strong> of <strong className="text-white font-mono">{pagination.totalPages}</strong> ({pagination.totalItems} elements overall)
                            </span>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!pagination.hasPrevPage || isLoading}
                                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                    className="border-neutral-800 text-neutral-400 hover:text-white disabled:opacity-30 cursor-pointer bg-neutral-900/40 px-3 py-1 text-xs flex items-center gap-1 rounded-lg"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" /> Prev
                                </Button>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!pagination.hasNextPage || isLoading}
                                    onClick={() => setCurrentPage((p) => Math.min(p + 1, pagination.totalPages))}
                                    className="border-neutral-800 text-neutral-400 hover:text-white disabled:opacity-30 cursor-pointer bg-neutral-900/40 px-3 py-1 text-xs flex items-center gap-1 rounded-lg"
                                >
                                    Next <ChevronRight className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <AddDishDialog 
                isOpen={isAddDialogOpen}
                onClose={() => setIsAddDialogOpen(false)}
                onRefreshCatalog={fetchMenuCatalog}
                categories={dbCategories}
            />
        </div>
    )
}
