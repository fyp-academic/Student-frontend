export interface EmailVerificationProps {
  userName: string;
  verificationUrl: string;
  expiresIn: string;
}

export interface CourseUpdateProps {
  studentName: string;
  courseName: string;
  updateType: 'new_material' | 'assignment' | 'quiz' | 'live_session' | 'grade_released';
  activityName: string;
  description: string;
  dueDate: string | null;
  actionUrl: string;
}

export interface AIRecommendationProps {
  userName: string;
  courseName: string;
  profileType: 'H' | 'A' | 'T' | 'C' | 'mixed';
  riskTier: 'green' | 'amber' | 'red' | 'critical';
  recommendations: Array<{
    title: string;
    description: string;
    impact_level: 'high' | 'medium' | 'low';
  }>;
  actionUrl: string;
}

export type EmailType = 'email-verification' | 'course-update' | 'ai-recommendation';

export interface EmailRenderRequest {
  type: EmailType;
  data: EmailVerificationProps | CourseUpdateProps | AIRecommendationProps;
}
