import { createContext, useContext, useState, useCallback } from 'react';

type WidgetMode =
  | 'study'        // lesson / course page — full tutoring
  | 'restricted'   // during active quiz — no answer help
  | 'remediation'  // after quiz submission — targeted review
  | 'revision'     // exam-prep / practice — spaced repetition focus
  | 'reflection'   // post-lesson — metacognitive prompts
  | 'general';     // dashboard, catalog, forum, fallback

interface AiContextData {
  currentPage:    string;
  topicId?:       string;
  topicName?:     string;
  courseName?:    string;
  courseId?:      string;
  quizAttemptId?: string;
  sectionName?:   string;      // current section/week name
  activityType?:  string;      // lesson | quiz | assign | forum | scorm | h5p
  materialType?:  string;      // pdf | pptx | video | h5p | scorm
  mode?:          WidgetMode;
}

interface AiWidgetCtx {
  context: AiContextData;
  setContext: (ctx: Partial<AiContextData>) => void;
  clearContext: () => void;
}

const AiWidgetContext = createContext<AiWidgetCtx | null>(null);

export function AiWidgetProvider({ children }: { children: React.ReactNode }) {
  const [context, setCtx] = useState<AiContextData>({ currentPage: '' });

  const setContext = useCallback((partial: Partial<AiContextData>) => {
    setCtx(prev => ({ ...prev, ...partial }));
  }, []);

  const clearContext = useCallback(() => {
    setCtx({ currentPage: '' });
  }, []);

  return (
    <AiWidgetContext.Provider value={{ context, setContext, clearContext }}>
      {children}
    </AiWidgetContext.Provider>
  );
}

export function useAiWidgetContext() {
  const ctx = useContext(AiWidgetContext);
  if (!ctx) throw new Error('useAiWidgetContext must be used inside AiWidgetProvider');
  return ctx;
}
