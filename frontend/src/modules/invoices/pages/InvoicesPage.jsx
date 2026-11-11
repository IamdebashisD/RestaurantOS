import { useState, useEffect, useCallback } from "react"
import { useParams } from "react-router"
import {
    Receipt, 
    RefreshCw, 
    FileText, 
    Clock, 
    CheckCircle2, 
    Ban, 
    Undo2, 
    Coins, 
    TrendingUp, 
    AlertTriangle,
    Eye,
    ChevronLeft,
    ChevronRight,
    User,
    Layers,
    Calendar
} from "lucide-react"
import { Button } from "../../../components/ui/button"
import { api } from "../../../lib/axios"
import ProcessPaymentDialog from "../../payments/components/ProcessPaymentDialog"


export default function InvoicesPage() {
    const { restaurantId } = useParams()

    // SYSTEM OPERATION STATE STACKS
    const [invoices, setInvoices] = useState([])
    const [pagination, setPagination] = useState({ page: 1, limit: 12, totalPages: 1 })
    const [currentPage, setCurrentPage] = useState(1)
    const [activeFilter, setActiveFilter] = useState("ALL")
    const [selectedInvoice, setSelectedInvoice] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState(null)
    const [processingId, setProcessingId] = useState(null)

    const [settlingInvoice, setSettlingInvoice] = useState(null)

    // SYNCRONIZED LEDGER WITH BACKEND PIPELINE
    const loadInvoicesWorkspace = useCallback(async () => {
        setIsLoading(true)
        setErrorMessage(null)

        try {
            const response = await api.get(`/restaurants/${restaurantId}/invoices`, {
                params: { page: currentPage, limit: 10 }
            })
            const fetchedInvoices = response.data?.data?.invoices || []
            const metaData = response.data?.data?.meta || { page: 1, limit: 10, totalPages: 1 }

            setInvoices(fetchedInvoices)
            setPagination(metaData)
            

        } catch (error) {
            console.error("[Invoices Workspace Sync Failed]:", error)
            setErrorMessage(
                error.response?.data?.message || 
                "Failed to establish communication pipeline with live billing data streams."
            )
        } finally {
            setIsLoading(false)
        }

    }, [restaurantId, currentPage])

    useEffect(() => {
        if (restaurantId) loadInvoicesWorkspace()
    }, [loadInvoicesWorkspace])

    // STATE TRANSITION ENGINE INTERCEPTORS
    const handleInvoiceAction = async (invoiceId, actionEndpoint) => {
        setProcessingId(invoiceId)
        setErrorMessage(null)

        try {
            const response = await api.patch(`/restaurants/${restaurantId}/invoices/${invoiceId}/${actionEndpoint}`)
            // Re-sync local states cleanly depending on response mapping properties
            const updatedInvoice = response.data?.data?.invoice || response.data?.data?.paidInvoice || null
            if (updatedInvoice) {
                setInvoices(prev => prev.map(inv => inv._id === invoiceId ? updatedInvoice : inv))
                if (selectedInvoice?._id === invoiceId) {
                    setSelectedInvoice(updatedInvoice)
                }
            } else {
                loadInvoicesWorkspace()
            }
        } catch (error) {
            alert(error.response?.data?.message || "Operational ledger state shift rejected by system rules.")
        } finally {
            setProcessingId(null)
        }
    }

    // 📊 RUNTIME AGGREGATORS FOR SYSTEM METRIC SUMMARY CARDS
    const computesSummaryMetrics = () => {
        return invoices.reduce((acc, current) => {
            if (current.status === "PAID") acc.grossPaid += current.totalAmount
            if (current.status === "ISSUED") acc.unpaidBalance += current.totalAmount
            acc.totalCount += 1
            return acc
        }, { grossPaid: 0, unpaidBalance: 0, totalCount: 0 })
    }
    const stats = computesSummaryMetrics()

    // FILTER CORRIDOR ROUTING
    const filteredInvoices = invoices.filter(inv => {
        const standadizeFilter = activeFilter.toUpperCase()
        return standadizeFilter === "ALL" ? true : inv.status?.toUpperCase() === standadizeFilter
    })
    console.log("Filtered Invoices:", filteredInvoices, "Active Filter:", activeFilter)

    // 🎨 DESIGN TOKEN COLOR MAP FOR LIFECYCLE ENUMS
    const getStatusStyle = (status) => {
        switch (status?.toUpperCase()) {
            case "ISSUED": return "bg-amber-500/10 border-amber-500/20 text-amber-400"
            case "PAID": return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            case "CANCELLED": return "bg-neutral-950 border-neutral-800 text-neutral-500"
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
                        <Receipt className="w-5 h-5 text-emerald-500" />
                        Invoices & Financial Billing Console
                    </h2>
                    <p className="text-neutral-400 text-sm mt-1">
                        Audit immutable operational ledgers, calculate tax structures, and handle transaction balances.
                    </p>
                </div>

                <Button
                    onClick={loadInvoicesWorkspace}
                    variant="outline"
                    className="border-neutral-800 text-neutral-400 hover:text-white bg-neutral-900/50 rounded-xl cursor-pointer self-start sm:self-auto"
                >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                </Button>
            </div>

            {/* TELEMETRY COUNTER LEDGER METRICS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-5 flex items-center justify-between backdrop-blur-md">
                    <div className="space-y-1">
                        <span className="text-[10px] text-neutral-500 font-mono font-bold uppercase tracking-wider block">Settled Gross Revenue</span>
                        <span className="text-2xl font-black text-white font-mono">₹{stats.grossPaid.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="p-3 bg-emerald-950/20 border border-emerald-900/30 rounded-xl text-emerald-400"><Coins className="w-5 h-5" /></div>
                </div>

                <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-5 flex items-center justify-between backdrop-blur-md">
                    <div className="space-y-1">
                        <span className="text-[10px] text-neutral-500 font-mono font-bold uppercase tracking-wider block">Outstanding Receivables</span>
                        <span className="text-2xl font-black text-white font-mono">₹{stats.unpaidBalance.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="p-3 bg-amber-950/20 border border-amber-900/30 rounded-xl text-amber-400"><TrendingUp className="w-5 h-5" /></div>
                </div>

                <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-5 flex items-center justify-between backdrop-blur-md">
                    <div className="space-y-1">
                        <span className="text-[10px] text-neutral-500 font-mono font-bold uppercase tracking-wider block">System Ledgers Indexed</span>
                        <span className="text-2xl font-black text-white font-mono">{stats.totalCount} Tickets</span>
                    </div>
                    <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-400"><FileText className="w-5 h-5" /></div>
                </div>
            </div>

            {errorMessage && (
                <div className="p-3 bg-red-900/20 border border-red-800/40 text-red-400 text-xs font-medium rounded-xl text-center">{errorMessage}</div>
            )}

            {/* MAIN SYSTEM MULTI-TRACK VIEWPORT ENGAGEMENT LAYER */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start w-full">
                
                {/* LEFT LEDGER MATRIX CONTAINER AREA */}
                <div className="xl:col-span-2 space-y-4">
                    <div className="flex flex-wrap items-center gap-1.5 p-1 bg-neutral-900/30 border border-neutral-800/80 rounded-xl w-max max-w-full">
                        {["ALL", "ISSUED", "PAID", "CANCELLED", "REFUNDED"].map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setActiveFilter(filter)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wide transition-all cursor-pointer select-none ${
                                    activeFilter === filter
                                        ?  "bg-emerald-600/10 border-emerald-500/30 text-emerald-400 shadow-md"
                                        : "text-neutral-400 hover:text-white hover:bg-neutral-800/40"
                                }`}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>

                    {/* MAIN LEDGER DATA SHEET TABLE */}
                    <div className="bg-neutral-900/20 border border-neutral-800/80 rounded-2xl overflow-hidden backdrop-blur-md">
                        {isLoading ? (
                            <div className="text-center py-24 text-neutral-500 font-mono text-xs animate-pulse">Syncing Transaction Core Ledgers...</div>
                        ) : filteredInvoices.length === 0 ? (
                            <div className="text-center py-24 text-neutral-600 font-mono text-xs flex flex-col items-center justify-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-neutral-700" />
                                <span>No invoices matching operational constraints.</span>
                            </div>
                        ) : (
                            <div className="overflow-x-auto w-full">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-neutral-800 bg-neutral-950/40 text-[10px] font-mono font-black text-neutral-500 uppercase tracking-wider select-none">
                                            <th className="py-3.5 px-4">Invoice Track #</th>
                                            <th className="py-3.5 px-4">Origin / Table</th>
                                            <th className="py-3.5 px-4">Customer ID</th>
                                            <th className="py-3.5 px-4 text-right">Settlement Due</th>
                                            <th className="py-3.5 px-4 text-center">Lifecycle Status</th>
                                            <th className="py-3.5 px-4 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-900/60 text-xs font-medium text-neutral-300">
                                        {filteredInvoices.map((invoice) => (
                                            <tr 
                                                key={invoice._id}
                                                className={`hover:bg-neutral-900/30 transition-colors group ${processingId === invoice._id ? "opacity-30 pointer-events-none" : ""} ${selectedInvoice?._id === invoice._id ? "bg-neutral-900/40" : ""}`}
                                            >
                                                <td className="py-4 px-4 font-mono font-bold text-white whitespace-nowrap">
                                                    {invoice.invoiceNumber?.split("-").slice(0, 2).join("-") || invoice._id.slice(-6).toUpperCase()}
                                                </td>
                                                <td className="py-4 px-4 whitespace-nowrap text-neutral-400">
                                                    Table {invoice.table?.tableNumber || "Dine-In"}
                                                </td>
                                                <td className="py-4 px-4 truncate max-w-32 text-neutral-400">
                                                    {invoice.customer?.name || "Anonymous Guest"}
                                                </td>
                                                <td className="py-4 px-4 font-mono font-bold text-white text-right whitespace-nowrap">
                                                    ₹{invoice.totalAmount.toLocaleString('en-IN')}
                                                </td>
                                                <td className="py-4 px-4 text-center whitespace-nowrap">
                                                    <span className={`px-2 py-0.5 text-[9px] font-mono font-black tracking-wider rounded border uppercase ${getStatusStyle(invoice.status)}`}>
                                                        {invoice.status}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 text-center whitespace-nowrap">
                                                    <button
                                                        onClick={() => setSelectedInvoice(invoice)}
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

                        {/* ARROW CORRIDOR CONTROLS */}
                        <div className="p-4 border-t border-neutral-800/80 bg-neutral-950/20 flex items-center justify-between select-none">
                            <span className="text-[10px] font-mono text-neutral-500 font-bold uppercase">
                                Page {pagination.page} of {pagination.totalPages || 1}
                            </span>
                            <div className="flex gap-1.5">
                                <Button
                                    disabled={currentPage <= 1 || isLoading}
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    variant="outline"
                                    className="border-neutral-800 bg-neutral-950 h-8 px-2.5 rounded-lg cursor-pointer text-xs"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                    disabled={currentPage >= pagination.totalPages || isLoading}
                                    onClick={() => setCurrentPage(p => p + 1)}
                                    variant="outline"
                                    className="border-neutral-800 bg-neutral-950 h-8 px-2.5 rounded-lg cursor-pointer text-xs"
                                >
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT SYSTEM RECEIPT DETAIL INSPECTOR SIDEBAR */}
                <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-5 backdrop-blur-md h-full space-y-5 min-h-[50vh]">
                    {selectedInvoice ? (
                        <div className="space-y-5 animate-scale-in">
                            <div className="flex justify-between items-start border-b border-neutral-800/60 pb-4">
                                <div className="space-y-1">
                                    <h4 className="text-sm font-black text-white uppercase tracking-tight">Ledger Deep Audit</h4>
                                    <span className="text-[10px] font-mono text-neutral-500 block font-bold">{selectedInvoice.invoiceNumber}</span>
                                </div>
                                <span className={`text-[9px] font-mono font-black tracking-wider px-2 py-0.5 border rounded uppercase ${getStatusStyle(selectedInvoice.status)}`}>
                                    {selectedInvoice.status}
                                </span>
                            </div>

                            <div className="space-y-2 bg-neutral-950/50 border border-neutral-900 p-3 rounded-xl text-[11px]">
                                <div className="flex items-center gap-2 text-neutral-400">
                                    <User className="w-3.5 h-3.5 text-neutral-600" />
                                    <span className="font-semibold text-neutral-300 truncate">{selectedInvoice.customer?.name}</span>
                                    <span className="text-neutral-600 font-mono">({selectedInvoice.customer?.email})</span>
                                </div>
                                <div className="flex items-center gap-2 text-neutral-400">
                                    <Layers className="w-3.5 h-3.5 text-neutral-600" />
                                    <span>Station Placement: <strong className="text-white font-bold">Table {selectedInvoice.table?.tableNumber}</strong></span>
                                </div>
                                <div className="flex items-center gap-2 text-neutral-400">
                                    <Calendar className="w-3.5 h-3.5 text-neutral-600" />
                                    <span>Stamped: <span className="font-mono text-[10px]">{new Date(selectedInvoice.issuedAt || selectedInvoice.createdAt).toLocaleString('en-IN')}</span></span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <span className="text-[10px] font-mono font-black text-neutral-500 uppercase tracking-wider block px-0.5">Snapshot Items Row Basket</span>
                                <div className="max-h-40 overflow-y-auto pr-1 border border-neutral-900 rounded-xl divide-y divide-neutral-900 bg-neutral-950/20 scrollbar-none">
                                    {selectedInvoice.items?.map((item, index) => (
                                        <div key={index} className="p-2.5 flex justify-between items-start text-xs">
                                            <div className="space-y-0.5">
                                                <p className="text-neutral-200 font-semibold leading-tight">{item.name}</p>
                                                <span className="text-[10px] font-mono text-neutral-500">₹{item.price} x {item.quantity}</span>
                                            </div>
                                            <span className="font-mono font-bold text-white text-[11px] pt-0.5">₹{item.subtotal}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="border-t border-neutral-800/60 pt-4 space-y-2.5 text-xs font-medium">
                                <div className="flex justify-between items-center text-neutral-400">
                                    <span>Basket Ticket Subtotal</span>
                                    <span className="font-mono">₹{selectedInvoice.subtotal}</span>
                                </div>
                                <div className="flex justify-between items-center text-red-400/90">
                                    <span>Configured Deductible Discount</span>
                                    <span className="font-mono">-₹{selectedInvoice.discount}</span>
                                </div>
                                <div className="flex justify-between items-center text-neutral-400">
                                    <span>System Standard Tax Rate</span>
                                    <span className="font-mono">+₹{selectedInvoice.tax}</span>
                                </div>
                                <div className="flex justify-between items-center text-neutral-400">
                                    <span>Service Gratuity Charge</span>
                                    <span className="font-mono">+₹{selectedInvoice.serviceCharge}</span>
                                </div>
                                <div className="flex justify-between items-baseline border-t border-neutral-900 pt-3 px-0.5">
                                    <span className="text-[10px] font-mono font-black uppercase text-neutral-400">Net Aggregation Total</span>
                                    <span className="text-xl font-mono font-black text-white">₹{selectedInvoice.totalAmount}</span>
                                </div>
                            </div>

                            <div className="space-y-2 pt-2 text-[10px] font-bold uppercase tracking-wider">
                                {selectedInvoice.status === "ISSUED" && (
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => setSettlingInvoice(selectedInvoice)}
                                            className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                                        >
                                            <CheckCircle2 className="w-3.5 h-3.5" /> Settle Dues
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (window.confirm("Void this system invoice ledger definitively?")) {
                                                    handleInvoiceAction(selectedInvoice._id, "cancel")
                                                }
                                            }}
                                            className="w-full py-2.5 px-3 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-red-400 hover:border-red-950/30 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                        >
                                            <Ban className="w-3.5 h-3.5" /> Void Ledger
                                        </button>
                                    </div>
                                )}

                                {selectedInvoice.status === "PAID" && (
                                    <button
                                        onClick={() => {
                                            if (window.confirm("Revert funds and issue transactional credit refund?")) {
                                                handleInvoiceAction(selectedInvoice._id, "refund")
                                            }
                                        }}
                                        className="w-full py-2.5 px-3 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-purple-400 hover:border-purple-900/30 transition-all cursor-pointer flex items-center justify-center gap-1.5 font-bold"
                                    >
                                        <Undo2 className="w-3.5 h-3.5 text-purple-500" /> Execute Return Refund
                                    </button>
                                )}

                                {["CANCELLED", "REFUNDED"].includes(selectedInvoice.status?.toUpperCase()) && (
                                    <div className="w-full py-2 bg-neutral-950 border border-neutral-900 text-neutral-600 text-[9px] font-mono text-center rounded-xl select-none">
                                        Ledger Block Finalised & Locked
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-600 font-mono text-xs border border-dashed border-neutral-800 rounded-xl bg-neutral-950/10">
                            <Receipt className="w-6 h-6 text-neutral-700 mb-2 animate-pulse" />
                            <span>Select an invoice item node to open auditing telemetry.</span>
                        </div>
                    )}
                </div>

            </div>

            <ProcessPaymentDialog
                isOpen={!!settlingInvoice}
                onClose={() => setSettlingInvoice(null)}
                onRefresh={() => {
                    loadInvoicesWorkspace()
                    setSelectedInvoice(null)
                }}
                restaurantId={restaurantId}
                invoice={settlingInvoice}
            />

        </div>
    )
}

