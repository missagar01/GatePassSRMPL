import React, { useState, useEffect } from 'react'
import { FileText, ScrollText, Users, User, KeyRound, Clock, CheckCircle, LogOut, Bell, Calendar, UserCheck, XCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from "../components/layout/AdminLayout"

const VisitorManagement = () => {
    const [userRole, setUserRole] = useState("")
    const [username, setUsername] = useState("")
    const [activeTab, setActiveTab] = useState("Requests")
    const [isLoading, setIsLoading] = useState(false)
    const [toast, setToast] = useState({ show: false, message: "", type: "" })
    const navigate = useNavigate()

    const [pendingVisits, setPendingVisits] = useState([])
    const [approvedVisits, setApprovedVisits] = useState([])

    // Your Google Apps Script Web App URL
    const webAppUrl = "https://script.google.com/macros/s/AKfycbzIlixuocy7PD7fFp8-0R689eauMalOHY5RsngXrIQ1vRYM_PUBMEHPsYHbS2rXT_j6/exec"

    // Get user info from sessionStorage
    useEffect(() => {
        const storedRole = sessionStorage.getItem('role') || 'admin'
        const storedUsername = sessionStorage.getItem('username') || 'Admin'
        setUserRole(storedRole)
        setUsername(storedUsername)

        // Load data based on initial active tab
        if (activeTab === "Requests") {
            fetchPendingVisits()
        } else if (activeTab === "Approved") {
            fetchApprovedVisits()
        }
    }, [])

    // Fetch data when tab changes
    useEffect(() => {
        if (activeTab === "Requests") {
            fetchPendingVisits()
        } else if (activeTab === "Approved") {
            fetchApprovedVisits()
        }
    }, [activeTab])

    const fetchPendingVisits = async () => {
        setIsLoading(true)
        try {
            const currentUsername = sessionStorage.getItem('username') || username
            const response = await fetch(`${webAppUrl}?action=getPendingVisitsForUser&username=${encodeURIComponent(currentUsername)}&timestamp=${Date.now()}`)

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const data = await response.json()

            if (data.success) {
                setPendingVisits(data.visits || [])
                showToast(`Loaded ${data.visits?.length || 0} pending visits`, "success")
            } else {
                throw new Error(data.error || 'Failed to fetch pending visits')
            }
        } catch (error) {
            console.error("Error fetching pending visits:", error)
            showToast("Failed to load pending visits", "error")
            setPendingVisits([])
        } finally {
            setIsLoading(false)
        }
    }

    const fetchApprovedVisits = async () => {
        setIsLoading(true)
        try {
            const currentUsername = sessionStorage.getItem('username') || username
            const response = await fetch(`${webAppUrl}?action=getApprovedVisitsForUser&username=${encodeURIComponent(currentUsername)}&timestamp=${Date.now()}`)

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const data = await response.json()

            if (data.success) {
                setApprovedVisits(data.visits || [])
                showToast(`Loaded ${data.visits?.length || 0} approved visits`, "success")
            } else {
                throw new Error(data.error || 'Failed to fetch approved visits')
            }
        } catch (error) {
            console.error("Error fetching approved visits:", error)
            showToast("Failed to load approved visits", "error")
            setApprovedVisits([])
        } finally {
            setIsLoading(false)
        }
    }

    const updateVisitStatus = async (serialNo, status) => {
        try {
            const currentUsername = sessionStorage.getItem('username') || username
            const formData = new FormData()
            formData.append('action', 'updateVisitStatus')
            formData.append('serialNo', serialNo)
            formData.append('status', status)
            formData.append('approvedBy', currentUsername)

            const response = await fetch(webAppUrl, {
                method: 'POST',
                body: formData
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const result = await response.json()

            if (result.success) {
                showToast(`Visit ${status} successfully!`, "success")

                // Remove from pending visits and add to approved if approved
                setPendingVisits(prev => prev.filter(visit => visit.serialNo !== serialNo))

                if (status === 'approved') {
                    const approvedVisit = pendingVisits.find(visit => visit.serialNo === serialNo)
                    if (approvedVisit) {
                        setApprovedVisits(prev => [...prev, { ...approvedVisit, status: 'approved' }])
                    }
                }

                // Refresh the current tab data
                if (activeTab === "Requests") {
                    fetchPendingVisits()
                } else if (activeTab === "Approved") {
                    fetchApprovedVisits()
                }
            } else {
                throw new Error(result.error || 'Update failed')
            }
        } catch (error) {
            console.error("Error updating visit status:", error)
            showToast(`Failed to ${status} visit`, "error")
        }
    }

    const handleApproveVisit = (serialNo) => {
        updateVisitStatus(serialNo, 'approved')
    }

    const handleRejectVisit = (serialNo) => {
        if (window.confirm("Are you sure you want to reject this visit?")) {
            updateVisitStatus(serialNo, 'rejected')
        }
    }

    const handleLogout = () => {
        sessionStorage.removeItem('username')
        sessionStorage.removeItem('role')
        navigate('/login')
    }

    const showToast = (message, type) => {
        setToast({ show: true, message, type })
        setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000)
    }

    const VisitCard = ({ visit, showActions = false }) => (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow mb-4">
            <div className="flex flex-col md:flex-row gap-4">
                {/* Left Side - Photo */}
                <div className="flex-shrink-0">
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                        {visit.photo ? (
                            <img
                                src={visit.photo}
                                alt={visit.visitorName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.target.style.display = 'none'
                                    e.target.nextSibling.style.display = 'flex'
                                }}
                            />
                        ) : null}
                        <div className={`w-full h-full flex items-center justify-center ${visit.photo ? 'hidden' : 'flex'}`}>
                            <User className="h-8 w-8 text-gray-400" />
                        </div>
                    </div>
                </div>

                {/* Right Side - Details */}
                <div className="flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-gray-500">Serial No</label>
                            <p className="text-sm font-medium text-gray-900">{visit.serialNo}</p>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-500">Visitor Name</label>
                            <p className="text-sm font-medium text-gray-900">{visit.visitorName}</p>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-500">Mobile Number</label>
                            <p className="text-sm text-gray-900">{visit.mobileNumber}</p>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-500">Date of Visit</label>
                            <p className="text-sm text-gray-900">{visit.dateOfVisit}</p>
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-xs font-medium text-gray-500">Purpose of Visit</label>
                            <p className="text-sm text-gray-900">{visit.purposeOfVisit}</p>
                        </div>
                        {visit.personToMeet && (
                            <div className="md:col-span-2">
                                <label className="text-xs font-medium text-gray-500">Person to Meet</label>
                                <p className="text-sm text-gray-900">{visit.personToMeet}</p>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons - Only show for pending visits */}
                    {showActions && visit.status === 'pending' && (
                        <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                            <button
                                onClick={() => handleApproveVisit(visit.serialNo)}
                                className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <CheckCircle className="h-4 w-4" />
                                Approve
                            </button>
                            <button
                                onClick={() => handleRejectVisit(visit.serialNo)}
                                className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <XCircle className="h-4 w-4" />
                                Reject
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )

    return (
        <AdminLayout>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-3 sm:p-4 lg:p-6 overflow-y-auto relative">
                <div className="max-w-7xl mx-auto">
                    {/* Header with Welcome Message */}
                    <div className="mb-6 sm:mb-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                                    <UserCheck className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">
                                        Welcome {username} Sir
                                    </h1>
                                    <p className="text-gray-600 text-sm mt-1">Visitor Management Dashboard</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {isLoading && (
                                    <div className="flex items-center gap-2 text-blue-600">
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                                        <span className="text-sm">Loading...</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tab Navigation - Only 2 Tabs */}
                    <div className="mb-6">
                        <div className="bg-white rounded-lg p-1 shadow-sm">
                            <div className="flex">
                                <button
                                    onClick={() => setActiveTab("Requests")}
                                    className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${activeTab === "Requests"
                                        ? "bg-blue-600 text-white"
                                        : "text-gray-600 hover:text-gray-800"
                                        }`}
                                >
                                    <Clock className="w-4 h-4 inline mr-2" />
                                    Requests ({pendingVisits.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab("Approved")}
                                    className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${activeTab === "Approved"
                                        ? "bg-blue-600 text-white"
                                        : "text-gray-600 hover:text-gray-800"
                                        }`}
                                >
                                    <CheckCircle className="w-4 h-4 inline mr-2" />
                                    Approved ({approvedVisits.length})
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Content Sections */}
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                        <div className="p-4 sm:p-6">
                            {/* Requests Tab - Shows visits assigned to logged-in user with pending status */}
                            {activeTab === "Requests" && (
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        {/* <Clock className="h-5 w-5 text-yellow-600" /> */}

                                    </div>
                                    <div>
                                        {pendingVisits.length > 0 ? (
                                            pendingVisits.map(visit => (
                                                <VisitCard
                                                    key={visit.serialNo}
                                                    visit={visit}
                                                    showActions={true}
                                                />
                                            ))
                                        ) : (
                                            <div className="text-center py-8 text-gray-500">
                                                {/* <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" /> */}
                                                <p>No pending visit requests</p>
                                                {/* <p className="text-sm mt-1">Visitors who request to meet with you will appear here</p> */}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Approved Tab - Shows approved/rejected visits */}
                            {activeTab === "Approved" && (
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        {/* <CheckCircle className="h-5 w-5 text-green-600" />
                                        <div>
                                            <h2 className="text-lg font-semibold text-gray-800">
                                                Approved Visit History
                                            </h2>
                                            <p className="text-sm text-gray-600">
                                                History of all visits you have approved or rejected
                                            </p>
                                        </div> */}
                                    </div>
                                    <div>
                                        {approvedVisits.length > 0 ? (
                                            approvedVisits.map(visit => (
                                                <VisitCard
                                                    key={visit.serialNo}
                                                    visit={visit}
                                                    showActions={false}
                                                />
                                            ))
                                        ) : (
                                            <div className="text-center py-8 text-gray-500">
                                                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                                <p>No approved visits yet</p>
                                                {/* <p className="text-sm mt-1">Approved and rejected visits will appear here</p> */}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Toast Notification */}
                {toast.show && (
                    <div className="fixed top-4 right-4 left-4 mx-auto max-w-md z-50">
                        <div className={`px-4 py-3 rounded-lg shadow-lg ${toast.type === "success" ? "bg-green-500" : "bg-red-500"} text-white`}>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">{toast.message}</span>
                                <button onClick={() => setToast({ show: false, message: "", type: "" })} className="text-white">
                                    <XCircle className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-lg transition-colors group"
                    title="Logout"
                >
                    <LogOut className="h-5 w-5" />
                </button>
            </div>
        </AdminLayout>
    )
}

export default VisitorManagement