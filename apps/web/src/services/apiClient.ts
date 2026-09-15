import axios from 'axios';

/**
 * Cliente HTTP único para toda la app. El interceptor de request agrega el
 * token de sesión (Fase 2) y el de response normaliza errores de la API
 * para que los componentes solo manejen `ApiErrorBody['error']`.
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error?.message ?? 'Error de conexión con el servidor';
    return Promise.reject(new Error(message));
  },
);
