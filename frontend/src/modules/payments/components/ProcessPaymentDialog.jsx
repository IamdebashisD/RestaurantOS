import { useState, useEffect } from "react"
import {
    X,
    Coins,
    Banknote,
    CreditCard,
    Smartphone,
    Building2,
    Wallet,
    HelpCircle,
    Hash,
    ArrowRight
} from "lucide-react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { api } from "../../../lib/axios"


const PAYMENT_METHODS = [
    { id: "CASH", label: "Cash", icon: Banknote },
    { id: "UPI", label: "UPI", icon: Smartphone },
    { id: "CARD", label: "Card", icon: CreditCard },
    { id: "NET_BANKING", label: "Net Banking", icon: Building2 },
    { id: "WALLET", label: "Wallet", icon: Wallet },
    { id: "OTHER", label: "Other", icon: HelpCircle },
]

export default function ProcessPaymentDialog({
    isOpen,
    onClose,
    onRefresh,
    restaurantId,
    invoice
}) {
    const [method, setMethod] = useState("CASH")
    const [transactionId, setTransactionId] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState(null)

    useEffect(() => {
        if (isOpen) {
            setMethod("CASH")
            setTransactionId("")
            setErrorMessage(null)
        }
    }, [isOpen, invoice])

    if (!isOpen || !invoice) return null

    const requiresTransactionId = method !== "CASH"

    const handleFormSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setErrorMessage(null)

        // Strict DTO payload alignment (createPaymentDto)
        const payload = {
            method,
            ...(transactionId.trim() ? { transactionId: transactionId.trim() } : {})
        }

        try {
            await api.post(`/restaurants/${restaurantId}/invoices/${invoice._id}/payments`, payload)
            onRefresh()
            onClose()
        } catch (error) {
            console.error("[Payment Settlement Failure]:", error)
            const detailedError = error.response?.data?.errors?.[0]?.message 
                || error.response?.data?.message 
                || "Failed to settle payment ledger block."
            setErrorMessage(detailedError)
        } finally {
            setIsLoading(false)
        }
    }


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop Blur Sheet Layer */}
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
                        <Coins className="w-5 h-5 text-emerald-500" />
                        Settle Invoice Payment
                    </h3>
                    <p className="text-neutral-400 text-xs mt-1">
                        Recording settlement for <span className="font-mono text-neutral-300 font-bold">{invoice.invoiceNumber}</span>
                    </p>
                </div>

                {errorMessage && (
                    <div className="mb-4 p-3 bg-red-900/30 border border-red-800 text-red-200 text-xs font-medium rounded-lg text-center">
                        {errorMessage}
                    </div>
                )}

                <form onSubmit={handleFormSubmit} className="space-y-5">
                    {/* Invoice Net Amount Display */}
                    <div className="bg-neutral-950 p-4 border border-neutral-800/80 rounded-xl flex justify-between items-baseline select-none">
                        <span className="text-[10px] text-neutral-500 font-mono font-bold uppercase">
                            Total Settlement Due
                        </span>
                        <span className="text-emerald-400 font-black text-2xl font-mono">
                            ₹{(invoice.totalAmount || 0).toLocaleString("en-IN")}
                        </span>
                    </div>

                    {/* Payment Method Enum Selector Grid */}
                    <div className="space-y-2">
                        <Label className="text-neutral-300 font-medium text-xs">
                            Select Payment Method
                        </Label>
                        <div className="grid grid-cols-3 gap-2">
                            {PAYMENT_METHODS.map((item) => {
                                const Icon = item.icon
                                const isSelected = method === item.id
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => setMethod(item.id)}
                                        className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer select-none ${isSelected
                                            ? "bg-emerald-600/10 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-950/20"
                                            : "bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-white"
                                            }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span className="text-[10px] tracking-wide uppercase">
                                            {item.label}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Conditional Gateway Transaction ID Input */}
                    {requiresTransactionId && (
                        <div className="space-y-1.5 animate-fade-in">
                            <Label htmlFor="transactionId" className="text-neutral-300 font-medium text-xs">
                                Bank / Gateway Reference ID <span className="text-neutral-500">(Optional)</span>
                            </Label>
                            <div className="relative flex items-center">
                                <Hash className="absolute left-3 w-4 h-4 text-neutral-500 pointer-events-none" />
                                <Input
                                    id="transactionId"
                                    type="text"
                                    placeholder="e.g., TXN-984512039"
                                    value={transactionId}
                                    onChange={(e) => setTransactionId(e.target.value)}
                                    className="pl-10 bg-neutral-950 border-neutral-800 text-white rounded-xl text-xs font-mono focus:border-emerald-500"
                                />
                            </div>
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl cursor-pointer mt-2 shadow-lg inline-flex items-center justify-center gap-2 text-sm transition-all active:scale-[0.99]"
                    >
                        {isLoading ? "Processing Transaction..." : "Confirm & Settle Payment"}
                        {!isLoading && <ArrowRight className="w-4 h-4" />}
                    </Button>
                </form>
            </div>
        </div>
    )







}