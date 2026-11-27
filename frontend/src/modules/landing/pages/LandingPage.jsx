import { Link } from "react-router"
import {
    UtensilsCrossed,
    ChefHat,
    Layers,
    ClipboardList,
    Receipt,
    Package,
    ShoppingBag,
    BarChart3,
    Bell,
    ArrowRight,
    CheckCircle2,
    Activity,
    ShieldCheck,
    Sparkles,
    Building2
} from "lucide-react"
import { useAuth } from "../../auth/context/AuthContext.jsx"
import { Button } from "../../../components/ui/button"


const PLATFORM_MODULES = [
    {
        icon: ChefHat,
        tag: "REAL-TIME KDS",
        title: "Kitchen Display System",
        description: "Route incoming table tickets straight to prep stations with instant status updates from pending to served."
    },
    {
        icon: Layers,
        tag: "FLOOR & BOOKINGS",
        title: "Table Mapping & Reservations",
        description: "Visualize live table occupancy, manage guest party bookings, and turn tables faster during peak rushes."
    },
    {
        icon: Receipt,
        tag: "POS & LEDGERS",
        title: "Invoices & Payment Tracking",
        description: "Generate itemized GST bills, apply discounts or service charges, and reconcile Cash, Card, and UPI settlements."
    },
    {
        icon: Package,
        tag: "WAREHOUSE CONTROL",
        title: "Inventory & Auto-Restock POs",
        description: "Track ingredient stock levels, manage vendor directories, and receive purchase shipments directly into inventory."
    },
    {
        icon: BarChart3,
        tag: "LIVE ANALYTICS",
        title: "Business Intelligence Reports",
        description: "Monitor net sales revenue, procurement spend, operational balance, and live stock valuation across any date window."
    },
    {
        icon: Bell,
        tag: "SMART ALERTS",
        title: "Automated Alert Center",
        description: "Get instant notifications on low-stock thresholds, order status transitions, payment events, and vendor deliveries."
    }
]

const WORKFLOW_STEPS = [
    {
        step: "01",
        title: "Create Your Restaurant Workspace",
        description: "Register your brand, configure tax and service rules, and invite managers, chefs, and floor staff with role-based access."
    },
    {
        step: "02",
        title: "Build Menu, Floor & Stock Catalogs",
        description: "Organize menu categories, set dish pricing, map your dining tables, and link raw ingredients with supplier profiles."
    },
    {
        step: "03",
        title: "Run Live Service & Track Margins",
        description: "Take orders, fire tickets to the kitchen, settle invoices, and audit net operational profit from one unified console."
    }
]

export default function LandingPage() {
    const { user, activeRestaurant } = useAuth()

    const consolePath = activeRestaurant?._id
        ? `/dashboard/${activeRestaurant._id}`
        : "/dashboard"




    return (
        <div className="min-h-screen bg-[#09090b] text-neutral-100 selection:bg-emerald-500/20 selection:text-emerald-400 flex flex-col">

            {/* STICKY TOP NAVIGATION BAR */}
            <header className="sticky top-0 z-30 border-b border-neutral-800/80 bg-[#09090b]/80 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                            <UtensilsCrossed className="w-4 h-4" />
                        </div>
                        <span className="text-xl font-black text-white tracking-tight">
                            Restaurant<span className="text-emerald-500">OS</span>
                        </span>
                    </Link>

                    <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-neutral-400">
                        <a href="#modules" className="hover:text-white transition-colors">
                            Platform Modules
                        </a>
                        <a href="#workflow" className="hover:text-white transition-colors">
                            How It Works
                        </a>
                        <a href="#architecture" className="hover:text-white transition-colors">
                            Architecture
                        </a>
                    </nav>

                    <div className="flex items-center gap-3">
                        {user ? (
                            <Link to={consolePath}>
                                <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl px-4 py-2 text-xs inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/30">
                                    Open Console
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </Button>
                            </Link>
                        ) : (
                            <>
                                <Link
                                    to="/signin"
                                    className="text-xs font-semibold text-neutral-300 hover:text-white px-3 py-2 transition-colors"
                                >
                                    Sign In
                                </Link>
                                <Link to="/signup">
                                    <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl px-4 py-2 text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-950/30">
                                        Get Started
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <main className="flex-1">

                {/* HERO SECTION */}
                <section className="relative overflow-hidden border-b border-neutral-800/60">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.12),transparent_55%)] pointer-events-none" />

                    <div className="max-w-7xl mx-auto px-6 py-20 lg:py-28 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative">
                        <div className="lg:col-span-7 space-y-6">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-800/50 text-emerald-400 text-[11px] font-mono font-bold">
                                <Sparkles className="w-3.5 h-3.5" />
                                FULL-STACK MULTI-TENANT RESTAURANT OPERATING SYSTEM
                            </div>

                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.08]">
                                Run Your Entire Restaurant From{" "}
                                <span className="text-emerald-500">One Command Console.</span>
                            </h1>

                            <p className="text-neutral-400 text-base sm:text-lg max-w-2xl leading-relaxed">
                                Unify kitchen display tickets, live floor mapping, table reservations, GST billing, inventory procurement, and real-time profit analytics in a single high-speed workspace.
                            </p>

                            <div className="flex flex-wrap items-center gap-3.5 pt-2">
                                <Link to={user ? consolePath : "/signup"}>
                                    <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl px-6 py-3 h-auto text-sm inline-flex items-center gap-2 cursor-pointer shadow-xl shadow-emerald-950/30">
                                        {user ? "Launch Active Workspace" : "Create Free Workspace"}
                                        <ArrowRight className="w-4 h-4" />
                                    </Button>
                                </Link>

                                {!user && (
                                    <Link to="/signin">
                                        <Button
                                            variant="outline"
                                            className="border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800 text-neutral-200 font-semibold rounded-xl px-6 py-3 h-auto text-sm cursor-pointer"
                                        >
                                            Sign In to Terminal
                                        </Button>
                                    </Link>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-6 pt-4 text-xs text-neutral-500 font-mono">
                                <span className="flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                    Role-Based Staff Access
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                    Atomic Stock & PO Sync
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                    Real-Time Revenue Telemetry
                                </span>
                            </div>
                        </div>

                        {/* RIGHT HERO TERMINAL PREVIEW CARD */}
                        <div className="lg:col-span-5">
                            <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-5 shadow-2xl backdrop-blur-xl space-y-4">
                                <div className="flex items-center justify-between border-b border-neutral-800 pb-3.5">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-xs font-mono font-bold text-white">
                                            LIVE CONSOLE SNAPSHOT
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
                                        NODE ONLINE
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-3 font-mono">
                                    <div className="bg-neutral-950/80 border border-neutral-800/80 rounded-xl p-3.5">
                                        <span className="text-[10px] text-neutral-500 uppercase block">
                                            30-Day Net Revenue
                                        </span>
                                        <span className="text-xl font-black text-emerald-400 mt-1 block">
                                            ₹2,84,950
                                        </span>
                                    </div>

                                    <div className="bg-neutral-950/80 border border-neutral-800/80 rounded-xl p-3.5">
                                        <span className="text-[10px] text-neutral-500 uppercase block">
                                            Active Kitchen KDS
                                        </span>
                                        <span className="text-xl font-black text-white mt-1 block">
                                            14 Tickets
                                        </span>
                                    </div>

                                    <div className="bg-neutral-950/80 border border-neutral-800/80 rounded-xl p-3.5">
                                        <span className="text-[10px] text-neutral-500 uppercase block">
                                            Floor Occupancy
                                        </span>
                                        <span className="text-xl font-black text-white mt-1 block">
                                            18 / 24 Tables
                                        </span>
                                    </div>

                                    <div className="bg-neutral-950/80 border border-neutral-800/80 rounded-xl p-3.5">
                                        <span className="text-[10px] text-neutral-500 uppercase block">
                                            Stock Valuation
                                        </span>
                                        <span className="text-xl font-black text-amber-400 mt-1 block">
                                            ₹94,320
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-neutral-950/80 border border-neutral-800/80 rounded-xl p-3.5 space-y-2.5">
                                    <div className="flex items-center justify-between text-[11px] font-mono">
                                        <span className="text-neutral-400 flex items-center gap-1.5">
                                            <ClipboardList className="w-3.5 h-3.5 text-emerald-400" />
                                            Order #ORD-8042 • Table T-06
                                        </span>
                                        <span className="text-emerald-400 font-bold">PREPARING</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] font-mono">
                                        <span className="text-neutral-400 flex items-center gap-1.5">
                                            <ShoppingBag className="w-3.5 h-3.5 text-blue-400" />
                                            PO-249430 • Stock Restock
                                        </span>
                                        <span className="text-blue-400 font-bold">RECEIVED</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* PLATFORM MODULES GRID */}
                <section id="modules" className="max-w-7xl mx-auto px-6 py-20 space-y-12">
                    <div className="max-w-2xl space-y-3">
                        <span className="text-xs font-mono font-bold text-emerald-500 uppercase tracking-wider">
                            INTEGRATED MODULES
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                            Every Operational Pillar Built Into One System
                        </h2>
                        <p className="text-neutral-400 text-sm sm:text-base">
                            Eliminate disconnected POS apps and spreadsheets with tightly coupled front-of-house, kitchen, warehouse, and accounting workflows.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {PLATFORM_MODULES.map((mod) => {
                            const IconComponent = mod.icon
                            return (
                                <div
                                    key={mod.title}
                                    className="bg-neutral-900/40 border border-neutral-800/80 hover:border-emerald-500/40 rounded-2xl p-6 transition-all duration-300 space-y-4 group"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="w-10 h-10 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-center text-emerald-400 group-hover:border-emerald-500/40 transition-colors">
                                            <IconComponent className="w-5 h-5" />
                                        </div>
                                        <span className="text-[10px] font-mono font-black tracking-wider px-2.5 py-1 rounded-md bg-emerald-950/30 border border-emerald-900/40 text-emerald-400">
                                            {mod.tag}
                                        </span>
                                    </div>

                                    <div className="space-y-1.5">
                                        <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                                            {mod.title}
                                        </h3>
                                        <p className="text-neutral-400 text-xs leading-relaxed">
                                            {mod.description}
                                        </p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </section>

                {/* 3-STEP WORKFLOW SECTION */}
                <section id="workflow" className="border-y border-neutral-800/60 bg-neutral-900/20">
                    <div className="max-w-7xl mx-auto px-6 py-20 space-y-12">
                        <div className="max-w-2xl space-y-3">
                            <span className="text-xs font-mono font-bold text-emerald-500 uppercase tracking-wider">
                                DEPLOYMENT FLOW
                            </span>
                            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                                From Setup to Live Service in Minutes
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {WORKFLOW_STEPS.map((item) => (
                                <div
                                    key={item.step}
                                    className="bg-neutral-950/70 border border-neutral-800 rounded-2xl p-6 space-y-4"
                                >
                                    <span className="inline-block text-xs font-mono font-black px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                                        STEP {item.step}
                                    </span>
                                    <h3 className="text-lg font-bold text-white">
                                        {item.title}
                                    </h3>
                                    <p className="text-neutral-400 text-xs leading-relaxed">
                                        {item.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ARCHITECTURE & SECURITY STRIP */}
                <section id="architecture" className="max-w-7xl mx-auto px-6 py-20">
                    <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 sm:p-12 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                        <div className="space-y-3 max-w-xl">
                            <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-emerald-400">
                                <ShieldCheck className="w-4 h-4" />
                                ENTERPRISE MULTI-TENANT ISOLATION
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                                Ready to Modernize Your Restaurant Operations?
                            </h2>
                            <p className="text-neutral-400 text-sm leading-relaxed">
                                Launch your restaurant workspace today with HTTP-only cookie authentication, strict role permissions, and real-time operational telemetry.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 shrink-0">
                            <Link to={user ? consolePath : "/signup"}>
                                <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl px-6 py-3 h-auto text-sm inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/30">
                                    <Building2 className="w-4 h-4" />
                                    {user ? "Go to Dashboard" : "Get Started Now"}
                                </Button>
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            {/* FOOTER */}
            <footer className="border-t border-neutral-800/80 py-8 px-6">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500 font-mono">
                    <div className="flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-emerald-500" />
                        <span>RestaurantOS • Unified Restaurant Management Console</span>
                    </div>
                    <span>© {new Date().getFullYear()} RestaurantOS. All rights reserved.</span>
                </div>
            </footer>
        </div>
    )


}