import { useState, useEffect } from "react"
import { useParams } from "react-router"
import { 
    Users, 
    UserPlus, 
    RefreshCw, 
    ShieldAlert, 
    CheckCircle2, 
    UserCheck, 
    Mail, 
    Clock,
    Shield,
    Trash2,
    ToggleLeft,
    ToggleRight,
    ShieldAlert as RoleIcon
} from "lucide-react"
import { Button } from "../../../components/ui/button"
import { api } from "../../../lib/axios"
import InviteStaffDialog from "../components/InviteStaffDialog"
import { useAuth } from "../../auth/context/AuthContext"


export default function StaffPage() {
    const { restaurantId } = useParams()
    const { user } = useAuth()

    const [staffList, setStaffList] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState(null)
    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
    const [processingId, setProcessingId] = useState(null)

    const isOwner = user?.role === "OWNER"

    const fetchStaffRoster = async () => {
        setIsLoading(true)
        setErrorMessage(null)

        try {
            const response = await api.get(`/restaurants/${restaurantId}/staff`)
            const rosterData = response.data?.data?.staff || response.data?.data || []
            setStaffList(rosterData)
        } catch (error) {
            console.error("[Staff Roster Fetch Failed]:", error)
            setErrorMessage(error.response?.data?.message || "Failed to communicate with active team access registries.")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (restaurantId) {
            fetchStaffRoster()
        }
    }, [restaurantId])

    const handleToggleStatus = async (staffId, currentStatus) => {
        setProcessingId(staffId)
        const nextStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE"
        try {
            await api.patch(`/restaurants/${restaurantId}/staff/${staffId}`, { status: nextStatus })
            setStaffList(
                (prev) => prev.map(
                    member => member._id === staffId 
                        ? { ...member, status: nextStatus } 
                        : member 
                    )
                )
        } catch (error) {
            alert(error.response?.data?.message || "Failed to modify membership status shifts.")
        } finally {
            setProcessingId(null)
        }
    }

    const handleRoleCycle = async (staffId, currentRole) => {
        if (currentRole === "OWNER") return
        setProcessingId(staffId)
        const rolesEnum = [
            "MANAGER",
            "CASHIER",
            "KITCHEN_STAFF",
            "WAITER"
        ]
        const currentIndex = rolesEnum.indexOf(currentRole)
        const nextRole = rolesEnum[(currentIndex + 1) % rolesEnum.length]
        try {
            await api.patch(`/restaurants/${restaurantId}/staff/${staffId}`, { role: nextRole })
            setStaffList(
                (prev) => prev.map(
                    member => member._id === staffId
                        ? { ...member, role: nextRole }
                        : member
                )
            )
        } catch (error) {
            alert(
                error.response?.data?.message || 
                "Failed to modify permission tier levels."
            )
        } finally {
            setProcessingId(null)
        }
    }

    const handleRemoveStaff = async (staffId, memberName) => {
        if (!window.confirm(`⚠️ DANGER: Are you certain you want to permanently revoke all access clearances for ${memberName}?`)) return
        setProcessingId(staffId)
        try {
            await api.delete(`/restaurants/${restaurantId}/staff/${staffId}`)
            setStaffList(
                (prev) => prev.map(
                    member => member._id === staffId
                        ? { ...member, status: "INACTIVE" }
                        : member 
                )
            )
            console.log(`🟢 [Soft-Deletion Synchronized]: ${memberName} set to INACTIVE.`);
        } catch (error) {
            alert(error.response?.data?.message || "Failed to terminate membership credentials record.")
        } finally {
            setProcessingId(null)
        }
    }

    const getRoleBadgeStyle = (role) => {
        switch (role?.toUpperCase()) {
            case "OWNER":
                return "bg-red-950/40 border-red-800/50 text-red-400"
            case "MANAGER":
                return "bg-amber-950/40 border-amber-800/50 text-amber-400"
            case "CASHIER":
                return "bg-emerald-950/40 border-emerald-800/40 text-emerald-400"
            case "KITCHEN_STAFF":
                return "bg-blue-950/40 border-blue-800/40 text-blue-400"
            case "WAITER":
                return "bg-purple-950/40 border-purple-800/40 text-purple-400"
            default:
                return "bg-neutral-950/40 border-neutral-800/40 text-neutral-400"
        }
    }


    return (
        <div className="space-y-6 animate-fade-in">

            {/* Module Title Action Frame Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-800 pb-5">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                        <Users className="w-5 h-5 text-emerald-500" />
                        Staff Hierarchy Roster
                    </h2>
                    <p className="text-neutral-400 text-sm mt-1">
                        Audit team system clearances, add operational users, and adjust active branch shift profiles.
                    </p>
                </div>

                {/* Action Controls Button Core Grid */}
                <div className="flex items-center gap-3">
                    <Button
                        onClick={fetchStaffRoster}
                        variant="outline"
                        className="border-neutral-800 text-neutral-400 hover:text-white cursor-pointer bg-neutral-900/50 rounded-xl"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                    </Button>

                    <Button 
                        onClick={() => setIsInviteDialogOpen(true)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-2 rounded-xl px-4 py-2 cursor-pointer shadow-lg shadow-emerald-950/20 text-xs transition-all active:scale-[0.99]"
                    >
                        <UserPlus className="w-4 h-4" />
                        Invite Staff Entry
                    </Button>
                </div>
            </div>

            {/* ⚠️ Error Banner Alerts Interceptor Container */}
            {errorMessage && (
                <div className="p-3 bg-red-900/30 border border-red-800 text-red-200 text-sm font-medium rounded-lg text-center animate-fade-in">
                    {errorMessage}
                </div>
            )}

            {/* 📊 ROSTER LIST VIEWPORT DATA CONTAINER */}
            {isLoading ? (
                <div className="text-center py-20 text-neutral-500 font-mono text-xs animate-pulse">
                    Aggregating Team Clearance Matrices...
                </div>
            ) : staffList.length === 0 ? (
                <div className="border border-dashed border-neutral-800 rounded-2xl p-16 text-center space-y-4 max-w-xl mx-auto mt-8 bg-neutral-900/10 animate-scale-in">
                    <div className="w-12 h-12 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center justify-center mx-auto text-emerald-500">
                        <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="text-white font-bold text-lg">Staff Roster is Empty</h4>
                        <p className="text-neutral-500 text-sm mt-1">
                            There are currently no staff profile rows associated with this hardware instance node besides the master account owner.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-4 animate-scale-in">

                    {/* Active Counters Header Badge */}
                    <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 uppercase tracking-wider px-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>Active Credentials Index ({staffList.length})</span>
                    </div>

                    {/* 👥 RESPONSIVE ROSTER GRID CARDS SYSTEM */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {staffList.map((member) => {
                            // Gracefully handle both populated user objects or embedded flat fields from your schema
                            const memberUser = member.user || member
                            const displayName = memberUser.name || "System User"
                            const displayEmail = memberUser.email || "No email declared"
                            const displayRole = member.role || memberUser.role || "STAFF"
                            const displayStatus = member.status || "ACTIVE"
                            const isTargetProcessing = processingId === member._id

                            const actionButtonBaseStyle = "flex flex-col items-center justify-center p-2 rounded-xl bg-neutral-950/40 border border-neutral-800 text-neutral-400 transition-all cursor-pointer gap-1 focus:outline-none"

                            return (
                                <div
                                    key={member._id || member.id}
                                    className={
                                        `bg-neutral-900/40 backdrop-blur-md border border-neutral-800/80 p-5 rounded-2xl shadow-xl 
                                        transition-all duration-300 hover:border-neutral-700/60 group flex flex-col 
                                        justify-between space-y-5 ${isTargetProcessing ? "opacity-40 animate-pulse pointer-events-none" : ""}`
                                    }
                                >
                                    <div className="space-y-3">
                                        {/* Header Row: Role Clearance Level */}
                                        <div className="flex justify-between items-center">
                                            <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 border rounded-md shadow-sm ${getRoleBadgeStyle(displayRole)}`}>
                                                {displayRole.replace("_", " ")}
                                            </span>

                                            {/* Active Roster Operational Shift Status Tag */}
                                            <span className={`text-[10px] font-medium inline-flex items-center gap-1 ${displayStatus === "ACTIVE" ? "text-emerald-400" : "text-neutral-500"}`}>
                                                <span className={`w-1.5 h-1-5 rounded-full ${displayStatus === "ACTIVE" ? "bg-emerald-500 animate-pulse" : "bg-neutral-600"}`} />
                                                {displayStatus.toLowerCase()}
                                            </span>
                                        </div>

                                        {/* Member Identity Content Profile */}
                                        <div className="space-y-1">
                                            <h4 className="text-white font-bold text-lg group-hover:text-emerald-400 transition-colors tracking-tight flex items-center gap-2">
                                                <UserCheck className="w-4 h-4 text-neutral-600 shrink-0 group-hover:text-emerald-500 transition-colors" />
                                                {displayName}
                                            </h4>

                                            <p className="text-neutral-400 text-xs inline-flex items-center gap-1.5 pt-1 font-mono truncate max-w-full">
                                                <Mail className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
                                                {displayEmail}
                                            </p>
                                        </div>
                                    </div>

                                    {/* 🛡️ INLINE OWNER MANAGEMENT PANEL CONTROLS BUTTON MODULE GRID */}
                                    {isOwner && displayRole !== "OWNER" && (
                                        <div className="grid grid-cols-3 gap-2 border-t border-b border-neutral-800/60 py-3 text-[11px] font-medium">
                                        
                                        {/* Control A: Toggle status shifts */}
                                        <button 
                                            onClick={() => handleToggleStatus(member._id, displayStatus)} 
                                            className={`${actionButtonBaseStyle} hover:text-emerald-400 hover:border-emerald-900/40 group`}
                                        >
                                            {displayStatus === "ACTIVE" ? <ToggleRight className="w-4 h-4 text-emerald-500" /> : <ToggleLeft className="w-4 h-4" />}
                                            <span>{displayStatus === "ACTIVE" ? "Suspend" : "Activate"}</span>
                                        </button>

                                        {/* Control B: Cycle Roles */}
                                        <button 
                                            onClick={() => handleRoleCycle(member._id, displayRole)} 
                                            className={`${actionButtonBaseStyle} hover:text-amber-400 hover:border-amber-900/40`}
                                        >
                                            <RoleIcon className="w-4 h-4 text-amber-500" />
                                            <span>Cycle Role</span>
                                        </button>

                                        {/* Control C: Evict Employee */}
                                        <button 
                                            onClick={() => handleRemoveStaff(member._id, displayName)} 
                                            className={`${actionButtonBaseStyle} hover:text-red-400 hover:border-red-900/40`}
                                        >
                                            <Trash2 className="w-4 h-4 text-red-500/80" />
                                            <span>Remove</span>
                                        </button>

                                        </div>
                                    )}

                                    {/* Lower Infrastructure Management Footer Card Row */}
                                    <div className="pt-3 flex items-center justify-between text-[11px] text-neutral-500 font-sans">
                                        <span className="inline-flex items-center gap-1">
                                            <Clock className="w-3.5 h-3.5 text-neutral-700" />
                                            Joined {member.createdAt ? new Date(member.createdAt).toLocaleDateString("en-US", { month: "short", year: "2-digit" }) : "Recent"}
                                        </span>

                                        <span className="text-neutral-600 text-[10px] font-mono">
                                            ID: {(member._id || member.id || "0000").toString().slice(-6)}
                                        </span>
                                    </div>

                                </div>
                            )
                        })}
                    </div>

                </div>
            )}

            <InviteStaffDialog 
                isOpen={isInviteDialogOpen}
                onClose={() => setIsInviteDialogOpen(false)}
                onRefreshRoster={fetchStaffRoster}
            />

        </div>
    )
}
