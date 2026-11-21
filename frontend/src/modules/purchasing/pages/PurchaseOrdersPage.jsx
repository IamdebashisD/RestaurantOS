import { useState, useEffect, useCallback } from "react"
import { useParams } from "react-router"
import {
    ShoppingBag,
    RefreshCw,
    Plus,
    Search,
    X,
    Truck,
    IndianRupee,
    Clock,
    CheckCircle2,
    Send,
    PackageCheck,
    Ban,
    Pencil,
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    Calendar,
    FileText
} from "lucide-react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { api } from "../../../lib/axios"
import PurchaseOrderDialog from "../components/PurchaseOrderDialog"
import ReceivePurchaseOrderDialog from "../components/ReceivePurchaseOrderDialog"

export default function PurchaseOrdersPage() {
    const { restaurantId } = useParams()

    // MASTER PURCHASE ORDERS & PAGINATION STATE
    const [purchaseOrders, setPurchaseOrders] = useState([])
    const [suppliers, setSuppliers] = useState([])
    const [inventoryItems, setInventoryItems] = useState([])
    const [meta, setMeta] = useState({
        page: 1,
        limit: 10,
        totalItems: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false
    })

    const [currentPage, setCurrentPage] = useState(1)
    const [activeFilter, setActiveFilter] = useState("ALL") // ALL | DRAFT | ORDERED | PARTIALLY_RECEIVED | RECEIVED | CANCELLED
    const [selectedSupplierFilter, setSelectedSupplierFilter] = useState("")
    const [searchQuery, setSearchQuery] = useState("")
    const [debouncedSearch, setDebouncedSearch] = useState("")
    const [selectedOrder, setSelectedOrder] = useState(null)

    const [isLoading, setIsLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState(null)
    const [processingId, setProcessingId] = useState(null)

    // MODAL STATES
    const [isDraftDialogOpen, setIsDraftDialogOpen] = useState(false)
    const [editingOrder, setEditingOrder] = useState(null)
    const [isReceiveDialogOpen, setIsReceiveDialogOpen] = useState(false)

    // Debounce PO number search (clears immediately when empty, waits 300ms when typing)
    useEffect(() => {
        if (!searchQuery.trim()) {
            setDebouncedSearch("")
            return
        }
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery.trim())
        }, 300)
        return () => clearTimeout(timer)
    }, [searchQuery])

    // =========================================================================
    // 📡 FETCH SUPPLIERS & INVENTORY CATALOGS FOR DROPDOWNS & NAME LOOKUPS
    // =========================================================================
    const loadReferenceCatalogs = useCallback(async () => {
        if (!restaurantId) return
        try {
            const [supRes, invRes] = await Promise.all([
                api.get(`/restaurants/${restaurantId}/suppliers`, { params: { page: 1, limit: 100 } }),
                api.get(`/restaurants/${restaurantId}/inventory`, { params: { page: 1, limit: 100 } })
            ])
            setSuppliers(supRes.data?.data?.suppliers || [])
            setInventoryItems(invRes.data?.data?.inventory || [])
        } catch (error) {
            console.error("[Purchasing Reference Catalogs Sync Failed]:", error)
        }
    }, [restaurantId])

    useEffect(() => {
        loadReferenceCatalogs()
    }, [loadReferenceCatalogs])

    // =========================================================================
    // 📡 FETCH PURCHASE ORDERS WITH ABORT CONTROLLER & SERVER FILTERS
    // =========================================================================
    const loadPurchaseOrdersWorkspace = useCallback(async (signal) => {
        setIsLoading(true)
        setErrorMessage(null)

        try {
            const params = {
                page: currentPage,
                limit: 10,
                ...(activeFilter !== "ALL" ? { status: activeFilter } : {}),
                ...(selectedSupplierFilter ? { supplier: selectedSupplierFilter } : {}),
                ...(debouncedSearch ? { search: debouncedSearch } : {})
            }

            const response = await api.get(`/restaurants/${restaurantId}/purchase-orders`, {
                params,
                signal
            })

            const fetchedOrders = response.data?.data?.purchaseOrders || []
            const fetchedMeta = response.data?.data?.meta || {
                page: 1,
                limit: 10,
                totalItems: fetchedOrders.length,
                totalPages: 1,
                hasNextPage: false,
                hasPrevPage: false
            }

            setPurchaseOrders(fetchedOrders)
            setMeta(fetchedMeta)
        } catch (error) {
            if (error.name === "CanceledError" || error.code === "ERR_CANCELED") return
            console.error("[Purchase Orders Sync Failed]:", error)
            setErrorMessage(
                error.response?.data?.message ||
                "Failed to load restaurant purchase orders."
            )
        } finally {
            if (!signal?.aborted) {
                setIsLoading(false)
            }
        }
    }, [restaurantId, currentPage, activeFilter, selectedSupplierFilter, debouncedSearch])

    useEffect(() => {
        if (!restaurantId) return
        const controller = new AbortController()
        loadPurchaseOrdersWorkspace(controller.signal)
        return () => controller.abort()
    }, [loadPurchaseOrdersWorkspace, restaurantId])

    // =========================================================================
    // ⚡ ATOMIC LIFECYCLE TRANSITIONS (/order & /cancel)
    // =========================================================================
    const handleLifecycleAction = async (orderId, actionEndpoint, confirmText) => {
        if (confirmText && !window.confirm(confirmText)) return
        setProcessingId(orderId)

        try {
            const response = await api.patch(
                `/restaurants/${restaurantId}/purchase-orders/${orderId}/${actionEndpoint}`
            )
            const updated = response.data?.data?.purchaseOrder || null
            if (updated) {
                setPurchaseOrders(prev =>
                    prev.map(po => (po._id === orderId ? updated : po))
                )
                if (selectedOrder?._id === orderId) {
                    setSelectedOrder(updated)
                }
            } else {
                loadPurchaseOrdersWorkspace()
            }
        } catch (error) {
            alert(
                error.response?.data?.message ||
                `Failed to ${actionEndpoint} purchase order.`
            )
        } finally {
            setProcessingId(null)
        }
    }

    const handleReceiveRefresh = (updatedOrder) => {
        if (updatedOrder) {
            setPurchaseOrders(prev =>
                prev.map(po => (po._id === updatedOrder._id ? updatedOrder : po))
            )
            if (selectedOrder?._id === updatedOrder._id) {
                setSelectedOrder(updatedOrder)
            }
        } else {
            loadPurchaseOrdersWorkspace()
        }
    }

    // Helper: Resolve Supplier Name from Object or ID
    const getSupplierName = (supplierRef) => {
        if (!supplierRef) return "Unknown Vendor"
        if (typeof supplierRef === "object" && supplierRef.name) return supplierRef.name
        const found = suppliers.find(s => s._id === supplierRef)
        return found ? found.name : "Vendor"
    }

    const getStatusBadgeStyle = (status) => {
        switch (status) {
            case "DRAFT":
                return "bg-neutral-800/80 border-neutral-700 text-neutral-300"
            case "ORDERED":
                return "bg-blue-500/10 border-blue-500/30 text-blue-400"
            case "PARTIALLY_RECEIVED":
                return "bg-amber-500/10 border-amber-500/30 text-amber-400"
            case "RECEIVED":
                return "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
            case "CANCELLED":
                return "bg-red-500/10 border-red-500/30 text-red-400"
            default:
                return "bg-neutral-900 border-neutral-800 text-neutral-400"
        }
    }

    // TELEMETRY AGGREGATORS
    const pageSpend = purchaseOrders
        .filter(po => po.status !== "CANCELLED")
        .reduce((sum, po) => sum + (Number(po.totalAmount) || 0), 0)
    const openDeliveriesCount = purchaseOrders.filter(po =>
        ["ORDERED", "PARTIALLY_RECEIVED"].includes(po.status)
    ).length
    const draftCount = purchaseOrders.filter(po => po.status === "DRAFT").length


    return (
        <div className="space-y-6 animate-fade-in pb-8 w-full select-none">

            {/* PANEL HEADER SYSTEM ACTION BLOCK */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-800 pb-5">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                        <ShoppingBag className="w-6 h-6 text-emerald-500" />
                        Purchase Orders & Procurement
                    </h2>
                    <p className="text-neutral-400 text-sm mt-1">
                        Create vendor restock drafts, confirm purchase orders, and receive deliveries directly into inventory stock.
                    </p>
                </div>

                <div className="flex items-center gap-3 self-start sm:self-auto">
                    <Button
                        onClick={() => loadPurchaseOrdersWorkspace()}
                        variant="outline"
                        className="border-neutral-800 text-neutral-400 hover:text-white bg-neutral-900/50 rounded-xl cursor-pointer"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                    </Button>

                    <Button
                        onClick={() => {
                            setEditingOrder(null)
                            setIsDraftDialogOpen(true)
                        }}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-2 rounded-xl px-4 py-2 cursor-pointer shadow-lg shadow-emerald-950/20 text-xs transition-all active:scale-[0.99]"
                    >
                        <Plus className="w-4 h-4" /> New Purchase Order
                    </Button>
                </div>
            </div>

            {/* TELEMETRIC SUMMARY CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-5 flex items-center justify-between backdrop-blur-md">
                    <div className="space-y-1">
                        <span className="text-[10px] text-neutral-500 font-mono font-bold uppercase tracking-wider block">
                            Page Procurement Volume
                        </span>
                        <span className="text-2xl font-black text-white font-mono">
                            ₹{Math.round(pageSpend).toLocaleString("en-IN")}
                        </span>
                    </div>
                    <div className="p-3 bg-emerald-950/20 border border-emerald-900/30 rounded-xl text-emerald-400">
                        <IndianRupee className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-5 flex items-center justify-between backdrop-blur-md">
                    <div className="space-y-1">
                        <span className="text-[10px] text-neutral-500 font-mono font-bold uppercase tracking-wider block">
                            Awaiting Shipment (Page)
                        </span>
                        <span className="text-2xl font-black text-white font-mono">
                            {openDeliveriesCount} Orders
                        </span>
                    </div>
                    <div className="p-3 bg-blue-950/20 border border-blue-900/30 rounded-xl text-blue-400">
                        <Truck className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-5 flex items-center justify-between backdrop-blur-md">
                    <div className="space-y-1">
                        <span className="text-[10px] text-neutral-500 font-mono font-bold uppercase tracking-wider block">
                            Pending Drafts (Page)
                        </span>
                        <span className="text-2xl font-black text-white font-mono">
                            {draftCount} Drafts
                        </span>
                    </div>
                    <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-400">
                        <Clock className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* SEARCH & SUPPLIER FILTER BAR */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
                <div className="relative flex items-center w-full max-w-md">
                    <Search className="absolute left-4 w-4 h-4 text-neutral-500 pointer-events-none" />
                    <Input
                        type="text"
                        placeholder="Search by PO number (e.g., PO-482910)..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value)
                            setCurrentPage(1)
                        }}
                        className="pl-11 pr-10 bg-neutral-900/50 border-neutral-800 text-white rounded-xl text-xs h-10 w-full focus:border-emerald-500"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearchQuery("")
                                setCurrentPage(1)
                            }}
                            className="absolute right-3 p-1 rounded-md text-neutral-500 hover:text-white hover:bg-neutral-800/60 transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-neutral-700"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                <select
                    value={selectedSupplierFilter}
                    onChange={(e) => {
                        setSelectedSupplierFilter(e.target.value)
                        setCurrentPage(1)
                    }}
                    className="h-10 px-3.5 bg-neutral-900/50 border border-neutral-800 text-neutral-300 rounded-xl text-xs focus:border-emerald-500 outline-none max-w-xs"
                >
                    <option value="">All Suppliers</option>
                    {suppliers.map((sup) => (
                        <option key={sup._id} value={sup._id}>
                            {sup.name}
                        </option>
                    ))}
                </select>
            </div>

            {errorMessage && (
                <div className="p-3 bg-red-900/20 border border-red-800/40 text-red-400 text-xs font-medium rounded-xl text-center">
                    {errorMessage}
                </div>
            )}

            {/* TWO-COLUMN PROCUREMENT LEDGER & ORDER INSPECTOR */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start w-full">

                {/* LEFT PURCHASE ORDERS TABLE */}
                <div className="xl:col-span-2 space-y-4">
                    <div className="flex flex-wrap items-center gap-2.5 w-full">
                        {[
                            { id: "ALL", label: "ALL ORDERS" },
                            { id: "DRAFT", label: "DRAFT" },
                            { id: "ORDERED", label: "ORDERED" },
                            { id: "PARTIALLY_RECEIVED", label: "PARTIAL" },
                            { id: "RECEIVED", label: "RECEIVED" },
                            { id: "CANCELLED", label: "CANCELLED" }
                        ].map((tab) => {
                            const isActive = activeFilter === tab.id
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        setActiveFilter(tab.id)
                                        setCurrentPage(1)
                                    }}
                                    className={`px-3.5 py-2 rounded-xl text-xs font-bold tracking-wide border cursor-pointer select-none uppercase transition-all duration-200 ${isActive
                                            ? "bg-emerald-600/10 border-emerald-500 text-emerald-400 font-extrabold shadow-lg shadow-emerald-950/20"
                                            : "border-neutral-800 bg-neutral-900/40 text-neutral-400 hover:border-neutral-700 hover:text-white"
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            )
                        })}
                    </div>

                    <div className="bg-neutral-900/20 border border-neutral-800/80 rounded-2xl overflow-hidden backdrop-blur-md">
                        {isLoading ? (
                            <div className="text-center py-24 text-neutral-500 font-mono text-xs animate-pulse">
                                Syncing Procurement Orders...
                            </div>
                        ) : purchaseOrders.length === 0 ? (
                            <div className="text-center py-24 text-neutral-600 font-mono text-xs flex flex-col items-center justify-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-neutral-700" />
                                <span>No purchase orders match the active filter or search criteria.</span>
                            </div>
                        ) : (
                            <div className="overflow-x-auto w-full">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-neutral-800 bg-neutral-950/40 text-[10px] font-mono font-black text-neutral-500 uppercase tracking-wider select-none">
                                            <th className="py-3.5 px-4">PO Reference</th>
                                            <th className="py-3.5 px-4">Supplier</th>
                                            <th className="py-3.5 px-4 text-center">Items</th>
                                            <th className="py-3.5 px-4 text-right">Total</th>
                                            <th className="py-3.5 px-4 text-center">Status</th>
                                            <th className="py-3.5 px-4 text-right">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-900/60 text-xs font-medium text-neutral-300">
                                        {purchaseOrders.map((po) => {
                                            const isSelected = selectedOrder?._id === po._id
                                            const isProcessing = processingId === po._id

                                            return (
                                                <tr
                                                    key={po._id}
                                                    onClick={() => setSelectedOrder(po)}
                                                    className={`hover:bg-neutral-900/40 transition-colors cursor-pointer ${isSelected ? "bg-neutral-900/60" : ""
                                                        } ${isProcessing ? "opacity-40 pointer-events-none" : ""}`}
                                                >
                                                    <td className="py-4 px-4 font-mono font-black text-white whitespace-nowrap">
                                                        {po.purchaseOrderNumber}
                                                    </td>
                                                    <td className="py-4 px-4 text-neutral-300 font-semibold">
                                                        {getSupplierName(po.supplier)}
                                                    </td>
                                                    <td className="py-4 px-4 text-center font-mono text-neutral-400">
                                                        {po.items?.length || 0}
                                                    </td>
                                                    <td className="py-4 px-4 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                                                        ₹{po.totalAmount?.toLocaleString("en-IN")}
                                                    </td>
                                                    <td className="py-4 px-4 text-center whitespace-nowrap">
                                                        <span
                                                            className={`px-2 py-0.5 text-[9px] font-mono font-black tracking-wider rounded border uppercase ${getStatusBadgeStyle(
                                                                po.status
                                                            )}`}
                                                        >
                                                            {po.status.replace("_", " ")}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4 text-right font-mono text-[11px] text-neutral-500 whitespace-nowrap">
                                                        {new Date(po.createdAt).toLocaleDateString("en-IN")}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* PAGINATION STRIP */}
                        <div className="p-4 border-t border-neutral-800/80 bg-neutral-950/20 flex items-center justify-between select-none">
                            <span className="text-[10px] font-mono text-neutral-500 font-bold uppercase">
                                Page {meta.page} of {meta.totalPages || 1} ({meta.totalItems} Total)
                            </span>
                            <div className="flex gap-1.5">
                                <Button
                                    disabled={!meta.hasPrevPage || isLoading}
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    variant="outline"
                                    className="border-neutral-800 bg-neutral-950 h-8 px-2.5 rounded-lg cursor-pointer text-xs"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                    disabled={!meta.hasNextPage || isLoading}
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

                {/* RIGHT PURCHASE ORDER INSPECTOR SIDEBAR */}
                <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-5 backdrop-blur-md h-full space-y-5 min-h-[55vh]">
                    {selectedOrder ? (
                        <div className="space-y-5 animate-scale-in">
                            <div className="flex justify-between items-start border-b border-neutral-800/60 pb-4">
                                <div>
                                    <h4 className="text-base font-black text-white tracking-tight font-mono">
                                        {selectedOrder.purchaseOrderNumber}
                                    </h4>
                                    <span className="text-xs font-semibold text-neutral-400 block mt-0.5">
                                        {getSupplierName(selectedOrder.supplier)}
                                    </span>
                                </div>
                                <span
                                    className={`text-[9px] font-mono font-black tracking-wider px-2 py-0.5 border rounded uppercase ${getStatusBadgeStyle(
                                        selectedOrder.status
                                    )}`}
                                >
                                    {selectedOrder.status.replace("_", " ")}
                                </span>
                            </div>

                            {/* LIFECYCLE DATES */}
                            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-neutral-950/50 border border-neutral-900 p-3 rounded-xl text-neutral-400">
                                <div>
                                    <span className="text-neutral-600 block uppercase">Expected ETA</span>
                                    <span className="text-neutral-200 font-bold flex items-center gap-1 mt-0.5">
                                        <Calendar className="w-3 h-3 text-neutral-500" />
                                        {selectedOrder.expectedDeliveryDate
                                            ? new Date(selectedOrder.expectedDeliveryDate).toLocaleDateString("en-IN")
                                            : "Not set"}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-neutral-600 block uppercase">Ordered At</span>
                                    <span className="text-neutral-200 font-bold block mt-0.5">
                                        {selectedOrder.orderedAt
                                            ? new Date(selectedOrder.orderedAt).toLocaleDateString("en-IN")
                                            : "Draft Stage"}
                                    </span>
                                </div>
                            </div>

                            {/* LINE ITEMS & RECEIVING PROGRESS */}
                            <div className="space-y-2.5 bg-neutral-950/60 border border-neutral-900 p-3.5 rounded-xl">
                                <div className="text-[9px] font-mono font-black text-neutral-500 uppercase tracking-wider border-b border-neutral-900 pb-1.5">
                                    Line Items ({selectedOrder.items?.length || 0})
                                </div>

                                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1 scrollbar-none">
                                    {selectedOrder.items?.map((item, idx) => {
                                        const pct =
                                            item.quantity > 0
                                                ? Math.min(
                                                    100,
                                                    Math.round(((item.receivedQuantity || 0) / item.quantity) * 100)
                                                )
                                                : 0

                                        return (
                                            <div key={idx} className="space-y-1 text-xs">
                                                <div className="flex items-center justify-between font-semibold">
                                                    <span className="text-white">{item.name}</span>
                                                    <span className="font-mono text-emerald-400">
                                                        ₹{item.subtotal?.toLocaleString("en-IN")}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
                                                    <span>
                                                        {item.quantity} {item.unit} @ ₹{item.costPerUnit}
                                                    </span>
                                                    <span>
                                                        Recv: {item.receivedQuantity || 0}/{item.quantity} {item.unit} ({pct}%)
                                                    </span>
                                                </div>
                                                <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-emerald-500 transition-all"
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>

                                <div className="pt-2 border-t border-neutral-900 space-y-1 font-mono text-xs">
                                    <div className="flex justify-between text-neutral-400 text-[11px]">
                                        <span>Subtotal</span>
                                        <span>₹{selectedOrder.subtotal?.toLocaleString("en-IN")}</span>
                                    </div>
                                    <div className="flex justify-between text-neutral-400 text-[11px]">
                                        <span>Tax / Freight</span>
                                        <span>₹{selectedOrder.tax?.toLocaleString("en-IN")}</span>
                                    </div>
                                    <div className="flex justify-between font-black text-white pt-1 border-t border-neutral-900">
                                        <span>Total Payable</span>
                                        <span className="text-emerald-400">
                                            ₹{selectedOrder.totalAmount?.toLocaleString("en-IN")}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {selectedOrder.notes && (
                                <div className="p-3 bg-neutral-950/60 border border-neutral-900 rounded-xl text-xs space-y-1">
                                    <span className="text-[9px] font-mono font-black text-neutral-500 uppercase flex items-center gap-1.5">
                                        <FileText className="w-3 h-3" /> Dispatch Notes
                                    </span>
                                    <p className="text-neutral-300 italic">"{selectedOrder.notes}"</p>
                                </div>
                            )}

                            {/* WORKFLOW STATE ACTIONS */}
                            <div className="space-y-2 pt-1">
                                {selectedOrder.status === "DRAFT" && (
                                    <>
                                        <button
                                            onClick={() =>
                                                handleLifecycleAction(
                                                    selectedOrder._id,
                                                    "order",
                                                    `Confirm and place ${selectedOrder.purchaseOrderNumber} with supplier?`
                                                )
                                            }
                                            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-blue-950/20"
                                        >
                                            <Send className="w-3.5 h-3.5" /> Confirm & Place Order
                                        </button>

                                        <div className="grid grid-cols-2 gap-2 text-[10px] font-bold uppercase">
                                            <button
                                                onClick={() => {
                                                    setEditingOrder(selectedOrder)
                                                    setIsDraftDialogOpen(true)
                                                }}
                                                className="py-2.5 px-3 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-300 hover:text-white transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                            >
                                                <Pencil className="w-3.5 h-3.5" /> Edit Draft
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleLifecycleAction(
                                                        selectedOrder._id,
                                                        "cancel",
                                                        `Cancel draft ${selectedOrder.purchaseOrderNumber}?`
                                                    )
                                                }
                                                className="py-2.5 px-3 rounded-xl bg-red-950/20 border border-red-900/40 text-red-400 hover:bg-red-950/40 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                            >
                                                <Ban className="w-3.5 h-3.5" /> Cancel
                                            </button>
                                        </div>
                                    </>
                                )}

                                {["ORDERED", "PARTIALLY_RECEIVED"].includes(selectedOrder.status) && (
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => setIsReceiveDialogOpen(true)}
                                            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/20"
                                        >
                                            <PackageCheck className="w-4 h-4" /> Receive Shipment Stock
                                        </button>

                                        {selectedOrder.status === "ORDERED" && (
                                            <button
                                                onClick={() =>
                                                    handleLifecycleAction(
                                                        selectedOrder._id,
                                                        "cancel",
                                                        `Cancel open purchase order ${selectedOrder.purchaseOrderNumber}?`
                                                    )
                                                }
                                                className="w-full py-2 px-3 rounded-xl bg-red-950/20 border border-red-900/40 text-red-400 hover:bg-red-950/40 font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                            >
                                                <Ban className="w-3.5 h-3.5" /> Cancel Order
                                            </button>
                                        )}
                                    </div>
                                )}

                                {selectedOrder.status === "RECEIVED" && (
                                    <div className="p-3 bg-emerald-950/20 border border-emerald-900/30 rounded-xl text-center text-xs font-mono text-emerald-400 flex items-center justify-center gap-2">
                                        <CheckCircle2 className="w-4 h-4" /> Fully Received & Logged
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-600 font-mono text-xs border border-dashed border-neutral-800 rounded-xl bg-neutral-950/10">
                            <ShoppingBag className="w-6 h-6 text-neutral-700 mb-2 animate-pulse" />
                            <span>Select a purchase order row to inspect line items, place orders, or receive stock.</span>
                        </div>
                    )}
                </div>
            </div>

            {/* MODALS */}
            <PurchaseOrderDialog
                isOpen={isDraftDialogOpen}
                onClose={() => {
                    setIsDraftDialogOpen(false)
                    setEditingOrder(null)
                }}
                onRefresh={() => {
                    loadPurchaseOrdersWorkspace()
                    setSelectedOrder(null)
                }}
                restaurantId={restaurantId}
                suppliers={suppliers}
                inventoryItems={inventoryItems}
                editingOrder={editingOrder}
            />

            <ReceivePurchaseOrderDialog
                isOpen={isReceiveDialogOpen}
                onClose={() => setIsReceiveDialogOpen(false)}
                onRefresh={handleReceiveRefresh}
                restaurantId={restaurantId}
                purchaseOrder={selectedOrder}
            />
        </div>
    )
}

