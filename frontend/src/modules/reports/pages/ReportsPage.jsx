import { useState, useEffect, useCallback } from "react"
import { useParams } from "react-router"
import {
    BarChart3,
    RefreshCw,
    IndianRupee,
    ShoppingBag,
    TrendingUp,
    TrendingDown,
    Package,
    Receipt,
    CreditCard,
    Calendar,
    AlertTriangle
} from "lucide-react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { api } from "../../../lib/axios"

const PRESET_RANGES = [
    { id: "7D", label: "LAST 7 DAYS", days: 7 },
    { id: "30D", label: "LAST 30 DAYS", days: 30 },
    { id: "90D", label: "LAST 90 DAYS", days: 90 },
    { id: "YTD", label: "YEAR TO DATE", days: null }
]

export default function ReportsPage() {
    const { restaurantId } = useParams()

    const [activePreset, setActivePreset] = useState("30D")
    const [customStart, setCustomStart] = useState("")
    const [customEnd, setCustomEnd] = useState("")

    const [report, setReport] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState(null)

    // Build strict ISO 8601 datetime query parameters matching getDashboardSummaryQueryDto

    const buildQueryParams = useCallback(() => {
        if (activePreset === "CUSTOM" && customStart && customEnd) {
            const startIso = new Date(`${customStart}T00:00:00.000Z`).toISOString()
            const endIso = new Date(`${customEnd}T23:59:59.999Z`).toISOString()
            return { startDate: startIso, endDate: endIso }
        }

        const now = new Date()
        if (activePreset === "YTD") {
            const startOfYear = new Date(Date.UTC(now.getUTCFullYear(), 0, 1, 0, 0, 0))
            return {
                startDate: startOfYear.toISOString(),
                endDate: now.toISOString()
            }
        }

        const presetObj = PRESET_RANGES.find(p => p.id === activePreset) || PRESET_RANGES[1]
        const start = new Date(now)
        start.setDate(now.getDate() - presetObj.days)

        return {
            startDate: start.toISOString(),
            endDate: now.toISOString()
        }
    }, [activePreset, customStart, customEnd])


    // 📡 FETCH CONSOLIDATED BUSINESS INTELLIGENCE REPORT
    const loadBusinessReport = useCallback(async (signal) => {
        if (activePreset === "CUSTOM" && (!customStart || !customEnd)) return

        setIsLoading(true)
        setErrorMessage(null)

        try {
            const params = buildQueryParams()
            const response = await api.get(`/restaurants/${restaurantId}/reports/dashboard`, {
                params,
                signal
            })

            const data = response.data?.data?.dashboardData || null
            setReport(data)
        } catch (error) {
            if (error.name === "CanceledError" || error.code === "ERR_CANCELED") return
            console.error("[Business Analytics Sync Failed]:", error)
            setErrorMessage(
                error.response?.data?.message ||
                "Failed to compile restaurant business intelligence report."
            )
        } finally {
            if (!signal?.aborted) {
                setIsLoading(false)
            }
        }
    }, [restaurantId, activePreset, customStart, customEnd, buildQueryParams])


    useEffect(() => {
        if (!restaurantId) return
        const controller = new AbortController()
        loadBusinessReport(controller.signal)
        return () => controller.abort()
    }, [loadBusinessReport, restaurantId])

    const sales = report?.salesOverview || {
        totalInvoice: 0,
        subtotal: 0,
        discount: 0,
        tax: 0,
        serviceCharge: 0,
        netRevenue: 0
    }
    const procurement = report?.procurementSpend || {
        totalOrdersPlaced: 0,
        totalSpend: 0
    }
    const valuation = report?.assetValuation || {
        activeSkuCount: 0,
        currentStockValue: 0
    }
    const balance = report?.diagnostics?.netOperationalBalance ?? 0
    const paymentMethods = report?.paymentMethodsBreakdown || []
    const totalPaymentsCollected = paymentMethods.reduce(
        (sum, p) => sum + (Number(p.totalAmount) || 0),
        0
    )



    return (
        <div className="space-y-6 animate-fade-in pb-8 w-full select-none">

            {/* PANEL HEADER SYSTEM ACTION BLOCK */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-800 pb-5">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-emerald-500" />
                        Reports & Business Intelligence
                    </h2>
                    <p className="text-neutral-400 text-sm mt-1">
                        Consolidated sales revenue, payment channel distribution, procurement expenditure, and live stock valuation.
                    </p>
                </div>

                <div className="flex items-center gap-3 self-start sm:self-auto">
                    {report?.timeframe && (
                        <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900/60 border border-neutral-800 text-[10px] font-mono text-neutral-400">
                            <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                            {new Date(report.timeframe.from).toLocaleDateString("en-IN")} →{" "}
                            {new Date(report.timeframe.to).toLocaleDateString("en-IN")}
                        </span>
                    )}

                    <Button
                        onClick={() => loadBusinessReport()}
                        variant="outline"
                        className="border-neutral-800 text-neutral-400 hover:text-white bg-neutral-900/50 rounded-xl cursor-pointer"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                    </Button>
                </div>
            </div>

            {/* DATE WINDOW PRESETS & CUSTOM ISO FILTER */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-neutral-900/30 border border-neutral-800/80 p-3.5 rounded-2xl">
                <div className="flex flex-wrap items-center gap-2">
                    {PRESET_RANGES.map((preset) => {
                        const isActive = activePreset === preset.id
                        return (
                            <button
                                key={preset.id}
                                onClick={() => setActivePreset(preset.id)}
                                className={`px-3.5 py-2 rounded-xl text-xs font-bold tracking-wide border cursor-pointer uppercase transition-all ${
                                    isActive
                                        ? "bg-emerald-600/15 border-emerald-500 text-emerald-400 font-extrabold shadow-lg shadow-emerald-950/20"
                                        : "border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700 hover:text-white"
                                }`}
                            >
                                {preset.label}
                            </button>
                        )
                    })}
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                    <span className="text-[10px] text-neutral-500 font-bold uppercase">Custom:</span>
                    <Input
                        type="date"
                        value={customStart}
                        onChange={(e) => {
                            setCustomStart(e.target.value)
                            setActivePreset("CUSTOM")
                        }}
                        className="h-9 w-36 bg-neutral-950 border-neutral-800 text-white rounded-xl text-xs font-mono"
                    />
                    <span className="text-neutral-600">→</span>
                    <Input
                        type="date"
                        value={customEnd}
                        onChange={(e) => {
                            setCustomEnd(e.target.value)
                            setActivePreset("CUSTOM")
                        }}
                        className="h-9 w-36 bg-neutral-950 border-neutral-800 text-white rounded-xl text-xs font-mono"
                    />
                </div>
            </div>

            {errorMessage && (
                <div className="p-3 bg-red-900/20 border border-red-800/40 text-red-400 text-xs font-medium rounded-xl text-center">
                    {errorMessage}
                </div>
            )}

            {/* 4 EXECUTIVE KPI CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-5 flex items-center justify-between backdrop-blur-md">
                    <div className="space-y-1">
                        <span className="text-[10px] text-neutral-500 font-mono font-bold uppercase tracking-wider block">
                            Net Sales Revenue
                        </span>
                        <span className="text-2xl font-black text-white font-mono">
                            ₹{sales.netRevenue.toLocaleString("en-IN")}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-400 block">
                            Across {sales.totalInvoice} issued invoices
                        </span>
                    </div>
                    <div className="p-3 bg-emerald-950/20 border border-emerald-900/30 rounded-xl text-emerald-400">
                        <IndianRupee className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-5 flex items-center justify-between backdrop-blur-md">
                    <div className="space-y-1">
                        <span className="text-[10px] text-neutral-500 font-mono font-bold uppercase tracking-wider block">
                            Procurement Spend
                        </span>
                        <span className="text-2xl font-black text-white font-mono">
                            ₹{procurement.totalSpend.toLocaleString("en-IN")}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-400 block">
                            {procurement.totalOrdersPlaced} purchase orders
                        </span>
                    </div>
                    <div className="p-3 bg-blue-950/20 border border-blue-900/30 rounded-xl text-blue-400">
                        <ShoppingBag className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-5 flex items-center justify-between backdrop-blur-md">
                    <div className="space-y-1">
                        <span className="text-[10px] text-neutral-500 font-mono font-bold uppercase tracking-wider block">
                            Net Operational Balance
                        </span>
                        <span
                            className={`text-2xl font-black font-mono ${
                                balance >= 0 ? "text-emerald-400" : "text-red-400"
                            }`}
                        >
                            {balance >= 0 ? "+" : "-"}₹{Math.abs(balance).toLocaleString("en-IN")}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-400 block">
                            Revenue minus procurement
                        </span>
                    </div>
                    <div
                        className={`p-3 rounded-xl border ${
                            balance >= 0
                                ? "bg-emerald-950/20 border-emerald-900/30 text-emerald-400"
                                : "bg-red-950/20 border-red-900/30 text-red-400"
                        }`}
                    >
                        {balance >= 0 ? (
                            <TrendingUp className="w-5 h-5" />
                        ) : (
                            <TrendingDown className="w-5 h-5" />
                        )}
                    </div>
                </div>

                <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-5 flex items-center justify-between backdrop-blur-md">
                    <div className="space-y-1">
                        <span className="text-[10px] text-neutral-500 font-mono font-bold uppercase tracking-wider block">
                            Live Stock Valuation
                        </span>
                        <span className="text-2xl font-black text-white font-mono">
                            ₹{valuation.currentStockValue.toLocaleString("en-IN")}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-400 block">
                            {valuation.activeSkuCount} active warehouse SKUs
                        </span>
                    </div>
                    <div className="p-3 bg-amber-950/20 border border-amber-900/30 rounded-xl text-amber-400">
                        <Package className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* DETAILED ANALYTICS BREAKDOWN PANELS */}
            {isLoading ? (
                <div className="text-center py-20 text-neutral-500 font-mono text-xs animate-pulse bg-neutral-900/20 border border-neutral-800/80 rounded-2xl">
                    Compiling Financial & Operational Aggregations...
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

                    {/* LEFT: SALES LEDGER BREAKDOWN */}
                    <div className="bg-neutral-900/30 border border-neutral-800/80 rounded-2xl p-6 backdrop-blur-md space-y-5">
                        <div className="flex items-center justify-between border-b border-neutral-800/80 pb-4">
                            <div className="flex items-center gap-2">
                                <Receipt className="w-4 h-4 text-emerald-400" />
                                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                                    Invoice Revenue Ledger
                                </h3>
                            </div>
                            <span className="text-[10px] font-mono text-neutral-500 font-bold uppercase">
                                {sales.totalInvoice} Invoices
                            </span>
                        </div>

                        <div className="space-y-3 font-mono text-xs">
                            <div className="flex items-center justify-between py-2 border-b border-neutral-900">
                                <span className="text-neutral-400">Gross Item Subtotal</span>
                                <span className="text-white font-bold">
                                    ₹{sales.subtotal.toLocaleString("en-IN")}
                                </span>
                            </div>

                            <div className="flex items-center justify-between py-2 border-b border-neutral-900">
                                <span className="text-neutral-400">Promotional Discounts</span>
                                <span className="text-amber-400 font-bold">
                                    -₹{sales.discount.toLocaleString("en-IN")}
                                </span>
                            </div>

                            <div className="flex items-center justify-between py-2 border-b border-neutral-900">
                                <span className="text-neutral-400">GST / Taxes Collected</span>
                                <span className="text-neutral-200 font-bold">
                                    +₹{sales.tax.toLocaleString("en-IN")}
                                </span>
                            </div>

                            <div className="flex items-center justify-between py-2 border-b border-neutral-900">
                                <span className="text-neutral-400">Service Charges</span>
                                <span className="text-neutral-200 font-bold">
                                    +₹{sales.serviceCharge.toLocaleString("en-IN")}
                                </span>
                            </div>

                            <div className="flex items-center justify-between pt-2 text-sm">
                                <span className="font-black text-white uppercase">Net Billed Total</span>
                                <span className="font-black text-emerald-400">
                                    ₹{sales.netRevenue.toLocaleString("en-IN")}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: PAYMENT CHANNELS DISTRIBUTION */}
                    <div className="bg-neutral-900/30 border border-neutral-800/80 rounded-2xl p-6 backdrop-blur-md space-y-5">
                        <div className="flex items-center justify-between border-b border-neutral-800/80 pb-4">
                            <div className="flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-emerald-400" />
                                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                                    Payment Methods Breakdown
                                </h3>
                            </div>
                            <span className="text-[10px] font-mono text-neutral-500 font-bold uppercase">
                                ₹{Math.round(totalPaymentsCollected).toLocaleString("en-IN")} Settled
                            </span>
                        </div>

                        {paymentMethods.length === 0 ? (
                            <div className="text-center py-12 text-neutral-600 font-mono text-xs flex flex-col items-center justify-center gap-2 border border-dashed border-neutral-800 rounded-xl">
                                <AlertTriangle className="w-5 h-5 text-neutral-700" />
                                <span>No completed payment settlements in this timeframe.</span>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {paymentMethods.map((pm) => {
                                    const sharePct =
                                        totalPaymentsCollected > 0
                                            ? Math.round((pm.totalAmount / totalPaymentsCollected) * 100)
                                            : 0

                                    return (
                                        <div
                                            key={pm.method}
                                            className="bg-neutral-950/60 border border-neutral-900 rounded-xl p-3.5 space-y-2"
                                        >
                                            <div className="flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-0.5 text-[10px] font-mono font-black rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase">
                                                        {pm.method}
                                                    </span>
                                                    <span className="text-neutral-400 font-mono text-[11px]">
                                                        {pm.count} {pm.count === 1 ? "txn" : "txns"}
                                                    </span>
                                                </div>

                                                <div className="font-mono font-bold text-white">
                                                    ₹{pm.totalAmount.toLocaleString("en-IN")}{" "}
                                                    <span className="text-neutral-500 text-[10px]">
                                                        ({sharePct}%)
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-emerald-500 transition-all duration-300"
                                                    style={{ width: `${sharePct}%` }}
                                                />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )

}

