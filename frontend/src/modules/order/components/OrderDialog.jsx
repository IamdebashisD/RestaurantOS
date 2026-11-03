import { useState, useEffect } from "react"
import { useParams } from "react-router"
import { X, Armchair, Plus, Trash2, FileText, ArrowRight } from "lucide-react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { api } from "../../../lib/axios"


export default function OrderDialog({ isOpen, onClose, onRefresh, activeTables = [], editingOrder = null }) {
    const { restaurantId } = useParams()

    const [menuItems, setMenuItems] = useState([])
    const [selectedTable, setSelectedTable] = useState("")
    const [basket, setBasket] = useState([])
    const [notes, setNotes] = useState("")

    const [isLoading, setIsLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState(null)

    const isEditMode = !!editingOrder 

    // Load Menu Item to selection dropdown
    useEffect(() => {
        if (isOpen && restaurantId) {
            api.get(`/restaurants/${restaurantId}/menu-items?limit=1000`)
                .then(res => setMenuItems(res.data?.data?.menuItems || res?.data?.data || []))
                .catch(err => console.error("Failed loading catalog items for basket:", err))
        }

        if (isOpen && isEditMode && editingOrder) {
            setSelectedTable(editingOrder.table || "")
            setNotes(editingOrder.notes || "")
            setBasket(editingOrder.items?.map(item => ({
                menuItem: item.menuItem,
                quantity: item.quantity
            })) || [])
        } else if (!isOpen) {
            setSelectedTable("")
            setBasket([])
            setNotes("")
            setErrorMessage(null)
        }
    }, [isOpen, restaurantId, editingOrder, isEditMode])

    if (!isOpen) return null

    const handleAddBasketRow = () => {
        setBasket(prev => [...prev, { menuItem: "", quantity: 1 }])
    }

    const handleRemoveBasketRow = (index) => {
        setBasket(prev => prev.filter((_, i) => i !== index))
    }

    const handleBasketChange = (index, field, value) => {
        setBasket(prev => prev.map((item, i) => {
            if (i !== index) return item
            return {
                ...item,
                [field]: field === "quantity" ? parseInt(value, 10) || 1 : value
            }
        }))
    }

    const handleFormSubmit = async (e) => {
        e.preventDefault()

        const cleanBasket = basket.filter(item => item.menuItem && item.menuItem.trim() !== "")
        if (cleanBasket.length === 0) {
            setErrorMessage("Order must contain at least one menu item.")
            return
        }

        setIsLoading(true)
        setErrorMessage(null)

        // EXACT DTO PAYLOAD ALIGNMENT: Strict keys only, no customer/prices to bypass .strict()
        const payload = {
            table: selectedTable,
            items: basket.map(item => ({
                menuItem: item.menuItem,
                quantity: item.quantity
            })),
            notes: notes.trim() || undefined
        }

        try {
            if (isEditMode) {
                await api.patch(`/restaurants/${restaurantId}/orders/${editingOrder._id}`, payload)
            } else {
                await api.post(`/restaurants/${restaurantId}/orders`, payload)
            }
            onRefresh()
            onClose()
        } catch (error) {
            console.error("[Order Creation Failure]:", error)
            setErrorMessage(error.response?.data?.message || "Failed to submit live order ticket.")
        } finally {
            setIsLoading(false)
        }

    }


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />

            <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 p-6 rounded-2xl shadow-2xl z-10 animate-scale-in max-h-[90vh] overflow-y-auto scrollbar-none">
                <button onClick={onClose} className="absolute right-4 top-4 p-1 rounded-md text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer">
                    <X className="w-4 h-4" />
                </button>

                <div className="mb-6">
                    <h3 className="text-xl font-black text-white tracking-tight">Deploy New Order Ticket</h3>
                    <p className="text-neutral-400 text-xs mt-1">Select table destination, add dishes, and pass instructions directly to cooking bays.</p>
                </div>

                {errorMessage && <div className="mb-4 p-3 bg-red-900/30 border border-red-800 text-red-200 text-xs font-medium rounded-lg text-center">{errorMessage}</div>}

                <form onSubmit={handleFormSubmit} className="space-y-5">

                    {/* Table Selector Dropdown */}
                    <div className="space-y-1.5">
                        <Label htmlFor="table" className="text-neutral-300 font-medium text-xs">Origin Table Assignment</Label>
                        <div className="relative flex items-center">
                            <Armchair className="absolute left-3 w-4 h-4 text-neutral-500 pointer-events-none" />
                            <select 
                                id="table" 
                                value={selectedTable} 
                                onChange={(e) => setSelectedTable(e.target.value)} 
                                required 
                                className="pl-10 pr-4 py-2 bg-neutral-950 border border-neutral-800 text-neutral-300 focus:border-emerald-500 rounded-xl text-sm w-full appearance-none outline-none h-10 cursor-pointer"
                            >
                                <option value="" disabled>Select station destination</option>
                                {activeTables.map((t) => (
                                    <option 
                                        key={t._id} 
                                        value={t._id}
                                    >
                                        Table {t.tableNumber} (Capacity: {t.capacity} Pax)
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Dynamic Order Basket Layout */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center px-0.5">
                            <Label className="text-neutral-300 font-medium text-xs">Dish Item Inclusions</Label>
                            <button 
                                type="button" 
                                onClick={handleAddBasketRow} 
                                className="text-[10px] font-mono font-black text-emerald-400 bg-neutral-950 border border-neutral-800 px-2 py-1 rounded-md uppercase hover:bg-neutral-900 cursor-pointer"
                            >
                                + Add Dish
                            </button>
                        </div>

                        <div className="space-y-2 max-h-55 overflow-y-auto pr-1 scrollbar-none">
                            {basket.map((item, idx) => (
                                <div key={idx} className="flex gap-2 items-center w-full animate-scale-in">
                                    <select 
                                        value={item.menuItem} 
                                        onChange={(e) => handleBasketChange(idx, "menuItem", e.target.value)} 
                                        required 
                                        className="flex-1 px-3 py-2 bg-neutral-950 border border-neutral-800 text-neutral-300 rounded-xl text-xs h-10 outline-none cursor-pointer"
                                    >
                                        <option value="" disabled>Select food item</option>
                                        {menuItems.filter(m => m.isAvailable).map(m => (
                                            <option key={m._id} value={m._id}>{m.name} (₹{m.price})</option>
                                        ))}
                                    </select>

                                    <Input 
                                        type="number" 
                                        min="1" 
                                        placeholder="Qty" 
                                        required value={item.quantity} 
                                        onChange={(e) => handleBasketChange(idx, "quantity", e.target.value)} 
                                        className="w-16 bg-neutral-950 border-neutral-800 text-white rounded-xl text-center h-10 font-mono" 
                                    />

                                    <button 
                                        type="button" 
                                        onClick={() => handleRemoveBasketRow(idx)} 
                                        className="p-2.5 rounded-xl border border-neutral-800/80 text-neutral-500 hover:text-red-400 bg-neutral-950/20 cursor-pointer"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {basket.length === 0 && (
                                <div className="text-center py-6 border border-dashed border-neutral-800 rounded-xl font-mono text-[11px] text-neutral-600 bg-neutral-950/10">
                                    Basket empty. Click '+ Add Dish' to begin.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Notes Input Field */}
                    <div className="space-y-1.5">
                        <Label htmlFor="notes" className="text-neutral-300 font-medium text-xs">Special Preparation Notes (Optional)</Label>
                        <div className="relative flex items-center">
                            <FileText className="absolute left-3 w-4 h-4 text-neutral-500 pointer-events-none" />
                            <Input 
                                id="notes" 
                                name="notes" 
                                type="text" 
                                maxLength={500} 
                                placeholder="e.g., Less spicy, no onions, extra mayo" 
                                className="pl-10 bg-neutral-950 border-neutral-800 text-white rounded-xl text-sm w-full focus:border-emerald-500" 
                                value={notes} 
                                onChange={(e) => setNotes(e.target.value)} 
                            />
                        </div>
                    </div>

                    <Button 
                        type="submit" 
                        disabled={isLoading} 
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl cursor-pointer mt-2 shadow-lg inline-flex items-center justify-center gap-2 text-sm focus:outline-none transition-all active:scale-[0.99] disabled:opacity-50"
                    >
                        {isLoading ? "Firing Ticket..." : "Fire Ticket to Kitchen"}
                        {!isLoading && <ArrowRight className="w-4 h-4" />}
                    </Button>
                </form>
            </div>
        </div>
    )
}

