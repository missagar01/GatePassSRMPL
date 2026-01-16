import api from "../services/axiosInstance";

export const fetchAllVisitorsApi = async () => {
    try {
        const response = await api.get("/visits/admin");
        return response.data;
    } catch (error) {
        console.error("Error fetching persons", error);
        return [];
    }
};
