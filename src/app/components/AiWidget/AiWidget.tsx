import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useParams, type Params } from 'react-router';
import { api } from '../../services/api';
import { useAiWidgetContext } from '../../context/AiWidgetContext';

// ── Types ──────────────────────────────────────────────────────────────────

type WidgetMode =
  | 'study'        // lesson / course page — full tutoring
  | 'restricted'   // during active quiz — no answer help
  | 'remediation'  // after quiz submission — targeted review
  | 'revision'     // exam-prep / practice — spaced repetition focus
  | 'reflection'   // post-lesson — metacognitive prompts
  | 'general';     // dashboard, catalog, forum, fallback

type IntentType =
  | 'tutor'        // explain concepts, Socratic guidance
  | 'summarize'    // summarize lesson / PDF / video content
  | 'resource'     // find YouTube, external links
  | 'quiz'         // generate practice questions
  | 'flashcard'    // generate spaced-repetition cards
  | 'debug'        // help with code errors (CS courses)
  | 'motivate'     // emotional support + concrete next steps
  | 'general';     // catch-all

interface Resource {
  title:         string;
  url:           string;
  thumbnail_url: string | null;
  description:   string;
  channel?:      string;
}

interface MaterialSource {
  title: string;
  type:  string;
}

interface Message {
  id:        string;
  role:      'user' | 'ai';
  content:   string;
  source?:   MaterialSource;
  resources?: Resource[];
  error?:    boolean;
}

interface Chip {
  type:    string;
  label:   string;
  context?: Record<string, unknown>;
}

interface WidgetContext {
  greeting:  string;
  chips:     Chip[];
  mode:      WidgetMode;
}

// Page-level props are optional overrides; widget auto-detects from URL + context
interface AiWidgetProps {
  currentPage?:    string;
  topicId?:       string;
  topicName?:     string;
  courseName?:    string;
  quizAttemptId?: string;
}

// ── Intent Detection ───────────────────────────────────────────────────────

function detectIntent(text: string): IntentType {
  const t = text.toLowerCase();

  // Emotional / motivational signals — check first (highest priority)
  if (/i('?m| am) (stuck|lost|confused|overwhelmed|stressed|struggling|behind)|can'?t do this|give up|too hard|i('?m| am) failing/.test(t))
    return 'motivate';

  // Code / debug help (CS-specific)
  if (/error|bug|fix|debug|compile|runtime|traceback|exception|syntax error|my code|code (doesn'?t|not) work|segfault/.test(t))
    return 'debug';

  // Flashcard generation
  if (/flashcard|flash card|key terms|vocabulary|memorize|revise cards|spaced repetition|anki/.test(t))
    return 'flashcard';

  // Summarization
  if (/summarize|summary|overview|what('?s| is) in|content of|lecture \d|main points|key takeaways|tldr|tl;dr/.test(t))
    return 'summarize';

  // External resource discovery
  if (/youtube|video|watch|tutorial|link|resources|where can i|external|recommend.*material/.test(t))
    return 'resource';

  // Practice quiz generation
  if (/quiz me|test me|practice question|give me a question|mock test|sample question|exam prep/.test(t))
    return 'quiz';

  // Tutoring / concept explanation
  if (/explain|help me|what is|how does|i don'?t understand|teach me|break.*down|walk me through|clarify/.test(t))
    return 'tutor';

  return 'general';
}

// ── Resource Card ──────────────────────────────────────────────────────────

function ResourceCard({ resource, index }: { resource: Resource; index: number }) {
  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-xl border border-gray-200 overflow-hidden
                 hover:border-blue-300 hover:shadow-md transition-all mt-2"
    >
      {/* Thumbnail */}
      <div className="relative w-full" style={{ aspectRatio: '16/9', background: '#f1f5f9' }}>
        {resource.thumbnail_url ? (
          <img
            src={resource.thumbnail_url}
            alt={resource.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl bg-gradient-to-br from-red-50 to-red-100">
            🎬
          </div>
        )}
        {/* Index badge */}
        <span className="absolute top-2 left-2 bg-black/60 text-white text-xs font-bold px-1.5 py-0.5 rounded">
          #{index + 1}
        </span>
      </div>
      {/* Info */}
      <div className="p-2.5">
        <p className="text-xs font-semibold text-gray-800 leading-tight line-clamp-2">
          {resource.title}
        </p>
        {resource.channel && (
          <p className="text-[10px] text-gray-500 mt-1 truncate">{resource.channel}</p>
        )}
      </div>
    </a>
  );
}

// ── Lightweight Markdown Renderer ──────────────────────────────────────────

function renderMarkdown(text: string) {
  // Split into lines for block-level processing
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="my-1.5 ml-4 space-y-1" style={{ listStyleType: 'disc' }}>
          {listItems}
        </ul>
      );
      listItems = [];
    }
  };

  const inlineFormat = (line: string, key: string): React.ReactNode => {
    const html = line
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code style="background:#e2e8f0;padding:1px 4px;border-radius:3px;font-size:0.85em">$1</code>');

    return <span key={key} dangerouslySetInnerHTML={{ __html: html }} />;
  };

  lines.forEach((line, i) => {
    const trimmed = line.trim();

    // Empty line → flush list & add spacing
    if (!trimmed) {
      flushList();
      elements.push(<div key={`br-${i}`} className="h-2" />);
      return;
    }

    // List item: "- text" or "• text" or "* text" (not **bold**)
    const listMatch = trimmed.match(/^[-•]\s+(.+)$/) || trimmed.match(/^\*\s+(?!\*)(.+)$/);
    if (listMatch) {
      listItems.push(
        <li key={`li-${i}`} className="text-sm leading-relaxed">
          {inlineFormat(listMatch[1], `li-c-${i}`)}
        </li>
      );
      return;
    }

    // Numbered list: "1. text"
    const numMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (numMatch) {
      listItems.push(
        <li key={`li-${i}`} className="text-sm leading-relaxed">
          {inlineFormat(numMatch[1], `li-c-${i}`)}
        </li>
      );
      return;
    }

    // Regular paragraph
    flushList();
    elements.push(
      <p key={`p-${i}`} className="text-sm leading-relaxed">
        {inlineFormat(trimmed, `in-${i}`)}
      </p>
    );
  });

  flushList();
  return <>{elements}</>;
}

// ── Message Bubble ─────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: Message }) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end mb-3">
        <div className="max-w-xs bg-blue-600 text-white px-4 py-2 rounded-2xl
                        rounded-br-sm text-sm leading-relaxed">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-3">
      <div className="max-w-full">
        {/* Source badge */}
        {message.source && (
          <div className="flex items-center gap-1 mb-1 px-1">
            <span className="text-xs text-gray-400">
              {message.source.type === 'pdf' ? '📄' :
               message.source.type === 'pptx' ? '📊' :
               message.source.type === 'video' ? '🎥' : '📁'}
            </span>
            <span className="text-xs text-gray-400">
              Source: {message.source.title}
            </span>
          </div>
        )}

        {/* Message content */}
        <div className={`px-4 py-3 rounded-2xl rounded-bl-sm leading-relaxed ${
                           message.error
                             ? 'bg-red-50 text-red-700 border border-red-200'
                             : 'bg-gray-100 text-gray-800'
                         }`}>
          {renderMarkdown(message.content)}
        </div>

        {/* Resource cards */}
        {message.resources && message.resources.length > 0 && (
          <div className="mt-2 px-1">
            <p className="text-xs font-medium text-gray-500 mb-1">📺 Related Videos</p>
            {message.resources.map((r, i) => (
              <ResourceCard key={i} resource={r} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Mode Badge ─────────────────────────────────────────────────────────────

function ModeBadge({ mode }: { mode: WidgetMode }) {
  const config: Record<WidgetMode, { label: string; color: string }> = {
    study:       { label: '📚 Study Mode',       color: 'bg-green-100 text-green-700'   },
    restricted:  { label: '🔒 Quiz Mode',        color: 'bg-red-100 text-red-700'       },
    remediation: { label: '🔄 Review Mode',      color: 'bg-yellow-100 text-yellow-700' },
    revision:    { label: '🎯 Exam Prep',        color: 'bg-purple-100 text-purple-700' },
    reflection:  { label: '🪞 Reflection',       color: 'bg-teal-100 text-teal-700'     },
    general:     { label: '💬 Open Chat',        color: 'bg-blue-100 text-blue-700'     },
  };
  const { label, color } = config[mode];
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>
      {label}
    </span>
  );
}

// ── Route-aware context resolver ─────────────────────────────────────────

function resolveContext(
  pathname: string,
  routeParams: Readonly<Params<string>>,
  pageCtx: ReturnType<typeof useAiWidgetContext>['context'],
  propOverrides: AiWidgetProps
) {
  const path = pathname.toLowerCase();

  // ── 1. Resolve identifiers (props → page context → route params) ──────
  const topicId       = propOverrides.topicId   ?? pageCtx.topicId   ?? routeParams.lessonId ?? routeParams.id ?? undefined;
  const topicName     = propOverrides.topicName ?? pageCtx.topicName ?? undefined;
  const courseName    = propOverrides.courseName?? pageCtx.courseName ?? undefined;
  const courseId      = pageCtx.courseId         ?? routeParams.id    ?? undefined;
  const quizAttemptId = propOverrides.quizAttemptId ?? pageCtx.quizAttemptId ?? undefined;

  // ── 2. Determine widget mode from URL + overrides ─────────────────────
  let mode: WidgetMode = 'general';

  // URL-based detection
  if (path.startsWith('/quizzes') || path.includes('/quiz-active'))
    mode = 'restricted';
  else if (path.includes('/quiz-review') || path.includes('/quiz-result'))
    mode = 'remediation';
  else if (path.startsWith('/practice') || path.includes('/revision') || path.includes('/exam-prep'))
    mode = 'revision';
  else if (path.startsWith('/lessons') || path.startsWith('/courses/') || path.startsWith('/activities'))
    mode = 'study';
  else if (path.startsWith('/course-progress'))
    mode = 'reflection';

  // Explicit overrides always win
  if (propOverrides.quizAttemptId) mode = 'restricted';
  if (pageCtx.mode) mode = pageCtx.mode;

  // ── 3. Build greeting + contextual chips per mode × page ──────────────
  const chips: Chip[] = [];
  let greeting = 'Hi! I\'m your AI Tutor — here to help you learn smarter.';

  switch (mode) {
    case 'restricted':
      greeting = '🔒 Quiz in progress — I\'m here but won\'t spoil answers.';
      chips.push(
        { type: 'clarify',  label: '❓ Clarify a term in this question' },
        { type: 'strategy', label: '🧠 Test-taking strategies' },
        { type: 'motivate', label: '💪 I\'m feeling anxious' },
      );
      break;

    case 'remediation':
      greeting = '📊 Let\'s review your quiz — I\'ll help you fill the gaps.';
      chips.push(
        { type: 'tutor',     label: '🔍 Explain what I got wrong' },
        { type: 'flashcard', label: '🗂️ Make flashcards from mistakes' },
        { type: 'resource',  label: '🎬 Find videos on weak topics' },
        { type: 'quiz',      label: '🔄 Practice similar questions' },
      );
      break;

    case 'revision':
      greeting = '🎯 Exam prep mode — focused review & practice.';
      chips.push(
        { type: 'quiz',      label: '📝 Generate practice questions' },
        { type: 'flashcard', label: '🗂️ Build revision flashcards' },
        { type: 'summarize', label: '📋 Summarize key concepts' },
        { type: 'tutor',     label: '🧩 Explain my weakest topic' },
      );
      break;

    case 'reflection':
      greeting = '🪞 Time to reflect — what stuck and what needs revisiting?';
      chips.push(
        { type: 'tutor',     label: '💭 What was the hardest part?' },
        { type: 'summarize', label: '📋 Summarize what I learned' },
        { type: 'flashcard', label: '🗂️ Save key takeaways as cards' },
        { type: 'motivate',  label: '🌟 How am I doing overall?' },
      );
      break;

    case 'study':
      // Sub-context by page type
      if (path.startsWith('/lessons')) {
        greeting = topicName ? `📘 Lesson: ${topicName}` : 'Need help with this lesson?';
        chips.push(
          { type: 'summarize', label: '📋 Summarize this lesson' },
          { type: 'tutor',     label: '🧠 Explain this concept' },
          { type: 'flashcard', label: '🗂️ Make flashcards from this' },
          { type: 'resource',  label: '🎬 Find related videos' },
          { type: 'debug',     label: '🐛 Help me debug code' },
        );
      } else if (path.startsWith('/assignments')) {
        greeting = '📝 Working on an assignment? I\'ll guide you — not do it for you.';
        chips.push(
          { type: 'tutor',     label: '📐 Help me outline my approach' },
          { type: 'tutor',     label: '🔍 Explain the requirements' },
          { type: 'debug',     label: '🐛 Help me fix my code' },
          { type: 'resource',  label: '📚 Find reference material' },
        );
      } else if (path.startsWith('/courses/')) {
        greeting = courseName ? `📚 ${courseName} — let\'s dive in!` : 'Ready to learn?';
        chips.push(
          { type: 'summarize', label: '📋 Summarize this topic' },
          { type: 'resource',  label: '🎬 Find video resources' },
          { type: 'quiz',      label: '📝 Quiz me on this' },
          { type: 'flashcard', label: '🗂️ Create study flashcards' },
        );
      } else {
        greeting = topicName ? `Studying: ${topicName}` : 'What can I help you learn?';
        chips.push(
          { type: 'tutor',     label: '🧠 Explain a concept' },
          { type: 'summarize', label: '📋 Summarize content' },
          { type: 'debug',     label: '🐛 Debug my code' },
        );
      }
      break;

    default: // general — dashboard, catalog, forum, etc.
      if (path === '/' || path.startsWith('/dashboard')) {
        greeting = '👋 Welcome back! Here\'s your learning pulse.';
        chips.push(
          { type: 'tutor',     label: '📊 How am I progressing?' },
          { type: 'tutor',     label: '📅 Suggest a study plan' },
          { type: 'motivate',  label: '⚠️ Am I at risk in any course?' },
        );
      } else if (path.startsWith('/course-forum')) {
        greeting = '💬 Forum mode — I\'ll help you craft clear, compelling posts.';
        chips.push(
          { type: 'tutor',     label: '✍️ Help me structure my post' },
          { type: 'tutor',     label: '❓ Clarify my question first' },
          { type: 'summarize', label: '📋 Summarize the discussion' },
        );
      } else if (path.startsWith('/catalog')) {
        greeting = '🔎 Exploring courses? I can help you choose wisely.';
        chips.push(
          { type: 'tutor',     label: '🗺️ What should I study next?' },
          { type: 'tutor',     label: '📊 What are the prerequisites?' },
        );
      } else {
        chips.push(
          { type: 'tutor',     label: '📅 What should I study next?' },
          { type: 'summarize', label: '📋 Summarize a topic' },
          { type: 'motivate',  label: '💪 I need motivation' },
        );
      }
      break;
  }

  return { mode, greeting, chips, topicId, topicName, courseName, courseId, quizAttemptId };
}

// ── Main Widget ────────────────────────────────────────────────────────────

export default function AiWidget(props: AiWidgetProps) {
  const location = useLocation();
  const routeParams = useParams();
  const pageCtx = useAiWidgetContext();

  const ctx = useMemo(
    () => resolveContext(location.pathname, routeParams, pageCtx.context, props),
    [location.pathname, routeParams, pageCtx.context, props]
  );

  const [isOpen, setIsOpen]     = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [chips, setChips]       = useState<Chip[]>(ctx.chips);
  const [mode, setMode]         = useState<WidgetMode>(ctx.mode);
  const [greeting, setGreeting] = useState(ctx.greeting);
  const bottomRef               = useRef<HTMLDivElement>(null);

  // Re-sync when route changes
  useEffect(() => {
    setMode(ctx.mode);
    setGreeting(ctx.greeting);
    setChips(ctx.chips);
    // Reset chat on major route change (optional — keeps chat fresh per page)
    setMessages([]);
  }, [location.pathname]);

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load widget context from backend when opened
  const loadContext = useCallback(async () => {
    try {
      const { data } = await api.get<WidgetContext>('/ai/widget-context', {
        params: {
          page: location.pathname,
          topic_id: ctx.topicId,
          course_id: ctx.courseId,
          quiz_attempt_id: ctx.quizAttemptId,
        },
      });
      setChips(data.chips);
      setMode(data.mode);
      setGreeting(data.greeting);

      if (messages.length === 0) {
        setMessages([{
          id:      Date.now().toString(),
          role:    'ai',
          content: data.greeting + '\n\nWhat would you like to do?',
        }]);
      }
    } catch {
      // Fallback: local greeting already set
    }
  }, [location.pathname, ctx.topicId, ctx.courseId, ctx.quizAttemptId, messages.length]);

  const openWidget = () => {
    setIsOpen(true);
    if (messages.length === 0) loadContext();
  };

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id:      Date.now().toString(),
      role:    'user',
      content: text.trim(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setChips([]); // Hide chips after first interaction
    setLoading(true);

    const intent = detectIntent(text);

    // Recent turns for multi-turn memory (last 6, before this new message).
    const history = messages.slice(-6).map(m => ({
      role:    m.role === 'user' ? 'user' : 'ai',
      content: m.content,
    }));

    // Common payload shared across endpoints
    const payload = {
      question:        text,
      topic_id:        ctx.topicId,
      course_id:       ctx.courseId,
      quiz_attempt_id: ctx.quizAttemptId,
      mode,
      intent,
      history,
    };

    try {
      let aiResponse: Message;

      if (mode === 'restricted') {
        // Quiz mode — restricted handler, no answer leakage
        const { data } = await api.post<{ response: string }>('/ai/ask', {
          ...payload, mode: 'restricted',
        });
        aiResponse = { id: Date.now().toString(), role: 'ai', content: data.response };

      } else if (intent === 'summarize') {
        const { data } = await api.post<{
          response:  string;
          source:    MaterialSource;
          resources: Resource[];
        }>('/ai/summarize', { ...payload, query: text });
        aiResponse = {
          id:        Date.now().toString(),
          role:      'ai',
          content:   data.response,
          source:    data.source,
          resources: data.resources,
        };

      } else if (intent === 'resource') {
        const { data } = await api.post<{
          response:  string;
          resources: Resource[];
        }>('/ai/resources', { ...payload, query: text });
        aiResponse = {
          id:        Date.now().toString(),
          role:      'ai',
          content:   data.response,
          resources: data.resources,
        };

      } else if (intent === 'flashcard') {
        const { data } = await api.post<{ response: string }>('/ai/flashcards', payload);
        aiResponse = { id: Date.now().toString(), role: 'ai', content: data.response };

      } else if (intent === 'debug') {
        const { data } = await api.post<{ response: string }>('/ai/debug', payload);
        aiResponse = { id: Date.now().toString(), role: 'ai', content: data.response };

      } else if (intent === 'motivate') {
        const { data } = await api.post<{ response: string }>('/ai/motivate', payload);
        aiResponse = { id: Date.now().toString(), role: 'ai', content: data.response };

      } else {
        // tutor, quiz, general — main ask endpoint
        const { data } = await api.post<{ response: string }>('/ai/ask', payload);
        aiResponse = { id: Date.now().toString(), role: 'ai', content: data.response };
      }

      setMessages(prev => [...prev, aiResponse]);

    } catch (err: unknown) {
      const axiosErr = err as {
        response?: {
          status?: number;
          data?: { response?: string; message?: string };
        };
      };
      const status = axiosErr?.response?.status;
      const backendMsg =
        axiosErr?.response?.data?.response ||
        axiosErr?.response?.data?.message;

      setMessages(prev => [...prev, {
        id:      Date.now().toString(),
        role:    'ai',
        content: backendMsg || (status === 429
          ? 'AI is busy right now. Please wait 30 seconds and try again.'
          : 'Something went wrong. Please try again.'),
        error:   true,
      }]);
    } finally {
      setLoading(false);
    }
  }, [loading, mode, ctx.topicId, ctx.courseId, ctx.quizAttemptId, messages]);

  const handleChipClick = (chip: Chip) => sendMessage(chip.label);
  const handleKeyDown   = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  // ── Closed state ──────────────────────────────────────────────────────────
  if (!isOpen) {
    return (
      <button
        onClick={openWidget}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white
                   rounded-full shadow-lg hover:bg-blue-700 transition-all
                   flex items-center justify-center text-2xl z-40
                   hover:scale-110 active:scale-95"
        title="AI Tutor"
      >
        🤖
      </button>
    );
  }

  // ── Open state ────────────────────────────────────────────────────────────
  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl
                    shadow-2xl flex flex-col z-40 border border-gray-200 overflow-hidden">

      {/* Header */}
      <div className="bg-blue-600 px-4 py-3 flex items-center gap-2 flex-shrink-0">
        <div className="w-8 h-8 bg-white rounded-full flex items-center
                        justify-center text-sm">🤖</div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold leading-none">AI Tutor</p>
          {(ctx.courseName || ctx.topicName) && (
            <p className="text-blue-200 text-xs truncate mt-0.5">
              📍 {[ctx.courseName, ctx.topicName].filter(Boolean).join(' › ')}
            </p>
          )}
        </div>
        <ModeBadge mode={mode} />
        <button
          onClick={() => setIsOpen(false)}
          className="text-blue-200 hover:text-white ml-2 text-lg leading-none"
        >✕</button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Chips — shown only at start */}
        {chips.length > 0 && !loading && (
          <div className="mt-2 space-y-2">
            {chips.map((chip, i) => (
              <button
                key={i}
                onClick={() => handleChipClick(chip)}
                className="w-full text-left px-4 py-3 rounded-xl border-2 border-blue-100
                           bg-blue-50 text-blue-800 text-sm font-medium
                           hover:border-blue-400 hover:bg-blue-100 transition-all"
              >
                {chip.label}
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-start mb-3">
            <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                {[0, 150, 300].map(delay => (
                  <div
                    key={delay}
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Mode-aware context banner */}
      {mode === 'restricted' && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-100 flex-shrink-0">
          <p className="text-xs text-red-600 text-center">
            🔒 Quiz active — I can clarify questions but won't give answers
          </p>
        </div>
      )}
      {mode === 'remediation' && (
        <div className="px-4 py-2 bg-yellow-50 border-t border-yellow-100 flex-shrink-0">
          <p className="text-xs text-yellow-700 text-center">
            🔄 Review mode — let's turn mistakes into mastery
          </p>
        </div>
      )}
      {mode === 'revision' && (
        <div className="px-4 py-2 bg-purple-50 border-t border-purple-100 flex-shrink-0">
          <p className="text-xs text-purple-700 text-center">
            🎯 Exam prep — focused practice & spaced review
          </p>
        </div>
      )}
      {mode === 'reflection' && (
        <div className="px-4 py-2 bg-teal-50 border-t border-teal-100 flex-shrink-0">
          <p className="text-xs text-teal-700 text-center">
            🪞 Reflect on what you learned and plan ahead
          </p>
        </div>
      )}

      {/* Input */}
      <div className="border-t p-3 flex gap-2 flex-shrink-0">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            mode === 'restricted'  ? 'Ask me to clarify a term...' :
            mode === 'remediation' ? 'Ask about what you got wrong...' :
            mode === 'revision'    ? 'Practice a topic or make flashcards...' :
            mode === 'reflection'  ? 'What did you find challenging?' :
            'Ask me anything...'
          }
          disabled={loading}
          rows={1}
          className="flex-1 border rounded-xl px-3 py-2 text-sm resize-none
                     focus:outline-none focus:ring-2 focus:ring-blue-300
                     disabled:bg-gray-50 max-h-24"
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium
                     hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed
                     flex-shrink-0"
        >
          Send
        </button>
      </div>
    </div>
  );
}
