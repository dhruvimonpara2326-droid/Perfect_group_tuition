import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/',
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

// Auth
export const login = (data) => API.post('/auth/login', data);
export const register = (data) => API.post('/auth/register', data);
export const getMe = () => API.get('/auth/me');
export const forgotPassword = (data) => API.post('/auth/forgot-password', data);
export const resetPassword = (data) => API.post('/auth/reset-password', data);

// Users
export const getStudents = (params) => API.get('/users/students', { params });
export const getFaculty = () => API.get('/users/faculty');
export const createFaculty = (data) => API.post('/users/faculty', data);
export const updateUser = (id, data) => API.put(`/users/${id}`, data);
export const deleteUser = (id) => API.delete(`/users/${id}`);
export const getDashboardStats = () => API.get('/users/stats');

// Attendance
export const markAttendance = (data) => API.post('/attendance/mark', data);
export const getAttendance = (params) => API.get('/attendance', { params });
export const getAttendanceSummary = (userId) => API.get(`/attendance/summary/${userId}`);

// Marks
export const addMarks = (data) => API.post('/marks', data);
export const updateMarks = (id, data) => API.put(`/marks/${id}`, data);
export const deleteMarks = (id) => API.delete(`/marks/${id}`);
export const getMarks = (params) => API.get('/marks', { params });
export const getStudentResult = (studentId) => API.get(`/marks/result/${studentId}`);

// Fees
export const addFeeRecord = (data) => API.post('/fees', data);
export const updateFeeRecord = (id, data) => API.put(`/fees/${id}`, data);
export const recordPayment = (id, data) => API.put(`/fees/${id}/pay`, data);
export const getFees = (params) => API.get('/fees', { params });
export const notifyDueFees = () => API.post('/fees/notify-due');

// Timetable
export const createTimetableEntry = (data) => API.post('/timetable', data);
export const getTimetable = (params) => API.get('/timetable', { params });
export const updateTimetableEntry = (id, data) => API.put(`/timetable/${id}`, data);
export const deleteTimetableEntry = (id) => API.delete(`/timetable/${id}`);

// Classwork
export const uploadClasswork = (formData) => API.post('/classwork', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const getClasswork = (params) => API.get('/classwork', { params });
export const updateClasswork = (id, formData) => API.put(`/classwork/${id}`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const deleteClasswork = (id) => API.delete(`/classwork/${id}`);

// Notifications
export const getNotifications = (params) => API.get('/notifications', { params });
export const createNotification = (data) => API.post('/notifications', data);
export const markNotificationRead = (id) => API.put(`/notifications/${id}/read`);
export const updateNotification = (id, data) => API.put(`/notifications/${id}`, data);
export const deleteNotification = (id) => API.delete(`/notifications/${id}`);

// Batches
export const getBatches = (params) => API.get('/batches', { params });
export const createBatch = (data) => API.post('/batches', data);
export const updateBatch = (id, data) => API.put(`/batches/${id}`, data);
export const deleteBatch = (id) => API.delete(`/batches/${id}`);

// Payment (Razorpay)
export const getRazorpayKey = () => API.get('/payment/key');
export const createPaymentOrder = (data) => API.post('/payment/create-order', data);
export const verifyPayment = (data) => API.post('/payment/verify', data);

export default API;
