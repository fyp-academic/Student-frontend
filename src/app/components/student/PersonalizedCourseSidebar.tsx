import React from 'react';
import {
  ArrowRight, CheckCircle, ChevronDown, ChevronRight, Clock, LayoutList, Loader2, Lock, X,
} from 'lucide-react';
import type { ActivityOverlay, NavigationConfig, SectionOverlay } from '@/app/types/personalization';

type Activity = Record<string, unknown>;
type Section = Record<string, unknown>;

interface PersonalizedCourseSidebarProps {
  sections: Section[];
  sectionsLoading: boolean;
  openModules: string[];
  activeActivityId: string;
  navigation: NavigationConfig | null;
  typeConfig: Record<string, { color: string; label: string }>;
  onToggleModule: (secId: string) => void;
  onClose: () => void;
  onOpenActivity: (act: Activity) => void;
  statKeyOf: (act: Activity) => string;
  rawTypeOf: (act: Activity) => string;
}

function sortSections(sections: Section[], overlays: Record<string, SectionOverlay>): Section[] {
  return [...sections].sort((a, b) => {
    const boostA = overlays[String(a.id ?? '')]?.sort_boost ?? 0;
    const boostB = overlays[String(b.id ?? '')]?.sort_boost ?? 0;
    if (boostA !== boostB) return boostB - boostA;
    return 0;
  });
}

function sortActivities(acts: Activity[], overlays: Record<string, ActivityOverlay>): Activity[] {
  return [...acts].sort((a, b) => {
    const boostA = overlays[String(a.id ?? '')]?.sort_boost ?? 0;
    const boostB = overlays[String(b.id ?? '')]?.sort_boost ?? 0;
    if (boostA !== boostB) return boostB - boostA;
    return 0;
  });
}

export const PersonalizedCourseSidebar: React.FC<PersonalizedCourseSidebarProps> = ({
  sections,
  sectionsLoading,
  openModules,
  activeActivityId,
  navigation,
  typeConfig,
  onToggleModule,
  onClose,
  onOpenActivity,
  statKeyOf,
  rawTypeOf,
}) => {
  const activityOverlays = navigation?.activity_overlays ?? {};
  const sectionOverlays = navigation?.section_overlays ?? {};
  const sortedSections = sortSections(sections, sectionOverlays);

  const handleActivityClick = (act: Activity, overlay?: ActivityOverlay) => {
    if (overlay && !overlay.accessible) return;
    const sKey = statKeyOf(act);
    if (sKey === 'locked') return;
    onOpenActivity(act);
  };

  // Neutral "where next" nudge: resolve the backend's suggested activity id to its title.
  // We deliberately use only the id + neutral client-side copy — never the backend's
  // direct_guidance.message/reason (which expose AI/weakness wording).
  const suggestedId = navigation?.direct_guidance?.suggested_activity_id ?? null;
  const suggestedActivity = suggestedId
    ? sections.flatMap(s => (s.activities ?? []) as Activity[]).find(a => String(a.id ?? '') === suggestedId)
    : undefined;
  const suggestedOverlay = suggestedId ? activityOverlays[suggestedId] : undefined;
  const showNudge = !!suggestedActivity
    && suggestedId !== activeActivityId
    && statKeyOf(suggestedActivity) !== 'completed'
    && (!suggestedOverlay || suggestedOverlay.accessible);
  const suggestedTitle = suggestedActivity
    ? String(suggestedActivity.name ?? suggestedActivity.title ?? '')
    : '';

  return (
    <aside
      className="flex-shrink-0 flex flex-col bg-white border-r overflow-hidden transition-all duration-300"
      style={{ width: '300px', minWidth: '300px', borderColor: '#e2e8f0' }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#e2e8f0', backgroundColor: '#1e293b' }}>
        <div className="flex items-center gap-2 min-w-0">
          <LayoutList size={16} color="#94a3b8" />
          <span className="truncate" style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>
            Course Modules
          </span>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-white/10 transition-colors" type="button">
          <X size={14} color="#94a3b8" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {showNudge && (
          <button
            type="button"
            onClick={() => handleActivityClick(suggestedActivity as Activity, suggestedOverlay)}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-left border-b hover:bg-blue-50 transition-colors"
            style={{ borderColor: '#e2e8f0', backgroundColor: '#f8fafc' }}
          >
            <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: '#dbeafe' }}>
              <ArrowRight size={14} color="#2563eb" />
            </div>
            <div className="min-w-0">
              <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>Continue where you left off</p>
              <p className="truncate" style={{ fontSize: '14px', color: '#1e293b', fontWeight: 600 }}>{suggestedTitle}</p>
            </div>
          </button>
        )}
        {sectionsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin" style={{ color: '#2563eb' }} />
          </div>
        ) : sortedSections.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p style={{ fontSize: '14px', color: '#94a3b8' }}>No sections found.</p>
          </div>
        ) : sortedSections.map((sec, si) => {
          const secId = String(sec.id ?? '');
          const secTitle = String(sec.title ?? sec.name ?? `Section ${si + 1}`);
          const secOverlay = sectionOverlays[secId];
          const acts = sortActivities((sec.activities ?? []) as Activity[], activityOverlays);
          const done = acts.filter(a => statKeyOf(a) === 'completed').length;
          const isOpen = openModules.includes(secId);

          return (
            <div key={secId}>
              <button
                type="button"
                onClick={() => onToggleModule(secId)}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors border-b"
                style={{ borderColor: '#f1f5f9' }}
              >
                <div
                  className="flex-shrink-0 w-2 h-2 rounded-full"
                  style={{ backgroundColor: secOverlay?.is_weak_topic ? '#f97316' : done === acts.length && acts.length > 0 ? '#22c55e' : '#2563eb' }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate" style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b' }}>{secTitle}</p>
                  </div>
                  <span style={{ fontSize: '13px', color: '#94a3b8' }}>{done}/{acts.length} completed</span>
                </div>
                {isOpen ? <ChevronDown size={14} color="#94a3b8" /> : <ChevronRight size={14} color="#94a3b8" />}
              </button>

              {isOpen && acts.map((act, ai) => {
                const aid = String(act.id ?? ai);
                const aTitle = String(act.name ?? act.title ?? `Activity ${ai + 1}`);
                const rType = rawTypeOf(act);
                const tCfg = typeConfig[rType] ?? typeConfig.resource;
                const sKey = statKeyOf(act);
                const isSel = activeActivityId === aid;
                const overlay = activityOverlays[aid];
                const isBlocked = overlay ? !overlay.accessible : false;
                const isLck = sKey === 'locked' || isBlocked;
                const dur = String(act.duration ?? (act.time_limit ? `${act.time_limit} min` : ''));
                return (
                  <button
                    key={aid}
                    type="button"
                    disabled={isLck}
                    onClick={() => handleActivityClick(act, overlay)}
                    className={`w-full flex items-start gap-2.5 px-4 py-2 text-left transition-all ${isLck ? 'opacity-40 cursor-not-allowed' : 'hover:bg-blue-50/60 cursor-pointer'}`}
                    style={{
                      backgroundColor: isSel
                        ? '#eff6ff'
                        : (!isLck && overlay?.annotation === 'recommended')
                          ? '#f0f7ff'
                          : 'transparent',
                      borderLeft: isSel
                        ? '3px solid #2563eb'
                        : (!isLck && overlay?.annotation === 'recommended')
                          ? '3px solid #2563eb'
                          : overlay?.is_weak_topic
                            ? '3px solid #f97316'
                            : '3px solid transparent',
                    }}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {sKey === 'completed' ? <CheckCircle size={14} color="#22c55e" />
                        : isSel ? (
                          <div className="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center" style={{ borderColor: '#2563eb', backgroundColor: '#2563eb' }}>
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          </div>
                        ) : isLck ? <Lock size={14} color="#94a3b8" />
                          : <div
                              className="w-3.5 h-3.5 rounded-full border-2"
                              style={{ borderColor: overlay?.annotation === 'recommended' ? '#2563eb' : overlay?.is_weak_topic ? '#f97316' : '#cbd5e1' }}
                            />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate" style={{ fontSize: '14px', fontWeight: isSel ? 600 : 400, color: isSel ? '#1e40af' : '#1e293b' }}>
                        {ai + 1}. {aTitle}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        {dur && (
                          <span className="flex items-center gap-0.5" style={{ fontSize: '12px', color: '#94a3b8' }}>
                            <Clock size={11} /> {dur}
                          </span>
                        )}
                        <span className="px-1.5 rounded" style={{ fontSize: '11px', fontWeight: 600, backgroundColor: `${tCfg.color}15`, color: tCfg.color }}>
                          {tCfg.label}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </aside>
  );
};
