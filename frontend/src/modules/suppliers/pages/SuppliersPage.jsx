import { useState, useEffect, useCallback } from "react"
import { useParams } from "react-router"
import {
    Truck,
    RefreshCw,
    Plus,
    Search,
    X,
    User,
    Phone,
    Mail,
    MapPin,
    FileText,
    CheckCircle2,
    Ban,
    Pencil,
    AlertTriangle,
    ChevronLeft,
    ChevronRight
} from "lucide-react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { api } from "../../../lib/axios"
import SupplierDialog from "../components/SupplierDialog"


export default function SuppliersPage() {
    const { restaurantId } = useParams()

    const [suppliers, setSuppliers] = useState([])
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
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedSupplier, setSelectedSupplier] = useState(null)

    const [isLoading, setIsLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState(null)
    const [processingId, setProcessingId] = useState(null)

    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingSupplier, setEditingSupplier] = useState(null)

    
    const loadSuppliersWorkspace = useCallback(async () => {
        setIsLoading(true)
        setErrorMessage(null)

        try {
            const params = {
                page: currentPage,
                limit: 10,
                ...(activeFilter !== "ALL" ? { status: activeFilter } : {}),
                ...(searchQuery.trim() ? { search: searchQuery.trim() } : {})
            }
            const response = await api.get(`/restaurants/${restaurantId}/suppliers`, { params })
            console.log("Calling... ", Date.now())
            
            const fetchedSuppliers = response.data?.data?.suppliers || []
            const fetchedMeta = response.data?.data?.meta || {
                page: 1,
                limit: 10,
                totalItems: fetchedSuppliers.length,
                totalPages: 1,
                hasNextPage: false,
                hasPrevPage: false
            }

            setSuppliers(fetchedSuppliers)
            setMeta(fetchedMeta)
            
        } catch (error) {
            console.error("[Suppliers Workspace Sync Failed]:", error)
            setErrorMessage(
                error.response?.data?.message ||
                "Failed to load restaurant supplier directory."
            )
        } finally {
            setIsLoading(false)
        }
    }, [restaurantId, currentPage, activeFilter, searchQuery])

    useEffect(() => {
        if (restaurantId) loadSuppliersWorkspace()
    }, [loadSuppliersWorkspace])

    const handleToggleStatus = async (supplier) => {
        const nextStatus = supplier.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
        setProcessingId(supplier._id)

        try {
            const response = await api.patch(
                `/restaurants/${restaurantId}/suppliers/${supplier._id}`, 
                { status: nextStatus }
            )

            const updated = response.data?.data?.supplier || null
            if (updated) {
                setSuppliers(prev => 
                    prev.map(s => (s._id === supplier._id ? updated : s))
                )
                if (selectedSupplier?._id === supplier._id) {
                    setSelectedSupplier(updated)
                }
            } else {
                loadSuppliersWorkspace()
            }
        } catch (error) {
            alert(
                error.response?.data?.message ||
                "Failed to update supplier status."
            )
        } finally {
            setProcessingId(null)
        }
    }

    const activeCount = suppliers.filter(s => s.status === "ACTIVE").length
    const inactiveCount = suppliers.filter(s => s.status === "INACTIVE").length


    return (
        <div className="space-y-6 animate-fade-in pb-8 w-full select-none">

            {/* PANEL HEADER SYSTEM ACTION BLOCK */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-800 pb-5">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                        <Truck className="w-6 h-6 text-emerald-500" />
                        Supplier & Vendor Directory
                    </h2>
                    <p className="text-neutral-400 text-sm mt-1">
                        Manage wholesale ingredient vendors, contact points, and procurement terms.
                    </p>
                </div>

                <div className="flex items-center gap-3 self-start sm:self-auto">
                    <Button
                        onClick={loadSuppliersWorkspace}
                        variant="outline"
                        className="border-neutral-800 text-neutral-400 hover:text-white bg-neutral-900/50 rounded-xl cursor-pointer"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                    </Button>

                    <Button
                        onClick={() => {
                            setEditingSupplier(null)
                            setIsDialogOpen(true)
                        }}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-2 rounded-xl px-4 py-2 cursor-pointer shadow-lg shadow-emerald-950/20 text-xs transition-all active:scale-[0.99]"
                    >
                        <Plus className="w-4 h-4" /> Add Supplier
                    </Button>
                </div>
            </div>

            {/* TELEMETRIC SUMMARY CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-5 flex items-center justify-between backdrop-blur-md">
                    <div className="space-y-1">
                        <span className="text-[10px] text-neutral-500 font-mono font-bold uppercase tracking-wider block">
                            Registered Vendors
                        </span>
                        <span className="text-2xl font-black text-white font-mono">
                            {meta.totalItems || suppliers.length} Vendors
                        </span>
                    </div>
                    <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-400">
                        <Truck className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-5 flex items-center justify-between backdrop-blur-md">
                    <div className="space-y-1">
                        <span className="text-[10px] text-neutral-500 font-mono font-bold uppercase tracking-wider block">
                            Active Partners (Page)
                        </span>
                        <span className="text-2xl font-black text-white font-mono">
                            {activeCount} Active
                        </span>
                    </div>
                    <div className="p-3 bg-emerald-950/20 border border-emerald-900/30 rounded-xl text-emerald-400">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-5 flex items-center justify-between backdrop-blur-md">
                    <div className="space-y-1">
                        <span className="text-[10px] text-neutral-500 font-mono font-bold uppercase tracking-wider block">
                            Inactive / Archived (Page)
                        </span>
                        <span className="text-2xl font-black text-white font-mono">
                            {inactiveCount} Inactive
                        </span>
                    </div>
                    <div className="p-3 bg-red-950/20 border border-red-900/30 rounded-xl text-red-400">
                        <Ban className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* SERVER-SIDE SEARCH BAR */}
            <div className="relative flex items-center w-full max-w-md">
                <Search className="absolute left-4 w-4 h-4 text-neutral-500 pointer-events-none" />
                <Input
                    type="text"
                    placeholder="Search suppliers by company name..."
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value)
                        setCurrentPage(1)
                    }}
                    className="pl-10 pr-10 bg-neutral-900/50 border-neutral-800 text-white placeholder:text-neutral-600 rounded-xl text-xs h-10 w-full focus:border-emerald-500"
                />
                {searchQuery && (
                    <button
                        type="button"
                        onClick={() => {
                            setSearchQuery("")
                            setCurrentPage(1)
                        }}
                        className="absolute right-3 p-1 rounded-md text-neutral-500 hover:text-white hover:bg-neutral-800/60 transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-neutral-700"
                        aria-label="Clear search query"
                    >
                        <X className="w-3.5 h-3.5 select-none" />
                    </button>
                )}
            </div>

            {errorMessage && (
                <div className="p-3 bg-red-900/20 border border-red-800/40 text-red-400 text-xs font-medium rounded-xl text-center">
                    {errorMessage}
                </div>
            )}

            {/* TWO-COLUMN DIRECTORY & PROFILE INSPECTOR */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start w-full">

                {/* LEFT DIRECTORY TABLE */}
                <div className="xl:col-span-2 space-y-4">
                    <div className="flex flex-wrap items-center gap-3 w-full">
                        {["ALL", "ACTIVE", "INACTIVE"].map((filter) => {
                            const isActive = activeFilter === filter
                            return (
                                <button
                                    key={filter}
                                    onClick={() => {
                                        setActiveFilter(filter)
                                        setCurrentPage(1)
                                    }}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide border cursor-pointer select-none uppercase transition-all duration-200 ${
                                        isActive
                                            ? "bg-emerald-600/10 border-emerald-500 text-emerald-400 font-extrabold shadow-lg shadow-emerald-950/20"
                                            : "border-neutral-800 bg-neutral-900/40 text-neutral-400 hover:border-neutral-700 hover:text-white"
                                    }`}
                                >
                                    {filter === "ALL" ? "ALL SUPPLIERS" : filter}
                                </button>
                            )
                        })}
                    </div>

                    <div className="bg-neutral-900/20 border border-neutral-800/80 rounded-2xl overflow-hidden backdrop-blur-md">
                        {isLoading ? (
                            <div className="text-center py-24 text-neutral-500 font-mono text-xs animate-pulse">
                                Syncing Vendor Directory Records...
                            </div>
                        ) : suppliers.length === 0 ? (
                            <div className="text-center py-24 text-neutral-600 font-mono text-xs flex flex-col items-center justify-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-neutral-700" />
                                <span>No suppliers match the active filter or search criteria.</span>
                            </div>
                        ) : (
                            <div className="overflow-x-auto w-full">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-neutral-800 bg-neutral-950/40 text-[10px] font-mono font-black text-neutral-500 uppercase tracking-wider select-none">
                                            <th className="py-3.5 px-4">Supplier Name</th>
                                            <th className="py-3.5 px-4">Contact Person</th>
                                            <th className="py-3.5 px-4">Phone</th>
                                            <th className="py-3.5 px-4 text-center">Status</th>
                                            <th className="py-3.5 px-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-900/60 text-xs font-medium text-neutral-300">
                                        {suppliers.map((supplier) => {
                                            const isSelected = selectedSupplier?._id === supplier._id
                                            const isProcessing = processingId === supplier._id

                                            return (
                                                <tr
                                                    key={supplier._id}
                                                    onClick={() => setSelectedSupplier(supplier)}
                                                    className={`hover:bg-neutral-900/40 transition-colors cursor-pointer ${
                                                        isSelected ? "bg-neutral-900/60" : ""
                                                    } ${isProcessing ? "opacity-40 pointer-events-none" : ""}`}
                                                >
                                                    <td className="py-4 px-4 font-bold text-white">
                                                        {supplier.name}
                                                    </td>
                                                    <td className="py-4 px-4 text-neutral-400">
                                                        {supplier.contactPerson || "—"}
                                                    </td>
                                                    <td className="py-4 px-4 font-mono text-neutral-400 whitespace-nowrap">
                                                        {supplier.phone || "—"}
                                                    </td>
                                                    <td className="py-4 px-4 text-center whitespace-nowrap">
                                                        <span
                                                            className={`px-2 py-0.5 text-[9px] font-mono font-black tracking-wider rounded border uppercase ${
                                                                supplier.status === "ACTIVE"
                                                                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                                                    : "bg-red-500/10 border-red-500/20 text-red-400"
                                                            }`}
                                                        >
                                                            {supplier.status}
                                                        </span>
                                                    </td>
                                                    <td
                                                        className="py-4 px-4 text-right whitespace-nowrap"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <button
                                                            title="Edit Vendor"
                                                            onClick={() => {
                                                                setEditingSupplier(supplier)
                                                                setIsDialogOpen(true)
                                                            }}
                                                            className="p-1.5 rounded-lg border border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                                                        >
                                                            <Pencil className="w-3.5 h-3.5" />
                                                        </button>
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

                {/* RIGHT VENDOR PROFILE INSPECTOR SIDEBAR */}
                <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-5 backdrop-blur-md h-full space-y-5 min-h-[50vh]">
                    {selectedSupplier ? (
                        <div className="space-y-5 animate-scale-in">
                            <div className="flex justify-between items-start border-b border-neutral-800/60 pb-4">
                                <div>
                                    <h4 className="text-base font-black text-white tracking-tight">
                                        {selectedSupplier.name}
                                    </h4>
                                    <span className="text-[10px] font-mono text-neutral-500 font-bold uppercase">
                                        Added {new Date(selectedSupplier.createdAt).toLocaleDateString("en-IN")}
                                    </span>
                                </div>
                                <span
                                    className={`text-[9px] font-mono font-black tracking-wider px-2 py-0.5 border rounded uppercase ${
                                        selectedSupplier.status === "ACTIVE"
                                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                            : "bg-red-500/10 border-red-500/20 text-red-400"
                                    }`}
                                >
                                    {selectedSupplier.status}
                                </span>
                            </div>

                            <div className="space-y-3 bg-neutral-950/60 border border-neutral-900 p-4 rounded-xl text-xs">
                                <div className="flex items-center gap-2.5 text-neutral-300">
                                    <User className="w-4 h-4 text-neutral-500 shrink-0" />
                                    <span>{selectedSupplier.contactPerson || "No contact person listed"}</span>
                                </div>
                                <div className="flex items-center gap-2.5 text-neutral-300 font-mono">
                                    <Phone className="w-4 h-4 text-neutral-500 shrink-0" />
                                    <span>{selectedSupplier.phone || "No phone number listed"}</span>
                                </div>
                                <div className="flex items-center gap-2.5 text-neutral-300">
                                    <Mail className="w-4 h-4 text-neutral-500 shrink-0" />
                                    <span className="truncate">{selectedSupplier.email || "No email address listed"}</span>
                                </div>
                                <div className="flex items-start gap-2.5 text-neutral-300">
                                    <MapPin className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
                                    <span>{selectedSupplier.address || "No warehouse address listed"}</span>
                                </div>
                            </div>

                            {selectedSupplier.notes && (
                                <div className="p-3.5 bg-neutral-950/60 border border-neutral-900 rounded-xl text-xs space-y-1">
                                    <span className="text-[9px] font-mono font-black text-neutral-500 uppercase flex items-center gap-1.5">
                                        <FileText className="w-3 h-3" /> Procurement Notes
                                    </span>
                                    <p className="text-neutral-300 italic">"{selectedSupplier.notes}"</p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-2 pt-2 text-[10px] font-bold uppercase tracking-wider">
                                <button
                                    onClick={() => {
                                        setEditingSupplier(selectedSupplier)
                                        setIsDialogOpen(true)
                                    }}
                                    className="py-2.5 px-3 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                    <Pencil className="w-3.5 h-3.5" /> Edit Details
                                </button>

                                <button
                                    onClick={() => handleToggleStatus(selectedSupplier)}
                                    className={`py-2.5 px-3 rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                        selectedSupplier.status === "ACTIVE"
                                            ? "bg-red-950/20 border-red-900/40 text-red-400 hover:bg-red-950/40"
                                            : "bg-emerald-950/20 border-emerald-900/40 text-emerald-400 hover:bg-emerald-950/40"
                                    }`}
                                >
                                    {selectedSupplier.status === "ACTIVE" ? (
                                        <>
                                            <Ban className="w-3.5 h-3.5" /> Deactivate
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="w-3.5 h-3.5" /> Activate
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-600 font-mono text-xs border border-dashed border-neutral-800 rounded-xl bg-neutral-950/10">
                            <Truck className="w-6 h-6 text-neutral-700 mb-2 animate-pulse" />
                            <span>Select a supplier row to view full contact profile and terms.</span>
                        </div>
                    )}
                </div>
            </div>

            <SupplierDialog
                isOpen={isDialogOpen}
                onClose={() => {
                    setIsDialogOpen(false)
                    setEditingSupplier(null)
                }}
                onRefresh={() => {
                    loadSuppliersWorkspace()
                    setSelectedSupplier(null)
                }}
                restaurantId={restaurantId}
                editingSupplier={editingSupplier}
            />
        </div>
    )

}

