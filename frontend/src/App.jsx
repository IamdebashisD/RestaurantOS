import { BrowserRouter, Routes, Route, Navigate } from "react-router"

import AuthLayout from "./modules/auth/layouts/AuthLayout.jsx"

import SigninPage from "./modules/auth/pages/SigninPage.jsx"
import SignupPage from "./modules/auth/pages/SignupPage.jsx"
import ForgotPasswordPage from "./modules/auth/pages/ForgotPasswordPage.jsx"
import ResetPasswordPage  from "./modules/auth/pages/ResetPasswordPage.jsx"



function App() {
	return (
		<BrowserRouter>

				<Routes>
					<Route element={<AuthLayout />}>
						<Route path="/signin" element={<SigninPage />} />
						<Route path="/signup" element={<SignupPage />} />
						<Route path="/forgot-password" element={<ForgotPasswordPage />} />
						<Route path="/reset-password" element={<ResetPasswordPage />} />
					</Route>

					{/* 🔄 Wildcard Fallback Interception: Redirects all unmatched URLs straight back to /signin */}
					<Route path="*" element={<Navigate to="/signin" replace />} />
				</Routes>
				
		</BrowserRouter>

	)
}

export default App
