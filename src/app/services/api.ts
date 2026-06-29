import axios from 'axios';

export const BASE_URL = import.meta.env.VITE_API_URL ?? 'https://api.codagenz.com/api/v1';

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

// Clear stale auth state on 401 so ProtectedRoute can redirect gracefully
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
    return Promise.reject(err);
  }
);

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  login:              (email: string, password: string) => api.post('/auth/login', { email, password }),
  register:           (data: Record<string, unknown>) => api.post('/auth/register', data),
  me:                 ()                                 => api.get('/auth/me'),
  logout:             (loginSessionId?: string)        => api.post('/auth/logout', loginSessionId ? { login_session_id: loginSessionId } : {}),
  forgotPassword:     (email: string)                  => api.post('/auth/forgot-password', { email }),
  resetPassword:      (data: Record<string, unknown>)  => api.post('/auth/reset-password', data),
  resendVerification: (email?: string)                   => api.post('/auth/verify-email/resend', email ? { email } : {}),
  verifyEmailCode: (email: string, code: string) =>
    api.post('/auth/verify-email-code', { email, code }),
  parseRegistration: (registrationNumber: string) =>
    api.post('/auth/parse-registration', { registration_number: registrationNumber }),
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

// ─── Colleges & Degree Programmes ─────────────────────────────────────────────
export const collegesApi = {
  list: () => api.get('/colleges'),
};

export const degreeProgrammesApi = {
  list: (collegeId?: string) => api.get('/degree-programmes', { params: collegeId ? { college_id: collegeId } : {} }),
};

// ─── Activities ───────────────────────────────────────────────────────────────
export const activitiesApi = {
  list:     (sectionId: string) => api.get(`/sections/${sectionId}/activities`),
  get:      (id: string)        => api.get(`/activities/${id}`),
  complete: (id: string, type: 'viewed' | 'submitted' | 'attempted' | 'manual' = 'manual') =>
    api.post(`/activities/${id}/complete`, { completion_type: type }),
};

// ─── SCORM & H5P playback (returns a token-authed launch URL) ────────────────────
export const scormApi = {
  launch: (activityId: string) => api.post(`/student/activities/${activityId}/scorm/launch`),
};
export const h5pApi = {
  launch: (activityId: string) => api.post(`/student/activities/${activityId}/h5p/launch`),
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
  // Starts the server-side clock for a timed text-only assignment (no-op otherwise).
  start:  (activityId: string) => api.post(`/activities/${activityId}/assignment-start`),
};

// ─── Quiz ─────────────────────────────────────────────────────────────────────
export const quizApi = {
  myAttempts: (params?: Record<string, unknown>) => api.get('/my-quiz-attempts', { params }),
  questions:  (activityId: string)               => api.get(`/activities/${activityId}/questions`),
  answers:    (questionId: string)               => api.get(`/questions/${questionId}/answers`),
  start:      (activityId: string)               => api.post(`/activities/${activityId}/quiz-attempt`),
  submit:     (attemptId: string, data: Record<string, unknown>) =>
    api.post(`/quiz-attempts/${attemptId}/submit`, data),
  get:        (attemptId: string)                => api.get(`/quiz-attempts/${attemptId}`),
};

// ─── Proctoring ───────────────────────────────────────────────────────────────
export const proctoringApi = {
  start:             (data: { activity_id: string; course_id?: string; context_type?: 'quiz' | 'assignment' | 'practical'; quiz_attempt_id?: string }) =>
    api.post('/proctoring/start', data),
  violation:         (data: { session_id: string; type: string; metadata?: Record<string, unknown>; snapshot?: string }) =>
    api.post('/proctoring/violation', data),
  webcamCheck:       (data: { session_id: string; image: string }) =>
    api.post('/proctoring/webcam-check', data),
  end:               (data: { session_id: string }) =>
    api.post('/proctoring/end', data),
  analyzeSubmission: (formData: FormData) =>
    api.post('/proctoring/analyze-submission', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

// ─── Lesson ───────────────────────────────────────────────────────────────────
export const lessonApi = {
  listPages: (activityId: string) => api.get(`/activities/${activityId}/lesson-pages`),
  markViewed: (pageId: string) => api.post(`/lesson-pages/${pageId}/viewed`),
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
  // Single-topic discussion activity + reactions
  discussion:      (activityId: string)                              => api.get(`/activities/${activityId}/discussion`),
  react:           (postId: string, value: 1 | -1)                   => api.post(`/posts/${postId}/react`, { value }),
};

// ─── Practical Problem ────────────────────────────────────────────────────────
export const practicalApi = {
  template:     (activityId: string) => api.get(`/activities/${activityId}/practical-template`),
  mySubmission: (activityId: string) => api.get(`/activities/${activityId}/practical-submission`),
  start:        (activityId: string) => api.post(`/activities/${activityId}/practical-start`),
  save:         (activityId: string, data: { files: Record<string, string>; status?: 'draft' | 'submitted' }) =>
    api.post(`/activities/${activityId}/practical-submission`, data),
};

// ─── Grades ───────────────────────────────────────────────────────────────────
export const gradesApi = {
  myGrades: (courseId: string) => api.get(`/courses/${courseId}/my-grades`),
  gradebook: () => api.get('/my-gradebook'),
};

// ─── Groups ───────────────────────────────────────────────────────────────────
export const groupsApi = {
  myGroups: (courseId: string) => api.get(`/courses/${courseId}/my-groups`),
};

// ─── Group works ────────────────────────────────────────────────────────────────
export const groupWorksApi = {
  list: () => api.get('/my-group-works'),
};

// ─── Notifications ────────────────────────────────────────────────────────────
export const notificationsApi = {
  list:        () => api.get('/notifications', { params: { channel: 'in_app' } }),
  markRead:    (id: string) => api.patch(`/notifications/${id}/read`, { channel: 'in_app' }),
  markAllRead: () => api.post('/notifications/mark-all-read', { channel: 'in_app' }),
  remove:      (id: string) => api.delete(`/notifications/${id}`, { params: { channel: 'in_app' } }),
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
  // Structured chat features
  typing:        (convId: string, isTyping: boolean) =>
    api.post(`/conversations/${convId}/typing`, { is_typing: isTyping }),
  deleteMessage: (messageId: string, deletionType: 'me' | 'everyone') =>
    api.delete(`/messages/${messageId}`, { params: { deletion_type: deletionType } }),
  pinMessage:    (messageId: string, isPinned: boolean) =>
    api.post(`/messages/${messageId}/pin`, { is_pinned: isPinned }),
  markDelivered: (messageId: string) =>
    api.post(`/messages/${messageId}/delivered`),
  markMessageRead: (messageId: string) =>
    api.post(`/messages/${messageId}/read`),
  pinnedMessages: (convId: string) =>
    api.get(`/conversations/${convId}/pinned-messages`),
};

// ─── Structured Chat Access ───────────────────────────────────────────────────
export const chatAccessApi = {
  eligibleRecipients: (type?: string, courseId?: string, programmeId?: string) =>
    api.get('/chat/eligible-recipients', { params: { type, course_id: courseId, programme_id: programmeId } }),
  myChats:       () => api.get('/chat/my-chats'),
  availableCourses: () => api.get('/chat/available-courses'),
  availableProgrammes: () => api.get('/chat/available-programmes'),
};

// ─── Course Chat ───────────────────────────────────────────────────────────────
export const courseChatApi = {
  getOrCreate:   (courseId: string) => api.get(`/courses/${courseId}/chat`),
  participants:  (courseId: string) => api.get(`/courses/${courseId}/chat/participants`),
  syncParticipants: (courseId: string) => api.post(`/courses/${courseId}/chat/sync-participants`),
  postAnnouncement: (courseId: string, content: string) =>
    api.post(`/courses/${courseId}/chat/announcement`, { content }),
};

// ─── Programme Chat ───────────────────────────────────────────────────────────
export const programmeChatApi = {
  getOrCreate:   (programmeId: string) => api.get(`/degree-programmes/${programmeId}/chat`),
  participants:  (programmeId: string) => api.get(`/degree-programmes/${programmeId}/chat/participants`),
  syncParticipants: (programmeId: string) => api.post(`/degree-programmes/${programmeId}/chat/sync-participants`),
  postAnnouncement: (programmeId: string, content: string) =>
    api.post(`/degree-programmes/${programmeId}/chat/announcement`, { content }),
};

// ─── Profile / Learner ────────────────────────────────────────────────────────
export const profileApi = {
  get:               ()                                => api.get('/profile'),
  update:            (data: Record<string, unknown>)  => api.put('/profile', data),
  uploadImage:       (formData: FormData)             => api.post('/profile/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  removeImage:       ()                               => api.delete('/profile/image'),
  preferences:       ()                                => api.get('/profile/preferences'),
  updatePreferences:  (data: Record<string, unknown>)  => api.put('/profile/preferences', data),
  updateLearningStyle:(data: Record<string, unknown>)  => api.put('/profile/learning-style', data),
  myInstructors:     ()                                => api.get('/profile/my-instructors'),
  learnerProfile:    (learnerId: string, courseId: string) =>
    api.get(`/pipeline/learners/${learnerId}/courses/${courseId}/profile`),
  riskScore:         (learnerId: string, courseId: string) =>
    api.get(`/pipeline/learners/${learnerId}/courses/${courseId}/risk`),
  submitPulse:       (learnerId: string, courseId: string, data: Record<string, unknown>) =>
    api.post(`/pipeline/learners/${learnerId}/courses/${courseId}/pulse`, data),
};

// ─── Video Sessions (Jitsi) ───────────────────────────────────────────────────
export const sessionsApi = {
  // Session CRUD
  list:       (params?: Record<string, unknown>) => api.get('/sessions', { params }),
  get:        (id: string) => api.get(`/sessions/${id}`),

  // Token generation
  getToken:   (id: string) => api.post(`/sessions/${id}/token`),

  // AI features
  getTranscript: (id: string) => api.get(`/sessions/${id}/transcript`),
  getSummary:    (id: string) => api.get(`/sessions/${id}/summary`),
  askAI:         (id: string, question: string) => api.post(`/sessions/${id}/ask-ai`, { question }),

  // Recording download
  getRecordingUrl: (id: string) => api.get(`/recordings/${id}/url`),

  // Transcription
  transcribe: (formData: FormData) => api.post('/transcribe', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),

  // Participant lifecycle
  participantLeft: (id: string) => api.post(`/sessions/${id}/participant-left`),
  updateMetrics:   (id: string, data: Record<string, unknown>) => api.post(`/sessions/${id}/update-metrics`, data),

  grantTranscriptionConsent: (id: string) => api.post(`/sessions/${id}/transcription-consent`),

  // Polls
  getPolls:      (id: string) => api.get(`/sessions/${id}/polls`),
  votePoll:      (pollId: string, optionIndex: number) => api.post(`/polls/${pollId}/vote`, { option_index: optionIndex }),

  // Certificate
  checkCertificateEligibility: (id: string) => api.get(`/sessions/${id}/certificate/eligibility`),
  generateCertificate: (id: string) => api.post(`/sessions/${id}/certificate`),

  // Quiz
  generateQuiz:  (id: string) => api.post(`/sessions/${id}/generate-quiz`),
};

// ─── Engagement ──────────────────────────────────────────────────────────────
export const engagementApi = {
  dashboard:       ()                                          => api.get('/engagement/my-dashboard'),
  loginHistory:    (page = 1)                                  => api.get('/engagement/my-login-history', { params: { page, per_page: 20 } }),
  activityLog:     (params?: Record<string, unknown>)         => api.get('/engagement/my-activity-log', { params }),
  recommendations: ()                                          => api.get('/engagement/my-recommendations'),
  logEvent:        (data: Record<string, unknown>)            => api.post('/engagement/events', data),
  sessionOpen:     (deviceType?: string)                      => api.post('/engagement/session/open', deviceType ? { device_type: deviceType } : {}),
  sessionClose:    (sessionId: string)                        => api.post('/engagement/session/close', { session_id: sessionId }),
  materialInteract:(materialId: string, data: Record<string, unknown>) => api.post(`/engagement/materials/${materialId}/interact`, data),
  markNotifClicked:(id: number)                               => api.patch(`/notifications/${id}/click`, { channel: 'in_app' }),
};

// ─── Adaptive Content ────────────────────────────────────────────────────────
export const adaptiveContentApi = {
  myProfile: () => api.get('/student/my-profile'),
  chunks: (contentId: string, source = 'lesson_page') =>
    api.get(`/student/content-chunks/${contentId}`, { params: { source } }),
  activityChunks: (activityId: string) => api.get(`/student/activities/${activityId}/adaptive-chunks`),
  prepareActivity: (activityId: string) => api.post(`/student/activities/${activityId}/prepare-adaptation`),
  get: (chunkId: string, modalityOverride?: string) =>
    api.get(`/student/content/${chunkId}`, { params: modalityOverride ? { modality_override: modalityOverride } : {} }),
  feedback: (adaptationId: string, data: { rating?: string; complexity?: string }) =>
    api.post(`/student/adaptation/${adaptationId}/feedback`, data),
  recalculateProfile: (studentId: string, data?: { manual_modality?: string }) =>
    api.post(`/student/${studentId}/recalculate-profile`, data ?? {}),
  videoLearningSupport: (activityId: string) =>
    api.get(`/student/activities/${activityId}/video-learning-support`),
};

export const personalizationApi = {
  forCourse: (courseId: string) => api.get(`/student/courses/${courseId}/personalization`),
};

// ─── Calendar / Scheduler ─────────────────────────────────────────────────────
export const calendarApi = {
  feed:      (params: { start: string; end: string; course_ids?: string[] }) =>
    api.get('/calendar/events', { params }),
  calendars: () => api.get('/calendar/calendars'),
  create:    (data: Record<string, unknown>) => api.post('/calendar/events', data),
  update:    (id: string, data: Record<string, unknown>) => api.put(`/calendar/events/${id}`, data),
  remove:    (id: string) => api.delete(`/calendar/events/${id}`),
};

// ─── Notifications ───────────────────────────────────────────────────────────
export const notificationApi = {
  getPreferences:    () => api.get('/notifications/preferences'),
  updatePreferences: (data: { preferences: Array<{
    type: string;
    channel: 'in_app' | 'email' | 'push' | 'sms';
    enabled: boolean;
    digest_mode?: 'instant' | 'daily' | 'weekly';
    quiet_start?: string | null;
    quiet_end?: string | null;
  }> }) => api.patch('/notifications/preferences', data),
  resetPreferences:  () => api.post('/notifications/preferences/reset', {}),
  setGlobalMute:     (muted: boolean) => api.post('/notifications/mute', { muted }),
};
