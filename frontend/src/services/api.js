import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Auth
export const login = (data) => axios.post(`${API_URL}/auth/login`, data);
export const registerStudent = (data) => axios.post(`${API_URL}/auth/register/student`, data);
export const registerGuide = (data) => axios.post(`${API_URL}/auth/register/guide`, data);
export const registerAdmin = (data) => axios.post(`${API_URL}/auth/register/admin`, data);
export const getMe = () => axios.get(`${API_URL}/auth/me`);
export const resetPassword = (data) => axios.post(`${API_URL}/auth/reset-password`, data);

// COE
export const getAllCOEs = () => axios.get(`${API_URL}/coe`);
export const getCOE = (id) => axios.get(`${API_URL}/coe/${id}`);
export const getCOEDetails = (id) => axios.get(`${API_URL}/coe/${id}/details`);
export const createCOE = (data) => axios.post(`${API_URL}/coe`, data);
export const updateCOE = (id, data) => axios.put(`${API_URL}/coe/${id}`, data);
export const deleteCOE = (id) => axios.delete(`${API_URL}/coe/${id}`);

// Guides
export const getAllGuides = () => axios.get(`${API_URL}/guides`);
export const searchGuides = (query) => axios.get(`${API_URL}/guides/search`, { params: { q: query } });
export const getGuide = (id) => axios.get(`${API_URL}/guides/${id}`);
export const createGuide = (data) => axios.post(`${API_URL}/guides`, data);
export const getMyBatches = () => axios.get(`${API_URL}/guides/my-batches`);

// Problems
export const getAllProblems = () => axios.get(`${API_URL}/problems`);
export const searchProblems = (query) => axios.get(`${API_URL}/problems/search`, { params: { q: query } });
export const getMyProblems = () => axios.get(`${API_URL}/problems/my-problems`);
export const getProblemsByCOE = (coeId) => axios.get(`${API_URL}/problems/coe/${coeId}`);
export const getProblem = (id) => axios.get(`${API_URL}/problems/${id}`);
export const createProblem = (data) => axios.post(`${API_URL}/problems`, data);
export const updateProblem = (id, data) => axios.put(`${API_URL}/problems/${id}`, data);
export const deleteProblem = (id) => axios.delete(`${API_URL}/problems/${id}`);

// Batches
export const getAllBatches = () => axios.get(`${API_URL}/batches`);
export const searchBatches = (query) => axios.get(`${API_URL}/batches/search`, { params: { query } });
export const searchBatchesByGuide = (guideName, type = 'all') => axios.get(`${API_URL}/admin/search-batches-by-guide`, { params: { guideName, type } });
export const searchAllBatches = (query) => axios.get(`${API_URL}/batches/search-all`, { params: { q: query } });
export const getMyBatch = () => axios.get(`${API_URL}/batches/my-batch`);
export const getBatch = (id) => axios.get(`${API_URL}/batches/${id}`);
export const createBatch = (data) => axios.post(`${API_URL}/batches`, data);
export const selectProblem = (problemId) => axios.post(`${API_URL}/batches/select-problem`, { problemId });
export const updateBatchStatus = (id, status) => axios.put(`${API_URL}/batches/${id}/status`, { status });
export const getOptedTeams = () => axios.get(`${API_URL}/batches/opted-teams`);
export const allotProblem = (batchId, problemId) => axios.post(`${API_URL}/batches/${batchId}/allot`, { problemId });
export const rejectProblem = (batchId, problemId) => axios.post(`${API_URL}/batches/${batchId}/reject`, { problemId });

// Team Members
export const getTeamMembers = (batchId) => axios.get(`${API_URL}/team-members/${batchId}`);
export const addTeamMember = (data) => axios.post(`${API_URL}/team-members`, data);
export const updateTeamMember = (id, data) => axios.put(`${API_URL}/team-members/${id}`, data);
export const deleteTeamMember = (id) => axios.delete(`${API_URL}/team-members/${id}`);

// Progress
export const getProgressUpdates = (batchId) => axios.get(`${API_URL}/progress/${batchId}`);
export const createProgressUpdate = (data) => axios.post(`${API_URL}/progress`, data);
export const addComment = (progressId, comment) => axios.post(`${API_URL}/progress/${progressId}/comment`, { comment });
export const getGuideProgressUpdates = () => axios.get(`${API_URL}/progress/guide/all`);

// Admin
export const getAdminDashboard = () => axios.get(`${API_URL}/admin/dashboard`);
export const getAdminOverview = () => axios.get(`${API_URL}/admin/overview`);
export const getBatchGuideMapping = () => axios.get(`${API_URL}/admin/batch-guide-mapping`);
export const createAdmin = (data) => axios.post(`${API_URL}/admin/create`, data);
export const importBatches = (data) => axios.post(`${API_URL}/admin/import-batches`, data);
export const importBatchData = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return axios.post(`${API_URL}/admin/import-batch-data`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};
export const importStudentBatchesFromExcel = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return axios.post(`${API_URL}/batches/import`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};
export const fixCOEandRCClassification = () => axios.post(`${API_URL}/admin/fix-coe-rc-classification`);


// Timeline
export const getAllTimelineEvents = (year) => axios.get(`${API_URL}/timeline`, { params: { year } });
export const getTimelineForBatch = (batchId) => axios.get(`${API_URL}/timeline/batch/${batchId}`);
export const createTimelineEvent = (data) => axios.post(`${API_URL}/timeline`, data, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const updateTimelineEvent = (id, data) => axios.put(`${API_URL}/timeline/${id}`, data, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const deleteTimelineEvent = (id) => axios.delete(`${API_URL}/timeline/${id}`);

// Submissions
export const createSubmission = (data) => axios.post(`${API_URL}/submissions`, data);
export const getSubmission = (id) => axios.get(`${API_URL}/submissions/${id}`);
export const getBatchSubmissions = (batchId) => axios.get(`${API_URL}/submissions/batch/${batchId}`);
export const getGuideSubmissions = () => axios.get(`${API_URL}/submissions/guide`);
export const getAllSubmissions = (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.eventId) queryParams.append('eventId', params.eventId);
  if (params.batchId) queryParams.append('batchId', params.batchId);
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);
  
  const queryString = queryParams.toString();
  return axios.get(`${API_URL}/submissions${queryString ? '?' + queryString : ''}`);
};
export const addSubmissionComment = (id, comment) => axios.post(`${API_URL}/submissions/${id}/comment`, { comment });
export const assignSubmissionMarks = (id, marks, status, comment) => axios.post(`${API_URL}/submissions/${id}/marks`, { marks, status, comment });
export const addAdminRemark = (id, remark) => axios.post(`${API_URL}/submissions/${id}/admin-remark`, { remark });

// Chat
export const getGuideChats = () => axios.get(`${API_URL}/chat/guide/chats`);
export const summarizeProject = (projectId) => axios.post(`${API_URL}/chat/summarize/${projectId}`);
export const getProjectSummaries = (projectId) => axios.get(`${API_URL}/chat/summaries/${projectId}`);
export const summarizeBatch = (batchId) => axios.post(`${API_URL}/chat/summarize-batch/${batchId}`);
export const getBatchSummaries = (batchId) => axios.get(`${API_URL}/chat/summaries-batch/${batchId}`);
export const getAllProjects = () => axios.get(`${API_URL}/projects`);
export const searchProjects = (query, type = 'all') => axios.get(`${API_URL}/projects/search`, { params: { q: query, type } });
export const importProjectExcelFiles = (files) => {
  const formData = new FormData();
  files.forEach((file, index) => {
    formData.append('files', file);
  });
  return axios.post(`${API_URL}/projects/import`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};
export const deleteAllProjects = () => axios.delete(`${API_URL}/projects/all`);

// New ProjectEntry search endpoints
export const searchProjectEntries = (query) => axios.get(`${API_URL}/projects/search-projects`, { params: { q: query } });
export const getAllProjectEntries = (page = 1, limit = 10) => axios.get(`${API_URL}/projects/all-entries`, { params: { page, limit } });
export const getProjectEntry = (id) => axios.get(`${API_URL}/projects/entry/${id}`);
export const getProjectEntryByBatchId = (batchId) => axios.get(`${API_URL}/projects/entry/batch/${batchId}`);

// Filter endpoints
export const filterProjectsByDomain = (domain) => axios.get(`${API_URL}/projects/filter/domain`, { params: { domain } });
export const filterProjectsByCOE = (coe) => axios.get(`${API_URL}/projects/filter/coe`, { params: { coe } });
export const filterProjectsByRC = (rc) => axios.get(`${API_URL}/projects/filter/rc`, { params: { rc } });
export const filterProjectsByGuide = (guide) => axios.get(`${API_URL}/projects/filter/guide`, { params: { guide } });

// Metadata endpoints
export const getProjectDomains = () => axios.get(`${API_URL}/projects/meta/domains`);
export const getProjectCOEs = () => axios.get(`${API_URL}/projects/meta/coes`);
export const getProjectRCs = () => axios.get(`${API_URL}/projects/meta/rcs`);

// RC endpoints
export const getAllRCs = () => axios.get(`${API_URL}/rc`);
export const getRC = (id) => axios.get(`${API_URL}/rc/${id}`);
export const searchRCs = (query) => axios.get(`${API_URL}/rc/search`, { params: { q: query } });
export const createRC = (data) => axios.post(`${API_URL}/rc`, data);
export const updateRC = (id, data) => axios.put(`${API_URL}/rc/${id}`, data);
export const deleteRC = (id) => axios.delete(`${API_URL}/rc/${id}`);
