import { BrowserRouter, Routes, Route, Navigate } from "react-router"
import { AuthProvider } from "./modules/auth/context/AuthContext.jsx"
import ProtectedRoute from "./modules/auth/components/ProtectedRoute.jsx"
import AuthLayout from "./modules/auth/layouts/AuthLayout.jsx"

import SigninPage from "./modules/auth/pages/SigninPage.jsx"
import SignupPage from "./modules/auth/pages/SignupPage.jsx"
import ForgotPasswordPage from "./modules/auth/pages/ForgotPasswordPage.jsx"
import ResetPasswordPage  from "./modules/auth/pages/ResetPasswordPage.jsx"

import DashboardLayout from "./modules/dashboard/layouts/DashboardLayout.jsx"
import CreateRestaurantPage from "./modules/dashboard/pages/CreateRestaurantPage.jsx"
import MenuPage from "./modules/restaurant-menu/pages/MenuPage.jsx"
import SystemConsoleOverview from "./modules/dashboard/pages/SystemConsoleOverview.jsx"
import SettingsPage from "./modules/dashboard/pages/SettingsPage.jsx"
import StaffPage from "./modules/restaurant-staff/pages/StaffPage.jsx"
import TablesPage from "./modules/restaurant-table/pages/TablesPage.jsx"
import ReservationsPage from "./modules/reservation/pages/ReservationsPage.jsx"
import CategoriesPage from "./modules/menu-category/pages/CategoriesPage.jsx"
import OrdersPage from "./modules/order/pages/OrdersPage.jsx"
import InvoicesPage from "./modules/invoices/pages/InvoicesPage.jsx"
import PaymentsPage from "./modules/payments/pages/PaymentsPage.jsx"
import KitchenDisplayPage from "./modules/kitchen/pages/KitchenDisplayPage.jsx"



function App() {
	return (
		<AuthProvider>
			<BrowserRouter>

				<Routes>
					{/* 🔒 1. PUBLIC AUTHENTICATION MODULE PAGES GRID */}
					<Route element={<AuthLayout />}>
						<Route path="/signin" element={<SigninPage />} />
						<Route path="/signup" element={<SignupPage />} />
						<Route path="/forgot-password" element={<ForgotPasswordPage />} />
						<Route path="/reset-password" element={<ResetPasswordPage />} />
					</Route>


					{/* 🛡️ 2. PRIVATE SECURE RESTAURANTOS CHANNELS GATE */}
					{/* Every nested Route mounted inside here is automatically guarded against logged-out users! */}
					<Route element={<ProtectedRoute />}>


						{/* 🏢 STEP A: If they just log in, this route catches them and lets them select or create a restaurant */}
						<Route element={<AuthLayout />}>
							<Route path="/dashboard" element={<CreateRestaurantPage />} />
						</Route>


						{/* Index Default Page view path when landing on /dashboard straight */}
						{/* Passes the variable dynamically straight into the URL line to satisfy req.params.restaurantId! */}
						<Route path="/dashboard/:restaurantId" element={<DashboardLayout />}>

							<Route index element={<SystemConsoleOverview />} />

							{/* (Your future features like /dashboard/:restaurantId/menu, /dashboard/:restaurantId/orders will be dropped right here!) */}
							<Route path="menu" element={<MenuPage />}/>
							
							<Route path="categories" element={<CategoriesPage />}/>
							
							<Route path="kitchen" element={<KitchenDisplayPage />} />
							
							<Route path="tables" element={<TablesPage />} />
							<Route path="reservations" element={<ReservationsPage />} />
							<Route path="orders" element={<OrdersPage />} />

							<Route path="invoices" element={<InvoicesPage />} />
							<Route path="payments" element={<PaymentsPage />} />

							<Route path="settings" element={<SettingsPage />}/>

							<Route path="staff" element={<StaffPage />} />
							
						</Route>
						
					</Route>


					{/* 🔄 Wildcard Fallback Interception: Redirects all unmatched URLs straight back to /signin */}
					<Route path="*" element={<Navigate to="/signin" replace />} />
				</Routes>
					
			</BrowserRouter>
		</AuthProvider>

	)
}

export default App
