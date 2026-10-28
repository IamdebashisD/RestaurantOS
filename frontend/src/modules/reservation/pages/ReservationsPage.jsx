import { useState, useEffect, useCallback } from "react"
import { useParams } from "react-router"
import {
    Calendar,
    Plus,
    RefreshCw,
    ClipboardCheck,
    Ban,
    CheckCircle,
    Clock,
    Users,
    Armchair,
    ShieldAlert,
    Pencil
} from "lucide-react"
import { Button } from "../../../components/ui/button"
import ReservationDialog from "../components/ReservationDialog.jsx"
import { api } from "../../../lib/axios"


export default function ReservationsPage() {
    const { restaurantId } = useParams()

    const [reservations, setReservations] = useState([])
    const [tables, setTables] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState(null)

    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [processingId, setProcessingId] = useState(null)

    const [editingReservation, setEditingReservation] = useState(null)

    // FETCH REPOSITORIES DATA IN PARALLEL
    const loadSchedulerMetadata = useCallback(async () => {
        setIsLoading(true)
        setErrorMessage(null)

        try {
            const [resResponse, tablesResponse] = await Promise.all([
                api.get(`/restaurants/${restaurantId}/reservations`),
                api.get(`/restaurants/${restaurantId}/tables`)
            ])

            setReservations(resResponse.data?.data?.reservations || [])
            setTables(tablesResponse.data?.data.tables || [])
        } catch (error) {
            console.error("❌ [Scheduler Sync Core Failure]:", error)
            setErrorMessage(
                error.response?.data?.message ||
                "Failed to synchronize parameters with booking registries."
            )
        } finally {
            setIsLoading(false)
        }
    }, [restaurantId])

    useEffect(() => {
        if (restaurantId) loadSchedulerMetadata()
    }, [loadSchedulerMetadata])


    // STATUS MUTATION ENGINE: Mutates finite state pathways cleanly via your distinct PATCH routes
    const handleMutateStatus = async (reservationId, routeAction) => {
        setProcessingId(reservationId)
        try {
            // Triggers your matching PATCH sub-routes: /confirm, /cancel, or /complete dynamically!
            await api.patch(`/restaurants/${restaurantId}/reservations/${reservationId}/${routeAction}`)
            // Update local array status cleanly to maintain visual continuity with zero reload lag
            setReservations(prev => prev.map(res =>
                res._id === reservationId ?
                    { ...res, status: routeAction === "cancel" ? "CANCELLED" : routeAction === "confirm" ? "CONFIRMED" : "COMPLETED" }
                    : res
            ))
        } catch (error) {
            alert(error.response?.data?.message || "State transition rejected by validation constraints.")
        } finally {
            setProcessingId(null)
        }
    }

    const getStatusStyle = (status) => {
        switch (status?.toUpperCase()) {
            case "PENDING": return "bg-amber-950/40 border-amber-800/40 text-amber-400"
            case "CONFIRMED": return "bg-emerald-950/40 border-emerald-800/40 text-emerald-400"
            case "COMPLETED": return "bg-blue-950/40 border-blue-800/40 text-blue-400"
            default: return "bg-neutral-950/40 border-neutral-800/80 text-neutral-500 opacity-60"
        }
    }

    const getTableNumberStr = (tableId) => {
        const matched = tables.find(t => t._id === tableId)
        return matched ? `Table ${matched.tableNumber}` : "Allocated Table"
    }

    const activeTablesOnly = tables.filter(t => t.status !== "INACTIVE")



    return (
        <div className="space-y-6 animate-fade-in pb-12">

            {/* Module Title Action Frame Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-800 pb-5">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-emerald-500" />
                        Reservations Control Desk
                    </h2>
                    <p className="text-neutral-400 text-sm mt-1">Audit guest booking calendars, monitor timeline overlaps, and process operational check-ins.</p>
                </div>

                <div className="flex items-center gap-3">
                    <Button 
                        onClick={loadSchedulerMetadata} 
                        variant="outline" 
                        className="border-neutral-800 text-neutral-400 hover:text-white bg-neutral-900/50 rounded-xl cursor-pointer"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                    </Button>
                    <Button 
                        onClick={() => setIsDialogOpen(true)} 
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-2 rounded-xl px-4 py-2 cursor-pointer shadow-lg shadow-emerald-950/20 text-xs transition-all active:scale-[0.99]"
                    >
                        <Plus className="w-4 h-4" />Book Seating Slot
                    </Button>
                </div>
            </div>

            {errorMessage && <div className="p-3 bg-red-900/30 border border-red-800 text-red-200 text-sm font-medium rounded-lg text-center">{errorMessage}</div>}

            {/* 📊 RUNTIME SCHEDULER VIEWPORT LIST CONTAINER */}
            {isLoading ? (
                <div className="text-center py-20 text-neutral-500 font-mono text-xs animate-pulse">Synchronizing Seating Timeline Matrix...</div>
            ) : reservations.length === 0 ? (
                <div className="border border-dashed border-neutral-800 rounded-2xl p-16 text-center space-y-4 max-w-xl mx-auto mt-8 bg-neutral-900/10"><div className="w-12 h-12 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center justify-center mx-auto text-emerald-500"><Calendar className="w-5 h-5" /></div><h4 className="text-white font-bold text-lg">No Schedule Records Registered</h4><p className="text-neutral-500 text-sm">There are currently zero future table bookings mapped inside this restaurant's ledger.</p></div>
            ) : (
                <div className="space-y-4 animate-scale-in">

                    <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 uppercase tracking-wider px-1 mb-2"><ClipboardCheck className="w-4 h-4 text-emerald-500" /><span>Active Booking Ledgers ({reservations.length})</span></div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {reservations.map((res) => {
                            const isProcessing = processingId === res._id
                            const badgeStyle = getStatusStyle(res.status)
                            const formattedDate = new Date(res.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })

                            return (
                                <div key={res._id} className={`bg-neutral-900/40 backdrop-blur-md border border-neutral-800 p-5 rounded-2xl shadow-xl flex flex-col justify-between space-y-5 hover:border-neutral-700 transition-all ${isProcessing ? "opacity-30 animate-pulse pointer-events-none" : ""}`}>

                                    <div className="space-y-3.5">
                                        {/* Header Row: Status Label state maps */}
                                        <div className="flex justify-between items-center">
                                            <span className={`text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 border rounded-md shadow-sm uppercase ${badgeStyle}`}>{res.status}</span>
                                            <span className="text-xs text-neutral-400 font-mono font-bold bg-neutral-950 border border-neutral-800/80 px-2 py-1 rounded-lg flex items-center gap-1"><Armchair className="w-3.5 h-3.5 text-emerald-500" />{getTableNumberStr(res.table)}</span>
                                        </div>

                                        {/* Timeline Coordinate parameters */}
                                        <div className="space-y-1.5 pt-1">
                                            <div className="text-white font-black text-xl tracking-tight flex items-center gap-2 font-sans">{formattedDate}</div>
                                            <div className="text-neutral-400 text-xs font-mono flex items-center gap-3 bg-neutral-950/40 p-2 rounded-xl border border-neutral-800/40 w-fit">
                                                <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-neutral-600" /> {res.startTime} - {res.endTime}</span><span className="text-neutral-700">|</span><span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5 text-neutral-600" /> {res.guests} Pax</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 🛡️ STATE MACHINE CONTROL SHORTCUT BOARD BUTTON MODULE PANEL */}
                                    {res.status !== "CANCELLED" && res.status !== "COMPLETED" && (
                                        <div className="flex flex-col gap-2 pt-2 border-t border-neutral-800/40 text-[11px] font-bold uppercase tracking-wider">

                                            {/* Upper Row: 50/50 Split for Management Operations */}
                                            <div className="grid grid-cols-2 gap-2">
                                                {/* Left Option: Cancel booking holds */}
                                                <button
                                                    onClick={() => handleMutateStatus(res._id, "cancel")}
                                                    className="py-2 px-3 rounded-xl bg-neutral-950/40 border border-neutral-800 text-neutral-400 hover:text-red-400 hover:border-red-900/30 transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 outline-none focus:outline-none"
                                                >
                                                    <Ban className="w-3.5 h-3.5 text-red-500/80" /> Cancel
                                                </button>

                                                {/* Right Option: Edit Details Wizard */}
                                                <button
                                                    onClick={() => { setEditingReservation(res); setIsDialogOpen(true); }}
                                                    className="py-2 px-3 rounded-xl bg-neutral-950/40 border border-neutral-800 text-neutral-400 hover:text-amber-400 hover:border-amber-900/30 transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 outline-none focus:outline-none"
                                                >
                                                    <Pencil className="w-3.5 h-3.5 text-amber-500" /> Edit Details
                                                </button>
                                            </div>

                                            {/* Lower Row: Full-Width Advanced State Progression Gates */}
                                            {res.status === "PENDING" && (
                                                <button
                                                    onClick={() => handleMutateStatus(res._id, "confirm")}
                                                    className="w-full py-2.5 px-3 rounded-xl bg-neutral-950/40 border border-neutral-800 text-neutral-400 hover:text-emerald-400 hover:border-emerald-900/30 transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 outline-none focus:outline-none"
                                                >
                                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Confirm
                                                </button>
                                            )}

                                            {res.status === "CONFIRMED" && (
                                                <button
                                                    onClick={() => handleMutateStatus(res._id, "complete")}
                                                    className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 outline-none focus:outline-none shadow-md shadow-emerald-950/10"
                                                >
                                                    <CheckCircle className="w-3.5 h-3.5" /> Complete
                                                </button>
                                            )}

                                        </div>
                                    )}
                                    {/* Footer Account Token reference tracking label */}
                                    <div className="text-[10px] text-neutral-600 font-mono text-right select-none pt-1">
                                        CUST-ID: {(res.customer || "0000").toString().slice(-6).toUpperCase()}
                                    </div>

                                </div>
                            )
                        })}
                    </div>

                </div>
            )}

            <ReservationDialog 
                isOpen={isDialogOpen} 
                onClose={() => setIsDialogOpen(false)} 
                onRefresh={loadSchedulerMetadata} 
                activeTables={activeTablesOnly}
                editingReservation={editingReservation} 
            />
        </div>
    )
}