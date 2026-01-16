import api from "./axiosInstance";

export const fetchGatePassesApi = () =>
    api.get("/gatepass");

export const closeGatePassApi = (id) =>
    api.patch(`/gatepass/${id}`);