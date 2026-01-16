"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/slice/loginSlice";
import { Eye, EyeOff } from "lucide-react";
import AdminLayout from "../components/AdminLayout";


const LoginPage = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { isLoggedIn, userData, error } = useSelector((state) => state.login);

    const [isLoginLoading, setIsLoginLoading] = useState(false);
    const [formData, setFormData] = useState({
        username: "",
        password: "",
    });

    const [toast, setToast] = useState({ show: false, message: "", type: "" });
    const [typedText, setTypedText] = useState("");
    // const [isTyping, setIsTyping] = useState(true);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsLoginLoading(true);
        dispatch(loginUser(formData));
    };

    useEffect(() => {
        if (isLoggedIn && userData) {
            setIsLoginLoading(false);

            // console.log("User Data:", userData);

            // Save data once
            localStorage.setItem("user-name", userData.user_name || userData.username || "");
            localStorage.setItem("role", userData.role || "");
            localStorage.setItem("email_id", userData.email_id || userData.email || "");
            localStorage.setItem("isLoggedIn", "true");

            if (userData.role === "admin") {
                navigate("/dashboard/license", { replace: true });
            } else {
                navigate("/dashboard/license", { replace: true });
            }
        }

        if (error) {
            setIsLoginLoading(false);
            showToast(error, "error");
        }
    }, [isLoggedIn, userData, error, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const showToast = (message, type) => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast({ show: false, message: "", type: "" });
        }, 5000);
    };

    return (
        <AdminLayout>
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
                <div className="w-full max-w-md shadow-2xl border border-indigo-100 rounded-2xl bg-white overflow-hidden">
                    {/* Typing Effect Header */}
                    <div className="px-8 pt-6 pb-2 text-center">
                        <div className="flex justify-center items-center">
                            <h1 className="text-2xl font-bold   text-red-500">
                                Approve Gatepass
                            </h1>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="px-8 pt-4 pb-8 space-y-6">
                        {/* Username Field with Animation */}
                        <div className="relative group">
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2 ml-1">
                                <i className="fas fa-user mr-2 text-red-500"></i> Enter your username
                            </label>
                            <div className="relative">
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    placeholder=""
                                    required
                                    value={formData.username}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 pl-11 bg-gray-50 border border-gray-200 rounded-xl 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         transition-all duration-300 group-hover:border-blue-300 
                         placeholder:text-gray-400 shadow-sm"
                                />
                                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                                    <i className="fas fa-user text-gray-400"></i>
                                </div>
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                    {formData.username && (
                                        <i className="fas fa-check-circle text-green-500 text-sm"></i>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Password Field with Animation */}
                        <div className="relative group">
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2 ml-1">
                                <i className="fas fa-key mr-2 text-red-500"></i> Enter your password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder=""
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 pl-11 bg-gray-50 border border-gray-200 rounded-xl 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         transition-all duration-300 group-hover:border-blue-300 
                         placeholder:text-gray-400 shadow-sm"
                                />
                                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                                    <i className="fas fa-lock text-gray-400"></i>
                                </div>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    {formData.password && (
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((prev) => !prev)}
                                            className="text-gray-500 hover:text-blue-500 focus:outline-none"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    )}
                                </div>

                            </div>
                        </div>

                        {/* Login Button */}
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={isLoginLoading}
                                className="w-full py-3.5 px-4 bg-gradient-to-r from-red-400 to-red-400 
                       text-white font-medium rounded-xl shadow-lg hover:shadow-xl 
                       transform hover:-translate-y-0.5 transition-all duration-300 
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                                {isLoginLoading ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Logging...
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center text-black">
                                        <i className="fas fa-sign-in-alt mr-2"></i>
                                        Login
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Divider */}
                        <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                        </div>
                    </form>


                </div>

                {/* Toast Notification */}
                {toast.show && (
                    <div
                        className={`fixed bottom-6 right-6 px-6 py-4 rounded-xl shadow-2xl transition-all duration-300 transform ${toast.type === "success"
                            ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 border border-green-200"
                            : "bg-gradient-to-r from-red-50 to-pink-50 text-red-800 border border-red-200"
                            }`}
                        style={{
                            animation: "slideInRight 0.3s ease-out",
                        }}
                    >
                        <div className="flex items-center">
                            <div className={`mr-3 ${toast.type === "success" ? "text-green-500" : "text-red-500"}`}>
                                {toast.type === "success" ? (
                                    <i className="fas fa-check-circle text-xl"></i>
                                ) : (
                                    <i className="fas fa-exclamation-circle text-xl"></i>
                                )}
                            </div>
                            <div>
                                <div className="font-medium">
                                    {toast.type === "success" ? "Success" : "Error"}
                                </div>
                                <div className="text-sm">{toast.message}</div>
                            </div>
                            <button
                                onClick={() => setToast({ show: false, message: "", type: "" })}
                                className="ml-4 text-gray-400 hover:text-gray-600"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default LoginPage;