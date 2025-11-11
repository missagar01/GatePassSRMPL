"use client"
import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import {
  CheckCircle2,
  DoorClosed,
  DoorOpen,
  RefreshCw,
  AlertCircle,
  Phone,
  Calendar,
  Clock,
  UserCheck,
  MapPin
} from "lucide-react"

const GatePassClosure = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("pending")
  const [pendingGatePasses, setPendingGatePasses] = useState([])
  const [historyGatePasses, setHistoryGatePasses] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState({ show: false, message: "", type: "" })
  const [closingPasses, setClosingPasses] = useState(new Set())

  // Your Google Apps Script Web App URL
  const webAppUrl = "https://script.google.com/macros/s/AKfycbzIlixuocy7PD7fFp8-0R689eauMalOHY5RsngXrIQ1vRYM_PUBMEHPsYHbS2rXT_j6/exec"

  // Function to fetch data from Google Sheets
  const fetchGatePassData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch data from your Google Apps Script web app
      const response = await fetch(`${webAppUrl}?action=getVisitors`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const visitorsData = await response.json()

      // Process the data and separate based on column N and O conditions
      const pendingData = []
      const historyData = []

      visitorsData.forEach((visitor, index) => {
        // Generate a unique ID if not available
        const visitorId = visitor['Serial No.'] || `VIS${String(index + 1).padStart(3, '0')}`

        // Get values from columns N and O
        const columnN = visitor['ColumnN'] || visitor['Gate Pass Approved'] || null // Adjust column name as per your sheet
        const columnO = visitor['ColumnO'] || visitor['Gate Pass Closed'] || null // Adjust column name as per your sheet

        const gatePass = {
          id: visitorId,
          visitorName: visitor['Visitor Name'] || 'N/A',
          mobileNumber: visitor['Mobile Number'] || 'N/A',
          email: visitor['Email'] || '',
          personToMeet: visitor['Person to Meet'] || 'N/A',
          purposeOfVisit: visitor['Purpose of Visit'] || 'N/A',
          entryDate: visitor['Date of Visit'] || 'N/A',
          entryTime: visitor['Entry Time'] || 'N/A',
          exitTime: columnN, // Column N value
          closedTimestamp: columnO, // Column O value
          status: columnO ? "Closed" : "Pending",
          visitorAddress: visitor['Address'] || '',
          photo: visitor['Photo'] || '/api/placeholder/80/80'
        }

        // Apply conditions: Pending tab - Column N NOT NULL and Column O NULL
        // History tab - Column N NOT NULL and Column O NOT NULL
        if (columnN && !columnO) {
          // Pending tab condition: Column N NOT NULL, Column O NULL
          pendingData.push(gatePass)
        } else if (columnN && columnO) {
          // History tab condition: Column N NOT NULL, Column O NOT NULL
          historyData.push(gatePass)
        }
        // If Column N is NULL, don't show in either tab
      })

      setPendingGatePasses(pendingData)
      setHistoryGatePasses(historyData)

    } catch (error) {
      console.error("Error fetching gate pass data:", error)
      setError("Failed to load gate pass data. Please try again.")

      // Fallback to empty arrays if fetch fails
      setPendingGatePasses([])
      setHistoryGatePasses([])
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
      const currentTimestamp = new Date().toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      })

      // Find the gate pass to close
      const gatePassToClose = pendingGatePasses.find(pass => pass.id === gatePassId)

      if (gatePassToClose) {
        // Update local state - move from pending to history
        setPendingGatePasses(prev => prev.filter(pass => pass.id !== gatePassId))

        const closedGatePass = {
          ...gatePassToClose,
          status: "Closed",
          closedTimestamp: currentTimestamp
        }

        setHistoryGatePasses(prev => [closedGatePass, ...prev])

        // Send update to Google Sheets - update column O with timestamp
        try {
          const updateResponse = await fetch(webAppUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `action=closeGatePass&visitorId=${encodeURIComponent(gatePassId)}&timestamp=${encodeURIComponent(currentTimestamp)}`
          })

          if (!updateResponse.ok) {
            throw new Error('Failed to update Google Sheets')
          } a

          showToast(`Gate Pass ${gatePassId} closed successfully!`, "success")
        } catch (updateError) {
          console.error("Failed to update sheet:", updateError)
          showToast("Gate pass closed locally but failed to update sheet.", "warning")
        }
      }

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

  const currentData = activeTab === "pending" ? pendingGatePasses : historyGatePasses

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

  const handleRefresh = () => {
    fetchGatePassData()
    showToast("Data refreshed successfully!", "success")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-orange-50 to-amber-50">

      {/* Logo Section */}
      <div className="bg-white px-4 py-2 text-center border-b border-gray-200/100">
      </div>

      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 p-2 sm:p-4">
        <div className="flex items-center justify-center">
          <img
            src="/logo.jpg"
            alt="Logo"
            className="w-full max-w-[280px] sm:max-w-[320px] md:max-w-[360px] object-contain"
          />
        </div>

        {/* Header */}
        <div className="text-center py-4 sm:py-6">
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
            Gate Pass Management
          </h1>
          <p className="text-sm text-gray-600 mt-1">गेट पास प्रबंधन</p>
        </div>


        {/* Tabs */}
        <div className="bg-orange-50/80 backdrop-blur-sm rounded-lg shadow-sm border border-orange-200/50 overflow-hidden">
          <div className="grid grid-cols-2">
            <button
              onClick={() => setActiveTab("pending")}
              className={`py-3 sm:py-4 px-2 sm:px-4 text-center transition-all ${activeTab === "pending"
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                : "bg-orange-100/50 text-orange-700 hover:bg-orange-200/50"
                }`}
            >
              <div className="flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base font-medium">
                <DoorOpen className="h-4 w-4" />
                Pending ({pendingGatePasses.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`py-3 sm:py-4 px-2 sm:px-4 text-center transition-all ${activeTab === "history"
                ? "bg-gradient-to-r from-emerald-400 to-teal-500 text-white"
                : "bg-orange-100/50 text-orange-700 hover:bg-orange-200/50"
                }`}
            >
              <div className="flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base font-medium">
                <DoorClosed className="h-4 w-4" />
                History ({historyGatePasses.length})
              </div>
            </button>
          </div>
        </div>



        {/* Content */}
        {loading ? (
          <div className="bg-orange-50/80 backdrop-blur-sm rounded-lg shadow-sm border border-orange-200/50 p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-orange-500 border-t-transparent mb-2"></div>
            <p className="text-orange-700 text-sm">Loading visitor data...</p>
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
                activeTab === "pending" ? "No pending gate passes found" : "No history available"}
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
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${gatePass.status === "Pending"
                        ? "bg-amber-500 text-white"
                        : "bg-emerald-500 text-white"
                        }`}>
                        {gatePass.status}
                      </span>
                    </div>
                    {activeTab === "history" && gatePass.closedTimestamp && (
                      <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded border">
                        Closed: {gatePass.closedTimestamp}
                      </span>
                    )}
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
                          <div className="flex items-center text-xs text-gray-600 mt-1">
                            <span>{gatePass.email}</span>
                          </div>
                        )}
                        {gatePass.photo && gatePass.photo !== '/api/placeholder/80/80' && (
                          <div className="mt-2">
                            <img
                              src={gatePass.photo}
                              alt={gatePass.visitorName}
                              className="w-16 h-16 object-cover rounded border border-gray-300"
                              onError={(e) => {
                                e.target.style.display = 'none'
                              }}
                            />
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
                          <span className="font-medium">Visit Date: </span>
                          <span className="text-gray-600">{gatePass.entryDate}</span>
                        </div>
                      </div>

                      <div className="flex items-start text-xs sm:text-sm text-gray-700">
                        <Clock className="h-3 w-3 text-blue-500 mr-1.5 mt-0.5 flex-shrink-0" />
                        {/* <div>
                          <span className="font-medium">Entry Time: </span>
                          <span className="text-gray-600">{gatePass.entryTime}</span>
                          {gatePass.exitTime && (
                            <div className="mt-0.5">
                              <span className="font-medium">Exit Time: </span>
                              <span className="text-gray-600">{gatePass.exitTime}</span>
                            </div>
                          )}
                        </div> */}
                      </div>

                      {gatePass.visitorAddress && (
                        <div className="flex items-start text-xs sm:text-sm text-gray-700">
                          <MapPin className="h-3 w-3 text-red-500 mr-1.5 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="font-medium">Address: </span>
                            <span className="text-gray-600">{gatePass.visitorAddress}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Button - Only show for pending gate passes */}
                  {activeTab === "pending" && (
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
          <div className={`max-w-sm w-full px-4 py-3 rounded-lg shadow-lg ${toast.type === "success" ? "bg-emerald-500" : toast.type === "warning" ? "bg-amber-500" : "bg-red-500"
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