import api from "./axiosInstance";

export const createVisitRequestApi = async (data) => {
    const formData = new FormData();

    formData.append("visitorName", data.visitorName);
    formData.append("mobileNumber", data.mobileNumber);
    formData.append("visitorAddress", data.visitorAddress || "");
    formData.append("purposeOfVisit", data.purposeOfVisit || "");
    formData.append("personToMeet", data.personToMeet);
    formData.append("dateOfVisit", data.dateOfVisit);
    formData.append("timeOfEntry", data.timeOfEntry);

    // image file (multer expects this)
    if (data.photoFile) {
        formData.append("photoData", data.photoFile);
    }

    return api.post("/visits", formData);
};

export const fetchVisitorByMobileApi = (mobile) => {
    return api.get(`/visits/by-mobile/${mobile}`);
};
