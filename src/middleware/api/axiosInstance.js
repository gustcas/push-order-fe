import axios from 'axios';

const axiosInstance = axios.create();

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('authUser');
        localStorage.removeItem('login');
        localStorage.removeItem('userRole');
        window.location.href = '/';
      } else if (error.response.status === 403) {
        window.dispatchEvent(
          new CustomEvent('pos:forbidden', {
            detail: { message: 'No tiene permisos para realizar esta acción' },
          })
        );
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
