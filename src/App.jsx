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

  // Simple synchronous check
  const username = sessionStorage.getItem("username")
  const role = sessionStorage.getItem("role")

  // ✅ ONLY dashboard/quick-task is public
  if (location.pathname === '/dashboard/quick-task') {
    return children
  }

  // For all other routes, require authentication
  if (!username) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />
  }

  // If this is an admin-only route and user is not admin, redirect to dashboard
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
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

        {/* ✅ ONLY PUBLIC ROUTE - dashboard/quick-task */}
        <Route
          path="/dashboard/quick-task"
          element={
            <ProtectedRoute>
              <QuickTask />
            </ProtectedRoute>
          }
        />

        {/* 🔒 ALL OTHER ROUTES PROTECTED */}
        <Route
          path="/dashboard/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/assign-task"
          element={
            <ProtectedRoute>
              <AdminAssignTask />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/delegation"
          element={
            <ProtectedRoute>
              <AccountDataPage />
            </ProtectedRoute>
          }
        />

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