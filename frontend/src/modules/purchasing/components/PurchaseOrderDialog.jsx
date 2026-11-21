import { useState, useEffect } from "react"
import {
    X,
    ShoppingBag,
    Truck,
    Plus,
    Trash2,
    Calendar,
    FileText,
    IndianRupee,
    ArrowRight
} from "lucide-react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { api } from "../../../lib/axios"


export default function PurchaseOrderDialog({
    isOpen,
    onClose,
    onRefresh,
    restaurantId,
    suppliers = [],
    inventoryItems = [],
    editingOrder = null
}) {

    const [supplierId, setSupplierId] = useState("")
    const [items, setItems] = useState([
        { inventoryId: "", quantity: 1, costPerUnit: 0 }
    ])

    const [tax, setTax] = useState(0)
    const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("")
    const [notes, setNotes] = useState("")

    const [isLoading, setIsLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState(null)

    const isEditMode = !!editingOrder

    const activeSuppliers = suppliers.filter(s => s.status === "ACTIVE")
    const activeInventory = inventoryItems.filter(i => i.status === "ACTIVE")


    useEffect(() => {
        if (isOpen) {
            if (editingOrder) {
                const resolvedSupplierId = typeof editingOrder.supplier === "object" 
                    ? editingOrder.supplier?._id : editingOrder.supplier || ""
                
                setSupplierId(resolvedSupplierId)

                const mappedItems = (editingOrder.items || []).map(it => ({
                    inventoryId: typeof it.inventory === "object" ? it.inventory?._id : it.inventory || "",
                    quantity: it.quantity ?? 1,
                    costPerUnit: it.costPerUnit ?? 0
                }))
                setItems(
                    mappedItems.length > 0 ? mappedItems : [{ inventoryId: "", quantity: 1, costPerUnit: 0 }]
                )
                setTax(editingOrder.tax ?? 0)
                setExpectedDeliveryDate(
                    editingOrder.expectedDeliveryDate
                        ? new Date(editingOrder.expectedDeliveryDate).toISOString().split("T")[0]
                        : ""
                )
                setNotes(editingOrder.notes ?? "")
            } else {
                setSupplierId(activeSuppliers[0]?._id || "")
                setItems([
                    {
                        inventoryId: activeInventory[0]?._id || "",
                        quantity: 1,
                        costPerUnit: activeInventory[0]?.costPerUnit ?? 0
                    }
                ])

                setTax(0)
                setExpectedDeliveryDate("")
                setNotes("")
            }
            setErrorMessage(null)
        }
    }, [isOpen, editingOrder])

    if (!isOpen) return null


    const handleItemChange = (index, field, value) => {
        setItems(prev => 
            prev.map((row, idx) => {
                if (idx !== index) return row
                if (field === "inventoryId") {
                    const matched = activeInventory.find(inv => inv._id === value)
                    return {
                        ...row,
                        inventoryId: value,
                        costPerUnit: matched ? matched.costPerUnit : row.costPerUnit
                    }
                }
                return { ...row, [field]: value }
            })
        )
    }

    const handleAddRow = () => {
        setItems(prev => [
            ...prev,
            { inventoryId: "", quantity: 1, costPerUnit: 0 }
        ])
    }

    const handleRemoveRow = (index) => {
        if (items.length <= 1) return
        setItems(prev => prev.filter((_, idx) => idx !== index))
    }

    // Live Financial Preview
    const calculatedSubtotal = items.reduce(
        (sum, row) => sum + Number((row.quantity) || 0) * Number((row.costPerUnit) || 0),
        0
    )

    const roundedSubtotal = Math.round(calculatedSubtotal * 100) / 100
    const numericTax = Number(tax) || 0
    const calculatedTotal = Math.round((roundedSubtotal + numericTax) * 100) / 100

    const handleFormSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setErrorMessage(null)

        if (!supplierId) {
            setErrorMessage("Please select an active supplier.")
            setIsLoading(false)
            return
        }

        const formattedItems = items.map(row => ({
            inventoryId: row.inventoryId,
            quantity: Number(row.quantity),
            costPerUnit: Number(row.costPerUnit)
        }))

        if (formattedItems.some(it => !it.inventoryId || it.quantity <= 0 || it.costPerUnit < 0)) {
            setErrorMessage("Every line item must have a valid asset, positive quantity, and valid cost.")
            setIsLoading(false)
            return
        } 

        // Prevent duplicate inventory items in the same PO
        const uniqueIds = new Set(formattedItems.map(it => it.inventoryId))
        if (uniqueIds.size !== formattedItems.length) {
            setErrorMessage("Duplicate inventory items detected. Combine quantities into a single row.")
            setIsLoading(false)
            return
        }

        // Strict DTO payload mapping
        const payload = {
            supplierId,
            items: formattedItems,
            tax: numericTax,
            ...(expectedDeliveryDate ? { expectedDeliveryDate } : {}),
            ...(notes.trim() ? { notes: notes.trim() } : {})
        }


        try {
            if (isEditMode) {
                await api.patch(`/restaurants/${restaurantId}/purchase-orders/${editingOrder._id}`, payload)
            } else {
                await api.post(`/restaurants/${restaurantId}/purchase-orders`, payload)
            }

            onRefresh()
            onClose()
        } catch (error) {
            console.error("[Purchase Order Save Failure]:", error)
            setErrorMessage(
                error.response?.data?.message ||
                "Failed to save purchase order draft."
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

            <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 p-6 rounded-2xl shadow-2xl z-10 animate-scale-in max-h-[90vh] overflow-y-auto scrollbar-none">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 p-1 rounded-md text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                    <X className="w-4 h-4" />
                </button>

                <div className="mb-5">
                    <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-emerald-500" />
                        {isEditMode
                            ? `Edit Draft (${editingOrder.purchaseOrderNumber})`
                            : "Create Purchase Order Draft"}
                    </h3>
                    <p className="text-neutral-400 text-xs mt-1">
                        Select a vendor and build ingredient procurement line items. Orders initialize in DRAFT status.
                    </p>
                </div>

                {errorMessage && (
                    <div className="mb-4 p-3 bg-red-900/30 border border-red-800 text-red-200 text-xs font-medium rounded-lg text-center">
                        {errorMessage}
                    </div>
                )}

                <form onSubmit={handleFormSubmit} className="space-y-4">
                    {/* Supplier & Expected Delivery Date */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="po-supplier" className="text-neutral-300 font-medium text-xs flex items-center gap-1.5">
                                <Truck className="w-3.5 h-3.5 text-neutral-500" />
                                Target Vendor <span className="text-red-400">*</span>
                            </Label>
                            <select
                                id="po-supplier"
                                required
                                value={supplierId}
                                onChange={(e) => setSupplierId(e.target.value)}
                                className="w-full h-10 px-3 bg-neutral-950 border border-neutral-800 text-white rounded-xl text-xs focus:border-emerald-500 outline-none"
                            >
                                <option value="">-- Select Active Supplier --</option>
                                {activeSuppliers.map((sup) => (
                                    <option key={sup._id} value={sup._id}>
                                        {sup.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="po-date" className="text-neutral-300 font-medium text-xs flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                                Expected Delivery Date
                            </Label>
                            <Input
                                id="po-date"
                                type="date"
                                value={expectedDeliveryDate}
                                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                                className="bg-neutral-950 border-neutral-800 text-white rounded-xl text-xs font-mono focus:border-emerald-500"
                            />
                        </div>
                    </div>

                    {/* Line Items Builder */}
                    <div className="space-y-2.5 bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-black text-neutral-400 uppercase tracking-wider">
                                Procurement Line Items ({items.length})
                            </span>
                            <button
                                type="button"
                                onClick={handleAddRow}
                                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                            >
                                <Plus className="w-3.5 h-3.5" /> Add Line Item
                            </button>
                        </div>

                        <div className="space-y-2.5">
                            {items.map((row, idx) => {
                                const selectedAsset = activeInventory.find(i => i._id === row.inventoryId)
                                const rowSubtotal =
                                    Math.round((Number(row.quantity) || 0) * (Number(row.costPerUnit) || 0) * 100) / 100

                                return (
                                    <div
                                        key={idx}
                                        className="grid grid-cols-12 gap-2 items-center bg-neutral-900/60 border border-neutral-800/60 p-2.5 rounded-xl"
                                    >
                                        <div className="col-span-12 sm:col-span-5">
                                            <select
                                                required
                                                value={row.inventoryId}
                                                onChange={(e) =>
                                                    handleItemChange(idx, "inventoryId", e.target.value)
                                                }
                                                className="w-full h-9 px-2.5 bg-neutral-950 border border-neutral-800 text-white rounded-lg text-xs focus:border-emerald-500 outline-none"
                                            >
                                                <option value="">Select Ingredient...</option>
                                                {activeInventory.map((inv) => (
                                                    <option key={inv._id} value={inv._id}>
                                                        {inv.name} ({inv.unit})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="col-span-4 sm:col-span-2">
                                            <Input
                                                type="number"
                                                required
                                                min="0.01"
                                                step="any"
                                                placeholder="Qty"
                                                title={`Quantity (${selectedAsset?.unit || "Unit"})`}
                                                value={row.quantity}
                                                onChange={(e) =>
                                                    handleItemChange(idx, "quantity", e.target.value)
                                                }
                                                className="h-9 bg-neutral-950 border-neutral-800 text-white rounded-lg text-xs font-mono"
                                            />
                                        </div>

                                        <div className="col-span-4 sm:col-span-2">
                                            <Input
                                                type="number"
                                                required
                                                min="0"
                                                step="any"
                                                placeholder="₹/Unit"
                                                title="Cost Per Unit (₹)"
                                                value={row.costPerUnit}
                                                onChange={(e) =>
                                                    handleItemChange(idx, "costPerUnit", e.target.value)
                                                }
                                                className="h-9 bg-neutral-950 border-neutral-800 text-white rounded-lg text-xs font-mono"
                                            />
                                        </div>

                                        <div className="col-span-3 sm:col-span-2 text-right font-mono text-xs font-bold text-emerald-400 truncate">
                                            ₹{rowSubtotal.toLocaleString("en-IN")}
                                        </div>

                                        <div className="col-span-1 text-right">
                                            <button
                                                type="button"
                                                disabled={items.length <= 1}
                                                onClick={() => handleRemoveRow(idx)}
                                                className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 disabled:opacity-25 cursor-pointer"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Tax & Notes */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="po-tax" className="text-neutral-300 font-medium text-xs">
                                Tax / Freight (₹)
                            </Label>
                            <div className="relative flex items-center">
                                <IndianRupee className="absolute left-3 w-3.5 h-3.5 text-neutral-500 pointer-events-none" />
                                <Input
                                    id="po-tax"
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={tax}
                                    onChange={(e) => setTax(e.target.value)}
                                    className="pl-9 bg-neutral-950 border-neutral-800 text-white rounded-xl text-xs font-mono"
                                />
                            </div>
                        </div>

                        <div className="sm:col-span-2 space-y-1.5">
                            <Label htmlFor="po-notes" className="text-neutral-300 font-medium text-xs">
                                Vendor Dispatch Notes
                            </Label>
                            <div className="relative flex items-center">
                                <FileText className="absolute left-3 w-3.5 h-3.5 text-neutral-500 pointer-events-none" />
                                <Input
                                    id="po-notes"
                                    type="text"
                                    maxLength={500}
                                    placeholder="e.g., Deliver to rear loading bay before 10 AM"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="pl-9 bg-neutral-950 border-neutral-800 text-white rounded-xl text-xs"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Financial Totals Banner */}
                    <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 flex items-center justify-between font-mono text-xs">
                        <div className="text-neutral-400">
                            Subtotal: <span className="text-white font-bold">₹{roundedSubtotal.toLocaleString("en-IN")}</span> + Tax:{" "}
                            <span className="text-white font-bold">₹{numericTax.toLocaleString("en-IN")}</span>
                        </div>
                        <div className="text-sm font-black text-emerald-400">
                            Total: ₹{calculatedTotal.toLocaleString("en-IN")}
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl cursor-pointer mt-2 shadow-lg inline-flex items-center justify-center gap-2 text-sm transition-all active:scale-[0.99]"
                    >
                        {isLoading
                            ? "Saving Draft..."
                            : isEditMode
                            ? "Save Draft Changes"
                            : "Create Purchase Order Draft"}
                        {!isLoading && <ArrowRight className="w-4 h-4" />}
                    </Button>
                </form>
            </div>
        </div>
    )

}

