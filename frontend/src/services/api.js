import axios from 'axios';

export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
export const SERVER_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

const BASE = API_BASE_URL;
const API = axios.create({ baseURL: BASE });

API.interceptors.request.use(config => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (user?.token) config.headers.Authorization = `Bearer ${user.token}`;
  return config;
});

API.interceptors.response.use(
  res => res,
  err => {
    // A 401 from a login attempt means wrong credentials, not an expired session:
    // let the login page show the error instead of reloading.
    const isLoginRequest = /\/(auth|employee-auth)\/login$/.test(err.config?.url || '');
    if (err.response?.status === 401 && !isLoginRequest) {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.removeItem('user');
      window.location.href = user?.role === 'Employee' ? '/employee-login' : '/';
    }
    return Promise.reject(err);
  }
);

// Auth
export const registerUser = d => API.post('/auth/register', d);
export const loginUser = d => API.post('/auth/login', d);
export const getMe = () => API.get('/auth/me');
export const getUsers = () => API.get('/auth/users');
export const changePassword = d => API.put('/auth/change-password', d);
export const updateProfile = d => API.put('/auth/profile', d);
export const forgotPassword = d => API.post('/auth/forgot-password', d);
export const resetPassword = (token, d) => API.post(`/auth/reset-password/${token}`, d);

// HR users (company admin)
export const getStaff = () => API.get('/auth/staff');
export const createStaff = d => API.post('/auth/staff', d);
export const updateStaff = (id, d) => API.put(`/auth/staff/${id}`, d);
export const resetStaffPassword = (id, d) => API.put(`/auth/staff/${id}/password`, d);
export const deleteStaff = id => API.delete(`/auth/staff/${id}`);

// Employee Auth / Portal
export const loginEmployee = d => API.post('/employee-auth/login', d);
export const getEmployeeProfile = () => API.get('/employee-portal/profile');
export const updateEmployeeProfile = d => API.put('/employee-portal/profile', d);
export const getEmployeeAttendance = params => API.get('/employee-portal/attendance', { params });
export const getEmployeePayslips = () => API.get('/employee-portal/payslips');
export const downloadEmployeePayslip = month =>
  API.get(`/employee-portal/payslips/${month}/download`, { responseType: 'blob' });
export const applyEmployeeLeave = d => API.post('/employee-portal/leave', d);
export const getEmployeeLeaves = () => API.get('/employee-portal/leave');
export const getEmployeeNotifications = () => API.get('/employee-portal/notifications');
export const createEmployeeRequest = d => API.post('/employee-portal/requests', d);
export const getMyEmployeeRequests = () => API.get('/employee-portal/requests');
export const createEmployeeReimbursement = d => API.post('/employee-portal/reimbursements', d, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const getMyReimbursements = () => API.get('/employee-portal/reimbursements');

// Company
export const createCompany = d => API.post('/company', d);
export const getCompanies = () => API.get('/company');
export const updateCompany = (id, d) => API.put(`/company/${id}`, d);
export const deleteCompany = id => API.delete(`/company/${id}`);
export const getCompanyAdmins = companyId => API.get(`/company/${companyId}/admins`);
export const createCompanyAdmin = (companyId, d) => API.post(`/company/${companyId}/admins`, d);
export const updateCompanyAdmin = (companyId, userId, d) => API.put(`/company/${companyId}/admins/${userId}`, d);
export const resetCompanyAdminPassword = (companyId, userId, d) => API.put(`/company/${companyId}/admins/${userId}/password`, d);

// Employee
export const createEmployee = d => API.post('/employee', d);
export const bulkCreateEmployees = d => API.post('/employee/bulk', d);
export const getEmployees = (params) => API.get('/employees', { params });
export const getEmployee = id => API.get(`/employee/${id}`);
export const updateEmployee = (id, d) => API.put(`/employee/${id}`, d);
export const deleteEmployee = id => API.delete(`/employee/${id}`);
export const resetEmployeePassword = (id, d) => API.put(`/employee/${id}/password`, d);

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

// Leave Requests
export const getLeaveRequests = params => API.get('/leaves', { params });
export const updateLeaveStatus = (id, status) => API.put(`/leaves/${id}/status`, { status });

// Employee Requests / Reimbursements
export const getEmployeeRequests = params => API.get('/requests', { params });
export const updateEmployeeRequestStatus = (id, data) => API.put(`/requests/${id}/status`, data);
export const getReimbursements = params => API.get('/reimbursements', { params });
export const updateReimbursementStatus = (id, data) => API.put(`/reimbursements/${id}/status`, data);
export const downloadReimbursementBill = id => API.get(`/reimbursements/${id}/bill`, { responseType: 'blob' });

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
