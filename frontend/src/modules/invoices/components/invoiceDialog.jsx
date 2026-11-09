import { useState } from "react"
import { X, Receipt, Calculator, DollarSign, Percent, ArrowRight } from "lucide-react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { api } from "../../../lib/axios"


export default function InvoiceDialog({ isOpen, onClose, onRefresh, orderId, restaurantId, orderTotal = 0 }) {
    // SYSTEM payload states matching your strict createInvoiceDto validation maps
    const [discount, setDiscount] = useState(0)
    const [tax, setTax] = useState(0)
    const [serviceCharge, setServiceCharge] = useState(0)

    const [isLoading, setIsLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState(null)

    if (!isOpen || !orderId) return null

    const subtotal = Math.round(orderTotal * 100) / 100
    const calculatedTotal = Math.max(0, subtotal - Number(discount) + Number(tax) + Number(serviceCharge))
    const totalAmount = Math.round(calculatedTotal * 100) / 100

    const handleFormSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setErrorMessage(null)

        const payload = {
            discount: Number(discount) || 0,
            tax: Number(tax) || 0,
            serviceCharge: Number(serviceCharge) || 0
        }

        try {
            await api.post(`restaurants/${restaurantId}/orders/${orderId}/invoice`, payload)
            onRefresh()
            onClose()
        } catch (error) {
            console.error("[Invoice Deployment Failure]:", error)
            setErrorMessage(error.response?.data?.message || "Failed to generate system invoice block.")
        } finally {
            setIsLoading(false)
        }
    }


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop Blur Sheet Layer */}
            <div onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />

            <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 p-6 rounded-2xl shadow-2xl z-10 animate-scale-in">
                <button onClick={onClose} className="absolute right-4 top-4 p-1 rounded-md text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer">
                    <X className="w-4 h-4" />
                </button>

                <div className="mb-5">
                    <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                        <Receipt className="w-5 h-5 text-emerald-500" />
                        Generate Invoice Ledger
                    </h3>
                    <p className="text-neutral-400 text-xs mt-1">Stamping transaction parameters from active Order Ticket configuration blocks.</p>
                </div>

                {errorMessage && (
                    <div className="mb-4 p-3 bg-red-900/30 border border-red-800 text-red-200 text-xs font-medium rounded-lg text-center">
                        {errorMessage}
                    </div>
                )}

                <form onSubmit={handleFormSubmit} className="space-y-4">

                    {/* Basket Gross Total Summary Card */}
                    <div className="bg-neutral-950 p-4 border border-neutral-800/80 rounded-xl flex justify-between items-baseline select-none">
                        <span className="text-[10px] text-neutral-500 font-mono font-bold uppercase">Order Base Subtotal</span>
                        <span className="text-white font-black text-xl font-mono">₹{subtotal.toLocaleString('en-IN')}</span>
                    </div>

                    {/* Input Field: Deductible Discount Adjustment */}
                    <div className="space-y-1.5">
                        <Label htmlFor="discount" className="text-neutral-300 font-medium text-xs">Discount Deductible (₹)</Label>
                        <div className="relative flex items-center">
                            <Percent className="absolute left-3 w-4 h-4 text-neutral-500 pointer-events-none" />
                            <Input
                                id="discount"
                                type="number"
                                min="0"
                                max={subtotal}
                                step="any"
                                className="pl-10 bg-neutral-950 border-neutral-800 text-white rounded-xl text-sm font-mono focus:border-emerald-500 shadow-none outline-none"
                                value={discount}
                                onChange={(e) => setDiscount(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Input Field: System Standard Tax Adjustment */}
                    <div className="space-y-1.5">
                        <Label htmlFor="tax" className="text-neutral-300 font-medium text-xs">System Tax Surcharge (₹)</Label>
                        <div className="relative flex items-center">
                            <Calculator className="absolute left-3 w-4 h-4 text-neutral-500 pointer-events-none" />
                            <Input
                                id="tax"
                                type="number"
                                min="0"
                                step="any"
                                className="pl-10 bg-neutral-950 border-neutral-800 text-white rounded-xl text-sm font-mono focus:border-emerald-500 shadow-none outline-none"
                                value={tax}
                                onChange={(e) => setTax(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Input Field: Service Fee Gratuity Adjustment */}
                    <div className="space-y-1.5">
                        <Label htmlFor="serviceCharge" className="text-neutral-300 font-medium text-xs">Service Charge Fee (₹)</Label>
                        <div className="relative flex items-center">
                            <DollarSign className="absolute left-3 w-4 h-4 text-neutral-500 pointer-events-none" />
                            <Input
                                id="serviceCharge"
                                type="number"
                                min="0"
                                step="any"
                                className="pl-10 bg-neutral-950 border-neutral-800 text-white rounded-xl text-sm font-mono focus:border-emerald-500 shadow-none outline-none"
                                value={serviceCharge}
                                onChange={(e) => setServiceCharge(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Projected Net Total Aggregation Card */}
                    <div className="border-t border-neutral-800 pt-4 mt-2 flex justify-between items-baseline px-0.5 select-none">
                        <span className="text-[10px] text-neutral-400 font-mono font-bold uppercase">Net Aggregate Due</span>
                        <span className="text-emerald-400 font-black text-2xl font-mono tracking-tight">₹{totalAmount.toLocaleString('en-IN')}</span>
                    </div>

                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl cursor-pointer mt-2 shadow-lg inline-flex items-center justify-center gap-2 text-sm transition-all active:scale-[0.99]"
                    >
                        {isLoading ? "Stamping Ledger..." : "Deploy Immutable Invoice"}
                        {!isLoading && <ArrowRight className="w-4 h-4" />}
                    </Button>
                </form>
            </div>
        </div>
    )
}
 