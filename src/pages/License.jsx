import React, { useState, useEffect } from 'react'
import { FileText, ScrollText, Users, User, KeyRound, Clock, CheckCircle, LogOut, Bell, Calendar, UserCheck, XCircle, Eye, EyeOff, Phone, MapPin } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from "../components/layout/AdminLayout"

const VisitorManagement = () => {
    const [userRole, setUserRole] = useState("")
    const [username, setUsername] = useState("")
    const [activeTab, setActiveTab] = useState("Requests")
    const [isLoading, setIsLoading] = useState(false)
    const [toast, setToast] = useState({ show: false, message: "", type: "" })
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [showLoginForm, setShowLoginForm] = useState(true)
    const [adminCredentials, setAdminCredentials] = useState({ username: "", password: "" })
    const [adminLoading, setAdminLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const navigate = useNavigate()

    const [pendingVisits, setPendingVisits] = useState([])
    const [approvedVisits, setApprovedVisits] = useState([])
    const [loadingStates, setLoadingStates] = useState({});

    // Your Google Apps Script Web App URL
    const webAppUrl = "https://script.google.com/macros/s/AKfycbzIlixuocy7PD7fFp8-0R689eauMalOHY5RsngXrIQ1vRYM_PUBMEHPsYHbS2rXT_j6/exec"

    // Check if user is already logged in
    useEffect(() => {
        const storedUsername = sessionStorage.getItem('username')
        const storedRole = sessionStorage.getItem('role')

        if (storedUsername && storedRole) {
            setUsername(storedUsername)
            setUserRole(storedRole)
            setIsLoggedIn(true)
            setShowLoginForm(false)

            // Load data based on initial active tab
            if (activeTab === "Requests") {
                fetchPendingVisits()
            } else if (activeTab === "Approved") {
                fetchApprovedVisits()
            }
        }
    }, [])

    // Fetch data when tab changes (only if logged in)
    useEffect(() => {
        if (isLoggedIn) {
            if (activeTab === "Requests") {
                fetchPendingVisits()
            } else if (activeTab === "Approved") {
                fetchApprovedVisits()
            }
        }
    }, [activeTab, isLoggedIn])

    // Fetch all visitor data and filter by username
    const fetchAllVisitors = async () => {
        if (!isLoggedIn) return

        setIsLoading(true)
        try {
            const response = await fetch(`${webAppUrl}?action=getAllVisitors&timestamp=${Date.now()}`)

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const data = await response.json()

            if (data.success && data.visitors) {
                // Filter visitors where 'Person to Meet' matches logged-in username
                const currentUsername = sessionStorage.getItem('username') || username
                const userVisitors = data.visitors.filter(visitor =>
                    visitor['Person to Meet'] === currentUsername
                )

                // Process the filtered data
                const processedVisits = userVisitors.map(visitor => ({
                    serialNo: visitor['Serial No.'] || 'N/A',
                    visitorName: visitor['Visitor Name'] || 'N/A',
                    mobileNumber: visitor['Mobile Number'] || 'N/A',
                    photo: visitor['Photo'] || '',
                    purposeOfVisit: visitor['Purpose of Visit'] || 'N/A',
                    personToMeet: visitor['Person to Meet'] || 'N/A',
                    dateOfVisit: visitor['Date of Visit'] || 'N/A',
                    status: visitor['Status'] || 'pending' // Assuming you have a status column
                }))

                // Sort all visits in descending order by Serial Number
                const sortedVisits = processedVisits.sort((a, b) => {
                    // Extract numeric part from serial numbers like 'SRMPL-9', 'SRMPL-8', etc.
                    const getSerialNumber = (serial) => {
                        if (!serial || serial === 'N/A') return 0;
                        const match = serial.toString().match(/-(\d+)$/);
                        return match ? parseInt(match[1]) : 0;
                    };

                    const numA = getSerialNumber(a.serialNo);
                    const numB = getSerialNumber(b.serialNo);
                    return numB - numA; // Descending order
                });

                // Separate pending and approved visits based on status
                const pending = sortedVisits.filter(visit => visit.status === 'pending')
                const approved = sortedVisits.filter(visit => visit.status === 'approved' || visit.status === 'rejected')

                setPendingVisits(pending)
                setApprovedVisits(approved)

                // showToast(`Loaded ${pending.length} pending and ${approved.length} approved visits`, "success")
            } else {
                throw new Error(data.error || 'Failed to fetch visitor data')
            }
        } catch (error) {
            console.error("Error fetching visitor data:", error)
            showToast("Failed to load visitor data", "error")
            setPendingVisits([])
            setApprovedVisits([])
        } finally {
            setIsLoading(false)
        }
    }

    // Updated fetch functions to use the new data structure
    const fetchPendingVisits = async () => {
        await fetchAllVisitors() // This will automatically filter and set pending visits
    }

    const fetchApprovedVisits = async () => {
        await fetchAllVisitors() // This will automatically filter and set approved visits
    }

    const handleAdminLogin = async (e) => {
        e.preventDefault()

        if (!adminCredentials.username || !adminCredentials.password) {
            showToast("Please enter both username and password", "error")
            return
        }

        setAdminLoading(true)

        try {
            const formData = new FormData();
            formData.append('action', 'verifyAdmin');
            formData.append('username', adminCredentials.username);
            formData.append('password', adminCredentials.password);

            // FIX: Changed scriptUrl to webAppUrl
            const scriptResponse = await fetch(webAppUrl, {
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

                setUsername(adminCredentials.username)
                setUserRole("admin")
                setIsLoggedIn(true)
                setShowLoginForm(false)

                showToast("Login successful! Loading dashboard...", "success")

                // Load initial data
                if (activeTab === "Requests") {
                    fetchPendingVisits()
                } else if (activeTab === "Approved") {
                    fetchApprovedVisits()
                }
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

    const updateVisitStatus = async (serialNo, status) => {
        try {
            // Set loading state for this specific serialNo
            setLoadingStates(prev => ({
                ...prev,
                [serialNo]: status
            }));

            const currentUsername = sessionStorage.getItem('username') || username
            const formData = new FormData()
            formData.append('action', 'updateVisitStatus')
            formData.append('serialNo', serialNo.toString())
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
            console.log("Update result:", result)

            if (result.success) {
                showToast(`Visit ${status} successfully!`, "success")
                await fetchAllVisitors()
            } else {
                throw new Error(result.error || 'Update failed')
            }
        } catch (error) {
            console.error("Error updating visit status:", error)
            showToast(`Failed to ${status} visit`, "error")
        } finally {
            // Clear loading state
            setLoadingStates(prev => {
                const newState = { ...prev };
                delete newState[serialNo];
                return newState;
            });
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
        setIsLoggedIn(false)
        setShowLoginForm(true)
        setAdminCredentials({ username: "", password: "" })
        setPendingVisits([])
        setApprovedVisits([])
        showToast("Logged out successfully", "success")

        navigate('/dashboard/quick-task')
    }

    const showToast = (message, type) => {
        setToast({ show: true, message, type })
        setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000)
    }

    // Enhanced image URL converter function
    const getDisplayableImageUrl = (url) => {
        if (!url || url === '') return '';

        try {
            // Pattern 1: Direct file ID from /file/d/ format
            const directMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
            if (directMatch && directMatch[1]) {
                return `https://drive.google.com/thumbnail?id=${directMatch[1]}&sz=w400`;
            }

            // Pattern 2: UC parameter format  
            const ucMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
            if (ucMatch && ucMatch[1]) {
                return `https://drive.google.com/thumbnail?id=${ucMatch[1]}&sz=w400`;
            }

            // Pattern 3: Open parameter format
            const openMatch = url.match(/open\?id=([a-zA-Z0-9_-]+)/);
            if (openMatch && openMatch[1]) {
                return `https://drive.google.com/thumbnail?id=${openMatch[1]}&sz=w400`;
            }

            // Pattern 4: Already thumbnail format
            if (url.includes("thumbnail?id=")) {
                return url;
            }

            // Pattern 5: Extract any long ID (25+ chars)
            const anyIdMatch = url.match(/([a-zA-Z0-9_-]{25,})/);
            if (anyIdMatch && anyIdMatch[1]) {
                return `https://drive.google.com/thumbnail?id=${anyIdMatch[1]}&sz=w400`;
            }

            // Fallback: Return original URL with cache buster
            const cacheBuster = Date.now();
            return url.includes("?") ? `${url}&cb=${cacheBuster}` : `${url}?cb=${cacheBuster}`;
        } catch (e) {
            console.error("Error processing image URL:", url, e);
            return url;
        }
    };

    // Login Form Component
    const LoginForm = () => (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-orange-200 to-red-500 p-6 text-center text-white">
                        <h2 className="text-2xl text-black font-bold">Admin Login</h2>
                        <p className="text-gray-900 mt-1">Visitor Management System</p>
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
                                    disabled={adminLoading}
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
                                        disabled={adminLoading}
                                    />
                                    <button
                                        type="button"
                                        onClick={togglePasswordVisibility}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Login Button */}
                        <button
                            type="submit"
                            disabled={adminLoading}
                            className="w-full mt-6 py-3 px-4 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                    </form>
                </div>
            </div>
        </div>
    )

    const VisitCard = ({ visit, showActions = false }) => {
        const photoUrl = getDisplayableImageUrl(visit.photo);
        const [showImageModal, setShowImageModal] = useState(false);

        const handleViewImage = () => {
            setShowImageModal(true);
        };

        const handleCloseModal = () => {
            setShowImageModal(false);
        };

        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 transition-all hover:shadow-md mb-4">
                {/* Header Row - Clean Design */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-lg text-sm font-semibold border border-blue-200">
                            #{visit.serialNo}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${visit.status === 'pending'
                            ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                            : visit.status === 'approved'
                                ? "bg-green-100 text-green-800 border border-green-200"
                                : "bg-gray-100 text-gray-800 border border-gray-200"
                            }`}>
                            {visit.status?.charAt(0).toUpperCase() + visit.status?.slice(1)}
                        </span>
                    </div>

                    {/* View Image Icon Button */}
                    {photoUrl && (
                        <button
                            onClick={handleViewImage}
                            className="flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors border border-gray-300"
                            title="View Visitor Photo"
                        >
                            <Eye className="h-3 w-3" />
                            <span>View Photo</span>
                        </button>
                    )}
                </div>

                {/* Main Content - App-like Layout */}
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                    {/* Left Side - Visitor Details */}
                    <div className="flex-1 space-y-3">
                        <div className="space-y-2">
                            <h3 className="font-bold text-gray-900 text-lg">{visit.visitorName}</h3>
                            <div className="flex items-center text-sm text-gray-700">
                                <Phone className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" />
                                <span className="font-medium">{visit.mobileNumber}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="flex items-start text-sm text-gray-600">
                                <UserCheck className="h-4 w-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                                <div>
                                    <span className="font-medium text-gray-800">Meeting: </span>
                                    <span>{visit.personToMeet}</span>
                                </div>
                            </div>

                            <div className="flex items-start text-sm text-gray-600">
                                <Calendar className="h-4 w-4 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                                <div>
                                    <span className="font-medium text-gray-800">Date: </span>
                                    <span>
                                        {(() => {
                                            try {
                                                if (visit.dateOfVisit && visit.dateOfVisit.includes('T')) {
                                                    const date = new Date(visit.dateOfVisit);
                                                    return date.toLocaleDateString('en-IN', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric'
                                                    });
                                                }
                                                return visit.dateOfVisit || 'Date not specified';
                                            } catch (error) {
                                                console.error('Error formatting date:', error);
                                                return visit.dateOfVisit || 'Date not specified';
                                            }
                                        })()}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-start text-sm text-gray-600 sm:col-span-2">
                                <MapPin className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                <div>
                                    <span className="font-medium text-gray-800">Purpose: </span>
                                    <span>{visit.purposeOfVisit}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Visitor Photo */}
                    <div className="flex justify-center md:justify-end">
                        <div className="w-28 h-28 bg-gray-50 rounded-2xl border-2 border-gray-200 overflow-hidden flex items-center justify-center shadow-sm">
                            {photoUrl ? (
                                <img
                                    src={photoUrl}
                                    alt={`${visit.visitorName}`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        console.log("Image failed to load:", e.target.src);
                                        if (e.target.src !== visit.photo) {
                                            console.log("Trying original URL:", visit.photo);
                                            e.target.src = visit.photo;
                                        } else {
                                            e.target.style.display = "none";
                                            e.target.nextSibling.style.display = "flex";
                                        }
                                    }}
                                    onLoad={(e) => {
                                        console.log("Image loaded successfully:", e.target.src);
                                    }}
                                />
                            ) : null}
                            <div
                                className={`w-full h-full flex items-center justify-center ${photoUrl ? "hidden" : "flex"
                                    }`}
                            >
                                <User size={40} className="text-gray-400" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons - Left & Right Layout */}
                {showActions && visit.status === 'pending' && (
                    <div className="flex gap-3 pt-3 border-t border-gray-100">
                        {/* Left Button - Reject */}
                        <button
                            onClick={() => handleRejectVisit(visit.serialNo)}
                            disabled={loadingStates[visit.serialNo]}
                            className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all shadow-sm flex items-center justify-center gap-2 ${loadingStates[visit.serialNo] === 'rejected'
                                ? "bg-red-100 text-red-700 border-2 border-red-200 cursor-not-allowed"
                                : "bg-white text-red-600 border-2 border-red-200 hover:bg-red-50 hover:border-red-300"
                                }`}
                        >
                            {loadingStates[visit.serialNo] === 'rejected' ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent"></div>
                                    Rejecting
                                </>
                            ) : (
                                <>
                                    <XCircle className="h-4 w-4" />
                                    Reject
                                </>
                            )}
                        </button>

                        {/* Right Button - Approve */}
                        <button
                            onClick={() => handleApproveVisit(visit.serialNo)}
                            disabled={loadingStates[visit.serialNo]}
                            className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all shadow-sm flex items-center justify-center gap-2 ${loadingStates[visit.serialNo] === 'approved'
                                ? "bg-green-100 text-green-700 border-2 border-green-200 cursor-not-allowed"
                                : "bg-white text-green-600 border-2 border-green-200 hover:bg-green-50 hover:border-green-300"
                                }`}
                        >
                            {loadingStates[visit.serialNo] === 'approved' ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-600 border-t-transparent"></div>
                                    Approving
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="h-4 w-4" />
                                    Approve
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* Image Modal */}
                {showImageModal && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                            <div className="flex justify-between items-center p-6 border-b border-gray-200">
                                <h3 className="text-xl font-bold text-gray-800">{visit.visitorName}'s Photo</h3>
                                <button
                                    onClick={handleCloseModal}
                                    className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
                                >
                                    <XCircle className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="p-6 flex justify-center">
                                {photoUrl ? (
                                    <img
                                        src={photoUrl}
                                        alt={visit.visitorName}
                                        className="max-w-full max-h-[70vh] object-contain rounded-lg"
                                        onError={(e) => {
                                            console.error("Failed to load image:", photoUrl);
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'block';
                                        }}
                                    />
                                ) : null}
                                <div className={`text-center py-12 ${photoUrl ? 'hidden' : 'block'}`}>
                                    <User className="h-20 w-20 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500 text-lg">No image available</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )
    };

    // Show login form if not logged in
    if (!isLoggedIn || showLoginForm) {
        return <LoginForm />
    }

    // Show main dashboard if logged in
    return (
        <AdminLayout>
            <div className="min-h-screen bg-gray-50 p-4 sm:p-6 overflow-y-auto relative">
                <div className="max-w-6xl mx-auto">
                    {/* Header with Welcome Message */}
                    <div className="mb-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-sm">
                                    <UserCheck className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                                        Welcome, {username}
                                    </h1>
                                    <p className="text-gray-600 text-sm">Visitor Management Dashboard</p>
                                </div>
                            </div>
                            {isLoading && (
                                <div className="flex items-center gap-2 text-blue-600 text-sm">
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                                    <span>Loading visitors...</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tab Navigation - Clean Design */}
                    <div className="mb-8">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-2">
                            <div className="flex">
                                <button
                                    onClick={() => setActiveTab("Requests")}
                                    className={`flex-1 py-3 px-6 text-base font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === "Requests"
                                        ? "bg-blue-500 text-white shadow-sm"
                                        : "bg-white text-gray-600 hover:bg-gray-50"
                                        }`}
                                >
                                    <Clock className="w-5 h-5" />
                                    <span>Requests</span>
                                    <span className="bg-white/20 text-white/90 px-2 py-1 rounded-full text-xs font-bold">
                                        {pendingVisits.length}
                                    </span>
                                </button>
                                <button
                                    onClick={() => setActiveTab("Approved")}
                                    className={`flex-1 py-3 px-6 text-base font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === "Approved"
                                        ? "bg-green-500 text-white shadow-sm"
                                        : "bg-white text-gray-600 hover:bg-gray-50"
                                        }`}
                                >
                                    <CheckCircle className="w-5 h-5" />
                                    <span>History</span>
                                    <span className="bg-white/20 text-white/90 px-2 py-1 rounded-full text-xs font-bold">
                                        {approvedVisits.length}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Content Sections */}
                    <div className="space-y-4">
                        {/* Requests Tab */}
                        {activeTab === "Requests" && (
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
                                    <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-200">
                                        <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold text-gray-600 mb-2">No Pending Requests</h3>
                                        <p className="text-gray-500">All visitor requests have been processed.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* History Tab */}
                        {activeTab === "Approved" && (
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
                                    <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-200">
                                        <CheckCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold text-gray-600 mb-2">No Visit History</h3>
                                        <p className="text-gray-500">Approved and rejected visits will appear here.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Toast Notification */}
                {toast.show && (
                    <div className="fixed top-6 right-6 left-6 sm:left-auto mx-auto sm:mx-0 max-w-sm z-50">
                        <div className={`px-4 py-3 rounded-xl shadow-lg ${toast.type === "success" ? "bg-green-500" : "bg-red-500"} text-white`}>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">{toast.message}</span>
                                <button
                                    onClick={() => setToast({ show: false, message: "", type: "" })}
                                    className="text-white ml-3 p-1 rounded hover:bg-white/20"
                                >
                                    <XCircle className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    )
}

export default VisitorManagement