import { useState, useEffect, useCallback } from "react"
import { useParams } from "react-router"
import {
    Package,
    RefreshCw,
    Plus,
    Search,
    AlertTriangle,
    IndianRupee,
    CheckCircle2,
    Pencil,
    ArrowDownToLine,
    ArrowUpFromLine,
    SlidersHorizontal,
    Trash2,
    ChevronLeft,
    ChevronRight,
    History,
    User
} from "lucide-react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { api } from "../../../lib/axios"
import InventoryItemDialog from "../components/InventoryItemDialog"
import StockMovementDialog from "../components/StockMovementDialog"


export default function InventoryPage() {
    const { restaurantId } = useParams()

    // MASTER INVENTORY LIST & PAGINATION STATE
    const [items, setItems] = useState([])
    const [meta, setMeta] = useState({
        page: 1,
        limit: 10,
        totalItems: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false
    })

    const [currentPage, setCurrentPage] = useState(1)
    const [activeFilter, setActiveFilter] = useState("ALL") // ALL | LOW_STOCK | ACTIVE | INACTIVE
    const [searchQuery, setSearchQuery] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState(null)

    // RIGHT-SIDE AUDIT INSPECTOR & HISTORY STATE
    const [selectedItem, setSelectedItem] = useState(null)
    const [transactions, setTransactions] = useState([])
    const [historyMeta, setHistoryMeta] = useState({
        page: 1,
        limit: 8,
        totalItems: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false
    })

    const [historyPage, setHistoryPage] = useState(1)
    const [isHistoryLoading, setIsHistoryLoading] = useState(false)

    // MODAL DIALOG STATES
    const [isItemDialogOpen, setIsItemDialogOpen] = useState(false)
    const [editingItem, setEditingItem] = useState(null)
    const [movementModal, setMovementModal] = useState({
        isOpen: false,
        item: null,
        type: "STOCK_IN"
    })


    // =========================================================================
    // 📡 FETCH INVENTORY ITEMS (ALL OR DEDICATED LOW-STOCK ENDPOINT)
    // =========================================================================
    const loadInventoryWorkspace = useCallback(async () => {
        setIsLoading(true)
        setErrorMessage(null)

        try {
            const endpoint = 
                activeFilter === "LOW_STOCK"
                ? `/restaurants/${restaurantId}/inventory/low-stock`
                : `/restaurants/${restaurantId}/inventory`

            const response = await api.get(endpoint, {
                params: { page: currentPage, limit: 10 }
            })

            const fetchedItems = response.data?.data?.inventory || []
            const fetchedMeta = response.data?.data?.meta || {
                page: 1,
                limit: 10,
                totalItems: 0,
                totalPages: fetchedItems.length,
                hasNextPage: false,
                hasPrevPage: false
            }
            setItems(fetchedItems)
            setMeta(fetchedMeta)
        } catch (error) {
            console.error("[Inventory Workspace Sync Failed]:", error)
            setErrorMessage(
                error.response?.data?.message ||
                "Failed to load restaurant inventory stock ledger."
            )
        } finally {
            setIsLoading(false)
        }
    }, [restaurantId, activeFilter, currentPage])

    useEffect(() => {
        if (restaurantId) loadInventoryWorkspace()
    }, [loadInventoryWorkspace])


    // =========================================================================
    // 📜 FETCH ITEM AUDIT LEDGER HISTORY
    // =========================================================================
    const loadItemHistory = useCallback(async (itemId, pageNum = 1) => {
        if (!itemId) return null
        setIsHistoryLoading(true)

        try {
            const response = await api.get(
                `/restaurants/${restaurantId}/inventory/${itemId}/history`,
                { params: { page: pageNum, limit: 8 } }
            )
            setTransactions(response.data?.data?.transactions || [])
            setHistoryMeta(
                response.data?.data?.meta || {
                    page: 1,
                    limit: 8,
                    totalItems: 0,
                    totalPages: 1,
                    hasNextPage: false,
                    hasPrevPage: false
                }
            )
        } catch (error) {
            console.error("[Inventory History Fetch Failed]:", error)
            setTransactions([])
        } finally {
            setIsHistoryLoading(false)
        }
    }, [restaurantId])

    const handleSelectItem = (item) => {
        setSelectedItem(item)
        setHistoryPage(1)
        loadItemHistory(item._id, 1)
    }

    const handleHistoryPageChange = (newPage) => {
        if (!selectedItem) return
        setHistoryPage(newPage)
        loadItemHistory(selectedItem._id, newPage)
    }

    const handleMovementRefresh = (updatedInventory) => {
        if (updatedInventory) {
            setItems(prev => 
                prev.map(it => it._id === updatedInventory._id ? updatedInventory : it)
            )
            if (selectedItem?._id === updatedInventory._id) {
                setSelectedItem(updatedInventory)
                setHistoryPage(1)
                loadItemHistory(updatedInventory._id, 1)
            }
        } else {
            loadInventoryWorkspace()
            if (selectedItem) loadItemHistory(selectedItem._id, historyPage)
        }
    }

    // METRIC SUMMARY AGGREGATORS
    const totalValuation = items.reduce(
        (sum, it) => sum + (Number(it.currentQuantity) || 0) * (Number(it.costPerUnit) || 0),
        0
    )
    const lowStockCount = items.filter(
        it => it.status === "ACTIVE" && Number(it.currentQuantity) <= Number(it.minimumQuantity)
    ).length
    const activeCount = items.filter(it => it.status === "ACTIVE").length

    // CLIENT-SIDE SEARCH & STATUS FILTERING
    const displayedItems = items.filter((item) => {
        const matchesSearch = item.name
            ?.toLowerCase()
            .includes(searchQuery.trim().toLowerCase())
        if (!matchesSearch) return false

        if (activeFilter === "ACTIVE") return item.status === "ACTIVE"
        if (activeFilter === "INACTIVE") return item.status === "INACTIVE"
        return true
    })

    const getMovementBadgeStyle = (type) => {
        switch (type) {
            case "STOCK_IN":
                return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            case "STOCK_OUT":
                return "bg-blue-500/10 border-blue-500/20 text-blue-400"
            case "ADJUSTMENT":
                return "bg-amber-500/10 border-amber-500/20 text-amber-400"
            case "WASTAGE":
                return "bg-red-500/10 border-red-500/20 text-red-400"
            default:
                return "bg-neutral-900 border-neutral-800 text-neutral-400"
        }
    }


    return (
        <div className="space-y-6 animate-fade-in pb-8 w-full select-none">

            {/* PANEL HEADER SYSTEM ACTION BLOCK */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-800 pb-5">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                        <Package className="w-5 h-5 text-emerald-500" />
                        Inventory & Stock Control Ledger
                    </h2>
                    <p className="text-neutral-400 text-sm mt-1">
                        Track raw ingredient levels, weighted unit valuations, low-stock alerts, and immutable movement audits.
                    </p>
                </div>

                <div className="flex items-center gap-3 self-start sm:self-auto">
                    <Button
                        onClick={loadInventoryWorkspace}
                        variant="outline"
                        className="border-neutral-800 text-neutral-400 hover:text-white bg-neutral-900/50 rounded-xl cursor-pointer"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                    </Button>

                    <Button
                        onClick={() => {
                            setEditingItem(null)
                            setIsItemDialogOpen(true)
                        }}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-2 rounded-xl px-4 py-2 cursor-pointer shadow-lg shadow-emerald-950/20 text-xs transition-all active:scale-[0.99]"
                    >
                        <Plus className="w-4 h-4" /> Register Stock Item
                    </Button>
                </div>
            </div>

            {/* TELEMETRIC SUMMARY CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-5 flex items-center justify-between backdrop-blur-md">
                    <div className="space-y-1">
                        <span className="text-[10px] text-neutral-500 font-mono font-bold uppercase tracking-wider block">
                            Page Stock Valuation
                        </span>
                        <span className="text-2xl font-black text-white font-mono">
                            ₹{Math.round(totalValuation).toLocaleString("en-IN")}
                        </span>
                    </div>
                    <div className="p-3 bg-emerald-950/20 border border-emerald-900/30 rounded-xl text-emerald-400">
                        <IndianRupee className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-5 flex items-center justify-between backdrop-blur-md">
                    <div className="space-y-1">
                        <span className="text-[10px] text-neutral-500 font-mono font-bold uppercase tracking-wider block">
                            Low-Stock Alerts (Page)
                        </span>
                        <span className="text-2xl font-black text-white font-mono">
                            {lowStockCount} Items
                        </span>
                    </div>
                    <div className="p-3 bg-amber-950/20 border border-amber-900/30 rounded-xl text-amber-400">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-5 flex items-center justify-between backdrop-blur-md">
                    <div className="space-y-1">
                        <span className="text-[10px] text-neutral-500 font-mono font-bold uppercase tracking-wider block">
                            Active Catalog Assets
                        </span>
                        <span className="text-2xl font-black text-white font-mono">
                            {activeCount} / {meta.totalItems || items.length}
                        </span>
                    </div>
                    <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-400">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* SEARCH INPUT */}
            <div className="relative flex items-center w-full max-w-md">
                <Search className="absolute left-4 w-4 h-4 text-neutral-500 pointer-events-none" />
                <Input
                    type="text"
                    placeholder="Filter ingredients by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-11 bg-neutral-900/50 border-neutral-800 text-white rounded-xl text-xs h-10 w-full focus:border-emerald-500"
                />
            </div>

            {errorMessage && (
                <div className="p-3 bg-red-900/20 border border-red-800/40 text-red-400 text-xs font-medium rounded-xl text-center">
                    {errorMessage}
                </div>
            )}

            {/* MAIN TWO-COLUMN WORKSPACE */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start w-full">

                {/* LEFT INVENTORY TABLE MATRIX */}
                <div className="xl:col-span-2 space-y-4">
                    {/* Floating Menu-Style Filter Tabs */}
                    <div className="flex flex-wrap items-center gap-3 w-full">
                        {[
                            { id: "ALL", label: "ALL ITEMS" },
                            { id: "LOW_STOCK", label: "LOW STOCK ALERTS" },
                            { id: "ACTIVE", label: "ACTIVE" },
                            { id: "INACTIVE", label: "INACTIVE" }
                        ].map((tab) => {
                            const isActive = activeFilter === tab.id
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        setActiveFilter(tab.id)
                                        setCurrentPage(1)
                                    }}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide border cursor-pointer select-none uppercase transition-all duration-200 ${
                                        isActive
                                            ? "bg-emerald-600/10 border-emerald-500 text-emerald-400 font-extrabold shadow-lg shadow-emerald-950/20"
                                            : "border-neutral-800 bg-neutral-900/40 text-neutral-400 hover:border-neutral-700 hover:text-white"
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            )
                        })}
                    </div>

                    {/* DATA TABLE */}
                    <div className="bg-neutral-900/20 border border-neutral-800/80 rounded-2xl overflow-hidden backdrop-blur-md">
                        {isLoading ? (
                            <div className="text-center py-24 text-neutral-500 font-mono text-xs animate-pulse">
                                Syncing Warehouse Stock Ledgers...
                            </div>
                        ) : displayedItems.length === 0 ? (
                            <div className="text-center py-24 text-neutral-600 font-mono text-xs flex flex-col items-center justify-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-neutral-700" />
                                <span>No inventory items match current filter criteria.</span>
                            </div>
                        ) : (
                            <div className="overflow-x-auto w-full">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-neutral-800 bg-neutral-950/40 text-[10px] font-mono font-black text-neutral-500 uppercase tracking-wider select-none">
                                            <th className="py-3.5 px-4">Asset Name</th>
                                            <th className="py-3.5 px-4 text-right">Current Stock</th>
                                            <th className="py-3.5 px-4 text-right">Min Alert</th>
                                            <th className="py-3.5 px-4 text-right">Unit Cost</th>
                                            <th className="py-3.5 px-4 text-center">Status</th>
                                            <th className="py-3.5 px-4 text-right">Quick Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-900/60 text-xs font-medium text-neutral-300">
                                        {displayedItems.map((item) => {
                                            const isLowStock =
                                                item.status === "ACTIVE" &&
                                                Number(item.currentQuantity) <= Number(item.minimumQuantity)
                                            const isSelected = selectedItem?._id === item._id

                                            return (
                                                <tr
                                                    key={item._id}
                                                    onClick={() => handleSelectItem(item)}
                                                    className={`hover:bg-neutral-900/40 transition-colors cursor-pointer ${
                                                        isSelected ? "bg-neutral-900/60" : ""
                                                    }`}
                                                >
                                                    <td className="py-4 px-4">
                                                        <div className="font-bold text-white flex items-center gap-2">
                                                            <span>{item.name}</span>
                                                            {isLowStock && (
                                                                <span className="px-1.5 py-0.5 text-[9px] font-mono font-black rounded bg-amber-500/15 border border-amber-500/30 text-amber-400 uppercase">
                                                                    LOW
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    <td className="py-4 px-4 text-right font-mono font-black whitespace-nowrap">
                                                        <span className={isLowStock ? "text-amber-400" : "text-white"}>
                                                            {item.currentQuantity}
                                                        </span>{" "}
                                                        <span className="text-neutral-500 text-[10px]">
                                                            {item.unit}
                                                        </span>
                                                    </td>

                                                    <td className="py-4 px-4 text-right font-mono text-neutral-400 whitespace-nowrap">
                                                        {item.minimumQuantity} {item.unit}
                                                    </td>

                                                    <td className="py-4 px-4 text-right font-mono text-neutral-300 whitespace-nowrap">
                                                        ₹{item.costPerUnit}
                                                    </td>

                                                    <td className="py-4 px-4 text-center whitespace-nowrap">
                                                        <span
                                                            className={`px-2 py-0.5 text-[9px] font-mono font-black tracking-wider rounded border uppercase ${
                                                                item.status === "ACTIVE"
                                                                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                                                    : "bg-red-500/10 border-red-500/20 text-red-400"
                                                            }`}
                                                        >
                                                            {item.status}
                                                        </span>
                                                    </td>

                                                    <td
                                                        className="py-4 px-4 text-right whitespace-nowrap"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <div className="inline-flex items-center gap-1">
                                                            {item.status === "ACTIVE" && (
                                                                <>
                                                                    <button
                                                                        title="Stock In"
                                                                        onClick={() =>
                                                                            setMovementModal({
                                                                                isOpen: true,
                                                                                item,
                                                                                type: "STOCK_IN"
                                                                            })
                                                                        }
                                                                        className="p-1.5 rounded-lg border border-neutral-800 bg-neutral-950 text-emerald-400 hover:border-emerald-700 transition-colors cursor-pointer"
                                                                    >
                                                                        <ArrowDownToLine className="w-3.5 h-3.5" />
                                                                    </button>
                                                                    <button
                                                                        title="Stock Out"
                                                                        onClick={() =>
                                                                            setMovementModal({
                                                                                isOpen: true,
                                                                                item,
                                                                                type: "STOCK_OUT"
                                                                            })
                                                                        }
                                                                        className="p-1.5 rounded-lg border border-neutral-800 bg-neutral-950 text-blue-400 hover:border-blue-700 transition-colors cursor-pointer"
                                                                    >
                                                                        <ArrowUpFromLine className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </>
                                                            )}
                                                           <button
                                                                title="Edit Asset Metadata"
                                                                onClick={() => {
                                                                    setEditingItem(item)
                                                                    setIsItemDialogOpen(true)
                                                                }}
                                                                className="p-1.5 rounded-lg border border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                                                            >
                                                                <Pencil className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
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

                {/* RIGHT AUDIT LEDGER & MOVEMENT INSPECTOR SIDEBAR */}
                <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-5 backdrop-blur-md h-full space-y-5 min-h-[55vh]">
                    {selectedItem ? (
                        <div className="space-y-5 animate-scale-in">
                            <div className="flex justify-between items-start border-b border-neutral-800/60 pb-4">
                                <div>
                                    <h4 className="text-base font-black text-white tracking-tight">
                                        {selectedItem.name}
                                    </h4>
                                    <span className="text-[10px] font-mono text-neutral-500 font-bold uppercase">
                                        Valuation: ₹
                                        {Math.round(
                                            selectedItem.currentQuantity * selectedItem.costPerUnit
                                        ).toLocaleString("en-IN")}{" "}
                                        (@ ₹{selectedItem.costPerUnit}/{selectedItem.unit})
                                    </span>
                                </div>
                                <span
                                    className={`text-[9px] font-mono font-black tracking-wider px-2 py-0.5 border rounded uppercase ${
                                        selectedItem.status === "ACTIVE"
                                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                            : "bg-red-500/10 border-red-500/20 text-red-400"
                                    }`}
                                >
                                    {selectedItem.status}
                                </span>
                            </div>

                            {/* 4-WAY LEDGER ACTION BUTTONS */}
                            {selectedItem.status === "ACTIVE" && (
                                <div className="grid grid-cols-2 gap-2 text-[10px] font-bold uppercase tracking-wider">
                                    <button
                                        onClick={() =>
                                            setMovementModal({
                                                isOpen: true,
                                                item: selectedItem,
                                                type: "STOCK_IN"
                                            })
                                        }
                                        className="py-2.5 px-3 rounded-xl bg-emerald-600/15 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-600/25 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                    >
                                        <ArrowDownToLine className="w-3.5 h-3.5" /> Stock In
                                    </button>
                                    <button
                                        onClick={() =>
                                            setMovementModal({
                                                isOpen: true,
                                                item: selectedItem,
                                                type: "STOCK_OUT"
                                            })
                                        }
                                        className="py-2.5 px-3 rounded-xl bg-blue-600/15 border border-blue-500/40 text-blue-400 hover:bg-blue-600/25 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                    >
                                        <ArrowUpFromLine className="w-3.5 h-3.5" /> Stock Out
                                    </button>
                                    <button
                                        onClick={() =>
                                            setMovementModal({
                                                isOpen: true,
                                                item: selectedItem,
                                                type: "ADJUSTMENT"
                                            })
                                        }
                                        className="py-2.5 px-3 rounded-xl bg-neutral-950 border border-neutral-800 text-amber-400 hover:border-amber-700/50 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                    >
                                        <SlidersHorizontal className="w-3.5 h-3.5" /> Adjust Count
                                    </button>
                                    <button
                                        onClick={() =>
                                            setMovementModal({
                                                isOpen: true,
                                                item: selectedItem,
                                                type: "WASTAGE"
                                            })
                                        }
                                        className="py-2.5 px-3 rounded-xl bg-neutral-950 border border-neutral-800 text-red-400 hover:border-red-700/50 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" /> Log Wastage
                                    </button>
                                </div>
                            )}

                             {/* IMMUTABLE AUDIT MOVEMENT FEED */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-[10px] font-mono font-black text-neutral-500 uppercase tracking-wider">
                                    <span className="flex items-center gap-1.5">
                                        <History className="w-3.5 h-3.5 text-neutral-500" />
                                        Audit Ledger Trail
                                    </span>
                                    <span>{historyMeta.totalItems || transactions.length} Logs</span>
                                </div>

                                {isHistoryLoading ? (
                                    <div className="text-center py-10 text-neutral-500 font-mono text-xs animate-pulse">
                                        Loading Movement Logs...
                                    </div>
                                ) : transactions.length === 0 ? (
                                    <div className="text-center py-10 text-neutral-600 font-mono text-xs border border-dashed border-neutral-800 rounded-xl">
                                        No stock movements logged yet.
                                    </div>
                                ) : (
                                    <div className="space-y-2.5 max-h-105 overflow-y-auto pr-1 scrollbar-none">
                                        {transactions.map((tx) => (
                                            <div
                                                key={tx._id}
                                                className="bg-neutral-950/70 border border-neutral-900 rounded-xl p-3 space-y-1.5 text-xs"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span
                                                        className={`px-2 py-0.5 text-[9px] font-mono font-black rounded border uppercase ${getMovementBadgeStyle(
                                                            tx.type
                                                        )}`}
                                                    >
                                                        {tx.type.replace("_", " ")}
                                                    </span>
                                                    <span className="font-mono font-bold text-white text-[11px]">
                                                        {tx.previousQuantity} → {tx.resultingQuantity}{" "}
                                                        {selectedItem.unit}
                                                    </span>
                                                </div>

                                                {tx.reason && (
                                                    <p className="text-neutral-400 text-[11px] italic">
                                                        "{tx.reason}"
                                                    </p>
                                                )}

                                                <div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono pt-1 border-t border-neutral-900/80">
                                                    <span className="flex items-center gap-1 truncate max-w-32">
                                                        <User className="w-3 h-3" />
                                                        {tx.performedBy?.name || "Operator"}
                                                    </span>
                                                    <span>
                                                        {new Date(tx.createdAt).toLocaleDateString("en-IN")}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* AUDIT FEED PAGINATION */}
                                {historyMeta.totalPages > 1 && (
                                    <div className="flex items-center justify-between pt-2 border-t border-neutral-800/60">
                                        <span className="text-[10px] font-mono text-neutral-500">
                                            Page {historyMeta.page} / {historyMeta.totalPages}
                                        </span>
                                        <div className="flex gap-1">
                                            <button
                                                disabled={!historyMeta.hasPrevPage}
                                                onClick={() => handleHistoryPageChange(historyPage - 1)}
                                                className="p-1.5 rounded-lg border border-neutral-800 bg-neutral-950 text-neutral-400 disabled:opacity-30 cursor-pointer"
                                            >
                                                <ChevronLeft className="w-3 h-3" />
                                            </button>
                                            <button
                                                disabled={!historyMeta.hasNextPage}
                                                onClick={() => handleHistoryPageChange(historyPage + 1)}
                                                className="p-1.5 rounded-lg border border-neutral-800 bg-neutral-950 text-neutral-400 disabled:opacity-30 cursor-pointer"
                                            >
                                                <ChevronRight className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-600 font-mono text-xs border border-dashed border-neutral-800 rounded-xl bg-neutral-950/10">
                            <Package className="w-6 h-6 text-neutral-700 mb-2 animate-pulse" />
                            <span>Select an inventory item row to inspect stock history and run adjustments.</span>
                        </div>
                    )}
                </div>
            </div>

            {/* MODALS */}
            <InventoryItemDialog
                isOpen={isItemDialogOpen}
                onClose={() => {
                    setIsItemDialogOpen(false)
                    setEditingItem(null)
                }}
                onRefresh={loadInventoryWorkspace}
                restaurantId={restaurantId}
                editingItem={editingItem}
            />

            <StockMovementDialog
                isOpen={movementModal.isOpen}
                onClose={() => setMovementModal({ isOpen: false, item: null, type: "STOCK_IN" })}
                onRefresh={handleMovementRefresh}
                restaurantId={restaurantId}
                item={movementModal.item}
                movementType={movementModal.type}
            />
        </div>
    )
}

