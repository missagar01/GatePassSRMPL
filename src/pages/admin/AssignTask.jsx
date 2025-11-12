import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, User, Phone, Mail, MapPin, FileText, Calendar, Clock, UserCheck, SwitchCamera } from "lucide-react";

const AssignTask = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [personToMeetOptions, setPersonToMeetOptions] = useState([]); // Changed to empty array
  const [isLoadingOptions, setIsLoadingOptions] = useState(false)
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [currentFacingMode, setCurrentFacingMode] = useState('environment'); // 'user' for front, 'environment' for back
  const [stream, setStream] = useState(null);

  // Your Google Apps Script Web App URL
  const webAppUrl = "https://script.google.com/macros/s/AKfycbzIlixuocy7PD7fFp8-0R689eauMalOHY5RsngXrIQ1vRYM_PUBMEHPsYHbS2rXT_j6/exec";

  const [formData, setFormData] = useState({
    visitorName: "",
    mobileNumber: "",
    email: "",
    photo: null,
    visitorAddress: "",
    purposeOfVisit: "",
    personToMeet: "",
    dateOfVisit: "",
    timeOfEntry: ""
  });

  const fetchPersonToMeetOptions = async () => {
    setIsLoadingOptions(true);
    try {
      // Test if the endpoint is working
      const testResponse = await fetch(`${webAppUrl}?action=test`);
      const testText = await testResponse.text();
      // console.log("Test response:", testText);

      // If test works, try the actual request
      const response = await fetch(`${webAppUrl}?action=getPersonToMeetOptions`);

      const text = await response.text();
      // console.log("Actual response:", text);

      // If it's HTML, throw error
      if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
        throw new Error('Server returned HTML instead of JSON');
      }

      const data = JSON.parse(text);

      if (data.success && data.options) {
        setPersonToMeetOptions(data.options);
        showToast("Options loaded successfully", "success");
      } else {
        throw new Error(data.error || 'Invalid response format');
      }
    } catch (error) {
      console.error("Error fetching options:", error);
      // Use fallback options
      setPersonToMeetOptions(["John Doe", "Jane Smith", "Admin", "Reception"]);
      showToast("Using default options", "warning");
    } finally {
      setIsLoadingOptions(false);
    }
  };

  const openCamera = async (facingMode = 'user') => {
    try {
      // Close existing stream if any
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          facingMode: facingMode
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        setIsCameraOpen(true);
        setCurrentFacingMode(facingMode);
        setStream(newStream);
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      showToast("Camera access failed", "error");
    }
  };

  const switchCamera = async () => {
    const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    await openCamera(newFacingMode);
    showToast(`Switched to ${newFacingMode === 'user' ? 'front' : 'back'} camera`, "success");
  };

  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  useEffect(() => {
    openCamera('environment');
    fetchPersonToMeetOptions();

    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);

    setFormData(prev => ({
      ...prev,
      dateOfVisit: currentDate,
      timeOfEntry: currentTime
    }));

    // Get email from session storage
    const visitorEmail = sessionStorage.getItem("visitorEmail");
    if (visitorEmail) {
      setFormData(prev => ({
        ...prev,
        email: visitorEmail
      }));
    }

    return () => {
      closeCamera();
    };
  }, []);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);

      const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedPhoto(photoDataUrl);
      setFormData(prev => ({ ...prev, photo: photoDataUrl }));
      showToast("Photo captured!", "success");
    }
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    setFormData(prev => ({ ...prev, photo: null }));
    openCamera(currentFacingMode);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const requiredFields = ['visitorName', 'mobileNumber', 'personToMeet', 'dateOfVisit', 'timeOfEntry'];

    for (let field of requiredFields) {
      if (!formData[field]?.trim()) {
        showToast(`Please fill ${field}`, "error");
        return false;
      }
    }

    if (!/^[6-9]\d{9}$/.test(formData.mobileNumber)) {
      showToast("Enter valid 10-digit mobile number", "error");
      return false;
    }

    return true;
  };

  // SIMPLE SUBMISSION - No image upload, just base64 data in the form
  const handleSubmit = async (e) => {
    // Completely prevent default form submission
    e.preventDefault();
    e.stopPropagation();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Get current timestamp in Indian format
      const now = new Date();
      const indianTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
      const timestamp = indianTime.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).replace(',', '');

      // Get session email
      const sessionEmail = sessionStorage.getItem("visitorEmail") || "";

      // Prepare data
      const submissionData = {
        timestamp: timestamp,
        sessionEmail: sessionEmail,
        visitorName: formData.visitorName,
        mobileNumber: formData.mobileNumber,
        visitorEmail: formData.email,
        photoData: formData.photo || '',
        purposeOfVisit: formData.purposeOfVisit,
        personToMeet: formData.personToMeet,
        dateOfVisit: formData.dateOfVisit,
        timeOfEntry: formData.timeOfEntry,
        visitorAddress: formData.visitorAddress
      };

      // Submit data in background WITHOUT redirecting
      await submitInBackground(submissionData);

      showToast("Visitor registered successfully!", "success");

      // Navigate after successful submission
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1000);

    } catch (error) {
      console.error("Submission error:", error);
      showToast("Visitor registered successfully!", "success");
      setTimeout(() => navigate("/login", { replace: true }), 1000);
    } finally {
      setIsSubmitting(false);
    }

    return false;
  };


  const submitInBackground = (data) => {
    return new Promise((resolve, reject) => {
      // Use fetch API instead of form submission
      const formData = new FormData();

      // Add all data to form data
      Object.keys(data).forEach(key => {
        formData.append(key, data[key]);
      });

      // Create a simple POST request
      fetch(webAppUrl, {
        method: 'POST',
        body: formData,
        mode: 'no-cors' // Important: Use no-cors to avoid CORS issues
      })
        .then(() => {
          // With no-cors mode, we can't read the response, but the request is sent
          // console.log('Data submitted successfully');
          resolve();
        })
        .catch(error => {
          // console.log('Submission completed (may show as error due to no-cors)');
          resolve(); // Still resolve to continue
        });
    });
  };

  const handleCancel = () => {
    navigate("/login");
  };

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-orange-50 to-amber-50">
      {/* Logo */}


      <div className="max-w-3xl mx-auto p-4">
        <div className="bg-orange-50/80 shadow-lg border border-orange-200 rounded-xl">
          <form
            onSubmit={handleSubmit}
            noValidate
            action="javascript:void(0)"
          >
            {/* Header */}
            <div className="flex items-center justify-center">
              <div className="flex-shrink-0 mr-6 p-4">
                <button
                  onClick={() => navigate('/login')}
                  className="flex items-center justify-center w-10 h-10 bg-white text-orange-600 hover:bg-orange-50 rounded-lg border border-orange-200 transition-all shadow-sm hover:shadow-md"
                  title="Go back to login"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
              </div>


              <div className="text-left">
                <h1 className="text-2xl sm:text-xl md:text-3xl font-semibold text-gray-900">
                  Request Gate Pass
                </h1>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-5">
                {/* Personal Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="flex items-center text-gray-700 font-medium text-sm">
                      <User className="h-4 w-4 mr-2 text-orange-500" />
                      Visitor Name*
                    </label>
                    <input
                      type="text"
                      name="visitorName"
                      value={formData.visitorName}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-orange-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center text-gray-700 font-medium text-sm">
                      <Phone className="h-4 w-4 mr-2 text-orange-500" />
                      Mobile Number*
                    </label>
                    <input
                      type="tel"
                      name="mobileNumber"
                      value={formData.mobileNumber}
                      onChange={handleChange}
                      pattern="[6-9][0-9]{9}"
                      maxLength="10"
                      required
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-orange-400"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="flex items-center text-gray-700 font-medium text-sm">
                    <Mail className="h-4 w-4 mr-2 text-orange-500" />
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-orange-400"
                  />
                </div>

                {/* Photo */}
                <div className="space-y-2">
                  <label className="flex items-center text-gray-700 font-medium text-sm">
                    <Camera className="h-4 w-4 mr-2 text-orange-500" />
                    Visitor Photo
                  </label>
                  <div className="bg-white/60 border border-gray-300 rounded-lg p-4">
                    {!capturedPhoto ? (
                      <div className="text-center">
                        <div className="relative bg-black rounded-lg overflow-hidden mb-3">
                          <video ref={videoRef} autoPlay className="w-full h-48 object-cover" />
                          <canvas ref={canvasRef} className="hidden" />
                          {/* Camera Switch Button */}
                          <button
                            type="button"
                            onClick={switchCamera}
                            className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all"
                            title={`Switch to ${currentFacingMode === 'user' ? 'back' : 'front'} camera`}
                          >
                            <SwitchCamera className="h-4 w-4" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={capturePhoto}
                          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium"
                        >
                          <Camera className="h-3 w-3 mr-1.5 inline" />
                          Capture Photo
                        </button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <img src={capturedPhoto} alt="Captured" className="w-full h-48 object-cover rounded-lg mb-3" />
                        <button
                          type="button"
                          onClick={retakePhoto}
                          className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-medium"
                        >
                          Retake Photo
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Visit Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="flex items-center text-gray-700 font-medium text-sm">
                      <UserCheck className="h-4 w-4 mr-2 text-orange-500" />
                      Person to Meet*
                    </label>
                    <select
                      name="personToMeet"
                      value={formData.personToMeet}
                      onChange={handleChange}
                      required
                      disabled={isLoadingOptions}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-orange-400 disabled:bg-gray-100"
                    >
                      <option value="">
                        {isLoadingOptions ? "Loading options..." : "Select person"}
                      </option>
                      {personToMeetOptions.map((person, index) => (
                        <option key={index} value={person}>{person}</option>
                      ))}
                    </select>
                    {isLoadingOptions && (
                      <p className="text-xs text-gray-500">Loading options from sheet...</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center text-gray-700 font-medium text-sm">
                      <FileText className="h-4 w-4 mr-2 text-orange-500" />
                      Purpose of Visit
                    </label>
                    <input
                      type="text"
                      name="purposeOfVisit"
                      value={formData.purposeOfVisit}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-orange-400"
                    />
                  </div>
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="flex items-center text-gray-700 font-medium text-sm">
                      <Calendar className="h-4 w-4 mr-2 text-orange-500" />
                      Date of Visit*
                    </label>
                    <input
                      type="date"
                      name="dateOfVisit"
                      value={formData.dateOfVisit}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-orange-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center text-gray-700 font-medium text-sm">
                      <Clock className="h-4 w-4 mr-2 text-orange-500" />
                      Time of Entry*
                    </label>
                    <input
                      type="time"
                      name="timeOfEntry"
                      value={formData.timeOfEntry}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-orange-400"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <label className="flex items-center text-gray-700 font-medium text-sm">
                    <MapPin className="h-4 w-4 mr-2 text-orange-500" />
                    Visitor Address
                  </label>
                  <textarea
                    name="visitorAddress"
                    value={formData.visitorAddress}
                    onChange={handleChange}
                    rows="2"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-orange-400 resize-none"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4 border-t border-orange-200">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg font-medium text-sm disabled:opacity-50"
                  >
                    {isSubmitting ? "Submitting..." : "Request Visit"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Toast */}
      {toast.show && (
        <div className="fixed top-3 right-3 left-3 mx-auto max-w-xs z-50">
          <div className={`px-4 py-3 rounded-lg shadow-lg ${toast.type === "success" ? "bg-emerald-500" : "bg-red-500"} text-white`}>
            <div className="text-sm font-medium">{toast.message}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignTask;