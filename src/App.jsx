"use client"

import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom"
import LoginPage from "./pages/HomePage"
// import AdminDashboard from "./pages/Dashboard"
import AdminAssignTask from "./pages/RequestVisit"
import AccountDataPage from "./pages/ClosePass"
import QuickTask from "./pages/AdminLogin"
import License from "./pages/ApprovelPage"

// 🔒 Auth wrapper
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const location = useLocation()

  const username = sessionStorage.getItem("username")
  const role = sessionStorage.getItem("role")

  // ✅ PUBLIC ROUTES (NO LOGIN REQUIRED)
  const publicRoutes = [
    "/dashboard/quick-task",
    "/dashboard/assign-task",
    "/dashboard/delegation"
  ]

  // ✅ Allow public routes
  if (publicRoutes.some(route => location.pathname.startsWith(route))) {
    return children
  }

  // ❌ Block if not logged in
  if (!username) {
    return <Navigate to="/login" replace />
  }

  // ❌ Role restriction
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard/admin" replace />
  }

  return children
}

function App() {
  return (
    <Router>
      <Routes>

        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<LoginPage />} />

        <Route path="/dashboard" element={<Navigate to="/dashboard/admin" replace />} />

        <Route path="/dashboard/assign-task" element={<AdminAssignTask />} />
        <Route path="/dashboard/delegation" element={<AccountDataPage />} />
        <Route path="/dashboard/quick-task" element={<QuickTask />} />
        <Route path="/dashboard/license" element={<License />} />

        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </Router>
  )
}

export default App