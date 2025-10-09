"use client"
import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import {
  CheckCircle2,
  X,
  Search,
  Clock,
  User,
  Calendar,
  MapPin,
  UserCheck,
  DoorClosed,
  RefreshCw,
  AlertCircle,
  Phone,
  DoorOpen
} from "lucide-react"

const GatePassClosure = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("active")
  const [activeGatePasses, setActiveGatePasses] = useState([])
  const [closedGatePasses, setClosedGatePasses] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState({ show: false, message: "", type: "" })
  const [closingPasses, setClosingPasses] = useState(new Set())

  // Mock data
  const mockActiveGatePassData = [
    {
      id: "GP001",
      visitorName: "John Doe",
      mobileNumber: "9876543210",
      email: "john.doe@email.com",
      personToMeet: "Manager Smith",
      purposeOfVisit: "Business Meeting",
      entryDate: "24/09/2025",
      entryTime: "09:30",
      exitTime: null,
      status: "Active",
      visitorAddress: "123 Main Street, City",
      photo: "/api/placeholder/80/80"
    },
    {
      id: "GP002",
      visitorName: "Jane Smith",
      mobileNumber: "8765432109",
      email: "jane.smith@email.com",
      personToMeet: "Director Johnson",
      purposeOfVisit: "Project Discussion",
      entryDate: "24/09/2025",
      entryTime: "10:15",
      exitTime: null,
      status: "Active",
      visitorAddress: "456 Oak Avenue, Town",
      photo: "/api/placeholder/80/80"
    },
    {
      id: "GP003",
      visitorName: "राम शर्मा",
      mobileNumber: "7654321098",
      email: "",
      personToMeet: "HR Manager",
      purposeOfVisit: "Interview",
      entryDate: "24/09/2025",
      entryTime: "11:00",
      exitTime: null,
      status: "Active",
      visitorAddress: "789 Gandhi Road, Village",
      photo: "/api/placeholder/80/80"
    }
  ]

  const mockClosedGatePassData = [
    {
      id: "GP004",
      visitorName: "Sarah Wilson",
      mobileNumber: "9988776655",
      email: "sarah@email.com",
      personToMeet: "Admin Head",
      purposeOfVisit: "Documentation",
      entryDate: "23/09/2025",
      entryTime: "14:30",
      exitTime: "16:45",
      status: "Closed",
      visitorAddress: "321 Park Street, City",
      photo: "/api/placeholder/80/80"
    }
  ]

  const fetchGatePassData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      await new Promise(resolve => setTimeout(resolve, 1000))
      setActiveGatePasses(mockActiveGatePassData)
      setClosedGatePasses(mockClosedGatePassData)
    } catch (error) {
      console.error("Error fetching gate pass data:", error)
      setError("Failed to load gate pass data: " + error.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchGatePassData()
  }, [fetchGatePassData])

  const showToast = (message, type) => {
    setToast({ show: true, message, type })
    setTimeout(() => {
      setToast({ show: false, message: "", type: "" })
    }, 4000)
  }

  const handleCloseGatePass = async (gatePassId) => {
    if (!confirm("Are you sure you want to close this gate pass?")) {
      return
    }

    setClosingPasses(prev => new Set([...prev, gatePassId]))

    try {
      const currentTime = new Date().toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })

      await new Promise(resolve => setTimeout(resolve, 1500))

      const gatePassToClose = activeGatePasses.find(pass => pass.id === gatePassId)
      if (gatePassToClose) {
        const closedGatePass = {
          ...gatePassToClose,
          status: "Closed",
          exitTime: currentTime
        }

        setActiveGatePasses(prev => prev.filter(pass => pass.id !== gatePassId))
        setClosedGatePasses(prev => [closedGatePass, ...prev])
      }

      showToast(`Gate Pass ${gatePassId} closed successfully!`, "success")

    } catch (error) {
      console.error("Error closing gate pass:", error)
      showToast("Failed to close gate pass. Please try again.", "error")
    } finally {
      setClosingPasses(prev => {
        const newSet = new Set(prev)
        newSet.delete(gatePassId)
        return newSet
      })
    }
  }

  const currentData = activeTab === "active" ? activeGatePasses : closedGatePasses

  const filteredData = currentData.filter(pass => {
    if (!searchTerm) return true

    const searchLower = searchTerm.toLowerCase()
    return (
      pass.id.toLowerCase().includes(searchLower) ||
      pass.visitorName.toLowerCase().includes(searchLower) ||
      pass.mobileNumber.includes(searchTerm) ||
      pass.personToMeet.toLowerCase().includes(searchLower) ||
      pass.purposeOfVisit.toLowerCase().includes(searchLower)
    )
  })

  const handleBackToHome = () => {
    navigate("/login")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-orange-50 to-amber-50">

      {/* Logo Section */}
      <div className="bg-white px-4 py-2 text-center border-b border-gray-200/100">
        <div className="flex items-center justify-center">
          <img
            src="/logo.jpg"
            alt="Logo"
            className="w-full max-w-[280px] sm:max-w-[320px] md:max-w-[360px] object-contain"
          />
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 p-2 sm:p-4">

        {/* Header */}
        <div className="text-center py-4 sm:py-6">
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
            Gate Pass Management
          </h1>
          <p className="text-sm text-gray-600 mt-1">गेट पास प्रबंधन</p>
        </div>

        {/* Controls */}
        {/* <div className="bg-orange-50/80 backdrop-blur-sm rounded-lg shadow-sm border border-orange-200/50 p-3 sm:p-4">
          <div className="flex justify-center">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by ID, name, mobile..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-sm border border-orange-200 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-400 focus:border-orange-400"
              />
            </div>
          </div>
        </div> */}

        {/* Tabs */}
        <div className="bg-orange-50/80 backdrop-blur-sm rounded-lg shadow-sm border border-orange-200/50 overflow-hidden">
          <div className="grid grid-cols-2">
            <button
              onClick={() => setActiveTab("active")}
              className={`py-3 sm:py-4 px-2 sm:px-4 text-center transition-all ${activeTab === "active"
                ? "bg-gradient-to-r from-emerald-400 to-teal-500 text-white"
                : "bg-orange-100/50 text-orange-700 hover:bg-orange-200/50"
                }`}
            >
              <div className="flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base font-medium">
                <DoorOpen className="h-4 w-4" />
                Active ({activeGatePasses.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab("closed")}
              className={`py-3 sm:py-4 px-2 sm:px-4 text-center transition-all ${activeTab === "closed"
                ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white"
                : "bg-orange-100/50 text-orange-700 hover:bg-orange-200/50"
                }`}
            >
              <div className="flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base font-medium">
                <DoorClosed className="h-4 w-4" />
                Closed ({closedGatePasses.length})
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="bg-orange-50/80 backdrop-blur-sm rounded-lg shadow-sm border border-orange-200/50 p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-orange-500 border-t-transparent mb-2"></div>
            <p className="text-orange-700 text-sm">Loading...</p>
          </div>
        ) : error ? (
          <div className="bg-orange-50/80 backdrop-blur-sm rounded-lg shadow-sm border border-orange-200/50 p-6 text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600 mb-2">{error}</p>
            <button
              onClick={fetchGatePassData}
              className="text-red-600 hover:text-red-700 underline text-sm"
            >
              Try again
            </button>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="bg-orange-50/80 backdrop-blur-sm rounded-lg shadow-sm border border-orange-200/50 p-8 text-center">
            <DoorClosed className="h-12 w-12 text-orange-400 mx-auto mb-3" />
            <h3 className="font-medium text-orange-700 mb-1">
              {searchTerm ? "No matches found" : `No ${activeTab} gate passes`}
            </h3>
            <p className="text-orange-600 text-sm">
              {searchTerm ? "Try different search terms" :
                activeTab === "active" ? "All visitors checked out" : "No closed passes yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {filteredData.map((gatePass) => {
              const isClosing = closingPasses.has(gatePass.id)

              return (
                <div
                  key={gatePass.id}
                  className={`bg-orange-50/80 backdrop-blur-sm rounded-lg shadow-sm border border-orange-200/50 p-3 transition-all ${isClosing ? 'opacity-50 pointer-events-none' : 'hover:shadow-md'
                    }`}
                >
                  {/* Header Row */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-white text-orange-700 px-2 py-0.5 rounded text-xs font-semibold border border-orange-200">
                        {gatePass.id}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${gatePass.status === "Active"
                        ? "bg-emerald-500 text-white"
                        : "bg-gray-500 text-white"
                        }`}>
                        {gatePass.status}
                      </span>
                    </div>
                  </div>

                  {/* Main Content - Two Columns */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    {/* Left Column */}
                    <div className="space-y-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-1">
                          {gatePass.visitorName}
                        </h3>
                        <div className="flex items-center text-xs sm:text-sm text-gray-700">
                          <Phone className="h-3 w-3 text-blue-500 mr-1.5 flex-shrink-0" />
                          <span>{gatePass.mobileNumber}</span>
                        </div>
                        {gatePass.email && (
                          <div className="text-xs text-gray-600 ml-4">
                            {gatePass.email}
                          </div>
                        )}
                      </div>

                      <div className="flex items-start text-xs sm:text-sm text-gray-700">
                        <UserCheck className="h-3 w-3 text-purple-500 mr-1.5 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium">Meeting: </span>
                          <span className="text-gray-600">{gatePass.personToMeet}</span>
                        </div>
                      </div>

                      <div className="flex items-start text-xs sm:text-sm text-gray-700">
                        <MapPin className="h-3 w-3 text-green-500 mr-1.5 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium">Purpose: </span>
                          <span className="text-gray-600">{gatePass.purposeOfVisit}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-2">
                      <div className="flex items-start text-xs sm:text-sm text-gray-700">
                        <Calendar className="h-3 w-3 text-orange-500 mr-1.5 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium">Date: </span>
                          <span className="text-gray-600">{gatePass.entryDate}</span>
                        </div>
                      </div>

                      <div className="flex items-start text-xs sm:text-sm text-gray-700">
                        <Clock className="h-3 w-3 text-blue-500 mr-1.5 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium">Entry: </span>
                          <span className="text-gray-600">{gatePass.entryTime}</span>
                          {gatePass.exitTime && (
                            <div className="mt-0.5">
                              <span className="font-medium">Exit: </span>
                              <span className="text-gray-600">{gatePass.exitTime}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="bg-white/60 rounded p-2 border border-orange-100">
                        <div className="flex items-start">
                          <MapPin className="h-3 w-3 text-gray-500 mr-1.5 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="text-xs font-medium text-gray-700">Address:</span>
                            <p className="text-xs text-gray-600 mt-0.5 leading-tight line-clamp-2">
                              {gatePass.visitorAddress}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  {activeTab === "active" && (
                    <button
                      onClick={() => handleCloseGatePass(gatePass.id)}
                      disabled={isClosing}
                      className="w-full py-2 px-4 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded font-medium text-xs sm:text-sm transition-all disabled:opacity-50 shadow-sm"
                    >
                      {isClosing ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                          <span>Closing...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5">
                          <DoorClosed className="h-3 w-3" />
                          <span>Close Gate Pass</span>
                        </div>
                      )}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Footer - Fixed at bottom */}
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

      {/* Toast */}
      {toast.show && (
        <div className="fixed top-4 left-4 right-4 z-50 flex justify-center">
          <div className={`max-w-sm w-full px-4 py-3 rounded-lg shadow-lg ${toast.type === "success" ? "bg-emerald-500" : "bg-red-500"
            } text-white`}>
            <div className="flex items-center text-sm">
              <CheckCircle2 className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>{toast.message}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GatePassClosure