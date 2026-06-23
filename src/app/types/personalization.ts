import type { CSSProperties } from 'react';

export type PresentationMode =
  | 'guided_steps'
  | 'visual_discovery'
  | 'deep_focus'
  | 'narrative_example'
  | 'standard';

export type ModeConfig = {
  numbered_steps?: boolean;
  bold_key_terms?: boolean;
  use_highlights?: boolean;
  prefer_tables?: boolean;
  prefer_headings?: boolean;
  dense_prose?: boolean;
  show_connections?: boolean;
  example_first?: boolean;
  structure: string;
  density: string;
};

export type PresentationConfig = {
  is_active?: boolean;
  text_density: 'comfortable' | 'compact' | 'spacious';
  font_scale: number;
  layout_mode: 'standard' | 'focus' | 'visual' | 'example' | 'exploratory';
  line_height: number;
  content_max_width: string;
  show_step_numbers: boolean;
  visual_emphasis: boolean;
  highlight_weak_topics: boolean;
  color_scheme: 'default' | 'calm' | 'high_contrast';
  card_variant?: string;
  reading_rail?: string;
  typography_class: string;
  mode?: PresentationMode;
  mode_config?: ModeConfig;
};

export type DeliveryStatus =
  | 'adapted'
  | 'original_only'
  | 'presentation_only'
  | 'fallback'
  | 'flagged';

export type ContentDelivery = {
  delivery_status: DeliveryStatus;
  content_adapted: boolean;
  presentation_active: boolean;
  is_personalized: boolean;
  transparency?: {
    message: string;
    instructor_content_immutable: boolean;
    layers?: { content: boolean; presentation: boolean; navigation: boolean };
  };
  integrity?: {
    instructor_content_immutable?: boolean;
    delivery_changed?: boolean;
    similarity_to_original_percent?: number;
  };
};

export type ActivityOverlay = {
  accessible: boolean;
  hidden: boolean;
  annotation: 'recommended' | 'weak_topic' | 'review' | 'locked' | null;
  annotation_label: string | null;
  sort_boost: number;
  is_weak_topic: boolean;
};

export type SectionOverlay = {
  is_weak_topic: boolean;
  sort_boost: number;
  annotation_label: string | null;
};

export type NavigationConfig = {
  mode: 'open' | 'structured' | 'balanced';
  allow_non_linear_jump: boolean;
  enforce_sequence: boolean;
  navigation_pattern: string;
  direct_guidance: {
    enabled: boolean;
    message: string | null;
    suggested_activity_id: string | null;
    reason?: string | null;
    time_estimate_minutes?: number | null;
    prerequisite_warnings?: string[];
  };
  lesson_page_navigation: {
    allow_page_skip: boolean;
    show_progress_dots: boolean;
  };
  activity_overlays: Record<string, ActivityOverlay>;
  section_overlays: Record<string, SectionOverlay>;
};

export type ContentProfile = {
  pace: string;
  quiz_average: number;
  weak_topics: string[];
  preferred_modality: string;
  completion_rate: number;
  knowledge_level: 'novice' | 'intermediate' | 'advanced';
  primary_profile?: string;
  at_risk?: boolean;
};

export type PersonalizationContext = {
  student_id: string;
  course_id: string;
  content: ContentProfile;
  presentation: PresentationConfig;
  navigation: NavigationConfig;
};

export const presentationStyles = (config?: PresentationConfig | null): CSSProperties => {
  if (!config) return {};

  const baseFontSize = 16 * (config.font_scale ?? 1);

  const bg = config.color_scheme === 'calm'
    ? '#f8fafc'
    : config.color_scheme === 'high_contrast'
      ? '#ffffff'
      : undefined;

  const borderAccent = config.layout_mode === 'visual'
    ? { borderLeftWidth: 4, borderLeftColor: '#3b82f6' }
    : config.layout_mode === 'example'
      ? { borderLeftWidth: 4, borderLeftColor: '#0d9488' }
      : {};

  return {
    fontSize: `${baseFontSize}px`,
    lineHeight: config.line_height ?? 1.65,
    maxWidth: config.content_max_width ?? '72rem',
    backgroundColor: bg,
    marginLeft: config.reading_rail === 'centered' ? 'auto' : undefined,
    marginRight: config.reading_rail === 'centered' ? 'auto' : undefined,
    ...borderAccent,
  };
};

export const cardVariantClass = (variant?: string): string => {
  switch (variant) {
    case 'elevated-visual': return 'personalization-card-elevated-visual';
    case 'narrow-focus': return 'personalization-card-narrow-focus';
    case 'example-first': return 'personalization-example';
    default: return '';
  }
};

export const annotationStyles: Record<string, { bg: string; color: string }> = {
  recommended: { bg: '#eff6ff', color: '#1d4ed8' },
  weak_topic: { bg: '#fff7ed', color: '#c2410c' },
  review: { bg: '#f0fdf4', color: '#15803d' },
  locked: { bg: '#f1f5f9', color: '#64748b' },
};
