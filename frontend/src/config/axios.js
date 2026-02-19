import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
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
    console.log('🚀 Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('✅ Response:', response.config.url, response.status);
    return response.data;
  },
  (error) => {
    if (error.code === 'ERR_NETWORK') {
      console.error('❌ Network Error - Backend tidak merespon');
      alert('Koneksi ke server gagal. Pastikan backend berjalan di http://localhost:5000');
    } else if (error.response) {
      console.error('❌ Server Error:', error.response.status, error.response.data);
      
      // Handle 401 Unauthorized
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      
      // Handle 500 Internal Server Error
      if (error.response.status === 500) {
        console.error('❌ Internal Server Error:', error.response.data);
        alert('Terjadi kesalahan pada server. Silakan cek console untuk detail.');
      }
    } else {
      console.error('❌ Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;