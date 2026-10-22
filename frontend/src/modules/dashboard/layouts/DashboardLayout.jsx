import { Link, Outlet, useNavigate, useLocation, useParams } from "react-router"
import { useAuth } from "../../auth/context/AuthContext"
import {
    LayoutDashboard,
    UtensilsCrossed,
    ChefHat,
    Layers,
    ClipboardList,
    Receipt,
    LogOut,
    User,
    Building,
    Settings
} from "lucide-react"


export default function DashboardLayout() {
    const { user, setUser, activeRestaurant } = useAuth()
    console.log("=====",activeRestaurant)
    const navigate = useNavigate()
    const location = useLocation()

    const { restaurantId } = useParams()

    const handleLogout = async () => {
        // ⚡ Future optimization link: execute a clear call to api.post("/auth/signout") here
        setUser(null)
        localStorage.clear()
        navigate("/signin", { replace: true })
    }

    // Navigate map mirroring our backend core business domain modules perfectly
    const navItems = [
        { name: "Overview",           path: `/dashboard/${restaurantId}`,          icon: LayoutDashboard },
        { name: "Restaurant Menu",    path: `/dashboard/${restaurantId}/menu`,     icon: UtensilsCrossed },
        { name: "Kitchen Display",    path: `/dashboard/${restaurantId}/kitchen`,  icon: ChefHat },
        { name: "Table Mapping",      path: `/dashboard/${restaurantId}/tables`,   icon: Layers },
        { name: "Live Orders",        path: `/dashboard/${restaurantId}/orders`,   icon: ClipboardList },
        { name: "Invoices & Billing", path: `/dashboard/${restaurantId}/invoices`, icon: Receipt },
        { name: "Workspace Settings",  path: `/dashboard/${restaurantId}/settings`, icon: Settings },
    ]

    return (
        <div className="flex min-h-screen bg-[#09090b] text-neutral-100 selection:bg-emerald-500/20 selection:text-emerald-400">

            {/* 🎛️ FIXED LEFT SIDEBAR NAVIGATION CONSOLE */}
            <aside className="fixed inset-y-0 left-0 z-20 w-64 border-r border-neutral-800 bg-neutral-900/50 backdrop-blur-xl flex flex-col justify-between p-6">
                <div className="space-y-8">
                    {/* Main Identity Header */}
                    <div className="px-2 space-y-3">
                        <div>
                            <h1 className="text-xl font-black text-white tracking-tight">
                                Restaurant<span className="text-emerald-500">OS</span>
                            </h1>
                            <p className="text-neutral-500 text-xs mt-0.5">Management Master Console</p>
                        </div>
                        
                        {/* 🟢 Live Restaurant Context Indicator Card Card */}
                        <div className="flex items-center gap-2.5 px-3 py-2 bg-emerald-950/20 border border-emerald-900/30 rounded-xl">
                            <Building className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="text-xs font-bold text-emerald-300 truncate max-w-40">
                                {activeRestaurant?.name || "Loading Context..."}
                            </span>
                        </div>
                    </div>

                    {/* Navigation Item Map Grid Link Matrix */}
                    <nav className="space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon
                            const isActive = location.pathname === item.path

                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group duration-200 cursor-pointer ${
                                        isActive 
                                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-950/40" 
                                        : "text-neutral-400 hover:bg-neutral-800/60 hover:text-white"
                                    }`}
                                >
                                <Icon className={`w-4 h-4 transition-transform group-hover:scale-105 ${isActive ? "text-white" : "text-neutral-400 group-hover:text-emerald-400"}`} />
                                {item.name}
                                </Link>
                            )
                        })}
                    </nav>
                </div>

                {/* Footer User Profile & System Logout Button Box */}
                <div className="border-t border-neutral-800 pt-4 space-y-4">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-9 h-9 rounded-xl bg-neutral-800 flex items-center justify-center border border-neutral-700 shrink-0">
                            <User className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="truncate">
                            <p className="text-sm font-semibold text-white truncate">{user?.name || "Manager"}</p>
                            
                            {/* 🛡️ Dynamic Membership Role Badge Badge indicator */}
                            <p className="text-[10px] font-mono font-bold text-emerald-500 uppercase tracking-wider mt-0.5">
                                {user?.role || "STAFF"}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-950/20 hover:text-red-300 transition-colors cursor-pointer"
                    >
                        <LogOut className="w-4 h-4" />
                        Exit System Console
                    </button>
                </div>
            </aside>

            {/* 🔓 MAIN WORKSPACE VIEWPORT LAYER PANEL */}
            <div className="pl-64 flex-1 flex flex-col min-h-screen">
                {/* Universal Sticky Header Frame */}
                <header className="sticky top-0 z-10 h-16 border-b border-neutral-800 bg-[#09090b]/80 backdrop-blur-md flex items-center justify-between px-8">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <h2 className="text-sm font-medium text-neutral-400">Terminal Operational Node Active</h2>
                    </div>
                    <div className="text-xs font-mono text-neutral-600">v1.0.0-beta</div>
                </header>

                {/* Asynchronous Child Component Page View Container Portal */}
                <main className="flex-1 p-8 bg-[#09090b]">
                    {/* React Router will dynamically swap out deep module pages right here! */}
                    <Outlet />
                </main>
            </div>

        </div>
    )
}
