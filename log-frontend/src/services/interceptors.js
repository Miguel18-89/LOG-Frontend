
import api from './api';

let isHandlingAuthFailure = false;

export const setupInterceptors = (navigate) => {
  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    },
    (error) => Promise.reject(error)
  );

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const res = error.response;
      if (!res) return Promise.reject(error);

      if (res.status === 401 && !isHandlingAuthFailure) {
        isHandlingAuthFailure = true;

        try {
          const reason = res.data?.reason;
          const message = res.data?.message || 'Sessão inválida. Por favor faça login novamente.';

          localStorage.removeItem('token');
          localStorage.removeItem('user');

          try {
            await api.post('/auth/logout', {}, { withCredentials: true });
          } catch (e) {
          }

          if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
            navigate(`/`, { replace: true });
          } else {
            navigate('/', { replace: true });
          }

          // opcional: mostrar toast com message aqui (depende do teu UI)
          // toast.error(message);

        } finally {
          setTimeout(() => {
            isHandlingAuthFailure = false;
          }, 1000);
        }
      }

      if (res.status === 500) {
        console.error('Erro interno do servidor', res.data);
      }

      return Promise.reject(error);
    }
  );
};



















/*import api from './api';


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
*/