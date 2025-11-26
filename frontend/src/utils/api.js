import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/login', credentials),
  register: (userData) => api.post('/register', userData),
};

export const productsAPI = {
  getAll: (params = {}) => api.get('/products', { params }),
  create: (productData) => api.post('/products', productData),
};

export const jobsAPI = {
  getAll: (params = {}) => api.get('/jobs', { params }),
  create: (jobData) => api.post('/jobs', jobData),
  getPending: () => api.get('/admin/jobs'),
  approve: (jobId) => api.put(`/admin/jobs/${jobId}/approve`),
};

export const checkServerHealth = async () => {
  try {
    const response = await axios.get('http://localhost:3001/api/health', { timeout: 5000 });
    return response.data;
  } catch (error) {
    throw new Error('Сервер не доступен. Убедитесь, что бэкенд запущен на порту 3001.');
  }
};

export default api;
