"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"

const LoginPage = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState({})
  const [toast, setToast] = useState({ show: false, message: "", type: "" })
  const [showAdminModal, setShowAdminModal] = useState(false)
  const [adminCredentials, setAdminCredentials] = useState({ username: "", password: "" })
  const [adminLoading, setAdminLoading] = useState(false)

  // Your Google Apps Script web app URL
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzIlixuocy7PD7fFp8-0R689eauMalOHY5RsngXrIQ1vRYM_PUBMEHPsYHbS2rXT_j6/exec"

  const handleAdminCredentialChange = (e) => {
    const { name, value } = e.target
    setAdminCredentials(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleAdminLogin = async (e) => {
    e.preventDefault()

    if (!adminCredentials.username || !adminCredentials.password) {
      showToast("Please enter both username and password", "error")
      return
    }

    setAdminLoading(true)

    try {
      const scriptUrl = `https://script.google.com/macros/s/AKfycbzIlixuocy7PD7fFp8-0R689eauMalOHY5RsngXrIQ1vRYM_PUBMEHPsYHbS2rXT_j6/exec`

      const formData = new FormData();
      formData.append('action', 'verifyAdmin');
      formData.append('username', adminCredentials.username);
      formData.append('password', adminCredentials.password);

      const scriptResponse = await fetch(scriptUrl, {
        method: 'POST',
        body: formData
      })

      if (!scriptResponse.ok) {
        throw new Error(`HTTP error! status: ${scriptResponse.status}`)
      }

      const result = await scriptResponse.json()

      if (result.success) {
        // Set admin authentication
        sessionStorage.setItem("username", adminCredentials.username)
        sessionStorage.setItem("role", "admin")

        showToast("Login successful! Redirecting...", "success")
        setShowAdminModal(false)

        // Navigate to license page
        setTimeout(() => {
          navigate("/dashboard/license")
        }, 1000)
      } else {
        showToast(result.error || "Invalid username or password", "error")
      }
    } catch (error) {
      console.error("Admin Login Error:", error)
      showToast("Login failed. Please try again.", "error")
    } finally {
      setAdminLoading(false)
    }
  }

  // Direct navigation handlers for each button
  const handleRequestVisit = async () => {
    setIsLoading(prev => ({ ...prev, requestVisit: true }))

    try {
      // Simulate loading for better UX
      await new Promise(resolve => setTimeout(resolve, 500))

      // Store email in session storage for use in Request Visit form
      sessionStorage.setItem("visitorEmail", "")
      // Set user as admin to access assign-task page
      sessionStorage.setItem("username", "admin")
      sessionStorage.setItem("role", "admin")
      console.log("Set admin role, navigating to assign-task")
      navigate("/dashboard/assign-task")
      showToast("Redirecting to Request Visit...", "success")
    } catch (error) {
      console.error("Navigation Error:", error)
      showToast(`Navigation failed: ${error.message}. Please try again.`, "error")
    } finally {
      setIsLoading(prev => ({ ...prev, requestVisit: false }))
    }
  }

  const handleCloseGatePass = async () => {
    setIsLoading(prev => ({ ...prev, closeGatePass: true }))

    try {
      // Simulate loading for better UX
      await new Promise(resolve => setTimeout(resolve, 500))

      // Set user as regular user to access delegation page
      sessionStorage.setItem("username", "user")
      sessionStorage.setItem("role", "user")
      console.log("Set user role, navigating to delegation")
      navigate("/dashboard/delegation")
      showToast("Redirecting to Close Gate Pass...", "success")
    } catch (error) {
      console.error("Navigation Error:", error)
      showToast(`Navigation failed: ${error.message}. Please try again.`, "error")
    } finally {
      setIsLoading(prev => ({ ...prev, closeGatePass: false }))
    }
  }

  const showToast = (message, type) => {
    setToast({ show: true, message, type })
    setTimeout(() => {
      setToast({ show: false, message: "", type: "" })
    }, 3000)
  }

  const closeAdminModal = () => {
    setShowAdminModal(false)
    setAdminCredentials({ username: "", password: "" })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50 flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-md mx-auto">
        {/* Main Card */}
        <div className="bg-white/90 backdrop-blur-sm shadow-lg border border-gray-200/50 rounded-xl sm:rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-white px-4 py-2 text-center border-b border-gray-200/100">
            <div className="flex items-center justify-center">
              <img
                src="/logo.jpg"
                alt="Logo"
                className="w-full max-w-[280px] sm:max-w-[320px] md:max-w-[360px] object-contain"
              />
            </div>
          </div>

          {/* Form Content */}
          <div className="p-4 sm:p-6">
            {/* Instructions */}
            <div className="text-center mb-4 sm:mb-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Visitor Request Form</h3>
              <p className="text-gray-500 text-xs">
                नोट- ये फॉर्म गेट स्टाफ या विजिटर के द्वारा भरा जाएगा
              </p>
            </div>

            {/* Button Options */}
            <div className="space-y-3 sm:space-y-4">
              {/* Request Visit Button */}
              <button
                onClick={handleRequestVisit}
                disabled={isLoading.requestVisit}
                className="w-full flex items-center p-3 sm:p-4 bg-gradient-to-r from-emerald-50/80 to-teal-50/80 border border-emerald-200/60 rounded-lg sm:rounded-xl cursor-pointer transition-all duration-200 hover:from-emerald-100/80 hover:to-teal-100/80 hover:border-emerald-300/60 hover:shadow-sm group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-emerald-500/90 rounded-md sm:rounded-lg mr-3 group-hover:bg-emerald-600/90 transition-colors flex-shrink-0">
                  <i className="fas fa-user-plus text-white text-sm sm:text-base"></i>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <h3 className="text-sm sm:text-base font-medium text-gray-800 mb-0.5 sm:mb-1 leading-tight">
                    {isLoading.requestVisit ? "Processing..." : "Request Visit"}
                  </h3>
                  <p className="text-xs sm:text-sm font-medium text-gray-600 mb-0.5">
                    विज़िट का अनुरोध
                  </p>
                </div>
                {isLoading.requestVisit && (
                  <div className="ml-2 flex-shrink-0">
                    <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-emerald-500 border-t-transparent"></div>
                  </div>
                )}
              </button>

              {/* Close Gate Pass Button */}
              <button
                onClick={handleCloseGatePass}
                disabled={isLoading.closeGatePass}
                className="w-full flex items-center p-3 sm:p-4 bg-gradient-to-r from-amber-50/80 to-orange-50/80 border border-amber-200/60 rounded-lg sm:rounded-xl cursor-pointer transition-all duration-200 hover:from-amber-100/80 hover:to-orange-100/80 hover:border-amber-300/60 hover:shadow-sm group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-amber-500/90 rounded-md sm:rounded-lg mr-3 group-hover:bg-amber-600/90 transition-colors flex-shrink-0">
                  <i className="fas fa-door-closed text-white text-sm sm:text-base"></i>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <h3 className="text-sm sm:text-base font-medium text-gray-800 mb-0.5 sm:mb-1 leading-tight">
                    {isLoading.closeGatePass ? "Processing..." : "Close Gate Pass"}
                  </h3>
                  <p className="text-xs sm:text-sm font-medium text-gray-600 mb-0.5">
                    गेट पास बंद करें
                  </p>
                </div>
                {isLoading.closeGatePass && (
                  <div className="ml-2 flex-shrink-0">
                    <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-amber-500 border-t-transparent"></div>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="fixed bottom-0 left-0 right-0 bg-orange-50/90 backdrop-blur-sm border-t border-orange-200 py-1 z-10">
          <div className="text-center">
            <a
              href="https://www.botivate.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-orange-700 text-xs"
            >
              Powered by <span className="font-medium">Botivate</span>
            </a>
          </div>
        </div>
      </div>

      {/* Admin Login Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-md mx-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Admin Login</h3>
              <button
                onClick={closeAdminModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleAdminLogin} className="p-4 sm:p-6">
              <div className="space-y-4">
                {/* Username Field */}
                <div>
                  <label htmlFor="admin-username" className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    id="admin-username"
                    name="username"
                    value={adminCredentials.username}
                    onChange={handleAdminCredentialChange}
                    placeholder="Enter username"
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    required
                  />
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    id="admin-password"
                    name="password"
                    value={adminCredentials.password}
                    onChange={handleAdminCredentialChange}
                    placeholder="Enter password"
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={closeAdminModal}
                  className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adminLoading}
                  className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {adminLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      <span>Logging in...</span>
                    </div>
                  ) : (
                    "Login"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-3 sm:top-4 right-3 sm:right-4 left-3 sm:left-4 mx-auto max-w-xs sm:max-w-md z-50">
          <div className={`px-4 sm:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl shadow-lg transition-all duration-300 transform ${toast.type === "success"
            ? "bg-emerald-500 text-white"
            : "bg-red-500 text-white"
            }`}>
            <div className="flex items-center">
              <i className={`fas ${toast.type === "success" ? "fa-check-circle" : "fa-exclamation-circle"} mr-2 sm:mr-3 text-sm sm:text-base`}></i>
              <span className="font-medium text-xs sm:text-sm">{toast.message}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LoginPage