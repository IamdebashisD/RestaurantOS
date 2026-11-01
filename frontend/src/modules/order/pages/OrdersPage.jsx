import { useState, useEffect, useCallback } from "react"
import { useParams } from "react-router"
import {
    ClipboardList,
    RefreshCw,
    Plus,
    AlertCircle,
    Clock,
    CheckCircle,
    Archive,
    ChefHat,
    Truck,
    DollarSign,
    Ban
} from "lucide-react"
import { Button } from "../../../components/ui/button"
import { api } from "../../../lib/axios"
import OrderDialog from "../components/OrderDialog"



export default function OrdersPage() {
    const { restaurantId } = useParams()

    // SYSTEM STATE REGISTERED
    const [orders, setOrders] = useState([])
    const [tables, setTables] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState(null)
    const [processingId, setProcessingId] = useState(null)
    const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false)

    const loadOrdersWorkspace = useCallback(async () => {
        setIsLoading(true)
        setErrorMessage(null)
        try {
            const [ordersRes, tablesRes] = await Promise.all([
                api.get(`/restaurants/${restaurantId}/orders`),
                api.get(`/restaurants/${restaurantId}/tables`)
            ])

            console.log(ordersRes.data?.data?.orders || [])
            setOrders(ordersRes.data?.data?.orders || [])
            setTables(tablesRes.data?.data?.tables || [])
        } catch (error) {
            console.error("[Orders Workspace Sync Failed]:", error)
            setErrorMessage(
                error.response?.data?.message ||
                "Failed to establish communication pipeline with live order data streams."
            )
        } finally {
            setIsLoading(false)
        }
    }, [restaurantId])

    useEffect(() => {
        if (restaurantId) loadOrdersWorkspace()
    }, [loadOrdersWorkspace])

    const handleAdvanceOrderState = async (orderId, endpointAction) => {
        setProcessingId(orderId)
        try {
            const response = await api.patch(`restaurants/${restaurantId}/orders/${orderId}/${endpointAction}`)
            const updatedOrders = response.data?.data?.orders || response.data?.data?.confirmedOrder || null

            if (updatedOrders) {
                setOrders(prev => prev.map(o => o._id === orderId ? updatedOrders : o))
            } else {
                loadOrdersWorkspace()
            }

        } catch (error) {
            alert(error.response?.data?.message || "Operational state transition rejected by system rules.")
        } finally {
            setProcessingId(null)
        }
    }


    // =========================================================================
    // 🧠 THE ARCHITECTURAL ISOLATION PIPELINE (Frontend Status Mapping)
    // =========================================================================

    // Track 1: Active Tickets Queue (Kitchen KDS View)
    const kitchenQueue = orders.filter(order =>
        ["PENDING", "CONFIRMED", "PREPARING"].includes(order.status?.toUpperCase())
    )
    
    // Track 2: Expedite Pass (Food Runner Ready View)
    const expeditePass = orders.filter(order =>
        order.status?.toUpperCase() === "READY"
    )

    // Track 3: Service Archives (Cashier / History View)
    const serviceArchives = orders.filter(order =>
        ["SERVED", "COMPLETED", "CANCELLED"].includes(order.status?.toUpperCase())
    )

    // Helper dictionary lookup to map an abstract Table ID string into its readable floor number text
    const getReadableTableNum = (tableId) => {
        const found = tables.find(table => table._id === tableId)
        return found ? `Table found ${found.tableNumber}` : 'Dine-In table'
    }


    if (isLoading) {
        return (
            <div className="text-center py-32 text-neutral-500 font-mono text-xs animate-pulse select-none">
                Intercepting Live Restaurant Transaction Streams...
            </div>
        )
    }


    // ===================================================================
    // THE HIGH-FIDELITY ORDER FULFILLMENT CARD IMPLEMENTATION MODULE
    // ===================================================================
    const renderOrderCard = (order) => {
        const isProcessing = processingId === order._id

        // Dynamic State Color Mapping for Food Preparation Stages
        const getPrepStatusStyle = (status) => {
            switch (status?.toUpperCase()) {
                case "PENDING": return "bg-neutral-950 border-amber-800/60 text-amber-400"
                case "CONFIRMED": return "bg-amber-950/20 border-amber-800/40 text-amber-400"
                case "PREPARING": return "bg-blue-950/20 border-blue-800/40 text-blue-400 animate-pulse"
                case "READY": return "bg-emerald-950/20 border-emerald-800/40 text-emerald-400"
                case "CANCELLED": return "bg-red-950/20 border-red-900/40 text-red-400"
                default: return "bg-neutral-900/40 border-neutral-800 text-neutral-400 opacity-60"
            }
        }

        // Dynamic State Color Mapping for Financial Balances
        const getPaymentStatusStyle = (payStatus) => {
            return payStatus?.toUpperCase() === "PAID"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-red-500/10 border-red-500/20 text-red-400"
        }

        return (
            <div
                key={order._id}
                className={`bg-neutral-900/50 backdrop-blur-md border border-neutral-800/80 p-4 rounded-xl flex flex-col justify-between space-y-4 shadow-lg hover:border-neutral-700/80 transition-all ${isProcessing ? "opacity-30 animate-pulse pointer-events-none" : ""
                    }`}
            >
                {/* 1. CARD HEADER SECTION: Identifiers, Badges, and Table Mapping */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono text-neutral-500 font-bold uppercase select-none">
                            TICKET #{order._id.slice(-4).toUpperCase()}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-mono font-bold bg-neutral-950 border border-neutral-800/80 px-2 py-0.5 rounded-md">
                            {getReadableTableNum(order.table)}
                        </span>
                    </div>

                    {/* Dual-Track State Badges */}
                    <div className="flex gap-1.5 select-none">
                        <span className={`text-[9px] font-mono font-black tracking-wider px-2 py-0.5 border rounded-md uppercase ${getPrepStatusStyle(order.status)}`}>
                            {order.status}
                        </span>
                        <span className={`text-[9px] font-mono font-black tracking-wider px-2 py-0.5 border rounded-md uppercase ${getPaymentStatusStyle(order.paymentStatus)}`}>
                            {order.paymentStatus === "PAID" ? "💳 PAID" : "💵 UNPAID"}
                        </span>
                    </div>
                </div>

                {/* 2. CARD MIDDLE SECTION: Unboxing the Nested Embedded Recipes Array Loop */}
                <div className="bg-neutral-950/40 border border-neutral-900/80 rounded-xl p-3 space-y-2">
                    <div className="text-[9px] text-neutral-500 font-mono font-black uppercase tracking-wider border-b border-neutral-900/60 pb-1 select-none">
                        Order Items Basket
                    </div>
                    <div className="space-y-1.5 max-h-35 overflow-y-auto scrollbar-none pr-0.5">
                        {order.items?.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-start text-xs font-medium tracking-tight">
                                <div className="text-neutral-200 flex items-start gap-1.5">
                                    <span className="text-emerald-500 font-mono font-bold bg-emerald-950/40 border border-emerald-900/20 px-1.5 py-0.5 rounded-md text-[10px] leading-none mt-0.5">
                                        {item.quantity}x
                                    </span>
                                    <span className="text-neutral-300 leading-tight">{item.name}</span>
                                </div>
                                <span className="text-neutral-400 font-mono font-semibold text-[11px] pt-0.5">
                                    ₹{item.subtotal}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Customer Chef Notes Layer Section */}
                    {order.notes && (
                        <div className="mt-2 pt-2 border-t border-neutral-900/40 text-[10px] font-sans text-amber-500/90 leading-relaxed italic bg-amber-950/5 p-2 rounded-lg border border-amber-900/10">
                            <span className="font-bold uppercase tracking-wider not-italic text-[8px] block mb-0.5 text-amber-600">Chef Note:</span>
                            "{order.notes}"
                        </div>
                    )}
                </div>

                {/* 3. CARD LOWER SECTION: Financial Aggregations Tally & Dynamic Action Controls */}
                <div className="space-y-3 pt-1">
                    <div className="flex justify-between items-baseline px-0.5">
                        <span className="text-[10px] text-neutral-500 font-mono font-bold uppercase select-none">Total Amount Due</span>
                        <span className="text-white font-black text-xl font-mono tracking-tight">
                            ₹{order.totalAmount}
                        </span>
                    </div>

                    {/* 🛡️ THE DETERMINISTIC STATE-MACHINE ACTION TOGGLES BOARD */}
                    <div className="w-full text-[10px] font-bold uppercase tracking-wider space-y-2">

                        {/* A. PENDING CARD CONTEXT TRACK */}
                        {order.status === "PENDING" && (
                            <div className="flex flex-col gap-2 w-full">
                                <button
                                    onClick={() => handleAdvanceOrderState(order._id, "confirm")}
                                    className="w-full py-2 px-3 rounded-xl bg-neutral-950/40 border border-neutral-800 text-neutral-400 hover:text-amber-400 hover:border-amber-900/30 transition-all cursor-pointer font-sans"
                                >
                                    Verify & Confirm Ticket
                                </button>

                                {/* 🔴 INLINE CANCEL SWITCH TRIGGER */}
                                <button
                                    onClick={() => {
                                        if (window.confirm(`Cancel Ticket #${order._id.slice(-4).toUpperCase()} permanently?`)) {
                                            handleAdvanceOrderState(order._id, "cancel")
                                        }
                                    }}
                                    className="w-full py-2 px-3 rounded-xl bg-neutral-950/40 border border-neutral-800 text-neutral-400 hover:text-red-400 hover:border-red-950/30 transition-all cursor-pointer font-sans font-bold text-center flex items-center justify-center gap-1.5 outline-none focus:outline-none"
                                >
                                    <Ban className="w-3.5 h-3.5 text-red-500/80" /> Cancel Order
                                </button>
                            </div>
                        )}

                        {/* B. CONFIRMED CARD CONTEXT TRACK */}
                        {order.status === "CONFIRMED" && (
                            <div className="flex flex-col gap-2 w-full">
                                <button
                                    onClick={() => handleAdvanceOrderState(order._id, "prepare")}
                                    className="w-full py-2 px-3 rounded-xl bg-neutral-950/40 border border-neutral-800 text-neutral-400 hover:text-blue-400 hover:border-blue-900/30 transition-all cursor-pointer font-sans flex items-center justify-center gap-1.5"
                                >
                                    <ChefHat className="w-3.5 h-3.5 text-blue-400" /> Start Preparation
                                </button>

                                {/* 🔴 INLINE CANCEL SWITCH TRIGGER */}
                                <button
                                    onClick={() => {
                                        if (window.confirm(`Cancel Ticket #${order._id.slice(-4).toUpperCase()} permanently?`)) {
                                            handleAdvanceOrderState(order._id, "cancel")
                                        }
                                    }}
                                    className="w-full py-2 px-3 rounded-xl bg-neutral-950/40 border border-neutral-800 text-neutral-400 hover:text-red-400 hover:border-red-950/30 transition-all cursor-pointer font-sans font-bold text-center flex items-center justify-center gap-1.5 outline-none focus:outline-none"
                                >
                                    <Ban className="w-3.5 h-3.5 text-red-500/80" /> Cancel Order
                                </button>
                            </div>
                        )}

                        {/* C. PREPARING CARD CONTEXT TRACK (Cancellations completely locked to prevent kitchen waste!) */}
                        {order.status === "PREPARING" && (
                            <button
                                onClick={() => handleAdvanceOrderState(order._id, "ready")}
                                className="w-full py-2.5 px-3 rounded-xl bg-neutral-950/40 border border-neutral-800 text-neutral-400 hover:text-emerald-400 hover:border-emerald-900/30 transition-all cursor-pointer font-sans"
                            >
                                🔔 Move to Pass (Mark Ready)
                            </button>
                        )}

                        {/* D. READY CARD CONTEXT TRACK */}
                        {order.status === "READY" && (
                            <button
                                onClick={() => handleAdvanceOrderState(order._id, "serve")}
                                className="w-full py-2.5 px-3 rounded-xl bg-neutral-950/40 border border-neutral-800 text-neutral-400 hover:text-emerald-400 hover:border-emerald-900/30 transition-all cursor-pointer font-sans"
                            >
                                🍽️ Dispatch to Table (Mark Served)
                            </button>
                        )}

                        {/* E. SERVED CARD CONTEXT TRACKS */}
                        {order.status === "SERVED" && order.paymentStatus !== "PAID" && (
                            <button
                                onClick={() => handleAdvanceOrderState(order._id, "pay")}
                                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black transition-all cursor-pointer font-sans shadow-md"
                            >
                                <DollarSign className="w-3.5 h-3.5 inline mr-1" /> Settle & Process Payment
                            </button>
                        )}

                        {order.status === "SERVED" && order.paymentStatus === "PAID" && (
                            <button
                                onClick={() => handleAdvanceOrderState(order._id, "complete")}
                                className="w-full py-2.5 px-3 rounded-xl bg-neutral-950/40 border border-neutral-800 text-neutral-400 hover:text-emerald-400 hover:border-emerald-950/30 transition-all cursor-pointer font-sans"
                            >
                                🏁 Archive & Close Order
                            </button>
                        )}

                        {["COMPLETED", "CANCELLED"].includes(order.status?.toUpperCase()) && (
                            <div className="w-full py-2 bg-neutral-950/40 border border-neutral-900 text-neutral-600 text-[9px] font-mono text-center rounded-xl select-none">
                                Operational Ledger Block Locked
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )
    }


    return (
        <div className="space-y-6 animate-fade-in pb-6 w-full select-none">

            {/* 👑 PANEL HEADER SYSTEM ACTION BLOCK */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-800 pb-5">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                        <ClipboardList className="w-5 h-5 text-emerald-500" />
                        Live Orders Interceptor Console
                    </h2>
                    <p className="text-neutral-400 text-sm mt-1">
                        Monitor real-time transaction streams, orchestrate dual-track fulfillment states, and track kitchen velocity.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        onClick={loadOrdersWorkspace}
                        variant="outline"
                        className="border-neutral-800 text-neutral-400 hover:text-white bg-neutral-900/50 rounded-xl cursor-pointer"
                    >
                        <RefreshCw className={`w-4 h-4`} />
                    </Button>

                    <Button
                        onClick={() => setIsOrderDialogOpen(true)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-2 rounded-xl px-4 py-2 cursor-pointer shadow-lg shadow-emerald-950/20 text-xs transition-all active:scale-[0.99]"
                    >
                        <Plus className="w-4 h-4" /> Deploy Order Node
                    </Button>
                </div>
            </div>

            {errorMessage && (
                <div className="p-3 bg-red-900/30 border border-red-800 text-red-200 text-sm font-medium rounded-lg text-center">
                    {errorMessage}
                </div>
            )}

            {/* ========================================================================= */}
            {/* // 📊 THE DUAL-TRACK WORKSPACE INTERACTIVE VIEWPORT ENGINE */}
            {/* ========================================================================= */}
            {/* ⚡ FIXED COLUMN STRATEGY: Locks exactly 3 high-contrast operational tracks side-by-side */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full items-start">

                {/* CONTAINER COLUMN TRACK 1: ACTIVE KITCHEN DISPLAY SYSTEM QUEUE */}
                <div className="bg-neutral-950/20 border border-neutral-900 rounded-2xl p-4 space-y-4 flex flex-col h-full min-h-[65vh]">
                    <div className="flex items-center justify-between border-b border-neutral-900 pb-2 px-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 uppercase tracking-wider">
                            <ChefHat className="w-4 h-4 text-amber-500/90" />
                            <span>Kitchen Display Queue</span>
                        </div>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-amber-950/20 border border-amber-900/30 text-amber-400 rounded-md">
                            {kitchenQueue.length} Active
                        </span>
                    </div>

                    {/* Isolated Scroll Corridor */}
                    <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-240px)] pr-1 smooth-sidebar-scroll flex-1">
                        {kitchenQueue.length === 0 ? (
                            <div className="text-center py-16 text-neutral-600 font-mono text-xs border border-dashed border-neutral-900 rounded-xl bg-neutral-950/10">No Pending Tickets</div>
                        ) : (
                            kitchenQueue.map(order => renderOrderCard(order))
                        )}
                    </div>
                </div>

                {/* CONTAINER COLUMN TRACK 2: THE EXPEDITE FOOD RUNNER PASS */}
                <div className="bg-neutral-950/20 border border-neutral-900 rounded-2xl p-4 space-y-4 flex flex-col h-full min-h-[65vh]">
                    <div className="flex items-center justify-between border-b border-neutral-900 pb-2 px-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 uppercase tracking-wider">
                            <Truck className="w-4 h-4 text-emerald-500/90" />
                            <span>Expedite Runner Pass</span>
                        </div>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 rounded-md">
                            {expeditePass.length} Hot Pass
                        </span>
                    </div>

                    {/* Isolated Scroll Corridor */}
                    <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-240px)] pr-1 smooth-sidebar-scroll flex-1">
                        {expeditePass.length === 0 ? (
                            <div className="text-center py-16 text-neutral-600 font-mono text-xs border border-dashed border-neutral-900 rounded-xl bg-neutral-950/10">Pass Clear</div>
                        ) : (
                            expeditePass.map(order => renderOrderCard(order))
                        )}
                    </div>
                </div>

                {/* CONTAINER COLUMN TRACK 3: SYSTEM TRANSACTION SERVICE ARCHIVES */}
                <div className="bg-neutral-950/20 border border-neutral-900 rounded-2xl p-4 space-y-4 flex flex-col h-full min-h-[65vh]">
                    <div className="flex items-center justify-between border-b border-neutral-900 pb-2 px-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 uppercase tracking-wider">
                            <Archive className="w-4 h-4 text-neutral-500" />
                            <span>Service History Logs</span>
                        </div>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-neutral-900 border border-neutral-800 text-neutral-500 rounded-md">
                            {serviceArchives.length} Mapped
                        </span>
                    </div>

                    {/* Isolated Scroll Corridor */}
                    <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-240px)] pr-1 smooth-sidebar-scroll flex-1">
                        {serviceArchives.length === 0 ? (
                            <div className="text-center py-16 text-neutral-600 font-mono text-xs border border-dashed border-neutral-900 rounded-xl bg-neutral-950/10">Archives Empty</div>
                        ) : (
                            serviceArchives.map(order => renderOrderCard(order))
                        )}
                    </div>
                </div>

            </div>

            {/* ⚡ MOUNT WIZARD LAYOUT PORTAL */}
            <OrderDialog
                isOpen={isOrderDialogOpen}
                onClose={() => setIsOrderDialogOpen(false)}
                onRefresh={loadOrdersWorkspace}
                activeTables={tables.filter(t => t.status !== "INACTIVE")}
            />

        </div>
    )
}
