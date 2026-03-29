import axios from 'axios';

const BASE = 'http://localhost:5000/api';
const API = axios.create({ baseURL: BASE });

API.interceptors.request.use(config => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (user?.token) config.headers.Authorization = `Bearer ${user.token}`;
  return config;
});

API.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) { localStorage.removeItem('user'); window.location.href = '/'; }
    return Promise.reject(err);
  }
);

// Auth
export const registerUser = d => API.post('/auth/register', d);
export const loginUser = d => API.post('/auth/login', d);
export const getMe = () => API.get('/auth/me');
export const getUsers = () => API.get('/auth/users');

// Company
export const createCompany = d => API.post('/company', d);
export const getCompanies = () => API.get('/company');
export const updateCompany = (id, d) => API.put(`/company/${id}`, d);
export const deleteCompany = id => API.delete(`/company/${id}`);

// Employee
export const createEmployee = d => API.post('/employee', d);
export const getEmployees = (params) => API.get('/employees', { params });
export const getEmployee = id => API.get(`/employee/${id}`);
export const updateEmployee = (id, d) => API.put(`/employee/${id}`, d);
export const deleteEmployee = id => API.delete(`/employee/${id}`);

// Salary
export const createSalaryStructure = d => API.post('/salary-structure', d);
export const getSalaryStructure = empId => API.get(`/salary-structure/${empId}`);

// Payroll
export const runPayroll = d => API.post('/run-payroll', d);
export const getPayroll = params => API.get('/payroll', { params });
export const updatePayrollStatus = (id, status) => API.put(`/payroll/${id}/status`, { status });

// Attendance
export const markAttendance = d => API.post('/attendance', d);
export const markBulkAttendance = d => API.post('/attendance/bulk', d);
export const getAttendance = params => API.get('/attendance', { params });
export const getAttendanceSummary = params => API.get('/attendance/summary', { params });

// Compliance
export const saveCompliance = d => API.post('/compliance', d);
export const getCompliance = params => API.get('/compliance', { params });
export const autoValidateCompliance = (cId, m) => API.get(`/compliance/validate/${cId}/${m}`);

// Analytics
export const getAnalyticsOverview = () => API.get('/analytics/overview');
export const getPayrollTrends = () => API.get('/analytics/payroll-trends');
export const getDepartmentSalary = () => API.get('/analytics/department-salary');
export const getCompanyComparison = () => API.get('/analytics/company-comparison');
export const getComplianceStatus = () => API.get('/analytics/compliance-status');
export const getAttendanceAnalytics = m => API.get('/analytics/attendance-summary', { params: { month: m } });

// Payslip PDF
export const downloadPayslip = (empId, month) =>
  API.get(`/payslip/${empId}/${month}`, { responseType: 'blob' });

// Reports / Excel
export const exportPayrollExcel = params =>
  API.get('/reports/payroll-excel', { params, responseType: 'blob' });
export const exportAttendanceExcel = params =>
  API.get('/reports/attendance-excel', { params, responseType: 'blob' });

// Helper to trigger file download
export const triggerDownload = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  window.URL.revokeObjectURL(url);
};
