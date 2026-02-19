import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      // Handle specific error statuses
      switch (error.response.status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          toast.error('Sesi anda telah berakhir. Silakan login kembali.');
          break;
        case 403:
          toast.error('Anda tidak memiliki izin untuk mengakses resource ini.');
          break;
        case 404:
          toast.error('Resource tidak ditemukan.');
          break;
        case 422:
          toast.error('Validasi gagal. Periksa kembali input anda.');
          break;
        case 500:
          toast.error('Terjadi kesalahan pada server. Silakan coba lagi.');
          break;
        default:
          toast.error(error.response.data?.error || 'Terjadi kesalahan');
      }
    } else if (error.request) {
      // Network error
      toast.error('Tidak dapat terhubung ke server. Periksa koneksi internet anda.');
    } else {
      toast.error('Terjadi kesalahan yang tidak diketahui');
    }
    
    return Promise.reject(error);
  }
);

export default api;