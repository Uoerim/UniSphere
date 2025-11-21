import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth/';

export const loginRequest = async (username, password) => {
    const res = await axios.post(API_URL + 'login', { username, password });
    return res.data;
};

export const validateToken = async (token) => {
    const res = await axios.get(API_URL + "validate", {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return res.data;
};
