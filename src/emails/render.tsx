import { renderToStaticMarkup } from 'react-dom/server';
import * as React from 'react';
import { EmailVerificationTemplate } from './templates/EmailVerification';
import { CourseUpdateTemplate } from './templates/CourseUpdate';
import { AIRecommendationTemplate } from './templates/AIRecommendation';
import type {
  EmailType,
  EmailVerificationProps,
  CourseUpdateProps,
  AIRecommendationProps,
} from './types';

const templates: Record<EmailType, React.FC<any>> = {
  'email-verification': EmailVerificationTemplate,
  'course-update': CourseUpdateTemplate,
  'ai-recommendation': AIRecommendationTemplate,
};

export function renderEmail(
  type: EmailType,
  data: EmailVerificationProps | CourseUpdateProps | AIRecommendationProps
): string {
  const Template = templates[type];
  if (!Template) {
    throw new Error(`Unknown email template type: ${type}`);
  }

  const element = React.createElement(Template, data);
  const doctype = '<!DOCTYPE html>';
  const html = renderToStaticMarkup(element);

  return `${doctype}\n${html}`;
}
