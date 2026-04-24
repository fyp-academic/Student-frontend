import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  login:              (email: string, password: string) => api.post('/auth/login', { email, password }),
  register:           (data: Record<string, unknown>) => api.post('/auth/register', data),
  me:                 ()                                 => api.get('/auth/me'),
  logout:             ()                               => api.post('/auth/logout'),
  forgotPassword:     (email: string)                  => api.post('/auth/forgot-password', { email }),
  resetPassword:      (data: Record<string, unknown>)  => api.post('/auth/reset-password', data),
  resendVerification: (email?: string)                   => api.post('/auth/verify-email/resend', email ? { email } : {}),
  verifyEmailConfirm: (data: { id: string; hash: string; signature: string; expires: string }) =>
    api.post('/auth/verify-email/confirm', data),
};

// ─── Dashboard ───────────────────────────────────────────────────────────────
export const dashboardApi = {
  studentHub: () => api.get('/dashboard/student'),
};

// ─── Courses ─────────────────────────────────────────────────────────────────
export const coursesApi = {
  catalog:      (params?: Record<string, unknown>) => api.get('/courses/catalog', { params }),
  myCourses:    () => api.get('/courses/catalog', { params: { enrolled: true } }),
  get:          (id: string) => api.get(`/courses/${id}/public`),
  selfEnroll:   (id: string) => api.post(`/courses/${id}/join`),
  leave:        (id: string) => api.delete(`/courses/${id}/leave`),
  progress:     (id: string) => api.get(`/courses/${id}/my-grades`),
  sections:     (id: string) => api.get(`/courses/${id}/sections`),
};

// ─── Categories ───────────────────────────────────────────────────────────────
export const categoriesApi = {
  list: () => api.get('/categories'),
};

// ─── Activities ───────────────────────────────────────────────────────────────
export const activitiesApi = {
  list:     (sectionId: string) => api.get(`/sections/${sectionId}/activities`),
  get:      (id: string)        => api.get(`/activities/${id}`),
  complete: (id: string)        => api.post(`/activities/${id}/complete`),
};

// ─── Assignments ──────────────────────────────────────────────────────────────
export const assignmentsApi = {
  mySubmissions: (params?: Record<string, unknown>) => api.get('/my-submissions', { params }),
  list:   (activityId: string) => api.get(`/activities/${activityId}/submissions`),
  submit: (activityId: string, formData: FormData) =>
    api.post(`/activities/${activityId}/submissions`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  get:    (id: string) => api.get(`/submissions/${id}`),
};

// ─── Quiz ─────────────────────────────────────────────────────────────────────
export const quizApi = {
  myAttempts: (params?: Record<string, unknown>) => api.get('/my-quiz-attempts', { params }),
  questions:  (activityId: string)               => api.get(`/activities/${activityId}/questions`),
  answers:    (questionId: string)               => api.get(`/questions/${questionId}/answers`),
  start:      (activityId: string)               => api.post(`/activities/${activityId}/quiz-attempt`),
  submit:     (attemptId: string, data: Record<string, unknown>) =>
    api.post(`/quiz-attempts/${attemptId}/submit`, data),
};

// ─── Lesson ───────────────────────────────────────────────────────────────────
export const lessonApi = {
  listPages: (activityId: string) => api.get(`/activities/${activityId}/lesson-pages`),
};

// ─── Forum ────────────────────────────────────────────────────────────────────
export const forumApi = {
  discussions:     (activityId: string)                              => api.get(`/activities/${activityId}/discussions`),
  posts:           (discussionId: string)                            => api.get(`/discussions/${discussionId}/posts`),
  reply:           (discussionId: string, data: Record<string, unknown>) =>
    api.post(`/discussions/${discussionId}/posts`, data),
  startDiscussion: (activityId: string, data: Record<string, unknown>) =>
    api.post(`/activities/${activityId}/discussions`, data),
  togglePin:       (discussionId: string)                            => api.patch(`/discussions/${discussionId}/pin`),
  toggleLock:      (discussionId: string)                            => api.patch(`/discussions/${discussionId}/lock`),
};

// ─── Grades ───────────────────────────────────────────────────────────────────
export const gradesApi = {
  myGrades: (courseId: string) => api.get(`/courses/${courseId}/my-grades`),
};

// ─── Notifications ────────────────────────────────────────────────────────────
export const notificationsApi = {
  list:        () => api.get('/notifications'),
  markRead:    (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/mark-all-read'),
  remove:      (id: string) => api.delete(`/notifications/${id}`),
};

// ─── Messaging ────────────────────────────────────────────────────────────────
export const messagingApi = {
  conversations: ()                    => api.get('/conversations'),
  createConv:    (data: Record<string, unknown>) => api.post('/conversations', data),
  messages:      (convId: string)      => api.get(`/conversations/${convId}/messages`),
  sendMessage:   (convId: string, formData: FormData) =>
    api.post(`/conversations/${convId}/messages`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  markRead:      (convId: string)      => api.patch(`/conversations/${convId}/messages/read`),
  react:         (messageId: string, emoji: string) =>
    api.post(`/messages/${messageId}/react`, { emoji }),
};

// ─── Profile / Learner ────────────────────────────────────────────────────────
export const profileApi = {
  get:               ()                                => api.get('/profile'),
  update:            (data: Record<string, unknown>)  => api.put('/profile', data),
  preferences:       ()                                => api.get('/profile/preferences'),
  updatePreferences: (data: Record<string, unknown>)  => api.put('/profile/preferences', data),
  learnerProfile:    (learnerId: string, courseId: string) =>
    api.get(`/pipeline/learners/${learnerId}/courses/${courseId}/profile`),
  riskScore:         (learnerId: string, courseId: string) =>
    api.get(`/pipeline/learners/${learnerId}/courses/${courseId}/risk`),
  submitPulse:       (learnerId: string, courseId: string, data: Record<string, unknown>) =>
    api.post(`/pipeline/learners/${learnerId}/courses/${courseId}/pulse`, data),
};
