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

							<Route
								index
								element={
									<div className="space-y-2">
										<h3 className="text-2xl font-extrabold text-white">System Console Overview</h3>
										<p className="text-neutral-400 text-sm">Select an active operational module module tab on the left sidebar terminal console to deploy metrics viewframes.</p>
									</div>
								} 
							/>

							{/* (Your future features like /dashboard/:restaurantId/menu, /dashboard/:restaurantId/orders will be dropped right here!) */}

							{/* (Stage 3 menu-management components nested routes will slide right here!) */}

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
