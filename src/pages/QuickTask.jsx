import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from "../components/layout/AdminLayout"

const LoginPage = () => {
    const [adminCredentials, setAdminCredentials] = useState({
        username: "",
        password: ""
    })
    const [adminLoading, setAdminLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [toast, setToast] = useState({ show: false, message: "", type: "" })
    const [loginAttempts, setLoginAttempts] = useState(0)
    const navigate = useNavigate()

    const webAppUrl = "https://script.google.com/macros/s/AKfycbzy2KgQNVJ-mSgyLwXA1l2VBD4qQEQZvu9dy7MYrPEgOCIdJUOY7Tfa3WMGqJ3IpK3a6w/exec"

    // Input validation
    const validateInputs = () => {
        const { username, password } = adminCredentials

        if (!username.trim() || !password.trim()) {
            showToast("Please enter both username and password", "error")
            return false
        }

        if (username.length < 3 || username.length > 50) {
            showToast("Username must be between 3 and 50 characters", "error")
            return false
        }

        if (password.length < 6) {
            showToast("Password must be at least 6 characters", "error")
            return false
        }

        return true
    }

    // Rate limiting check
    const isRateLimited = () => {
        if (loginAttempts >= 5) {
            showToast("Too many failed attempts. Please try again later.", "error")
            return true
        }
        return false
    }

    // Admin login handler
    const handleAdminLogin = async (e) => {
        e.preventDefault()

        if (isRateLimited() || !validateInputs()) {
            return
        }

        setAdminLoading(true)

        try {
            // Add timeout for the request
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 10000)

            const formData = new FormData();
            formData.append('action', 'verifyAdmin');
            formData.append('username', adminCredentials.username.trim());
            formData.append('password', adminCredentials.password);

            const scriptResponse = await fetch(webAppUrl, {
                method: 'POST',
                body: formData,
                signal: controller.signal
            })

            clearTimeout(timeoutId)

            if (!scriptResponse.ok) {
                throw new Error(`Network error: ${scriptResponse.status}`)
            }

            const result = await scriptResponse.json()

            if (result.success) {
                // Reset login attempts on success
                setLoginAttempts(0)

                // ✅ STORE BOTH USERNAME AND ROLE
                sessionStorage.setItem("username", adminCredentials.username.trim())
                sessionStorage.setItem("role", result.role || "user") // Add this line

                showToast("Login successful! Redirecting...", "success")

                // Navigate to dashboard after successful login
                setTimeout(() => {
                    navigate('/dashboard/license', { replace: true })
                }, 1000)
            } else {
                // Increment failed attempts
                setLoginAttempts(prev => prev + 1)
                const remainingAttempts = 5 - loginAttempts - 1
                const message = remainingAttempts > 0
                    ? `Invalid credentials. ${remainingAttempts} attempts remaining.`
                    : "Account temporarily locked due to too many failed attempts."

                showToast(result.error || message, "error")

                // Clear password on failure
                setAdminCredentials(prev => ({ ...prev, password: "" }))
            }
        } catch (error) {
            console.error("Admin Login Error:", error)

            if (error.name === 'AbortError') {
                showToast("Request timeout. Please try again.", "error")
            } else {
                showToast("Login failed. Please check your connection and try again.", "error")
            }

            setLoginAttempts(prev => prev + 1)
        } finally {
            setAdminLoading(false)
        }
    }

    const handleAdminCredentialChange = (e) => {
        const { name, value } = e.target
        setAdminCredentials(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword)
    }

    const showToast = (message, type) => {
        setToast({ show: true, message, type })
        setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000)
    }

    return (
        <AdminLayout>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full">
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-orange-200 to-red-500 p-6 text-center text-white">
                            <h2 className="text-2xl text-black font-bold">Login For</h2>
                            <p className="text-gray-900 mt-1">Approve / Reject Gate Pass</p>
                            {loginAttempts > 0 && (
                                <p className="text-sm text-red-700 mt-2">
                                    Failed attempts: {loginAttempts}/5
                                </p>
                            )}
                        </div>

                        {/* Login Form */}
                        <form onSubmit={handleAdminLogin} className="p-6">
                            <div className="space-y-4">
                                {/* Username Field */}
                                <div>
                                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                                        Username
                                    </label>
                                    <input
                                        type="text"
                                        id="username"
                                        name="username"
                                        value={adminCredentials.username}
                                        onChange={handleAdminCredentialChange}
                                        placeholder="Enter username"
                                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        required
                                        disabled={adminLoading || loginAttempts >= 5}
                                        maxLength={50}
                                        autoComplete="username"
                                    />
                                </div>

                                {/* Password Field */}
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            id="password"
                                            name="password"
                                            value={adminCredentials.password}
                                            onChange={handleAdminCredentialChange}
                                            placeholder="Enter password"
                                            className="w-full px-3 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                            required
                                            disabled={adminLoading || loginAttempts >= 5}
                                            minLength={6}
                                            autoComplete="current-password"
                                        />
                                        <button
                                            type="button"
                                            onClick={togglePasswordVisibility}
                                            disabled={adminLoading}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Login Button */}
                            <button
                                type="submit"
                                disabled={adminLoading || loginAttempts >= 5}
                                className="w-full mt-6 py-3 px-4 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {adminLoading ? (
                                    <div className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                        <span>Logging in...</span>
                                    </div>
                                ) : loginAttempts >= 5 ? (
                                    "Temporarily Locked"
                                ) : (
                                    "Login"
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Toast Notification */}
                {toast.show && (
                    <div className="fixed top-4 right-4 left-4 mx-auto max-w-md z-50">
                        <div className={`px-4 py-3 rounded-lg shadow-lg ${toast.type === "success" ? "bg-green-500" :
                            toast.type === "error" ? "bg-red-500" : "bg-blue-500"
                            } text-white`}>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">{toast.message}</span>
                                <button
                                    onClick={() => setToast({ show: false, message: "", type: "" })}
                                    className="text-white hover:text-gray-200"
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    )
}

export default LoginPage