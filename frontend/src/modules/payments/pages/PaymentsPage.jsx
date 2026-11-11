import { useState, useEffect, useCallback } from "react"
import { useParams } from "react-router"
import {
    Coins,
    RefreshCw,
    Search,
    Calendar,
    User,
    Layers,
    Receipt,
    FileText,
    CheckCircle2,
    Ban,
    AlertTriangle,
    Eye,
    ChevronLeft,
    ChevronRight,
    ArrowRight,
    Undo2
} from "lucide-react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { api } from "../../../lib/axios"


export default function PaymentsPage() {
    const { restaurantId } = useParams()

    // SYSTEM OPERATION STATE STACKS
    const [payments, setPayments] = useState([])
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        totalPages: 1,
        totalItems: 0,
        hasNextPage: false,
        hasPrevPage: false
    })
    const [currentPage, setCurrentPage] = useState(1)
    const [activeFilter, setActiveFilter] = useState("ALL")
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedPayment, setSelectedPayment] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState(null)
    const [processingId, setProcessingId] = useState(null)
    const [refundReason, setRefundReason] = useState("")
    const [isRefundFormOpen, setIsRefundFormOpen] = useState(false)

    // =========================================================================
    // 📡 SYNCHRONIZED LEDGER WITH BACKEND PIPELINE (Pagination & Smart Search Matrix)
    // =========================================================================
    const loadPaymentsWorkspace = useCallback(async () => {
        setIsLoading(true)
        setErrorMessage(null)

        // If an explicit search term exists, suspend standard paginated lookup to trigger smart route routing maps
        if (searchQuery.trim()) {
            const query = searchQuery.trim()

            try {
                let response
                if (query.toUpperCase().startsWith('PAY-')) {
                    response = await api.get(`/restaurants/${restaurantId}/payments/number/${query}`)
                } else if (query.length === 24) {
                    try {
                        response = await api.get(`/restaurants/${restaurantId}/invoices/${query}/payments`)
                    } catch {
                        try {
                            response = await api.get(`/restaurants/${restaurantId}/orders/${query}/payments`)
                        } catch {
                            response = await api.get(`/restaurants/${restaurantId}/payments/${query}`)
                        }
                    }
                } else {
                    response = await api.get(`/restaurants/${restaurantId}/payments/transaction/${query}`)
                }

                const dataPayload = response?.data?.data
                const resultPayments = dataPayload?.payments || (dataPayload?.payment ? [dataPayload.payment] : [])
                setPayments(resultPayments)
                setPagination({
                    page: 1,
                    limit: 10,
                    totalPages: 1,
                    totalItems: resultPayments.length,
                    hasNextPage: false,
                    hasPrevPage: false
                })

            } catch (error) {
                setPayments([])
                setErrorMessage(error.response?.data?.message || "Search trace yielded no indexed ledger results.")
            } {
                setIsLoading(false)
            }

            return
        }

        // Broad paginated default load path: GET /api/v1/restaurants/:restaurantId/payments
        try {
            const response = await api.get(`/restaurants/${restaurantId}/payments`, {
                params: { page: currentPage, limit: 10 }
            })
            const paymentsData = response.data?.data?.payments?.payments || response.data?.data?.payments || []
            const paginationData = response?.data?.data?.payments?.pagination || response.data?.data?.pagination || {}
            setPayments(paymentsData)
            setPagination(paginationData)

        } catch (error) {
            console.error("[Payments Workspace Sync Failed]:", error)
            setErrorMessage(error.response?.data?.message || "Failed to establish communication pipeline with live transaction logs.")
        } finally {
            setIsLoading(false)
        }
    }, [restaurantId, currentPage, searchQuery])


    useEffect(() => { 
        if (restaurantId) loadPaymentsWorkspace() 
    }, [loadPaymentsWorkspace])


    // STATE TRANSITION REVERSAL INTERCEPTOR (PATCH /refund)
    const handleRefundAction = async (e) => {
        e.preventDefault()
        if (!selectedPayment) return
        if (!refundReason.trim() || refundReason.trim().length < 3) {
            alert("Refund justification notes must contain at least 3 characters.")
            return
        } 

        setProcessingId(selectedPayment._id)
        try {
            const response = await api.patch(`restaurants/${restaurantId}/payments/${selectedPayment._id}/refund`, {
                refundReason: refundReason.trim()
            })
            const updatedPayment = response.data?.data?.payment || null
            if (updatedPayment) {
                setPayments(prev => prev.map(p => p._id === selectedPayment._id ? updatedPayment : p))
                setSelectedPayment(updatedPayment)
            } else {
                loadPaymentsWorkspace()
            }
            
            setIsRefundFormOpen(false)
            setRefundReason("")
        } catch (error) {
            alert(error.response?.data?.message || "Financial transaction reversal execution rejected by system rules.")
        } finally {
            setProcessingId(null)
        }
    }

    // DESK METRIC SUMMARY AGGREGATORS
    const computeSummaryMetrics = () => {
        return payments.reduce((acc, current) => {
            const numericAmount = Number(current.amount) || 0
            if (current.status === "COMPLETED") acc.settledVolume += numericAmount
            if (current.status === "REFUNDED") acc.refundedVolume += numericAmount
            acc.totalCount += 1
            return acc
        }, { settledVolume: 0, refundedVolume: 0, totalCount: 0 })
    }
    const stats = computeSummaryMetrics()

    const filteredPayments = payments.filter(pay => 
        activeFilter === "ALL" ? true : pay.method.toUpperCase() === activeFilter
    )

    const getStatusStyle = (status) => {
        switch (status?.toUpperCase()) {
            case "PENDING": return "bg-amber-500/10 border-amber-500/20 text-amber-400"
            case "COMPLETED": return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            case "FAILED": return "bg-red-500/10 border-red-500/20 text-red-400"
            case "REFUNDED": return "bg-purple-500/10 border-purple-500/20 text-purple-400"
            default: return "bg-neutral-900 border-neutral-800 text-neutral-400"
        }
    }




    return (
        <div className="space-y-6 animate-fade-in pb-8 w-full select-none">

            {/* PANEL HEADER SYSTEM ACTION BLOCK */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-800 pb-5">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                        <Coins className="w-5 h-5 text-emerald-500" />
                        Live Transaction Settle Ledger Matrix
                    </h2>
                    <p className="text-neutral-400 text-sm mt-1">
                        Monitor incoming capital pipelines, verify idempotency transaction tracks, and process atomic fund reversals.
                    </p>
                </div>

                <Button
                    onClick={() => { setSearchQuery(""); setCurrentPage(1); loadPaymentsWorkspace(); }}
                    variant="outline"
                    className="border-neutral-800 text-neutral-400 hover:text-white bg-neutral-900/50 rounded-xl cursor-pointer self-start sm:self-auto"
                >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                </Button>
            </div>

            {/* TELEMETRIC REVENUE METRIC NODES */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-5 flex items-center justify-between backdrop-blur-md">
                    <div className="space-y-1">
                        <span className="text-[10px] text-neutral-500 font-mono font-bold uppercase tracking-wider block">Net Settled Funds</span>
                        <span className="text-2xl font-black text-white font-mono">₹{stats.settledVolume.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="p-3 bg-emerald-950/20 border border-emerald-900/30 rounded-xl text-emerald-400"><CheckCircle2 className="w-5 h-5" /></div>
                </div>

                <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-5 flex items-center justify-between backdrop-blur-md">
                    <div className="space-y-1">
                        <span className="text-[10px] text-neutral-500 font-mono font-bold uppercase tracking-wider block">Reversed/Refunded Volume</span>
                        <span className="text-2xl font-black text-white font-mono">₹{stats.refundedVolume.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="p-3 bg-purple-950/20 border border-purple-900/30 rounded-xl text-purple-400"><Undo2 className="w-5 h-5" /></div>
                </div>

                <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-5 flex items-center justify-between backdrop-blur-md">
                    <div className="space-y-1">
                        <span className="text-[10px] text-neutral-500 font-mono font-bold uppercase tracking-wider block">Indexed Transaction Blocks</span>
                        <span className="text-2xl font-black text-white font-mono">{stats.totalCount} Blocks</span>
                    </div>
                    <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-400"><FileText className="w-5 h-5" /></div>
                </div>
            </div>

            {/* SMART OMNIBAR SEARCH ENGINE INPUT */}
            <div className="relative flex items-center w-full max-w-xl">
                <Search className="absolute left-4 w-4 h-4 text-neutral-500 pointer-events-none" />
                <Input
                    type="text"
                    placeholder="Search by Payment #, Invoice #, Order ID, or Transaction ID Tracking Code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-11 bg-neutral-900/50 border-neutral-800 text-white rounded-xl text-xs h-11 w-full focus:border-emerald-500 tracking-wide font-medium"
                />
            </div>

            {errorMessage && (
                <div className="p-3 bg-red-900/20 border border-red-800/40 text-red-400 text-xs font-medium rounded-xl text-center">{errorMessage}</div>
            )}

            {/* HORIZONTAL CATEGORY NAVIGATION FILTER TABS MATRIX (Menu Style Consistency) */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start w-full">

                {/* LEFT TRANSACTION LEDGER TRACK */}
                <div className="xl:col-span-2 space-y-4">
                    <div className="flex flex-wrap items-center gap-3 w-full">
                        {["ALL", "CASH", "CARD", "UPI", "NET_BANKING", "WALLET", "OTHER"].map((filter) => {
                            const isActive = activeFilter === filter
                            return (
                                <button
                                    key={filter}
                                    onClick={() => setActiveFilter(filter)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide border cursor-pointer select-none uppercase transition-all duration-200 ${isActive
                                        ? "bg-emerald-600/10 border-emerald-500 text-emerald-400 font-extrabold shadow-lg shadow-emerald-950/20"
                                        : "border-neutral-800 bg-neutral-900/40 text-neutral-400 hover:border-neutral-700 hover:text-white"
                                        }`}
                                >
                                    {filter.replace("_", " ")}
                                </button>
                            )
                        })}
                    </div>
                    {/* MAIN LEDGER DATA SHEET TABLE */}
                    <div className="bg-neutral-900/20 border border-neutral-800/80 rounded-2xl overflow-hidden backdrop-blur-md">
                        {isLoading ? (
                            <div className="text-center py-24 text-neutral-500 font-mono text-xs animate-pulse">Syncing Cryptographic Transaction Ledgers...</div>
                        ) : filteredPayments.length === 0 ? (
                            <div className="text-center py-24 text-neutral-600 font-mono text-xs flex flex-col items-center justify-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-neutral-700" />
                                <span>No indexed transactions match active viewport filters.</span>
                            </div>
                        ) : (
                            <div className="overflow-x-auto w-full">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-neutral-800 bg-neutral-950/40 text-[10px] font-mono font-black text-neutral-500 uppercase tracking-wider select-none">
                                            <th className="py-3.5 px-4">Payment Log #</th>
                                            <th className="py-3.5 px-4">Client ID Profile</th>
                                            <th className="py-3.5 px-4">Settlement Link</th>
                                            <th className="py-3.5 px-4 font-mono text-right">Volume</th>
                                            <th className="py-3.5 px-4 text-center">Lifecycle Status</th>
                                            <th className="py-3.5 px-4 text-center">Audit</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-900/60 text-xs font-medium text-neutral-300">
                                        {filteredPayments.map((payment) => (
                                            <tr
                                                key={payment._id}
                                                className={`hover:bg-neutral-900/30 transition-colors group ${processingId === payment._id ? "opacity-30 pointer-events-none" : ""} ${selectedPayment?._id === payment._id ? "bg-neutral-900/40" : ""}`}
                                            >
                                                <td className="py-4 px-4 font-mono font-bold text-white whitespace-nowrap">
                                                    {payment.paymentNumber || payment._id.slice(-8).toUpperCase()}
                                                </td>
                                                <td className="py-4 px-4 truncate max-w-36 text-neutral-400">
                                                    {payment.customer?.name || "Anonymous Guest"}
                                                </td>
                                                <td className="py-4 px-4 whitespace-nowrap text-neutral-500 font-mono text-[11px]">
                                                    {payment.method} {payment.transactionId ? `(${payment.transactionId.slice(0, 8)})` : ""}
                                                </td>
                                                <td className="py-4 px-4 font-mono font-bold text-white text-right whitespace-nowrap">
                                                    ₹{payment.amount.toLocaleString('en-IN')}
                                                </td>
                                                <td className="py-4 px-4 text-center whitespace-nowrap">
                                                    <span className={`px-2 py-0.5 text-[9px] font-mono font-black tracking-wider rounded border uppercase ${getStatusStyle(payment.status)}`}>
                                                        {payment.status}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 text-center whitespace-nowrap">
                                                    <button
                                                        onClick={() => { setSelectedPayment(payment); setIsRefundFormOpen(false); }}
                                                        className="p-1.5 rounded-lg border border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-emerald-400 transition-colors cursor-pointer"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* INTERNAL TABLES PAGINATION STRIP CONTROLLER */}
                        {!searchQuery.trim() && (
                            <div className="p-4 border-t border-neutral-800/80 bg-neutral-950/20 flex items-center justify-between select-none">
                                <span className="text-[10px] font-mono text-neutral-500 font-bold uppercase">
                                    Page {pagination.page} of {pagination.totalPages || 1}
                                </span>
                                <div className="flex gap-1.5">
                                    <Button
                                        disabled={!pagination.hasPrevPage || isLoading}
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        variant="outline"
                                        className="border-neutral-800 bg-neutral-950 h-8 px-2.5 rounded-lg cursor-pointer text-xs"
                                    >
                                        <ChevronLeft className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                        disabled={!pagination.hasNextPage || isLoading}
                                        onClick={() => setCurrentPage(p => p + 1)}
                                        variant="outline"
                                        className="border-neutral-800 bg-neutral-950 h-8 px-2.5 rounded-lg cursor-pointer text-xs"
                                    >
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                {/* RIGHT SYSTEM RECEIPT DETAIL INSPECTOR SIDEBAR */}
                <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-5 backdrop-blur-md h-full space-y-5 min-h-[50vh]">
                    {selectedPayment ? (
                        <div className="space-y-5 animate-scale-in">
                            <div className="flex justify-between items-start border-b border-neutral-800/60 pb-4">
                                <div className="space-y-1">
                                    <h4 className="text-sm font-black text-white uppercase tracking-tight">Audit Audit Telemetry</h4>
                                    <span className="text-[10px] font-mono text-neutral-500 block font-bold">{selectedPayment.paymentNumber}</span>
                                </div>
                                <span className={`text-[9px] font-mono font-black tracking-wider px-2 py-0.5 border rounded uppercase ${getStatusStyle(selectedPayment.status)}`}>
                                    {selectedPayment.status}
                                </span>
                            </div>

                            {/* Relationship Profiles Meta Box Layout */}
                            <div className="space-y-2.5 bg-neutral-950/50 border border-neutral-900 p-3 rounded-xl text-[11px]">
                                <div className="flex items-center gap-2 text-neutral-400">
                                    <User className="w-3.5 h-3.5 text-neutral-600" />
                                    <span className="font-semibold text-neutral-300 truncate">{selectedPayment.customer?.name || "Walk-In Guest"}</span>
                                    {selectedPayment.customer?.email && <span className="text-neutral-600 font-mono">({selectedPayment.customer.email})</span>}
                                </div>
                                <div className="flex items-center gap-2 text-neutral-400">
                                    <Receipt className="w-3.5 h-3.5 text-neutral-600" />
                                    <span>Invoice Target Link: <strong className="text-white font-mono font-bold text-[10px]">{selectedPayment.invoice?.invoiceNumber || selectedPayment.invoice}</strong></span>
                                </div>
                                <div className="flex items-center gap-2 text-neutral-400">
                                    <FileText className="w-3.5 h-3.5 text-neutral-600" />
                                    <span>Order Ref: <strong className="text-white font-mono font-bold text-[10px]">{selectedPayment.order?._id || selectedPayment.order}</strong></span>
                                </div>
                                <div className="flex items-center gap-2 text-neutral-400">
                                    <Calendar className="w-3.5 h-3.5 text-neutral-600" />
                                    <span>Settled Timestamp: <span className="font-mono text-[10px]">{new Date(selectedPayment.paidAt || selectedPayment.createdAt).toLocaleString('en-IN')}</span></span>
                                </div>
                                {selectedPayment.transactionId && (
                                    <div className="flex items-center gap-2 text-neutral-400 border-t border-neutral-900 pt-2 mt-2">
                                        <span className="text-[10px] font-mono text-neutral-500 uppercase font-black">Gateway Trace ID:</span>
                                        <span className="font-mono text-emerald-400 text-[10px] select-all font-bold">{selectedPayment.transactionId}</span>
                                    </div>
                                )}
                            </div>

                            {/* Financial Aggregation Tally Card */}
                            <div className="bg-neutral-950 p-4 border border-neutral-900 rounded-xl flex justify-between items-baseline">
                                <span className="text-[10px] font-mono font-black uppercase text-neutral-500">Collected Capital Net Total</span>
                                <span className="text-xl font-mono font-black text-white">₹{selectedPayment.amount}</span>
                            </div>

                            {/* Refund Audit Justification Notes Block */}
                            {selectedPayment.status === "REFUNDED" && (
                                <div className="p-3 bg-purple-950/20 border border-purple-900/40 rounded-xl text-xs space-y-1">
                                    <span className="text-[9px] font-mono font-black text-purple-400 uppercase block tracking-wider">Reversal Reason Log:</span>
                                    <p className="text-neutral-300 italic font-sans">"{selectedPayment.refundReason || "No explanation logged into ledger blocks."}"</p>
                                    {selectedPayment.refundedAt && <span className="text-[10px] text-neutral-500 block font-mono mt-1">Reversed At: {new Date(selectedPayment.refundedAt).toLocaleString('en-IN')}</span>}
                                </div>
                            )}

                            {/* Deterministic Reversal Actions Desk */}
                            {selectedPayment.status === "COMPLETED" && (
                                <div className="pt-2">
                                    {!isRefundFormOpen ? (
                                        <button
                                            onClick={() => setIsRefundFormOpen(true)}
                                            className="w-full py-2.5 px-3 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-purple-400 hover:border-purple-900/30 transition-all font-bold tracking-wider text-[10px] uppercase flex items-center justify-center gap-1.5 cursor-pointer"
                                        >
                                            <Undo2 className="w-3.5 h-3.5 text-purple-500" /> Execute Return Refund
                                        </button>
                                    ) : (
                                        <form onSubmit={handleRefundAction} className="space-y-3 p-3 bg-neutral-950 border border-neutral-800 rounded-xl animate-scale-in">
                                            <div className="space-y-1.5">
                                                <label htmlFor="reason" className="text-[10px] font-mono text-neutral-400 font-bold uppercase tracking-wider block">Reversal Reason Justification</label>
                                                <input
                                                    id="reason"
                                                    type="text"
                                                    required
                                                    minLength={3}
                                                    maxLength={500}
                                                    placeholder="e.g., Customer return, billing error, system mismatch"
                                                    value={refundReason}
                                                    onChange={(e) => setRefundReason(e.target.value)}
                                                    className="w-full bg-neutral-900 border border-neutral-800 text-white font-sans text-xs px-3 py-2 rounded-lg focus:border-purple-500 outline-none h-9"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-[9px] font-black tracking-wider uppercase">
                                                <button
                                                    type="submit"
                                                    className="py-2 px-3 bg-purple-600 hover:bg-purple-50 text-white font-bold rounded-lg cursor-pointer transition-colors text-center"
                                                >
                                                    Confirm Refund
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => { setIsRefundFormOpen(false); setRefundReason(""); }}
                                                    className="py-2 px-3 bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white rounded-lg cursor-pointer transition-colors text-center"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            )}

                            {selectedPayment.status === "FAILED" && (
                                <div className="w-full py-2 bg-red-950/20 border border-red-900/30 text-red-400 text-[10px] font-mono font-bold text-center rounded-xl select-none uppercase tracking-wider">
                                    Transaction Block Dropped & Voided
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-600 font-mono text-xs border border-dashed border-neutral-800 rounded-xl bg-neutral-950/10">
                            <Coins className="w-6 h-6 text-neutral-700 mb-2 animate-pulse" />
                            <span>Select a payment item node to open auditing telemetry.</span>
                        </div>
                    )}
                </div>

            </div>

        </div>
    )

}