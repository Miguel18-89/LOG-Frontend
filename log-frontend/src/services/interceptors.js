import api from './api';


export const setupInterceptors = (navigate) => {
    api.interceptors.request.use(
        (config) => {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error) => Promise.reject(error)
    );



    api.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.response?.status === 401) {
                console.warn('Sessão expirada. Redirecionar para login...');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/');
            }

            if (error.response?.status === 500) {
                console.error('Erro interno do servidor');
            }

            return Promise.reject(error);
        }
    );
};