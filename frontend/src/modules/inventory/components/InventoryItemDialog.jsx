import { useState, useEffect } from "react"
import { X, Package, Scale, AlertTriangle, IndianRupee, ArrowRight } from "lucide-react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { api } from "../../../lib/axios"


const UNIT_OPTIONS = ["KG", "G", "L", "ML", "PSC"]

export default function InventoryItemDialog({
    isOpen,
    onClose,
    onRefresh,
    restaurantId,
    editingItem = null    
}) {
    const [name, setName] = useState("")
    const [unit, setUnit] = useState("KG")
    const [minimumQuantity, setMinimumQuantity] = useState(0)
    const [costPerUnit, setCostPerUnit] = useState(0)
    const [status, setStatus] = useState("ACTIVE")

    const [isLoading, setIsLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState(null)

    const isEditMode = !!editingItem


    useEffect(() => {
        if (isOpen) {
            if (editingItem) {
                setName(editingItem.name || "")
                setUnit(editingItem.unit || "KG")
                setMinimumQuantity(editingItem.minimumQuantity ?? 0)
                setCostPerUnit(editingItem.costPerUnit ?? 0)
                setStatus(editingItem.status || "ACTIVE")
            } else {
                setName("")
                setUnit("KG")
                setMinimumQuantity(0)
                setCostPerUnit(0)
                setStatus("ACTIVE")
            }

            setErrorMessage(null)

        }
    }, [isOpen, editingItem])

    if (!isOpen) return null

    const handleFormSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setErrorMessage(null)

        try {
            if (isEditMode) {
                // Strict updateInventoryDto alignment (unit cannot be changed once created)
                const payload = {
                    name: name.trim(),
                    minimumQuantity: Number(minimumQuantity) || 0,
                    costPerUnit: Number(costPerUnit) || 0,
                    status
                }
                await api.post(`/restaurants/${restaurantId}/inventory/${editingItem._id}`, payload)
            } else {
                const payload = {
                    name: name.trim(),
                    unit,
                    minimumQuantity: Number(minimumQuantity) || 0,
                    costPerUnit: Number(costPerUnit) || 0
                }
                await api.post(`/restaurants/${restaurantId}/inventory`, payload)
            }

            onRefresh()
            onClose()
        } catch (error) {
            console.error("[Inventory Item Save Failure]:", error)
            setErrorMessage(
                error.response?.data?.message ||
                "Failed to save inventory item record."
            )
        } finally {
            setIsLoading(false)
        }
    }


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            />

            <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 p-6 rounded-2xl shadow-2xl z-10 animate-scale-in">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 p-1 rounded-md text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                    <X className="w-4 h-4" />
                </button>

                <div className="mb-5">
                    <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                        <Package className="w-5 h-5 text-emerald-500" />
                        {isEditMode ? "Edit Inventory Asset" : "Register Inventory Asset"}
                    </h3>
                    <p className="text-neutral-400 text-xs mt-1">
                        {isEditMode
                            ? "Update safety thresholds, unit cost valuation, or active status."
                            : "New items initialize at 0 stock. Use Stock-In after creation to log opening batches."}
                    </p>
                </div>

                {errorMessage && (
                    <div className="mb-4 p-3 bg-red-900/30 border border-red-800 text-red-200 text-xs font-medium rounded-lg text-center">
                        {errorMessage}
                    </div>
                )}

                <form onSubmit={handleFormSubmit} className="space-y-4">
                    {/* Item Name */}
                    <div className="space-y-1.5">
                        <Label htmlFor="inv-name" className="text-neutral-300 font-medium text-xs">
                            Ingredient / Supply Name
                        </Label>
                        <div className="relative flex items-center">
                            <Package className="absolute left-3 w-4 h-4 text-neutral-500 pointer-events-none" />
                            <Input
                                id="inv-name"
                                type="text"
                                required
                                minLength={2}
                                maxLength={150}
                                placeholder="e.g., Basmati Rice, Paneer, Olive Oil"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="pl-10 bg-neutral-950 border-neutral-800 text-white rounded-xl text-sm focus:border-emerald-500"
                            />
                        </div>
                    </div>

                    {/* Measurement Unit Selector (Locked in Edit Mode per backend DTO) */}
                    <div className="space-y-1.5">
                        <Label className="text-neutral-300 font-medium text-xs flex items-center gap-1.5">
                            <Scale className="w-3.5 h-3.5 text-neutral-500" />
                            Measurement Unit {isEditMode && <span className="text-neutral-500">(Locked)</span>}
                        </Label>
                        <div className="grid grid-cols-5 gap-2">
                            {UNIT_OPTIONS.map((u) => {
                                const isSelected = unit === u
                                return (
                                    <button
                                        key={u}
                                        type="button"
                                        disabled={isEditMode}
                                        onClick={() => setUnit(u)}
                                        className={`py-2 rounded-xl border text-xs font-mono font-bold transition-all select-none ${
                                            isSelected
                                                ? "bg-emerald-600/15 border-emerald-500 text-emerald-400"
                                                : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                                        } ${isEditMode ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                                    >
                                        {u}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Minimum Alert Quantity */}
                    <div className="space-y-1.5">
                        <Label htmlFor="inv-min" className="text-neutral-300 font-medium text-xs">
                            Low-Stock Alert Threshold ({unit})
                        </Label>
                        <div className="relative flex items-center">
                            <AlertTriangle className="absolute left-3 w-4 h-4 text-neutral-500 pointer-events-none" />
                            <Input
                                id="inv-min"
                                type="number"
                                min="0"
                                step="any"
                                required
                                value={minimumQuantity}
                                onChange={(e) => setMinimumQuantity(e.target.value)}
                                className="pl-10 bg-neutral-950 border-neutral-800 text-white rounded-xl text-sm font-mono focus:border-emerald-500"
                            />
                        </div>
                    </div>

                    {/* Cost Per Unit */}
                    <div className="space-y-1.5">
                        <Label htmlFor="inv-cost" className="text-neutral-300 font-medium text-xs">
                            Baseline Cost Per {unit} (₹)
                        </Label>
                        <div className="relative flex items-center">
                            <IndianRupee className="absolute left-3 w-4 h-4 text-neutral-500 pointer-events-none" />
                            <Input
                                id="inv-cost"
                                type="number"
                                min="0"
                                step="any"
                                required
                                value={costPerUnit}
                                onChange={(e) => setCostPerUnit(e.target.value)}
                                className="pl-10 bg-neutral-950 border-neutral-800 text-white rounded-xl text-sm font-mono focus:border-emerald-500"
                            />
                        </div>
                    </div>

                    {/* Status Toggle (Edit Mode Only) */}
                    {isEditMode && (
                        <div className="space-y-1.5">
                            <Label className="text-neutral-300 font-medium text-xs">
                                Operational Status
                            </Label>
                            <div className="grid grid-cols-2 gap-2">
                                {["ACTIVE", "INACTIVE"].map((st) => (
                                    <button
                                        key={st}
                                        type="button"
                                        onClick={() => setStatus(st)}
                                        className={`py-2 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                                            status === st
                                                ? st === "ACTIVE"
                                                    ? "bg-emerald-600/15 border-emerald-500 text-emerald-400"
                                                    : "bg-red-600/15 border-red-500 text-red-400"
                                                : "bg-neutral-950 border-neutral-800 text-neutral-400"
                                        }`}
                                    >
                                        {st}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl cursor-pointer mt-2 shadow-lg inline-flex items-center justify-center gap-2 text-sm transition-all active:scale-[0.99]"
                    >
                        {isLoading
                            ? "Saving Asset..."
                            : isEditMode
                            ? "Update Inventory Asset"
                            : "Create Inventory Asset"}
                        {!isLoading && <ArrowRight className="w-4 h-4" />}
                    </Button>
                </form>
            </div>
        </div>
    )
}

