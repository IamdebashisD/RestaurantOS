import { useState, useEffect } from "react"
import { useParams } from "react-router"
import { X, Calendar, Clock, Users, Armchair, ArrowRight } from "lucide-react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { api } from "../../../lib/axios"


export default function ReservationDialog({
    isOpen,
    onClose,
    onRefresh,
    activeTables = [],
    editingReservation = null
}) {
    const { restaurantId } = useParams()

    const [formData, setFormData] = useState({
        table: "",
        date: "",
        startTime: "",
        endTime: "",
        guests: ""
    })

    const [isLoading, setIsLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState(null)

    // Explicit dynamic boolean flag tracking mode contexts
    const isEditMode = !!editingReservation

    useEffect(() => {
        if (isEditMode && editingReservation) {
            setFormData({
                table: editingReservation.table || "",
                date: editingReservation.date ||"",
                startTime: editingReservation.startTime ||"",
                endTime: editingReservation.endTime ||"",
                guests: editingReservation.guests ||""
            })
        } else {   
            setFormData({ table: "", date: "", startTime: "", endTime: "", guest: "" })
        }
        setErrorMessage(null)
    }, [isOpen, editingReservation, isEditMode])

    if (!isOpen) return null

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleFormSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setErrorMessage(null)

        // EXACT DTO PAYLOAD MATCH: Packaged cleanly to satisfy your backend's .strict() modifier!
        const payload = {
            table: formData.table,
            date: formData.date,                    // Clean string literal (YYYY-MM-DD)
            startTime: formData.startTime.trim(),   // HH:mm format
            endTime: formData.endTime.trim(),       // HH:mm format
            guests: parseInt(formData.guests, 10)
        }

        try {
            if (isEditMode) {
                await api.patch(`/restaurants/${restaurantId}/reservations/${editingReservation._id}`, payload)
            } else {
                await api.post(`/restaurants/${restaurantId}/reservations`, payload)
            }
            onRefresh()
            onClose()
        } catch (error) {
            console.error("[Booking Provision Failure]:", error)
            setErrorMessage(
                error.response?.data?.message ||
                "Failed to finalize reservation lifecycle block on backend records."
            )
        } finally {
            setIsLoading(false)
        }
    }


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />

            <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 p-6 rounded-2xl shadow-2xl z-10 animate-scale-in max-h-[90vh] overflow-y-auto scrollbar-none">
                <button onClick={onClose} className="absolute right-4 top-4 p-1 rounded-md text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer">
                    <X className="w-4 h-4" />
                </button>

                <div className="mb-6">
                    <h3 className="text-xl font-black text-white tracking-tight">
                        Deploy Reservation Node
                    </h3>
                    <p className="text-neutral-400 text-xs mt-1">
                        Book a physical floor seating unit. Customer context maps automatically to your staff identity session.
                    </p>
                </div>

                {errorMessage && <div className="mb-4 p-3 bg-red-900/30 border border-red-800 text-red-200 text-xs font-medium rounded-lg text-center">{errorMessage}</div>}

                <form onSubmit={handleFormSubmit} className="space-y-4">

                    {/* Target Seating Table Select dropdown Menu */}
                    <div className="space-y-1.5">
                        <Label htmlFor="table" className="text-neutral-300 font-medium text-xs">Target Floor Table Unit Assignment</Label>
                        <div className="relative flex items-center">
                            <Armchair className="absolute left-3 w-4 h-4 text-neutral-500 pointer-events-none" />
                            <select
                                id="table"
                                name="table"
                                required
                                className="pl-10 pr-4 py-2 bg-neutral-950 border border-neutral-800 text-neutral-300 focus:border-emerald-500 rounded-xl text-sm w-full appearance-none outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer h-10"
                                value={formData.table}
                                onChange={handleInputChange}
                            >
                                <option value="" disabled>Select active floor plan target</option>
                                {activeTables.map((t) => (
                                    <option key={t._id} value={t._id}>Table {t.tableNumber} (Capacity: {t.capacity} Pax)</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Calendar Picker Date Field */}
                    <div className="space-y-1.5">
                        <Label htmlFor="date" className="text-neutral-300 font-medium text-xs">Calendar Event Date</Label>
                        <div className="relative flex items-center">
                            <Calendar className="absolute left-3 w-4 h-4 text-neutral-500 pointer-events-none" />
                            <Input 
                                id="date" 
                                name="date" 
                                type="date" 
                                required 
                                className="pl-10 bg-neutral-950 border-neutral-800 text-white rounded-xl text-sm w-full focus:border-emerald-500" 
                                value={formData.date} 
                                onChange={handleInputChange} 
                            />
                        </div>
                    </div>

                    {/* Arriving / Vacating Hours Timing Track Block */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="startTime" className="text-neutral-300 font-medium text-xs">Arriving Start (HH:mm)</Label>
                            <div className="relative flex items-center">
                                <Clock className="absolute left-3 w-4 h-4 text-neutral-500 pointer-events-none" />
                                <Input 
                                    id="startTime" 
                                    name="startTime" 
                                    type="text" 
                                    placeholder="19:00" 
                                    required 
                                    className="pl-10 bg-neutral-950 border-neutral-800 text-white rounded-xl text-sm w-full font-mono focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
                                    value={formData.startTime} 
                                    onChange={handleInputChange} 
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="endTime" className="text-neutral-300 font-medium text-xs">Vacating End (HH:mm)</Label>
                            <div className="relative flex items-center">
                                <Clock className="absolute left-3 w-4 h-4 text-neutral-500 pointer-events-none" />
                                <Input 
                                    id="endTime" 
                                    name="endTime" 
                                    type="text" 
                                    placeholder="21:00" 
                                    required 
                                    className="pl-10 bg-neutral-950 border-neutral-800 text-white rounded-xl text-sm w-full font-mono focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
                                    value={formData.endTime} 
                                    onChange={handleInputChange} 
                                />
                            </div>
                        </div>
                    </div>

                    {/* Guests Headcount Integer Input */}
                    <div className="space-y-1.5">
                        <Label htmlFor="guests" className="text-neutral-300 font-medium text-xs">Party Headcount (Expected Guests)</Label>
                        <div className="relative flex items-center">
                            <Users className="absolute left-3 w-4 h-4 text-neutral-500 pointer-events-none" />
                            <Input 
                                id="guests" 
                                name="guests" 
                                type="number" 
                                min="1" 
                                required 
                                placeholder="4" 
                                className="pl-10 bg-neutral-950 border-neutral-800 text-white rounded-xl text-sm w-full font-mono focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
                                value={formData.guests} 
                                onChange={handleInputChange} />
                        </div>
                    </div>

                    {/* Execution Submit Trigger Controller */}
                    <Button 
                        type="submit" 
                        disabled={isLoading} 
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl cursor-pointer mt-2 shadow-lg inline-flex items-center justify-center gap-2 text-sm focus:outline-none transition-all active:scale-[0.99] disabled:opacity-50"
                    >
                        {isLoading ? "Validating Overlaps..." : "Confirm Schedule Block"}
                        {!isLoading && <ArrowRight className="w-4 h-4" />}
                    </Button>
                </form>
            </div>
        </div>
    )
}

