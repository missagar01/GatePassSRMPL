import api from "./axiosInstance.js";


export const fetchPersonsApi = async () => {
    try {
        const response = await api.get("/persons");
        return response.data;
    } catch (error) {
        console.error("Error fetching persons", error);
        return [];
    }
};


export const createPersonApi = async (payload) => {
    try {
        const response = await api.post("/persons", payload);
        return response.data;
    } catch (error) {
        console.error("Error creating person", error);
        throw error;
    }
};


export const updatePersonApi = async (id, payload) => {
    try {
        const response = await api.put(`/persons/${id}`, payload);
        return response.data;
    } catch (error) {
        console.error("Error updating person", error);
        throw error;
    }
};


export const deletePersonApi = async (id) => {
    try {
        const response = await api.delete(`/persons/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting person", error);
        throw error;
    }
};
