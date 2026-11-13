import { useState, useEffect, useCallback } from "react"
import { ServerRouter, useParams } from "react-router"
import {
    ChefHat,
    RefreshCw,
    Flame,
    BellRing,
    Clock,
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    Utensils,
    Radio
} from "lucide-react"
import { Button } from "../../../components/ui/button"
import { api } from "../../../lib/axios"


export default function KitchenDisplayPage() {
    const { restaurantId } = useParams()

    // SYSTEM OPERATION STATES STACKS
    const [orders, setOrders] = useState([])
    const [tables, setTables] = useState([])
    const [meta, setMeta] = useState({
        page: 1,
        limit: 10,
        totalItems: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false
    })

    const [currentPage, setCurrentPage] = useState(1)
    const [activeFilter, setActiveFilter] = useState("ALL")
    const [isLoading, setIsLoading] = useState(true)
    const [isAutoPolling, setIsAutoPolling] = useState(true)
    const [errorMessage, setErrorMessage] = useState(null)
    const [processingId, setProcessingId] = useState(null)
    const [nowTick, setNowTick] = useState(Date.now())

    // Live 15-second clock tick for elapsed prep timers
    useEffect(() => {
        const clock = setInterval(() => setNowTick(Date.now()), 15000)
        return () => clearInterval(clock)
    }, [])

    // =========================================================================
    // 📡 SYNCHRONIZED KDS PIPELINE
    // =========================================================================
    const loadKitchenQueue = useCallback(async (silent = false) => {
        if (!silent) setIsLoading(true)
        setErrorMessage(null)

        try {
            const [kitchenRes, tablesRes] = await Promise.all([
                api.get(`/restaurants/${restaurantId}/kitchen/orders`, {
                    params: { page: currentPage, limit: 12 }
                }),
                api.get(`/restaurants/${restaurantId}/tables`).catch(() => null)
            ])

            const fetchedOrders = kitchenRes.data?.data?.orders || []
            const metaData = kitchenRes.data?.data?.meta || {
                page: 1,
                limit: 12,
                totalItems: fetchedOrders.length,
                totalPages: 1,
                hasNextPage: false,
                hasPrevPage: false
            }

            setOrders(fetchedOrders)
            setMeta(metaData)
        } catch (error) {
            console.error("[KDS Queue Sync Failed]:", error)
            setErrorMessage(
                error.response?.data?.message ||
                "Failed to synchronize active kitchen preparation queue."
            )
        } finally {
            if (!silent) setIsLoading(false)
        }
    }, [restaurantId, currentPage])

    useEffect(() => {
        if (restaurantId) loadKitchenQueue()
    }, [loadKitchenQueue])

    // Auto-polling background sync every 20 seconds when enabled
    useEffect(() => {
        if (!isAutoPolling || !restaurantId) return
        const poller = setInterval(() => {
            loadKitchenQueue(true)
        }, 20000)
        return () => clearInterval(poller)
    }, [isAutoPolling, restaurantId, loadKitchenQueue])

    // =========================================================================
    // ⚡ ATOMIC STAGE TRANSITION HANDLERS (/start & /ready)
    // =========================================================================

    const handleKitchenTransition = async (orderId, actionEndpoint) => {
        setProcessingId(orderId)
        setErrorMessage(null)

        try {
            const response = await api.patch(
                `/restaurants/${restaurantId}/kitchen/orders/${orderId}/${actionEndpoint}`
            )
            const updatedOrder = response.data?.data?.order || null

            if (updatedOrder) {
                if (updatedOrder.status === "READY") {
                    // Remove from active kitchen queue once ready for expedite runner
                    setOrders(prev => prev.filter(o => o._id !== orderId))
                    setMeta(prev => ({
                        ...prev,
                        totalItems: Math.max(0, (prev.totalItems || 1) - 1)
                    }))
                } else {
                    // Swap CONFIRMED ticket with PREPARING ticket inline
                    setOrders(prev => prev.map(o => o._id === orderId ? updatedOrder : o))
                }
            } else {
                loadKitchenQueue(true)
            }
        } catch (error) {
            alert(
                error.response?.data?.message ||
                "Kitchen ticket transition rejected due to a status conflict."
            )
            loadKitchenQueue(true)
        } finally {
            setProcessingId(null)
        }
    }

    // Helper: Map Table ID to floor table number
    const getReadableTable = (tableRef) => {
        if (!tableRef) return "Dine-In"
        if (typeof tableRef === "object" && tableRef.tableNumber) {
            return `Table ${tableRef.tableNumber}`
        }
        const found = tables.find(t => t._id === tableRef)
        return found ? `Table ${tableRef.tableNumber}` : "Dine-In"
    }

    // Helper: Format elapsed minutes since confirmation or prep start
    const getElapsedLabel = (timestamp) => {
        if (!timestamp) return "Just now"
        const diffMins = Math.max(0, Math.floor((nowTick - new Date(timestamp).getTime()) / 60000))
        if (diffMins < 1) return "< 1m ago"
        if (diffMins < 60) return `${diffMins}m elapsed`
        const hrs = Math.floor(diffMins / 60)
        return `${hrs}h ${diffMins % 60}m`
    }

    // Runtime Counters
    const confirmedCount = orders.filter(o => o.status === "CONFIRMED").length
    const preparingCount = orders.filter(o => o.status === "PREPARING").length

    const filteredOrders = orders.filter(order =>
        activeFilter === "ALL" ? true : order.status?.toUpperCase() === activeFilter
    )



    return (
        <div className="space-y-6 animate-fade-in pb-8 w-full select-none">

            {/* PANEL HEADER SYSTEM ACTION BLOCK */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-800 pb-5">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                        <ChefHat className="w-5 h-5 text-emerald-500" />
                        Kitchen Display System (KDS)
                    </h2>
                    <p className="text-neutral-400 text-sm mt-1">
                        FIFO culinary execution queue. Start confirmed tickets and dispatch ready dishes to the expedite pass.
                    </p>
                </div>

                <div className="flex items-center gap-3 self-start sm:self-auto">
                    <button
                        type="button"
                        onClick={() => setIsAutoPolling(prev => !prev)}
                        className={`px-3 py-2 rounded-xl border text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${isAutoPolling
                                ? "bg-emerald-950/30 border-emerald-800/50 text-emerald-400"
                                : "bg-neutral-900/50 border-neutral-800 text-neutral-500 hover:text-neutral-300"
                            }`}
                    >
                        <Radio className={`w-3.5 h-3.5 ${isAutoPolling ? "animate-pulse" : ""}`} />
                        {isAutoPolling ? "LIVE SYNC ON" : "AUTO-SYNC OFF"}
                    </button>

                    <Button
                        onClick={() => loadKitchenQueue()}
                        variant="outline"
                        className="border-neutral-800 text-neutral-400 hover:text-white bg-neutral-900/50 rounded-xl cursor-pointer"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                    </Button>
                </div>
            </div>

            {/* TELEMETRY METRIC CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-5 flex items-center justify-between backdrop-blur-md">
                    <div className="space-y-1">
                        <span className="text-[10px] text-neutral-500 font-mono font-bold uppercase tracking-wider block">
                            Queued / Awaiting Fire
                        </span>
                        <span className="text-2xl font-black text-white font-mono">
                            {confirmedCount} Tickets
                        </span>
                    </div>
                    <div className="p-3 bg-amber-950/20 border border-amber-900/30 rounded-xl text-amber-400">
                        <Clock className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-5 flex items-center justify-between backdrop-blur-md">
                    <div className="space-y-1">
                        <span className="text-[10px] text-neutral-500 font-mono font-bold uppercase tracking-wider block">
                            Actively Cooking
                        </span>
                        <span className="text-2xl font-black text-white font-mono">
                            {preparingCount} Tickets
                        </span>
                    </div>
                    <div className="p-3 bg-blue-950/20 border border-blue-900/30 rounded-xl text-blue-400">
                        <Flame className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-5 flex items-center justify-between backdrop-blur-md">
                    <div className="space-y-1">
                        <span className="text-[10px] text-neutral-500 font-mono font-bold uppercase tracking-wider block">
                            Total Kitchen Load
                        </span>
                        <span className="text-2xl font-black text-white font-mono">
                            {meta.totalItems || orders.length} Active
                        </span>
                    </div>
                    <div className="p-3 bg-emerald-950/20 border border-emerald-900/30 rounded-xl text-emerald-400">
                        <Utensils className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {errorMessage && (
                <div className="p-3 bg-red-900/20 border border-red-800/40 text-red-400 text-xs font-medium rounded-xl text-center">
                    {errorMessage}
                </div>
            )}

            {/* MENU-STYLE FLOATING FILTER TABS */}
            <div className="flex flex-wrap items-center gap-3 w-full">
                {["ALL", "CONFIRMED", "PREPARING"].map((filter) => {
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
                            {filter === "ALL" ? "ALL TICKETS" : filter}
                        </button>
                    )
                })}
            </div>

            {/* KDS TICKET GRID */}
            {isLoading ? (
                <div className="text-center py-28 text-neutral-500 font-mono text-xs animate-pulse">
                    Intercepting Kitchen Prep Queue...
                </div>
            ) : filteredOrders.length === 0 ? (
                <div className="bg-neutral-900/20 border border-dashed border-neutral-800 rounded-2xl py-24 text-center flex flex-col items-center justify-center gap-2 text-neutral-600 font-mono text-xs">
                    <AlertTriangle className="w-6 h-6 text-neutral-700" />
                    <span>No active kitchen tickets in this stage. Station clear.</span>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredOrders.map((order, idx) => {
                        const isPreparing = order.status === "PREPARING"
                        const isProcessing = processingId === order._id

                        return (
                            <div
                                key={order._id}
                                className={`bg-neutral-900/50 backdrop-blur-md border rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-xl transition-all ${isPreparing
                                        ? "border-blue-800/60 shadow-blue-950/10"
                                        : "border-amber-800/50 shadow-amber-950/10"
                                    } ${isProcessing ? "opacity-30 pointer-events-none animate-pulse" : ""}`}
                            >
                                {/* TICKET TOP HEADER */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-mono font-black text-white bg-neutral-950 border border-neutral-800 px-2.5 py-1 rounded-lg">
                                                #{order._id.slice(-4).toUpperCase()}
                                            </span>
                                            <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase">
                                                FIFO #{(meta.page - 1) * meta.limit + idx + 1}
                                            </span>
                                        </div>

                                        <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/30 border border-emerald-900/40 px-2.5 py-1 rounded-lg">
                                            {getReadableTable(order.table)}
                                        </span>
                                    </div>

                                    {/* STATUS & ELAPSED TIMER ROW */}
                                    <div className="flex items-center justify-between text-[10px] font-mono">
                                        <span
                                            className={`px-2.5 py-0.5 rounded-md border font-black uppercase tracking-wider ${isPreparing
                                                    ? "bg-blue-950/40 border-blue-800/50 text-blue-400 animate-pulse"
                                                    : "bg-amber-950/40 border-amber-800/50 text-amber-400"
                                                }`}
                                        >
                                            {order.status}
                                        </span>

                                        <span className="text-neutral-400 flex items-center gap-1 font-bold">
                                            <Clock className="w-3 h-3 text-neutral-500" />
                                            {isPreparing && order.preparationStartedAt
                                                ? `Cooking: ${getElapsedLabel(order.preparationStartedAt)}`
                                                : `Queued: ${getElapsedLabel(order.createdAt)}`}
                                        </span>
                                    </div>
                                </div>

                                {/* DISHES & CHEF NOTES */}
                                <div className="bg-neutral-950/60 border border-neutral-900 rounded-xl p-3.5 space-y-2.5 flex-1">
                                    <div className="text-[9px] font-mono font-black text-neutral-500 uppercase tracking-wider border-b border-neutral-900 pb-1.5">
                                        Prep Items ({order.items?.length || 0})
                                    </div>

                                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-none">
                                        {order.items?.map((item, itemIdx) => (
                                            <div
                                                key={itemIdx}
                                                className="flex items-center justify-between text-sm font-semibold"
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <span className="font-mono font-black text-emerald-400 bg-emerald-950/50 border border-emerald-900/30 px-2 py-0.5 rounded-md text-xs">
                                                        {item.quantity}x
                                                    </span>
                                                    <span className="text-neutral-100 leading-snug">
                                                        {item.name}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {order.notes && (
                                        <div className="mt-2 pt-2 border-t border-neutral-900/60 text-xs font-sans text-amber-400 bg-amber-950/15 p-2.5 rounded-lg border border-amber-900/20">
                                            <span className="font-mono font-black uppercase tracking-wider text-[9px] block mb-0.5 text-amber-500">
                                                Chef Note:
                                            </span>
                                            "{order.notes}"
                                        </div>
                                    )}
                                </div>

                                {/* ATOMIC STAGE ACTION BUTTON */}
                                <div className="pt-1">
                                    {!isPreparing ? (
                                        <button
                                            onClick={() => handleKitchenTransition(order._id, "start")}
                                            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-blue-950/30 flex items-center justify-center gap-2 active:scale-[0.99]"
                                        >
                                            <Flame className="w-4 h-4" /> Start Preparation
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleKitchenTransition(order._id, "ready")}
                                            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-emerald-950/30 flex items-center justify-center gap-2 active:scale-[0.99]"
                                        >
                                            <BellRing className="w-4 h-4" /> Mark Order Ready
                                        </button>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* PAGINATION STRIP CONTROLLER */}
            {meta.totalPages > 1 && (
                <div className="p-4 border border-neutral-800/80 bg-neutral-900/30 rounded-2xl flex items-center justify-between select-none">
                    <span className="text-[10px] font-mono text-neutral-500 font-bold uppercase">
                        Page {meta.page} of {meta.totalPages} ({meta.totalItems} Total Tickets)
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
            )}
        </div>
    )
}

