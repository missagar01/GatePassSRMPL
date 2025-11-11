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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState({ show: false, message: "", type: "" })
  const [closingPasses, setClosingPasses] = useState(new Set())

  const webAppUrl = "https://script.google.com/macros/s/AKfycbzIlixuocy7PD7fFp8-0R689eauMalOHY5RsngXrIQ1vRYM_PUBMEHPsYHbS2rXT_j6/exec"

  const fetchGatePassData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("🔍 Fetching raw data from Google Sheets...")

      const response = await fetch(`${webAppUrl}?action=getVisitors`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const visitorsData = await response.json()

      console.log("📊 RAW DATA FROM GOOGLE SHEETS:", visitorsData)

      // Process all data
      const allGatePasses = visitorsData.map((visitor, index) => {
        const serialNo = visitor['Serial No'] || visitor['Serial No.'] || `VIS${String(index + 1).padStart(3, '0')}`
        const columnN = visitor['Status'] || null
        const columnO = visitor['Gate Pass Closed'] || null

        return {
          id: serialNo,
          visitorName: visitor['Visitor Name'] || 'N/A',
          mobileNumber: visitor['Mobile Number'] || 'N/A',
          email: visitor['Email'] || '',
          personToMeet: visitor['Person to Meet'] || 'N/A',
          purposeOfVisit: visitor['Purpose of Visit'] || 'N/A',
          entryDate: visitor['Date of Visit'] || 'N/A',
          entryTime: visitor['Time of Entry'] || visitor['Entry Time'] || 'N/A',
          exitTime: visitor['Exit Time'] || 'N/A',
          status: columnN || 'N/A',
          gatePassClosed: columnO,
          visitorAddress: visitor['Visitor Address'] || visitor['Address'] || '',
          photo: visitor['Photo'] || '/api/placeholder/80/80'
        }
      })

      console.log("📋 ALL PROCESSED DATA:", allGatePasses)

      // Filter data based on column N (Status) and column O (Gate Pass Closed) conditions
      // Also exclude records with Status 'approved' or 'rejected'
      const pendingData = allGatePasses.filter(pass => {
        // Pending tab: Column O (Gate Pass Closed) should be NULL
        // AND Status should NOT be 'approved' or 'rejected'
        const hasValidStatus = pass.status.toLowerCase() === 'approved' &&
          pass.status.toLowerCase() === 'rejected'
        return (pass.gatePassClosed === null || pass.gatePassClosed === '') && hasValidStatus
      })

      const historyData = allGatePasses.filter(pass => {
        // History tab: Both Column N (Status) and Column O (Gate Pass Closed) should be NOT NULL
        // AND Status should NOT be 'approved' or 'rejected'
        const hasValidStatus = pass.status.toLowerCase() !== 'approved' &&
          pass.status.toLowerCase() !== 'rejected'
        return pass.status !== null && pass.status !== '' &&
          pass.gatePassClosed !== null && pass.gatePassClosed !== '' &&
          hasValidStatus
      })

      console.log("📝 PENDING DATA (Column O NULL, Status not approved/rejected):", pendingData)
      console.log("📚 HISTORY DATA (Column N & O NOT NULL, Status not approved/rejected):", historyData)

      setPendingGatePasses(pendingData)
      setHistoryGatePasses(historyData)

    } catch (error) {
      console.error("❌ Error fetching data:", error)
      setError(`Failed to load data: ${error.message}`)

      setPendingGatePasses([])
      setHistoryGatePasses([])
    } finally {
      setLoading(false)
    }
  }, [webAppUrl])

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

      const gatePassToClose = pendingGatePasses.find(pass => pass.id === gatePassId)

      if (gatePassToClose) {
        setPendingGatePasses(prev => prev.filter(pass => pass.id !== gatePassId))

        const closedGatePass = {
          ...gatePassToClose,
          status: "Closed",
          gatePassClosed: currentTimestamp
        }

        setHistoryGatePasses(prev => [closedGatePass, ...prev])

        const updateResponse = await fetch(webAppUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `action=closeGatePass&visitorId=${encodeURIComponent(gatePassId)}&timestamp=${encodeURIComponent(currentTimestamp)}`
        })

        if (!updateResponse.ok) {
          throw new Error('Failed to update Google Sheets')
        }

        const result = await updateResponse.json()
        console.log("Update response:", result)

        if (result.success) {
          showToast(`Gate Pass ${gatePassId} closed successfully!`, "success")
        } else {
          throw new Error(result.error || 'Unknown error updating sheet')
        }
      }

    } catch (error) {
      console.error("Error closing gate pass:", error)
      showToast("Failed to close gate pass: " + error.message, "error")
      fetchGatePassData()
    } finally {
      setClosingPasses(prev => {
        const newSet = new Set(prev)
        newSet.delete(gatePassId)
        return newSet
      })
    }
  }

  const currentData = activeTab === "pending" ? pendingGatePasses : historyGatePasses

  const handleRefresh = () => {
    fetchGatePassData()
    showToast("Data refreshed!", "success")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-orange-50 to-amber-50">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 p-2 sm:p-4">
        <div className="flex items-center justify-center">
          <img
            src="/logo.jpg"
            alt="Logo"
            className="w-full max-w-[280px] sm:max-w-[320px] md:max-w-[360px] object-contain"
          />
        </div>

        <div className="text-center py-4 sm:py-6">
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
            Gate Pass Management
          </h1>
          <p className="text-sm text-gray-600 mt-1">गेट पास प्रबंधन</p>
        </div>

        {/* Refresh Button */}
        {/* <div className="flex justify-end">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 bg-white text-orange-600 hover:bg-orange-50 px-3 py-2 rounded-lg border border-orange-200 text-sm font-medium transition-all shadow-sm"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div> */}

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
            <p className="text-orange-700 text-sm">Loading data...</p>
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
        ) : currentData.length === 0 ? (
          <div className="bg-orange-50/80 backdrop-blur-sm rounded-lg shadow-sm border border-orange-200/50 p-8 text-center">
            <DoorClosed className="h-12 w-12 text-orange-400 mx-auto mb-3" />
            <h3 className="font-medium text-orange-700 mb-1">
              {activeTab === "pending" ? "No pending gate passes" : "No history records"}
            </h3>
            <p className="text-orange-600 text-sm">
              {activeTab === "pending"
                ? "No gate passes waiting for closure"
                : "No completed gate passes found"}
            </p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {currentData.map((gatePass) => {
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
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${gatePass.status.toLowerCase() === "pending"
                        ? "bg-amber-500 text-white"
                        : gatePass.status.toLowerCase() === "closed" ? "bg-emerald-500 text-white" : "bg-gray-500 text-white"
                        }`}>
                        {gatePass.status}
                      </span>
                    </div>

                    {/* Close Button - Top Right, Smaller Width */}
                    {activeTab === "pending" && (!gatePass.gatePassClosed || gatePass.gatePassClosed === '') && (
                      <button
                        onClick={() => handleCloseGatePass(gatePass.id)}
                        disabled={isClosing}
                        className="w-auto px-3 py-1.5 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded text-xs font-medium transition-all disabled:opacity-50 shadow-sm flex items-center gap-1.5"
                      >
                        {isClosing ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                            <span>Closing...</span>
                          </>
                        ) : (
                          <>
                            <DoorClosed className="h-3 w-3" />
                            <span>Close</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Main Content */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                        <div>
                          <span className="font-medium">Entry Time: </span>
                          <span className="text-gray-600">{gatePass.entryTime}</span>
                          {gatePass.exitTime && gatePass.exitTime !== 'N/A' && (
                            <div className="mt-0.5">
                              <span className="font-medium">Exit Time: </span>
                              <span className="text-gray-600">{gatePass.exitTime}</span>
                            </div>
                          )}
                        </div>
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
                </div>
              )
            })}
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-4">
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