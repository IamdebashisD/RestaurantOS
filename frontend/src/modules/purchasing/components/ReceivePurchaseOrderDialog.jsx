import { useState, useEffect } from "react"
import { X, PackageCheck, CheckCheck, ArrowRight } from "lucide-react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { api } from "../../../lib/axios"


export default function ReceivePurchaseOrderDialog({
    isOpen,
    onClose,
    onRefresh,
    restaurantId,
    purchaseOrder
}) {
    const [receiveCounts, setReceiveCounts] = useState({})
    const [isLoading, setIsLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState(null)

    useEffect(() => {
        if (isOpen && purchaseOrder) {
            const initial = {}
            for (const item of purchaseOrder.items || []) {
                const invId =
                    typeof item.inventory === "object"
                        ? item.inventory?._id
                        : item.inventory
                const remaining = Math.max(
                    0,
                    Math.round(((item.quantity || 0) - (item.receivedQuantity || 0)) * 100) / 100
                )
                initial[invId] = remaining
            }
            setReceiveCounts(initial)
            setErrorMessage(null)
        }
    }, [isOpen, purchaseOrder])

    if (!isOpen || !purchaseOrder) return null

    const pendingItems = (purchaseOrder.items || []).filter(
        item => (item.quantity || 0) - (item.receivedQuantity || 0) > 0
    )

    const handleReceiveAllFill = () => {
        const filled = {}
        for (const item of pendingItems) {
            const invId =
                typeof item.inventory === "object" ? item.inventory?._id : item.inventory
            filled[invId] =
                Math.round(((item.quantity || 0) - (item.receivedQuantity || 0)) * 100) / 100
        }
        setReceiveCounts(filled)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setErrorMessage(null)

        const payloadItems = []
        for (const item of pendingItems) {
            const invId =
                typeof item.inventory === "object" ? item.inventory?._id : item.inventory
            const qty = Number(receiveCounts[invId]) || 0
            if (qty > 0) {
                payloadItems.push({
                    inventoryId: invId,
                    receivedQuantity: qty
                })
            }
        }

        if (payloadItems.length === 0) {
            setErrorMessage("Enter a positive received quantity for at least one pending item.")
            setIsLoading(false)
            return
        }

        try {
            const response = await api.patch(
                `/restaurants/${restaurantId}/purchase-orders/${purchaseOrder._id}/receive`,
                { items: payloadItems }
            )
            const updatedOrder = response.data?.data?.purchaseOrder || null
            onRefresh(updatedOrder)
            onClose()
        } catch (error) {
            console.error("[PO Receive Failure]:", error)
            setErrorMessage(
                error.response?.data?.message ||
                "Failed to log received shipment into inventory."
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

            <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 p-6 rounded-2xl shadow-2xl z-10 animate-scale-in max-h-[90vh] overflow-y-auto scrollbar-none">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 p-1 rounded-md text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                    <X className="w-4 h-4" />
                </button>

                <div className="mb-5">
                    <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                        <PackageCheck className="w-5 h-5 text-emerald-500" />
                        Receive Shipment ({purchaseOrder.purchaseOrderNumber})
                    </h3>
                    <p className="text-neutral-400 text-xs mt-1">
                        Log delivered quantities below. Stock levels and immutable inventory ledgers update automatically.
                    </p>
                </div>

                {errorMessage && (
                    <div className="mb-4 p-3 bg-red-900/30 border border-red-800 text-red-200 text-xs font-medium rounded-lg text-center">
                        {errorMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={handleReceiveAllFill}
                            className="text-xs font-mono font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 cursor-pointer"
                        >
                            <CheckCheck className="w-3.5 h-3.5" /> Fill All Remaining Quantities
                        </button>
                    </div>

                    <div className="space-y-2.5">
                        {pendingItems.map((item) => {
                            const invId =
                                typeof item.inventory === "object"
                                    ? item.inventory?._id
                                    : item.inventory
                            const remaining =
                                Math.round(((item.quantity || 0) - (item.receivedQuantity || 0)) * 100) / 100

                            return (
                                <div
                                    key={invId}
                                    className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-3.5 flex items-center justify-between gap-4"
                                >
                                    <div className="space-y-0.5">
                                        <div className="font-bold text-white text-sm">
                                            {item.name}
                                        </div>
                                        <div className="text-[11px] font-mono text-neutral-400">
                                            Ordered: {item.quantity} {item.unit} • Already Received:{" "}
                                            {item.receivedQuantity || 0} {item.unit}
                                        </div>
                                        <div className="text-[10px] font-mono font-bold text-amber-400">
                                            Remaining: {remaining} {item.unit}
                                        </div>
                                    </div>

                                    <div className="w-28 shrink-0">
                                        <Input
                                            type="number"
                                            min="0"
                                            max={remaining}
                                            step="any"
                                            value={receiveCounts[invId] ?? ""}
                                            onChange={(e) =>
                                                setReceiveCounts(prev => ({
                                                    ...prev,
                                                    [invId]: e.target.value
                                                }))
                                            }
                                            className="bg-neutral-900 border-neutral-700 text-white rounded-xl text-sm font-mono text-right focus:border-emerald-500"
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl cursor-pointer mt-2 shadow-lg inline-flex items-center justify-center gap-2 text-sm transition-all active:scale-[0.99]"
                    >
                        {isLoading ? "Committing Stock Inflow..." : "Confirm Shipment Receipt"}
                        {!isLoading && <ArrowRight className="w-4 h-4" />}
                    </Button>
                </form>
            </div>
        </div>
    )
}

