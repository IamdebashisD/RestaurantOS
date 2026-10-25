import { useState, useEffect } from "react"
import { useParams } from "react-router"
import { X, Layers, Users, ShieldAlert, ArrowRight, Activity } from "lucide-react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { api } from "../../../lib/axios"


export default function TableDialog({ isOpen, onClose, onRefresh, editingTable = null }) {
    const { restaurantId } = useParams()

    const [formData, setformData] = useState({
        tableNumber: "",
        capacity: "",
        status: "AVAILABLE"
    })

    const [isLoading, setIsLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState(null)

    const isEditMode = !!editingTable

    useEffect(() => {
        if (isEditMode && editingTable) {
            setformData({
                tableNumber: editingTable.tableNumber || "",
                capacity: editingTable.capacity || "",
                status: editingTable.status || "AVAILABLE"
            })
        } else {
            setformData({ tableNumber: "", capacity: "", status: "AVAILABLE" })
        }
        setErrorMessage(null)
    }, [isOpen, editingTable, isEditMode])

    if (!isOpen) return null

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setformData((prev) => ({ ...prev, [name]: value }))
    }

    const handleFormSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setErrorMessage(null)

        const payload = {
            tableNumber: parseInt(formData.tableNumber, 10),
            capacity: parseInt(formData.capacity, 10),
            status: formData.status
        }

        try {
            if (isEditMode) {
                await api.patch(`restaurants/${restaurantId}/tables/${editingTable._id}`, payload)
            } else {
                await api.post(`restaurants/${restaurantId}/tables`, payload)
            }
            onRefresh()
            onClose()
        } catch (error) {
            console.error("[Table Transaction Failure]:", error)
            setErrorMessage(
                error.response?.data?.message ||
                "Failed to commit table schema properties inside backend database nodes."
            )
        } finally {
            setIsLoading(false)
        }
    }


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />

            <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 p-6 rounded-2xl shadow-2xl z-10 animate-scale-in">
                <button onClick={onClose} className="absolute right-4 top-4 p-1 rounded-md text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer">
                    <X className="w-4 h-4" />
                </button>

                <div className="mb-6">
                    <h3 className="text-xl font-black text-white tracking-tight">{isEditMode ? "Modify Seating Node" : "Deploy Floor Seating Node"}</h3>
                    <p className="text-neutral-400 text-xs mt-1">Configure physical dining table grid boundaries matching restaurant blueprints.</p>
                </div>

                {errorMessage && <div className="mb-4 p-3 bg-red-900/30 border border-red-800 text-red-200 text-xs font-medium rounded-lg text-center">{errorMessage}</div>}

                <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="tableNumber" className="text-neutral-300 font-medium text-xs">Table Identification Number</Label>
                        <div className="relative flex items-center">
                            <Layers className="absolute left-3 w-4 h-4 text-neutral-500 pointer-events-none" />
                            <Input
                                id="tableNumber"
                                name="tableNumber"
                                type="number"
                                min="1"
                                required
                                placeholder="5"
                                className="pl-10 bg-neutral-950 border-neutral-800 text-white rounded-xl text-sm w-full transition-all font-mono"
                                value={formData.tableNumber}
                                onChange={handleInputChange}
                                disabled={isEditMode}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="capacity" className="text-neutral-300 font-medium text-xs">Guest Seating Capacity (Seats Max)</Label>
                        <div className="relative flex items-center">
                            <Users className="absolute left-3 w-4 h-4 text-neutral-500 pointer-events-none" />
                            <Input
                                id="capacity"
                                name="capacity"
                                type="number"
                                min="1"
                                required
                                placeholder="4"
                                className="pl-10 bg-neutral-950 border-neutral-800 text-white rounded-xl text-sm w-full transition-all font-mono"
                                value={formData.capacity}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="status" className="text-neutral-300 font-medium text-xs">
                            Operational Status Configuration State
                        </Label>
                        <div className="relative flex items-center w-full">
                            {/* <Layers className="absolute left-3 w-4 h-4 text-neutral-500 pointer-events-none" /> */}
                            <Activity className="absolute left-3 w-4 h-4 text-neutral-500 pointer-events-none group-focus-within:text-emerald-500 transition-colors" />
                            <select 
                                id="status" 
                                name="status" 
                                className="w-full pl-10 pr-10 py-2 bg-neutral-950 border border-neutral-800 text-neutral-300 focus:border-emerald-500 rounded-xl text-sm appearance-none outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer h-10 transition-all font-sans" 
                                value={formData.status} 
                                onChange={handleInputChange}
                            >
                                <option value="AVAILABLE">AVAILABLE (🟢 Open to Guests)</option>
                                <option value="OCCUPIED">OCCUPIED (🟡 Dining/Billed)</option>
                                <option value="RESERVED">RESERVED (🔴 Locked Hold Slot)</option>
                                {isEditMode && <option value="INACTIVE">INACTIVE (🔘 Taken Off Floor)</option>}
                            </select>
                        </div>
                    </div>

                    <Button type="submit" disabled={isLoading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl cursor-pointer mt-2 shadow-lg inline-flex items-center justify-center gap-2 text-sm focus:outline-none transition-all active:scale-[0.99] disabled:opacity-50">
                        {isLoading ? "Synchronizing Configurations..." : isEditMode ? "Commit Layout Updates" : "Deploy Seating Table"}
                        {!isLoading && <ArrowRight className="w-4 h-4" />}
                    </Button>
                </form>
            </div>
        </div>
    )
}
