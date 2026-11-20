import { useState, useEffect } from "react"
import {
    X,
    Truck,
    User,
    Phone,
    Mail,
    MapPin,
    FileText,
    ArrowRight
} from "lucide-react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { api } from "../../../lib/axios"


export default function SupplierDialog({ 
    isOpen, 
    onClose, 
    onRefresh, 
    restaurantId, 
    editingSupplier = null
}) {
    const [name, setName] = useState("")
    const [contactPerson, setContactPerson] = useState("")
    const [phone, setPhone] = useState("")
    const [email, setEmail] = useState("")
    const [address, setAddress] = useState("")
    const [notes, setNotes] = useState("")
    const [status, setStatus] = useState("ACTIVE")

    const [isLoading, setIsLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState(null)

    const isEditMode = !!editingSupplier

    useEffect(() => {
        if (isOpen) {
            setName(editingSupplier?.name || "")
            setContactPerson(editingSupplier?.contactPerson || "")
            setPhone(editingSupplier?.phone || "")
            setEmail(editingSupplier?.email || "")
            setAddress(editingSupplier?.address || "")
            setNotes(editingSupplier?.notes || "")
            setStatus(editingSupplier?.status || "ACTIVE")
        } else {
            setName("")
            setContactPerson("")
            setPhone("")
            setEmail("")
            setAddress("")
            setNotes("")
            setStatus("ACTIVE")
        }
        setErrorMessage(null)
    }, [isOpen, editingSupplier])

    if (!isOpen) return null

    const handleFormSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setErrorMessage(null)

        // Build clean DTO payload (omit blank optional strings so Zod .email() never rejects "")
        const payload = {
            name: name.trim(),
            ...(contactPerson.trim ? { contactPerson: contactPerson.trim() } : {}),
            ...(phone.trim() ? { phone: phone.trim() } : {}),
            ...(email.trim() ? { email: email.trim() } : {}),
            ...(address.trim() ? { address: address.trim() } : {}),
            ...(notes.trim() ? { notes: notes.trim() } : {}),
            ...(isEditMode ? { status } : {})
        }

        try {
            if (isEditMode) {
                await api.patch(`/restaurants/${restaurantId}/suppliers/${editingSupplier?._id}`, payload)
            } else {
                await api.post(`/restaurants/${restaurantId}/suppliers`, payload)
            }
            onRefresh()
            onClose()
        } catch (error) {
            console.error("[Supplier Save Failure]:", error)
            setErrorMessage(
                error.response?.data?.message ||
                "Failed to save supplier directory record."
            )
        } finally {
            setIsLoading(false)
        }
    }



        return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            />

            <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 p-6 rounded-2xl shadow-2xl z-10 animate-scale-in max-h-[90vh] overflow-y-auto scrollbar-none">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 p-1 rounded-md text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                    <X className="w-4 h-4" />
                </button>

                <div className="mb-5">
                    <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                        <Truck className="w-5 h-5 text-emerald-500" />
                        {isEditMode ? "Edit Vendor Profile" : "Register New Supplier"}
                    </h3>
                    <p className="text-neutral-400 text-xs mt-1">
                        {isEditMode
                            ? "Update supplier contact channels, delivery address, or operational status."
                            : "Add a wholesale vendor or distributor for procurement and purchase orders."}
                    </p>
                </div>

                {errorMessage && (
                    <div className="mb-4 p-3 bg-red-900/30 border border-red-800 text-red-200 text-xs font-medium rounded-lg text-center">
                        {errorMessage}
                    </div>
                )}

                <form onSubmit={handleFormSubmit} className="space-y-4">
                    {/* Vendor Name */}
                    <div className="space-y-1.5">
                        <Label htmlFor="sup-name" className="text-neutral-300 font-medium text-xs">
                            Vendor / Company Name <span className="text-red-400">*</span>
                        </Label>
                        <div className="relative flex items-center">
                            <Truck className="absolute left-3 w-4 h-4 text-neutral-500 pointer-events-none" />
                            <Input
                                id="sup-name"
                                type="text"
                                required
                                minLength={2}
                                maxLength={150}
                                placeholder="e.g., FreshHarvest Agro Foods"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="pl-10 bg-neutral-950 border-neutral-800 text-white rounded-xl text-sm focus:border-emerald-500"
                            />
                        </div>
                    </div>

                    {/* Contact Person & Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="sup-contact" className="text-neutral-300 font-medium text-xs">
                                Contact Person
                            </Label>
                            <div className="relative flex items-center">
                                <User className="absolute left-3 w-4 h-4 text-neutral-500 pointer-events-none" />
                                <Input
                                    id="sup-contact"
                                    type="text"
                                    maxLength={100}
                                    placeholder="e.g., Rajesh Sharma"
                                    value={contactPerson}
                                    onChange={(e) => setContactPerson(e.target.value)}
                                    className="pl-10 bg-neutral-950 border-neutral-800 text-white rounded-xl text-xs focus:border-emerald-500"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="sup-phone" className="text-neutral-300 font-medium text-xs">
                                Phone Number
                            </Label>
                            <div className="relative flex items-center">
                                <Phone className="absolute left-3 w-4 h-4 text-neutral-500 pointer-events-none" />
                                <Input
                                    id="sup-phone"
                                    type="text"
                                    maxLength={20}
                                    placeholder="+91 98765 43210"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="pl-10 bg-neutral-950 border-neutral-800 text-white rounded-xl text-xs font-mono focus:border-emerald-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                        <Label htmlFor="sup-email" className="text-neutral-300 font-medium text-xs">
                            Billing / Dispatch Email
                        </Label>
                        <div className="relative flex items-center">
                            <Mail className="absolute left-3 w-4 h-4 text-neutral-500 pointer-events-none" />
                            <Input
                                id="sup-email"
                                type="email"
                                maxLength={150}
                                placeholder="orders@freshharvest.in"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="pl-10 bg-neutral-950 border-neutral-800 text-white rounded-xl text-xs focus:border-emerald-500"
                            />
                        </div>
                    </div>

                    {/* Address */}
                    <div className="space-y-1.5">
                        <Label htmlFor="sup-address" className="text-neutral-300 font-medium text-xs">
                            Warehouse / Office Address
                        </Label>
                        <div className="relative flex items-center">
                            <MapPin className="absolute left-3 w-4 h-4 text-neutral-500 pointer-events-none" />
                            <Input
                                id="sup-address"
                                type="text"
                                maxLength={300}
                                placeholder="Sector 5, Salt Lake, Kolkata"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="pl-10 bg-neutral-950 border-neutral-800 text-white rounded-xl text-xs focus:border-emerald-500"
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-1.5">
                        <Label htmlFor="sup-notes" className="text-neutral-300 font-medium text-xs">
                            Procurement Terms / Notes
                        </Label>
                        <div className="relative flex items-center">
                            <FileText className="absolute left-3 w-4 h-4 text-neutral-500 pointer-events-none" />
                            <Input
                                id="sup-notes"
                                type="text"
                                maxLength={500}
                                placeholder="e.g., Net-15 credit, morning deliveries before 9 AM"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="pl-10 bg-neutral-950 border-neutral-800 text-white rounded-xl text-xs focus:border-emerald-500"
                            />
                        </div>
                    </div>

                    {/* Status Toggle (Edit Mode Only) */}
                    {isEditMode && (
                        <div className="space-y-1.5">
                            <Label className="text-neutral-300 font-medium text-xs">
                                Vendor Status
                            </Label>
                            <div className="grid grid-cols-2 gap-2">
                                {["ACTIVE", "INACTIVE"].map((st) => (
                                    <button
                                        key={st}
                                        type="button"
                                        onClick={() => setStatus(st)}
                                        className={`py-2 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                                            status === st
                                                ? st === "ACTIVE"
                                                    ? "bg-emerald-600/15 border-emerald-500 text-emerald-400"
                                                    : "bg-red-600/15 border-red-500 text-red-400"
                                                : "bg-neutral-950 border-neutral-800 text-neutral-400"
                                        }`}
                                    >
                                        {st}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl cursor-pointer mt-2 shadow-lg inline-flex items-center justify-center gap-2 text-sm transition-all active:scale-[0.99]"
                    >
                        {isLoading
                            ? "Saving Vendor..."
                            : isEditMode
                            ? "Update Vendor Profile"
                            : "Register Supplier"}
                        {!isLoading && <ArrowRight className="w-4 h-4" />}
                    </Button>
                </form>
            </div>
        </div>
    )

}

