import { useState, useEffect, useEffectEvent } from "react"
import {
    X,
    ArrowDownToLine,
    ArrowUpFromLine,
    SlidersHorizontal,
    Trash2,
    IndianRupee,
    FileText,
    ArrowRight
} from "lucide-react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { api } from "../../../lib/axios"

const MOVEMENT_CONFIG = {
    STOCK_IN: {
        title: "Stock-In Replenishment",
        subtitle: "Log incoming delivery batch and recalculate weighted unit cost.",
        endpoint: "stock-in",
        method: "post",
        badgeColor: "text-emerald-600 bg-emerald-950/40 border-emerald-800/50",
        buttonColor: "bg-emerald-600 hover:bg-emerald-500",
        icon: ArrowDownToLine,
        reasonRequired: false,
        reasonPlaceholder: "e.g., Weekly vendor delivery batch"
    },
    STOCK_OUT: {
        title: "Kitchen Stock-Out",
        subtitle: "Record daily kitchen consumption and check low-stock thresholds.",
        endpoint: "stock-out",
        method: "patch",
        badgeColor: "text-blue-400 bg-blue-950/40 border-blue-800/50",
        buttonColor: "bg-blue-600 hover:bg-blue-500",
        icon: ArrowUpFromLine,
        reasonRequired: false,
        reasonPlaceholder: "e.g., Dinner service prep depletion"
    },
    ADJUSTMENT: {
        title: "Physical Stock Adjustment",
        subtitle: "Reconcile system quantity to match an audited physical shelf count.",
        endpoint: "adjustment",
        method: "patch",
        badgeColor: "text-amber-400 bg-amber-950/40 border-amber-800/50",
        buttonColor: "bg-amber-600 hover:bg-amber-500",
        icon: SlidersHorizontal,
        reasonRequired: false,
        reasonPlaceholder: "e.g., End-of-week physical shelf audit"
    },
    WASTAGE: {
        title: "Record Stock Wastage",
        subtitle: "Deduct spoiled, expired, or damaged stock from active inventory.",
        endpoint: "wastage",
        method: "patch",
        badgeColor: "text-red-400 bg-red-950/40 border-red-800/50",
        buttonColor: "bg-red-600 hover:bg-red-500",
        icon: Trash2,
        reasonRequired: true,
        reasonPlaceholder: "e.g., Expired dairy batch / cold storage failure"
    },

}

export default function StockMovementDialog({
    isOpen, 
    onClose,
    onRefresh,
    restaurantId,
    item,
    movementType = 'STOCK_IN'
}) {
    const [quantity, setQuantity] = useState("")
    const [costPerUnit, setCostPerUnit] = useState("")
    const [reason, setReason] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState(null)

    const config = MOVEMENT_CONFIG[movementType] || MOVEMENT_CONFIG.STOCK_IN
    const IconComponent = config.icon

    useEffect(() => {
        if (isOpen && item) {
            setQuantity(movementType === "ADJUSTMENT" ? String(item.currentQuantity ?? 0) : "")
            setCostPerUnit(String(item.costPerUnit ?? 0))
            setReason("")
            setErrorMessage(null)
        }
    }, [isOpen, item, movementType])

    if (!isOpen || !item) return null
    
    const numericQty = Number(quantity) || 0
    const projectedQty = 
        movementType === "STOCK_IN"
            ? Math.round((item.currentQuantity + numericQty) * 100) / 100
            : movementType === "ADJUSTMENT"
            ? Math.round(numericQty * 100) / 100
            : Math.max(0, Math.round((item.currentQuantity - numericQty) * 100) / 100)
    
    const handleFormSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setErrorMessage(null)

        const trimmedReason = reason.trim()
        if (trimmedReason && trimmedReason.length < 3) {
            setErrorMessage("Reason must be at least 3 characters if provided.")
            setIsLoading(false)
            return
        }
        
        // Strict DTO Payload Mapping per Endpoint
        let payload = {}
        if (movementType === "STOCK_IN") {
            payload = {
                quantity: Number(quantity),
                ...(costPerUnit !== "" ? { costPerUnit: Number(costPerUnit) } : {}),
                ...(trimmedReason ? { reason: trimmedReason } : {})
            }
        } else if  (movementType === "ADJUSTMENT") {
            payload = {
                actualQuantity: Number(quantity),
                ...(trimmedReason ? { reason: trimmedReason } : {})
            }
        } else if (movementType === "WASTAGE") {
            payload = {
                quantity: Number(quantity),
                reason: trimmedReason
            }
        } else {
            payload = {
                quantity: Number(quantity),
                ...(trimmedReason ? { reason: trimmedReason } : {})
            }
        }


        try {
            const url = `/restaurants/${restaurantId}/inventory/${item._id}/${config.endpoint}`
            const response = 
                config.method === "post"
                    ? await api.post(url, payload)
                    : await api.patch(url, payload)
            
            const updatedInventory = response.data?.data?.updatedInventory || null
            onRefresh(updatedInventory)
            onClose()
        } catch (error) {
            console.error(`[${movementType} Execution Failure]:`, error)
            setErrorMessage(
                error.response?.data?.message ||
                "Failed to execute stock movement transaction."
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
                    <div className="flex items-center gap-2">
                        <span className={`p-1.5 rounded-lg border ${config.badgeColor}`}>
                            <IconComponent className="w-4 h-4" />
                        </span>
                        <h3 className="text-lg font-black text-white tracking-tight">
                            {config.title}
                        </h3>
                    </div>
                    <p className="text-neutral-400 text-xs mt-1.5">{config.subtitle}</p>
                </div>

                {errorMessage && (
                    <div className="mb-4 p-3 bg-red-900/30 border border-red-800 text-red-200 text-xs font-medium rounded-lg text-center">
                        {errorMessage}
                    </div>
                )}

                <form onSubmit={handleFormSubmit} className="space-y-4">
                    {/* Current vs Projected Stock Preview */}
                    <div className="bg-neutral-950 border border-neutral-800/80 rounded-xl p-3.5 flex items-center justify-between select-none">
                        <div>
                            <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase block">
                                {item.name} (Current)
                            </span>
                            <span className="text-white font-mono font-black text-base">
                                {item.currentQuantity} {item.unit}
                            </span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-neutral-600" />
                        <div className="text-right">
                            <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase block">
                                Resulting Stock
                            </span>
                            <span className="text-emerald-400 font-mono font-black text-base">
                                {projectedQty} {item.unit}
                            </span>
                        </div>
                    </div>

                    {/* Quantity / Actual Count Input */}
                    <div className="space-y-1.5">
                        <Label htmlFor="mov-qty" className="text-neutral-300 font-medium text-xs">
                            {movementType === "ADJUSTMENT"
                                ? `Physical Counted Quantity (${item.unit})`
                                : `Movement Quantity (${item.unit})`}
                        </Label>
                        <Input
                            id="mov-qty"
                            type="number"
                            required
                            min={movementType === "ADJUSTMENT" ? "0" : "0.01"}
                            max={
                                ["STOCK_OUT", "WASTAGE"].includes(movementType)
                                    ? item.currentQuantity
                                    : undefined
                            }
                            step="any"
                            placeholder="0.00"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            className="bg-neutral-950 border-neutral-800 text-white rounded-xl text-sm font-mono focus:border-emerald-500"
                        />
                    </div>

                    {/* Unit Cost Input (STOCK_IN Only) */}
                    {movementType === "STOCK_IN" && (
                        <div className="space-y-1.5">
                            <Label htmlFor="mov-cost" className="text-neutral-300 font-medium text-xs">
                                Batch Unit Cost per {item.unit} (₹)
                            </Label>
                            <div className="relative flex items-center">
                                <IndianRupee className="absolute left-3 w-4 h-4 text-neutral-500 pointer-events-none" />
                                <Input
                                    id="mov-cost"
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={costPerUnit}
                                    onChange={(e) => setCostPerUnit(e.target.value)}
                                    className="pl-10 bg-neutral-950 border-neutral-800 text-white rounded-xl text-sm font-mono focus:border-emerald-500"
                                />
                            </div>
                        </div>
                    )}

                    {/* Ledger Audit Reason */}
                    <div className="space-y-1.5">
                        <Label htmlFor="mov-reason" className="text-neutral-300 font-medium text-xs">
                            Audit Reason / Note{" "}
                            {config.reasonRequired ? (
                                <span className="text-red-400">*</span>
                            ) : (
                                <span className="text-neutral-500">(Optional)</span>
                            )}
                        </Label>
                        <div className="relative flex items-center">
                            <FileText className="absolute left-3 w-4 h-4 text-neutral-500 pointer-events-none" />
                            <Input
                                id="mov-reason"
                                type="text"
                                required={config.reasonRequired}
                                minLength={3}
                                maxLength={500}
                                placeholder={config.reasonPlaceholder}
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="pl-10 bg-neutral-950 border-neutral-800 text-white rounded-xl text-xs focus:border-emerald-500"
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full ${config.buttonColor} text-white font-semibold py-2.5 rounded-xl cursor-pointer mt-2 shadow-lg inline-flex items-center justify-center gap-2 text-sm transition-all active:scale-[0.99]`}
                    >
                        {isLoading ? "Recording Ledger Entry..." : `Confirm ${config.title}`}
                        {!isLoading && <ArrowRight className="w-4 h-4" />}
                    </Button>
                </form>
            </div>
        </div>
    )

}