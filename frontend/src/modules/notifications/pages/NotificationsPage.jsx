import { useState, useEffect, useCallback } from "react"
import { useParams, useNavigate } from "react-router"
import {
    Bell,
    RefreshCw,
    CheckCheck,
    Check,
    AlertTriangle,
    ShoppingBag,
    Calendar,
    Coins,
    ClipboardList,
    Package,
    ChevronLeft,
    ChevronRight,
    ArrowUpRight
} from "lucide-react"
import { Button } from "../../../components/ui/button"
import { api } from "../../../lib/axios"


const NOTIFICATION_TYPES = [
    { value: "", label: "All Alert Types"},
    { value: "LOW_STOCK", label: "Low Stock Alerts" },
    { value: "ORDER_STATUS_CHANGED", label: "Orders status updates" },
    { value: "RESERVATION_CREATED", label: "New Reservations" },
    { value: "RESERVATION_CANCELLED", label: "Cancelled Reservations" },
    { value: "PAYMENT_COMPLETED", label: "Payments Completed" },
    { value: "PAYMENT_FAILED", label: "Payments Failed" },
    { value: "PURCHASE_ORDER_ORDERED", label: "PO Confirmed & Ordered" },
    { value: "PURCHASE_ORDER_RECEIVED", label: "PO Shipment Received" },
    { value: "PURCHASE_ORDER_CANCELLED", label: "PO Cancelled" }
]

export default function NotificationsPage() {
    const { restaurantId } = useParams()
    const navigate = useNavigate()

    const [notifications, setNotifications] = useState([])
    const [meta, setMeta] = useState({
        page: 1,
        limit: 12,
        totalItems: 0,
        totalPages: 1,
        totalUnread: 0,
        hasNextPage: false,
        hasPrevPage: false
    })

    const [currentPage, setCurrentPage] = useState(1)
    const [readFilter, setReadFilter] = useState("ALL") // ALL | UNREAD | READ
    const [typeFilter, setTypeFilter] = useState("")

    const [isLoading, setIsLoading] = useState(true)
    const [isMarkingAll, setIsMarkingAll] = useState(false)
    const [processingId, setProcessingId] = useState(null)
    const [errorMessage, setErrorMessage] = useState(null)

    // =========================================================================
    // 📡 FETCHING RECIPIENT NOTIFICATIONS WITH SERVER FILTERS & PAGINATION
    // =========================================================================

    const loadNotificationsFeed = useCallback(async (signal) => {
        setIsLoading(true)
        setErrorMessage(null)

        try {
            const params = {
                page: currentPage,
                limit: 12,
                ...(readFilter === "UNREAD" ? { isRead: "false" } : {}),
                ...(readFilter === "READ" ? { isRead: "true" } : {}),
                ...(typeFilter ? { type: typeFilter } : {})
            }

            const response = await api.get(`/restaurants/${restaurantId}/notifications`, {
                params,
                signal
            })
            const fetchedNotifications = response.data?.data?.notifications || []
            const fetchedMeta = response.data?.data?.meta || {
                "page": 1,
                "limit": 12,
                "totalItems": fetchedNotifications.length,
                "totalPages": 1,
                "totalUnread": fetchedNotifications.filter(n => !n.isRead).length,
                "hasNextPage": false,
                "hasPrevPage": false
            }

            setNotifications(fetchedNotifications)
            setMeta(fetchedMeta)
        } catch (error) {
            if (error.name === "CanceledError" || error.name === "ERR_CANCELED") return
            console.error("[Notifications Sync Failed]:", error)
            setErrorMessage(
                error.response?.data?.message ||
                "Failed to load system notifications feed."
            )
        } finally {
            if (!signal?.aborted) {
                setIsLoading(false)
            }
        }

    }, [restaurantId, currentPage, readFilter, typeFilter])
    
    useEffect(() => {
        if (!restaurantId) return
        const controller = new AbortController()
        loadNotificationsFeed(controller.signal)
        return () => controller.abort()
    }, [loadNotificationsFeed, restaurantId])


    // =========================================================================
    // ⚡ MARK SINGLE NOTIFICATION AS READ
    // =========================================================================
    const handleMarkAsRead = async (notification) => {
        if (notification.isRead) return
        setProcessingId(notification._id)

        try {
            const response = await api.patch(
                `/restaurants/${restaurantId}/notifications/${notification._id}/read`
            )
            const updated = response.data?.data?.notification || {
                ...notification,
                isRead: true,
                readAt: new Date().toISOString()
            }

            setNotifications(prev => 
                readFilter === "UNREAD"
                    ? prev.filter(n => n._id !== notification._id)
                    : prev.map(n => n._id === notification._id ? updated : n)
            )
            setMeta(prev => ({
                ...prev,
                totalUnread: Math.max(0, (prev.totalUnread || 0) - 1)
            }))


        } catch (error) {
            alert(
                error.response?.data?.message ||
                "Failed to mark notification as read."
            )
        } finally {
            setProcessingId(null)
        }
    }


    // =========================================================================
    // ⚡ MARK ALL NOTIFICATIONS AS READ
    // =========================================================================
    const handleMarkAllAsRead = async () => {
        if (!meta.totalUnread || meta.totalUnread === 0) return
        setIsMarkingAll(true)

        try {
            await api.patch(`/restaurants/${restaurantId}/notifications/read-all`)

            if (readFilter === "UNREAD") {
                setNotifications([])
            } else {
                const nowIso = new Date().toISOString()
                setNotifications(prev => 
                    prev.map(n => (n.isRead ? n : { ...n, isRead: true, readAt: nowIso }))
                )
            }

            setMeta(prev => ({ ...prev, totalUnread: 0 }))
        } catch (error) {
            alert(
                error.response?.data?.message ||
                "Failed to mark all notifications as read."
            )
        } finally {
            setIsMarkingAll(false)
        }
    }

    // Resolve Module Deep Link & Visual Badge from Notification Type

    const getNotificationVisuals = (type) => {
        switch (type) {
            case "LOW_STOCK":
                return {
                    icon: AlertTriangle,
                    badge: "bg-amber-500/10 border-amber-500/20 text-amber-400",
                    iconWrap: "bg-amber-950/30 border-amber-900/40 text-amber-400",
                    route: `/dashboard/${restaurantId}/inventory`,
                    actionLabel: "Inspect Stock"
                }
            case "ORDER_STATUS_CHANGED":
                return {
                    icon: ClipboardList,
                    badge: "bg-blue-500/10 border-blue-500/20 text-blue-400",
                    iconWrap: "bg-blue-950/30 border-blue-900/40 text-blue-400",
                    route: `/dashboard/${restaurantId}/orders`,
                    actionLabel: "View Orders"
                }
            case "RESERVATION_CREATED":
            case "RESERVATION_CANCELLED":
                return {
                    icon: Calendar,
                    badge: "bg-purple-500/10 border-purple-500/20 text-purple-400",
                    iconWrap: "bg-purple-950/30 border-purple-900/40 text-purple-400",
                    route: `/dashboard/${restaurantId}/reservations`,
                    actionLabel: "View Desk"
                }
            case "PAYMENT_COMPLETED":
                return {
                    icon: Coins,
                    badge: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
                    iconWrap: "bg-emerald-950/30 border-emerald-900/40 text-emerald-400",
                    route: `/dashboard/${restaurantId}/payments`,
                    actionLabel: "View Ledger"
                }
            case "PAYMENT_FAILED":
                return {
                    icon: Coins,
                    badge: "bg-red-500/10 border-red-500/20 text-red-400",
                    iconWrap: "bg-red-950/30 border-red-900/40 text-red-400",
                    route: `/dashboard/${restaurantId}/payments`,
                    actionLabel: "Check Payment"
                }
            case "PURCHASE_ORDER_ORDERED":
            case "PURCHASE_ORDER_RECEIVED":
            case "PURCHASE_ORDER_CANCELLED":
                return {
                    icon: ShoppingBag,
                    badge: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
                    iconWrap: "bg-emerald-950/30 border-emerald-900/40 text-emerald-400",
                    route: `/dashboard/${restaurantId}/purchase-orders`,
                    actionLabel: "View PO"
                }
            default:
                return {
                    icon: Package,
                    badge: "bg-neutral-800 border-neutral-700 text-neutral-300",
                    iconWrap: "bg-neutral-900 border-neutral-800 text-neutral-400",
                    route: null,
                    actionLabel: null
                }
        }
    } 



    return (
        <div className="space-y-6 animate-fade-in pb-8 w-full select-none">

            {/* PANEL HEADER SYSTEM ACTION BLOCK */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-800 pb-5">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
                        <Bell className="w-6 h-6 text-emerald-500" />
                        Notifications & Alert Center
                        {meta.totalUnread > 0 && (
                            <span className="px-2.5 py-0.5 text-xs font-mono font-black rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400">
                                {meta.totalUnread} UNREAD
                            </span>
                        )}
                    </h2>
                    <p className="text-neutral-400 text-sm mt-1">
                        Real-time operational alerts across inventory thresholds, kitchen orders, payments, and purchase shipments.
                    </p>
                </div>

                <div className="flex items-center gap-3 self-start sm:self-auto">
                    <Button
                        onClick={() => loadNotificationsFeed()}
                        variant="outline"
                        className="border-neutral-800 text-neutral-400 hover:text-white bg-neutral-900/50 rounded-xl cursor-pointer"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                    </Button>

                    <Button
                        disabled={!meta.totalUnread || isMarkingAll}
                        onClick={handleMarkAllAsRead}
                        className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold flex items-center gap-2 rounded-xl px-4 py-2 cursor-pointer shadow-lg shadow-emerald-950/20 text-xs transition-all active:scale-[0.99]"
                    >
                        <CheckCheck className="w-4 h-4" />
                        {isMarkingAll ? "Clearing Alerts..." : "Mark All as Read"}
                    </Button>
                </div>
            </div>

            {/* FILTER BAR: READ STATUS TABS & EVENT TYPE DROPDOWN */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5">
                    {[
                        { id: "ALL", label: "ALL ALERTS" },
                        { id: "UNREAD", label: `UNREAD (${meta.totalUnread || 0})` },
                        { id: "READ", label: "READ ARCHIVE" }
                    ].map((tab) => {
                        const isActive = readFilter === tab.id
                        return (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setReadFilter(tab.id)
                                    setCurrentPage(1)
                                }}
                                className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide border cursor-pointer uppercase transition-all duration-200 ${
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

                <select
                    value={typeFilter}
                    onChange={(e) => {
                        setTypeFilter(e.target.value)
                        setCurrentPage(1)
                    }}
                    className="h-10 px-3.5 bg-neutral-900/50 border border-neutral-800 text-neutral-300 rounded-xl text-xs focus:border-emerald-500 outline-none max-w-xs"
                >
                    {NOTIFICATION_TYPES.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            </div>

            {errorMessage && (
                <div className="p-3 bg-red-900/20 border border-red-800/40 text-red-400 text-xs font-medium rounded-xl text-center">
                    {errorMessage}
                </div>
            )}

            {/* NOTIFICATIONS STREAM CONTAINER */}
            <div className="bg-neutral-900/20 border border-neutral-800/80 rounded-2xl overflow-hidden backdrop-blur-md">
                {isLoading ? (
                    <div className="text-center py-24 text-neutral-500 font-mono text-xs animate-pulse">
                        Syncing Restaurant Alert Feed...
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="text-center py-24 text-neutral-600 font-mono text-xs flex flex-col items-center justify-center gap-2">
                        <Bell className="w-6 h-6 text-neutral-700" />
                        <span>No notifications found matching the active filter criteria.</span>
                    </div>
                ) : (
                    <div className="divide-y divide-neutral-900/80">
                        {notifications.map((notif) => {
                            const visuals = getNotificationVisuals(notif.type)
                            const IconComponent = visuals.icon
                            const isProcessing = processingId === notif._id

                            return (
                                <div
                                    key={notif._id}
                                    className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                                        notif.isRead
                                            ? "bg-transparent hover:bg-neutral-900/25 opacity-75"
                                            : "bg-emerald-950/10 hover:bg-emerald-950/20"
                                    } ${isProcessing ? "opacity-40 pointer-events-none" : ""}`}
                                >
                                    <div className="flex items-start gap-3.5">
                                        <div className={`p-2.5 rounded-xl border shrink-0 mt-0.5 ${visuals.iconWrap}`}>
                                            <IconComponent className="w-4 h-4" />
                                        </div>

                                        <div className="space-y-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                {!notif.isRead && (
                                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                                )}
                                                <h4 className="text-sm font-bold text-white">
                                                    {notif.title}
                                                </h4>
                                                <span
                                                    className={`px-2 py-0.5 text-[9px] font-mono font-black tracking-wider rounded border uppercase ${visuals.badge}`}
                                                >
                                                    {notif.type.replaceAll("_", " ")}
                                                </span>
                                            </div>

                                            <p className="text-xs text-neutral-300 leading-relaxed">
                                                {notif.message}
                                            </p>

                                            <div className="text-[10px] font-mono text-neutral-500 pt-0.5">
                                                {new Date(notif.createdAt).toLocaleString("en-IN", {
                                                    dateStyle: "medium",
                                                    timeStyle: "short"
                                                })}
                                                {notif.isRead && notif.readAt && (
                                                    <span className="ml-2 text-neutral-600">
                                                        • Read
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* ACTION CONTROLS */}
                                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                        {visuals.route && (
                                            <button
                                                onClick={async () => {
                                                    if (!notif.isRead) await handleMarkAsRead(notif)
                                                    navigate(visuals.route)
                                                }}
                                                className="px-3 py-1.5 rounded-xl border border-neutral-800 bg-neutral-950 text-neutral-300 hover:text-white hover:border-neutral-700 text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                                            >
                                                {visuals.actionLabel}
                                                <ArrowUpRight className="w-3.5 h-3.5" />
                                            </button>
                                        )}

                                        {!notif.isRead && (
                                            <button
                                                title="Mark as Read"
                                                onClick={() => handleMarkAsRead(notif)}
                                                className="px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                                            >
                                                <Check className="w-3.5 h-3.5" /> Mark Read
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* PAGINATION STRIP */}
                <div className="p-4 border-t border-neutral-800/80 bg-neutral-950/20 flex items-center justify-between select-none">
                    <span className="text-[10px] font-mono text-neutral-500 font-bold uppercase">
                        Page {meta.page} of {meta.totalPages || 1} ({meta.totalItems} Total Alerts)
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
    )

}

