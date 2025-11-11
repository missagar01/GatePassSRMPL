"use client"

import { useState, useEffect } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom"
import LoginPage from "./pages/LoginPage"
import AdminDashboard from "./pages/admin/Dashboard"
import AdminAssignTask from "./pages/admin/AssignTask"
import DataPage from "./pages/admin/DataPage"
import AdminDataPage from "./pages/admin/admin-data-page"
import AccountDataPage from "./pages/delegation"
import "./index.css"
import QuickTask from "./pages/QuickTask"
import License from "./pages/License"
import TrainingVideo from "./pages/TrainingVideo"

// Auth wrapper component to protect routes
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const location = useLocation()
  const [isChecking, setIsChecking] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userRole, setUserRole] = useState("")

  useEffect(() => {
    const checkAuth = () => {
      const username = sessionStorage.getItem("username")
      const role = sessionStorage.getItem("role")

      setIsAuthenticated(!!username)
      setUserRole(role || "")
      setIsChecking(false)
    }

    checkAuth()
  }, [location])

  if (isChecking) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  // If no user is logged in, redirect to login but preserve the intended destination
  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />
  }

  // If this is an admin-only route and user is not admin, redirect to dashboard
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard/admin" replace />
  }

  return children
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Login route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Dashboard redirect */}
        <Route path="/dashboard" element={<Navigate to="/dashboard/admin" replace />} />

        {/* Admin & User Dashboard route */}
        <Route
          path="/dashboard/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/quick-task"
          element={
            <ProtectedRoute allowedRoles={["admin", "user"]}>
              <QuickTask />
            </ProtectedRoute>
          }
        />

        {/* Assign Task route - accessible after selecting "Request Visit" */}
        <Route
          path="/dashboard/assign-task"
          element={
            <ProtectedRoute>
              <AdminAssignTask />
            </ProtectedRoute>
          }
        />

        {/* Delegation route - accessible after selecting "Close Gate Pass" */}
        <Route
          path="/dashboard/delegation"
          element={
            <ProtectedRoute>
              <AccountDataPage />
            </ProtectedRoute>
          }
        />

        {/* Data routes */}
        <Route
          path="/dashboard/data/:category"
          element={
            <ProtectedRoute>
              <DataPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/license"
          element={
            <ProtectedRoute>
              <License />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/traning-video"
          element={
            <ProtectedRoute>
              <TrainingVideo />
            </ProtectedRoute>
          }
        />

        {/* Specific route for Admin Data Page */}
        <Route
          path="/dashboard/data/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDataPage />
            </ProtectedRoute>
          }
        />

        {/* Backward compatibility redirects */}
        <Route path="/admin/*" element={<Navigate to="/dashboard/admin" replace />} />
        <Route path="/admin/dashboard" element={<Navigate to="/dashboard/admin" replace />} />
        <Route path="/admin/quick-task" element={<Navigate to="/dashboard/quick-task" replace />} />
        <Route path="/admin/assign-task" element={<Navigate to="/dashboard/assign-task" replace />} />
        <Route path="/admin/data/:category" element={<Navigate to="/dashboard/data/:category" replace />} />
        <Route path="/admin/license" element={<Navigate to="/dashboard/license" replace />} />
        <Route path="/admin/traning-video" element={<Navigate to="/dashboard/traning-video" replace />} />
        <Route path="/user/*" element={<Navigate to="/dashboard/admin" replace />} />

        {/* Catch all route - redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  )
}

export default App