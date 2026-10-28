import { useState, useEffect, useCallback } from "react"
import { useParams } from "react-router"
import {
    Layers,
    Plus,
    RefreshCw,
    Armchair,
    ToggleLeft,
    ToggleRight,
    Trash2,
    CheckCircle2,
    ShieldAlert,
    Pencil
} from "lucide-react"
import { Button } from "../../../components/ui/button"
import TableDialog from "../components/TableDialog"
import { useAuth } from "../../auth/context/AuthContext"
import { api } from "../../../lib/axios"


export default function TablesPage() {
    const { restaurantId } = useParams()
    const { user } = useAuth()

    const [tablesList, setTablesList] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState(null)

    const [isDialogOpen, setIsAddDialogOpen] = useState(false)
    const [editingTable, setEditingTable] = useState(null)
    const [processingId, setProcessingId] = useState(null)

    const isManagementTier = ["OWNER", "MANAGER"].includes(user?.role?.toUpperCase())

    const fetchTablesCatalog = useCallback(async () => {
        setIsLoading(true)
        setErrorMessage(null)

        try {
            const response = await api.get(`/restaurants/${restaurantId}/tables`)
            const dataPackage = response.data?.data?.tables || response.data?.data || []
            setTablesList(dataPackage)
        } catch (error) {
            console.error("[Tables Unboxing Failed]:", error)
            setErrorMessage(
                error.response?.data?.message ||
                "Failed to establish communication pipeline with backend table registries."
            )
        } finally {
            setIsLoading(false)
        }
    }, [restaurantId])

    useEffect(() => {
        if (restaurantId) fetchTablesCatalog()
    }, [fetchTablesCatalog])

    const handleFastToggleOccupancy = async (tableId, currentStatus, currentNum, currentCapacity) => {
        if (!isManagementTier && currentStatus === "RESERVED") return
        setProcessingId(tableId)
        const nextStatus = currentStatus === "AVAILABLE" ? "OCCUPIED" : "AVAILABLE"

        try {
            await api.patch(`/restaurants/${restaurantId}/tables/${tableId}`, {
                tableNumber: currentNum,
                capacity: currentCapacity,
                status: nextStatus
            })

            setTablesList(prev => prev.map(t => t._id === tableId ? { ...t, status: nextStatus } : t))
        } catch (error) {
            alert(error.response?.data?.message || "Failed to commit inline seating updates.")
        } finally {
            setProcessingId(null)
        }
    }

    const handleSoftDeleteTable = async (tableId, tableNum) => {
        if (!window.confirm(`⚠️ WARNING: Deactivating Table ${tableNum} moves it off active service floor space views. Proceed?`)) return
        setProcessingId(tableId)

        try {
            await api.delete(`/restaurants/${restaurantId}/tables/${tableId}`)
            setTablesList(prev => prev.map(t => t._id === tableId ? { ...t, status: "INACTIVE" } : t))
        } catch (error) {
            alert(error.response?.data?.message || "Failed to soft-deactivate seating node.")
        } finally {
            setProcessingId(null)
        }
    }

    const handleTriggerEditMode = (table) => {
        setEditingTable(table)
        setIsAddDialogOpen(true)
    }

    const getStatusColorConfig = (status) => {
        switch (status?.toUpperCase()) {
            case "AVAILABLE": return "border-emerald-800/80 bg-emerald-950/20 text-emerald-400 ripple-emerald"
            case "OCCUPIED": return "border-amber-800/80 bg-amber-950/20 text-amber-400"
            case "RESERVED": return "border-red-800/80 bg-red-950/20 text-red-400"
            default: return "border-neutral-800 bg-neutral-950 text-neutral-500 opacity-40"
        }
    }

    const activeTables = tablesList.filter(t => t.status !== "INACTIVE")
    const inactiveTables = tablesList.filter(t => t.status === "INACTIVE")


    return (
        <div className="space-y-6 animate-fade-in pb-12">

            {/* Module Title Action Frame Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-800 pb-5">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                        <Layers className="w-5 h-5 text-emerald-500" />
                        Floor Space Layout Mapping
                    </h2>
                    <p className="text-neutral-400 text-sm mt-1">Monitor active dining grids, handle customer seatings, and provision layout blueprint scales.</p>
                </div>

                <div className="flex items-center gap-3">
                    <Button 
                        onClick={fetchTablesCatalog} 
                        variant="outline" className="border-neutral-800 text-neutral-400 hover:text-white bg-neutral-900/50 rounded-xl cursor-pointer"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                    </Button>

                    {isManagementTier && (
                        <Button 
                            onClick={() => { setEditingTable(null); setIsAddDialogOpen(true); }} 
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-2 rounded-xl px-4 py-2 cursor-pointer shadow-lg shadow-emerald-950/20 text-xs transition-all active:scale-[0.99]"
                        >
                            <Plus className="w-4 h-4" />Deploy Table Node
                        </Button>
                    )}
                </div>
            </div>

            {errorMessage && <div className="p-3 bg-red-900/30 border border-red-800 text-red-200 text-sm font-medium rounded-lg text-center">{errorMessage}</div>}

            {/* 📊 RUNTIME INTERACTIVE GRID VIEWPORT CONTAINER */}
            {isLoading ? (
                <div className="text-center py-20 text-neutral-500 font-mono text-xs animate-pulse">Aggregating Seating Geometries Grid...</div>
            ) : tablesList.length === 0 ? (
                <div className="border border-dashed border-neutral-800 rounded-2xl p-16 text-center space-y-4 max-w-xl mx-auto mt-8 bg-neutral-900/10">
                    <div className="w-12 h-12 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center justify-center mx-auto text-emerald-500">
                        <Armchair className="w-5 h-5" /></div><h4 className="text-white font-bold text-lg">No Seating Nodes Deployed</h4><p className="text-neutral-500 text-sm">Initialize restaurant floor plans using the action control button above.</p>
                    </div>
            ) : (
                <div className="space-y-10">

                    {/* Section A: Live Operational Service Floor */}
                    <div className="space-y-4 mb-8">
                        <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 uppercase tracking-wider px-1">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span>Active Dining Service Floor ({activeTables.length})</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full auto-rows-fr">
                            {activeTables.map((table) => {
                                const isProcessing = processingId === table._id
                                const configColors = getStatusColorConfig(table.status)

                                return (
                                    <div 
                                        key={table._id} 
                                        className={`border p-5 rounded-2xl flex flex-col justify-between space-y-4 relative shadow-xl transition-all duration-300 hover:border-neutral-700 select-none group ${configColors} 
                                        ${isProcessing ? "opacity-30 animate-pulse pointer-events-none" : ""}`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-0.5">
                                                <span className="text-[10px] text-neutral-500 font-mono font-bold uppercase tracking-wider block">TABLE</span>
                                                <h4 className="text-white font-black text-3xl font-mono tracking-tight group-hover:text-emerald-400 transition-colors">{table.tableNumber}</h4>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[10px] text-neutral-500 font-mono font-bold uppercase block">SEATS</span>
                                                <span className="text-white font-bold text-sm font-mono">{table.capacity} Pax</span>
                                            </div>
                                        </div>

                                        <div className="text-[10px] font-mono tracking-wide uppercase font-bold py-1 bg-neutral-950/40 rounded-lg text-center border border-neutral-800/40">
                                            {table.status}
                                        </div>

                                        {/* Quick Staff Interactions Dashboard Panel */}
                                        <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-neutral-800/40">
                                            <button 
                                                onClick={() => handleFastToggleOccupancy(table._id, table.status, table.tableNumber, table.capacity)} 
                                                className="flex-1 py-1.5 px-2 rounded-lg bg-neutral-950/40 border border-neutral-800 text-neutral-400 hover:text-emerald-400 hover:border-emerald-900/30 transition-all text-[10px] font-bold uppercase tracking-wider cursor-pointer text-center"
                                            >
                                                {table.status === "OCCUPIED" ? "Clear" : "Seat"}
                                            </button>

                                            {isManagementTier && (
                                                <div className="flex gap-1 shrink-0">
                                                    <button 
                                                        onClick={() => handleTriggerEditMode(table)} 
                                                        className="p-1.5 rounded-lg bg-neutral-950/40 border border-neutral-800 text-neutral-500 hover:text-amber-400 cursor-pointer transition-colors"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleSoftDeleteTable(table._id, table.tableNumber)} 
                                                        className="p-1.5 rounded-lg bg-neutral-950/40 border border-neutral-800 text-neutral-500 hover:text-red-400 cursor-pointer transition-colors"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Section B: Stored Broken-down / Inactive Units Storage Rack */}
                    {inactiveTables.length > 0 && (
                        <div className="space-y-4 pt-6 mt-6 border-t border-neutral-800/60 w-full animate-scale-in">
                            <div className="flex items-center gap-2 text-xs font-bold text-neutral-500 uppercase tracking-wider px-1">
                                <ShieldAlert className="w-4 h-4 text-neutral-600" /><span>Stored / Deactivated Inventory Node Units ({inactiveTables.length})</span>
                            </div>

                            <div className="grid grid-cols-1 gap-3 w-full">
                                {inactiveTables.map((table) => (
                                    <div 
                                        key={table._id} 
                                        className="border border-neutral-800/40 bg-neutral-950/20 px-5 py-4 rounded-xl flex items-center justify-between text-neutral-500 opacity-40 font-mono text-xs select-none w-full shadow-md"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="w-1.5 h-1.5 rounded-full bg-neutral-600 animate-pulse" />
                                            <span className="font-bold text-neutral-300">Table {table.tableNumber}</span>
                                            <span className="text-neutral-600 text-[11px]">({table.capacity} Seats Max Capacity)</span>
                                        </div>

                                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600 select-none">INACTIVE</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            )}

            <TableDialog 
                isOpen={isDialogOpen} 
                onClose={() => { setIsAddDialogOpen(false); setEditingTable(null); }} 
                onRefresh={fetchTablesCatalog} 
                editingTable={editingTable} 
            />
        </div>
    )
}
