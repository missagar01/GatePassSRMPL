"use client";
import { useEffect, useState } from "react";
import { fetchAllVisitorsApi } from "../services/allVisitors.js";
import { User, Eye, Search, Filter, Download, ChevronLeft, ChevronRight } from "lucide-react";
import {
    fetchPersonsApi,
    createPersonApi,
    updatePersonApi,
    deletePersonApi
} from "../services/personApi";



const AdminAllVisits = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showImageModal, setShowImageModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [showPersonModal, setShowPersonModal] = useState(false);
    const [persons, setPersons] = useState([]);
    const [personForm, setPersonForm] = useState({ personToMeet: "", phone: "" });
    const [editingId, setEditingId] = useState(null);

    const itemsPerPage = 10;

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await fetchAllVisitorsApi();
            const rows = res.data?.data || res.data || [];
            setData(Array.isArray(rows) ? rows : []);
        } catch (err) {
            setError("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const loadPersons = async () => {
        const res = await fetchPersonsApi();
        setPersons(res.data || []);
    };

    useEffect(() => {
        if (showPersonModal) {
            loadPersons();
        }
    }, [showPersonModal]);


    const handleImageClick = (imageUrl) => {
        setSelectedImage(imageUrl);
        setShowImageModal(true);
    };

    const closeImageModal = () => {
        setShowImageModal(false);
        setSelectedImage("");
    };

    const filteredData = data.filter(item =>
        Object.values(item).some(value =>
            value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentData = filteredData.slice(startIndex, endIndex);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-4">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 p-4">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            </div>
        );
    }

    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case 'approved':
                return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Approved</span>;
            case 'pending':
                return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">Pending</span>;
            case 'rejected':
                return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">Rejected</span>;
            default:
                return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">{status || 'Unknown'}</span>;
        }
    };

    const getImageUrl = (image) => {
        if (!image) return "/user.png";

        if (image.startsWith("http")) {
            return image;
        }

        return `${import.meta.env.VITE_API_BASE_URL}/uploads/${image}`;
    };



    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">All Visitors (Admin)</h1>
                        <p className="text-gray-600 mt-1">Total {data.length} visitors found</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <input
                                type="text"
                                placeholder="Search visitors..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg"
                            />
                        </div>
                        <button
                            onClick={() => setShowPersonModal(true)}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-700"
                        >
                            + Add / Edit Person
                        </button>
                    </div>

                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <div className="text-sm text-gray-600 mb-1">Total Visitors</div>
                        <div className="text-2xl font-bold text-gray-900">{data.length}</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <div className="text-sm text-gray-600 mb-1">Pending</div>
                        <div className="text-2xl font-bold text-yellow-600">
                            {data.filter(v => v.approval_status?.toLowerCase() === 'pending').length}
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <div className="text-sm text-gray-600 mb-1">Approved</div>
                        <div className="text-2xl font-bold text-green-600">
                            {data.filter(v => v.approval_status?.toLowerCase() === 'approved').length}
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <div className="text-sm text-gray-600 mb-1">Rejected</div>
                        <div className="text-2xl font-bold text-red-600">
                            {data.filter(v => v.approval_status?.toLowerCase() === 'rejected').length}
                        </div>
                    </div>
                </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:block">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Visitor Details
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Visit Info
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Approval & Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Timestamps
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {currentData.map((v) => (
                                    <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div
                                                    className="w-12 h-12 rounded-lg border border-gray-200 overflow-hidden cursor-pointer mr-4"
                                                    onClick={() => handleImageClick(getImageUrl(v.visitor_photo))}
                                                >
                                                    <img
                                                        src={getImageUrl(v.visitor_photo)}
                                                        alt={v.visitor_name}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = "/user.png";
                                                        }}
                                                    />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">{v.visitor_name}</div>
                                                    <div className="text-sm text-gray-600">{v.mobile_number}</div>
                                                    {v.visitor_address && (
                                                        <div className="text-xs text-gray-500 mt-1">{v.visitor_address}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-2">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">Meeting: {v.person_to_meet}</div>
                                                    <div className="text-sm text-gray-600">Purpose: {v.purpose_of_visit || '-'}</div>
                                                </div>
                                                <div className="text-sm">
                                                    <div className="font-medium text-gray-700">Date: {new Date(v.date_of_visit).toLocaleDateString("en-IN")}</div>
                                                    <div className="text-gray-600">
                                                        Entry: {v.time_of_entry ? new Date(`1970-01-01T${v.time_of_entry}`).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }) : '-'}
                                                    </div>
                                                    <div className="text-gray-600">
                                                        Exit: {v.visitor_out_time ? new Date(`1970-01-01T${v.visitor_out_time}`).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }) : '-'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-2">
                                                <div>
                                                    <div className="font-medium text-gray-700 mb-1">Approval Status</div>
                                                    {getStatusBadge(v.approval_status)}
                                                </div>
                                                {v.approved_by && (
                                                    <div className="text-sm">
                                                        <div className="text-gray-600">Approved by: {v.approved_by}</div>
                                                        <div className="text-gray-500 text-xs">
                                                            {v.approved_at ? new Date(v.approved_at).toLocaleString("en-IN") : '-'}
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="text-sm">
                                                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${v.gate_pass_closed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                        {v.gate_pass_closed ? 'Gate Pass Closed' : 'Gate Pass Open'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1 text-sm">
                                                {/* <div className="text-gray-600">
                                                    <div className="font-medium">Created:</div>
                                                    <div>{new Date(v.created_at).toLocaleString("en-IN")}</div>
                                                </div> */}
                                                {v.status && (
                                                    <div className="text-gray-600">
                                                        <div className="font-medium">Status:</div>
                                                        <div>{v.status}</div>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                            <div className="text-sm text-gray-700">
                                Showing {startIndex + 1} to {Math.min(endIndex, filteredData.length)} of {filteredData.length} visitors
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                >
                                    <ChevronLeft className="h-4 w-4 inline" /> Previous
                                </button>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                >
                                    Next <ChevronRight className="h-4 w-4 inline" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-4">
                {currentData.map((v) => (
                    <div key={v.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-start space-x-3">
                                <div
                                    className="w-16 h-16 rounded-lg border border-gray-200 overflow-hidden cursor-pointer flex-shrink-0"
                                    onClick={() => handleImageClick(getImageUrl(v.visitor_photo))}
                                >
                                    <img
                                        src={getImageUrl(v.visitor_photo)}
                                        alt={v.visitor_name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = "/user.png";
                                        }}
                                    />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{v.visitor_name}</h3>
                                    <p className="text-sm text-gray-600">{v.mobile_number}</p>
                                    <div className="mt-1">
                                        {getStatusBadge(v.approval_status)}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => handleImageClick(getImageUrl(v.visitor_photo))}
                                className="p-2 text-gray-500 hover:text-blue-600"
                                title="View photo"
                            >
                                <Eye className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-xs text-gray-500">Meeting Person</p>
                                    <p className="text-sm font-medium">{v.person_to_meet}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Visit Date</p>
                                    <p className="text-sm font-medium">
                                        {new Date(v.date_of_visit).toLocaleDateString("en-IN")}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <p className="text-xs text-gray-500">Purpose</p>
                                <p className="text-sm">{v.purpose_of_visit || '-'}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-xs text-gray-500">Entry Time</p>
                                    <p className="text-sm">
                                        {v.time_of_entry ? new Date(`1970-01-01T${v.time_of_entry}`).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }) : '-'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Exit Time</p>
                                    <p className="text-sm">
                                        {v.visitor_out_time ? new Date(`1970-01-01T${v.visitor_out_time}`).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }) : '-'}
                                    </p>
                                </div>
                            </div>

                            {v.approved_by && (
                                <div>
                                    <p className="text-xs text-gray-500">Approved By</p>
                                    <p className="text-sm">{v.approved_by}</p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {/* Mobile Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 text-sm rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                            <ChevronLeft className="h-4 w-4 inline mr-1" />
                            Prev
                        </button>
                        <span className="text-sm text-gray-700">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 text-sm rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                            Next
                            <ChevronRight className="h-4 w-4 inline ml-1" />
                        </button>
                    </div>
                )}
            </div>

            {/* Image Modal */}
            {showImageModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden">
                        <div className="flex justify-between items-center p-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Visitor Photo</h3>
                            <button
                                onClick={closeImageModal}
                                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-4 flex justify-center">
                            <img
                                src={selectedImage}
                                alt="Visitor"
                                className="max-w-full max-h-[60vh] object-contain rounded-lg"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "/user.png";
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Person Modal */}
            {showPersonModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-3xl p-6 overflow-y-auto max-h-[90vh] shadow-2xl">
                        {/* Header */}
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-xl font-semibold text-gray-800">Manage Persons</h2>
                            <button
                                onClick={() => setShowPersonModal(false)}
                                className="text-gray-500 hover:text-gray-700 text-lg"
                            >
                                ×
                            </button>
                        </div>

                        {/* Form */}
                        <div className="mb-8 p-4 bg-gray-50 rounded-xl shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <input
                                    placeholder="Person Name"
                                    value={personForm.personToMeet}
                                    onChange={(e) =>
                                        setPersonForm({ ...personForm, personToMeet: e.target.value })
                                    }
                                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 shadow-sm"
                                />
                                <input
                                    placeholder="Phone"
                                    value={personForm.phone}
                                    onChange={(e) =>
                                        setPersonForm({ ...personForm, phone: e.target.value })
                                    }
                                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 shadow-sm"
                                />
                                <button
                                    onClick={async () => {
                                        if (editingId) {
                                            await updatePersonApi(editingId, personForm);
                                        } else {
                                            await createPersonApi(personForm);
                                        }
                                        setPersonForm({ personToMeet: "", phone: "" });
                                        setEditingId(null);
                                        loadPersons();
                                    }}
                                    className={`px-4 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition-shadow ${editingId
                                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                                        : "bg-green-600 hover:bg-green-700 text-white"
                                        }`}
                                >
                                    {editingId ? "Update" : "Add"}
                                </button>
                            </div>
                            {editingId && (
                                <p className="text-sm text-blue-600 mt-3">
                                    Editing mode - Click Update to save changes
                                </p>
                            )}
                        </div>

                        {/* Table */}
                        <div className="rounded-xl overflow-hidden shadow-lg">
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="text-left py-4 px-4 font-medium text-gray-700">Name</th>
                                            <th className="text-left py-4 px-4 font-medium text-gray-700">Phone</th>
                                            <th className="text-left py-4 px-4 font-medium text-gray-700">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {persons.map((p, index) => (
                                            <tr key={p.id} className={`hover:bg-gray-50 ${index !== persons.length - 1 ? 'shadow-[0_1px_0_0_rgba(0,0,0,0.05)]' : ''}`}>
                                                <td className="py-4 px-4">{p.person_to_meet}</td>
                                                <td className="py-4 px-4">{p.phone}</td>
                                                <td className="py-4 px-4">
                                                    <div className="flex gap-3">
                                                        <button
                                                            onClick={() => {
                                                                setEditingId(p.id);
                                                                setPersonForm({
                                                                    personToMeet: p.person_to_meet,
                                                                    phone: p.phone
                                                                });
                                                            }}
                                                            className="text-blue-600 hover:text-blue-800 font-medium"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                if (confirm("Delete this person?")) {
                                                                    await deletePersonApi(p.id);
                                                                    loadPersons();
                                                                }
                                                            }}
                                                            className="text-red-600 hover:text-red-800 font-medium"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {persons.length === 0 && (
                                <div className="text-center py-12 text-gray-500">
                                    No persons added yet
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default AdminAllVisits;