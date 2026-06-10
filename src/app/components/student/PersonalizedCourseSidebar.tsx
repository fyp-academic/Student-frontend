import React from 'react';
import {
  CheckCircle, ChevronDown, ChevronRight, Clock, LayoutList, Loader2, Lock, Sparkles, X,
} from 'lucide-react';
import type { ActivityOverlay, NavigationConfig, SectionOverlay } from '@/app/types/personalization';
import { annotationStyles } from '@/app/types/personalization';

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
          {navigation?.mode && (
            <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide" style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: '#cbd5e1' }}>
              {navigation.mode}
            </span>
          )}
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-white/10 transition-colors" type="button">
          <X size={14} color="#94a3b8" />
        </button>
      </div>

      {navigation?.direct_guidance?.enabled && navigation.direct_guidance.message && (
        <div className="mx-3 mt-3 rounded-xl border px-3 py-3 personalization-nav-guidance" style={{ borderColor: '#93c5fd', backgroundColor: '#eff6ff' }}>
          <div className="flex items-start gap-2">
            <Sparkles size={15} className="mt-0.5 flex-shrink-0" color="#2563eb" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-800">Your pathway</p>
                {navigation.direct_guidance.time_estimate_minutes != null && (
                  <span className="flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium" style={{ backgroundColor: '#dbeafe', color: '#1d4ed8' }}>
                    <Clock size={9} />
                    ~{navigation.direct_guidance.time_estimate_minutes} min
                  </span>
                )}
              </div>
              <p style={{ fontSize: '12px', lineHeight: 1.5, color: '#1e40af' }}>{navigation.direct_guidance.message}</p>
              {navigation.direct_guidance.reason && (
                <p style={{ fontSize: '11px', lineHeight: 1.4, color: '#3b82f6', marginTop: '2px', fontStyle: 'italic' }}>
                  {navigation.direct_guidance.reason}
                </p>
              )}
            </div>
          </div>
          {Array.isArray(navigation.direct_guidance.prerequisite_warnings) && navigation.direct_guidance.prerequisite_warnings.length > 0 && (
            <details className="mt-2">
              <summary className="flex items-center gap-1 cursor-pointer text-[11px] font-semibold" style={{ color: '#b45309', listStyle: 'none' }}>
                <span>⚠ Prerequisites to check ({navigation.direct_guidance.prerequisite_warnings.length})</span>
              </summary>
              <ul className="mt-1.5 space-y-1 pl-1">
                {navigation.direct_guidance.prerequisite_warnings.map((w, i) => (
                  <li key={i} style={{ fontSize: '11px', color: '#92400e' }}>• {w}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      <div className="mx-3 mt-2 flex flex-wrap gap-1">
        <span className="rounded-md px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600">
          Nav: {navigation?.mode ?? 'balanced'}
        </span>
        {navigation?.enforce_sequence && (
          <span className="rounded-md px-1.5 py-0.5 text-[10px] font-medium bg-amber-50 text-amber-800">Sequential</span>
        )}
        {navigation?.allow_non_linear_jump && (
          <span className="rounded-md px-1.5 py-0.5 text-[10px] font-medium bg-emerald-50 text-emerald-800">Free explore</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
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
                    {secOverlay?.annotation_label && (
                      <span className="flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: '#fff7ed', color: '#c2410c' }}>
                        {secOverlay.annotation_label}
                      </span>
                    )}
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
                const annStyle = overlay?.annotation ? annotationStyles[overlay.annotation] : null;

                return (
                  <button
                    key={aid}
                    type="button"
                    disabled={isLck}
                    onClick={() => handleActivityClick(act, overlay)}
                    className={`w-full flex items-start gap-2.5 px-4 py-2 text-left transition-all ${isLck ? 'opacity-40 cursor-not-allowed' : 'hover:bg-blue-50/60 cursor-pointer'}`}
                    style={{
                      backgroundColor: isSel ? '#eff6ff' : 'transparent',
                      borderLeft: isSel ? '3px solid #2563eb' : overlay?.annotation === 'recommended' ? '3px solid #93c5fd' : '3px solid transparent',
                    }}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {sKey === 'completed' ? <CheckCircle size={14} color="#22c55e" />
                        : isSel ? (
                          <div className="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center" style={{ borderColor: '#2563eb', backgroundColor: '#2563eb' }}>
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          </div>
                        ) : isLck ? <Lock size={14} color="#94a3b8" />
                          : <div className="w-3.5 h-3.5 rounded-full border-2" style={{ borderColor: '#cbd5e1' }} />}
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
                        {overlay?.annotation_label && annStyle && (
                          <span className="px-1.5 rounded" style={{ fontSize: '10px', fontWeight: 600, backgroundColor: annStyle.bg, color: annStyle.color }}>
                            {overlay.annotation_label}
                          </span>
                        )}
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
