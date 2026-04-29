import { useState, useEffect, useCallback } from 'react';
import { Bell, Mail, Smartphone, Monitor, BellOff, RotateCcw, Loader2, CheckCircle, Volume2 } from 'lucide-react';
import { notificationApi } from '../services/api';
import { Switch } from './ui/switch';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface Preference {
  id: number;
  user_id: number;
  notification_type: string;
  channel: 'in_app' | 'email' | 'push' | 'sms';
  enabled: boolean;
  digest_mode: 'instant' | 'daily' | 'weekly';
  quiet_start: string | null;
  quiet_end: string | null;
  created_at: string;
  updated_at: string;
}

interface GroupedPreferences {
  [key: string]: Preference[];
}

const NOTIFICATION_LABELS: Record<string, string> = {
  // Student - Essential
  assignment_posted: 'Assignment Posted',
  assignment_due_soon: 'Assignment Due Soon',
  assignment_overdue: 'Assignment Overdue',
  grade_released: 'Grade Released',
  feedback_added: 'Feedback Added',
  new_course_material: 'New Course Material',
  quiz_available: 'Quiz Available',
  quiz_closing_soon: 'Quiz Closing Soon',
  course_announcement: 'Course Announcement',
  direct_message: 'Direct Message',
  enrollment_confirmed: 'Enrollment Confirmed',
  discussion_reply: 'Discussion Reply',
  // Student - Medium
  peer_review_assigned: 'Peer Review Assigned',
  attendance_flagged: 'Attendance Flagged',
  group_activity_update: 'Group Activity Update',
};

const NOTIFICATION_DESCRIPTIONS: Record<string, string> = {
  assignment_posted: 'Get notified when new assignments are published',
  assignment_due_soon: 'Reminders before assignment deadlines',
  assignment_overdue: 'Alerts for past due assignments',
  grade_released: 'Notifications when grades are published',
  feedback_added: 'When instructors add feedback to your work',
  new_course_material: 'Updates about new course content',
  quiz_available: 'When quizzes become available',
  quiz_closing_soon: 'Reminders before quiz deadlines',
  course_announcement: 'Important announcements from instructors',
  direct_message: 'Messages from instructors and peers',
  enrollment_confirmed: 'Course enrollment confirmations',
  discussion_reply: 'When someone replies to your discussions',
  peer_review_assigned: 'Peer review assignments',
  attendance_flagged: 'Attendance-related alerts',
  group_activity_update: 'Group collaboration updates',
};

const CHANNEL_ICONS = {
  in_app: Monitor,
  email: Mail,
  push: Smartphone,
  sms: Bell,
};

const CHANNEL_LABELS = {
  in_app: 'In-App',
  email: 'Email',
  push: 'Push',
  sms: 'SMS',
};

export function NotificationPreferences() {
  const [preferences, setPreferences] = useState<GroupedPreferences>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [globalMute, setGlobalMute] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const loadPreferences = useCallback(async () => {
    try {
      const response = await notificationApi.getPreferences();
      setPreferences(response.data.data || {});
      setGlobalMute(response.data.global_mute || false);
    } catch (e) {
      // Error handled silently
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const handleToggle = (
    type: string,
    channel: 'in_app' | 'email' | 'push' | 'sms',
    enabled: boolean
  ) => {
    setPreferences((prev) => {
      const typePrefs = prev[type] || [];
      const existingIndex = typePrefs.findIndex((p) => p.channel === channel);

      let updatedTypePrefs;
      if (existingIndex >= 0) {
        updatedTypePrefs = typePrefs.map((p, i) =>
          i === existingIndex ? { ...p, enabled } : p
        );
      } else {
        updatedTypePrefs = [
          ...typePrefs,
          {
            id: Date.now(),
            user_id: 0,
            notification_type: type,
            channel,
            enabled,
            digest_mode: 'instant' as const,
            quiet_start: null,
            quiet_end: null,
            created_at: '',
            updated_at: '',
          },
        ];
      }

      return {
        ...prev,
        [type]: updatedTypePrefs,
      };
    });
    setHasChanges(true);
    setSaveSuccess(false);
  };

  const handleGlobalMute = async (muted: boolean) => {
    try {
      await notificationApi.setGlobalMute(muted);
      setGlobalMute(muted);
    } catch (e) {
      // Error handled silently
      console.error('Failed to update global mute status', e);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Array<{
        type: string;
        channel: 'in_app' | 'email' | 'push' | 'sms';
        enabled: boolean;
        digest_mode: 'instant' | 'daily' | 'weekly';
        quiet_start: string | null;
        quiet_end: string | null;
      }> = [];

      Object.entries(preferences).forEach(([type, typePrefs]) => {
        typePrefs.forEach((pref) => {
          payload.push({
            type,
            channel: pref.channel,
            enabled: pref.enabled,
            digest_mode: pref.digest_mode,
            quiet_start: pref.quiet_start,
            quiet_end: pref.quiet_end,
          });
        });
      });

      await notificationApi.updatePreferences({ preferences: payload });
      setHasChanges(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      // Error handled silently
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset all notification preferences to defaults?')) return;
    setLoading(true);
    try {
      await notificationApi.resetPreferences();
      await loadPreferences();
    } catch (e) {
      // Error handled silently
    } finally {
      setLoading(false);
    }
  };

  const isEnabled = (type: string, channel: string) => {
    const typePrefs = preferences[type] || [];
    const pref = typePrefs.find((p) => p.channel === channel);
    return pref?.enabled ?? false;
  };

  // Group notification types by priority
  const essentialTypes = Object.keys(NOTIFICATION_LABELS).filter(
    (type) =>
      [
        'assignment_posted',
        'assignment_due_soon',
        'assignment_overdue',
        'grade_released',
        'feedback_added',
        'new_course_material',
        'quiz_available',
        'quiz_closing_soon',
        'course_announcement',
        'direct_message',
        'enrollment_confirmed',
        'discussion_reply',
      ].includes(type)
  );

  const mediumTypes = Object.keys(NOTIFICATION_LABELS).filter(
    (type) =>
      ['peer_review_assigned', 'attendance_flagged', 'group_activity_update'].includes(type)
  );

  const availableChannels: Array<'in_app' | 'email' | 'push' | 'sms'> = ['in_app', 'email', 'push'];

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
        <div className="flex items-center justify-center py-8">
          <Loader2 size={24} className="animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  const renderPreferenceCard = (type: string) => {
    const label = NOTIFICATION_LABELS[type] || type;
    const description = NOTIFICATION_DESCRIPTIONS[type] || '';
    const Icon = Bell;

    return (
      <div
        key={type}
        className="p-3 rounded-xl border transition-all hover:border-blue-200"
        style={{
          borderColor: '#e2e8f0',
          backgroundColor: globalMute ? '#f8fafc' : 'white',
          opacity: globalMute ? 0.6 : 1,
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#eff6ff' }}
          >
            <Icon size={16} color="#2563eb" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>{label}</p>
              <div className="flex items-center gap-1">
                {availableChannels.map((channel) => {
                  const ChannelIcon = CHANNEL_ICONS[channel];
                  const enabled = isEnabled(type, channel);
                  return (
                    <button
                      key={channel}
                      type="button"
                      onClick={() => !globalMute && handleToggle(type, channel, !enabled)}
                      disabled={globalMute}
                      className="p-1.5 rounded-md transition-all"
                      style={{
                        backgroundColor: enabled ? '#eff6ff' : 'transparent',
                        opacity: globalMute ? 0.4 : 1,
                      }}
                      title={CHANNEL_LABELS[channel]}
                    >
                      <ChannelIcon
                        size={14}
                        color={enabled ? '#2563eb' : '#94a3b8'}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
            <p style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{description}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell size={18} color="#2563eb" />
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>
            Notification Preferences
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {saveSuccess && (
            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
              <CheckCircle size={12} className="mr-1" />
              Saved
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-slate-500 hover:text-blue-600"
          >
            <RotateCcw size={14} className="mr-1" />
            Reset
          </Button>
        </div>
      </div>

      {/* Global Mute Toggle */}
      <div
        className="flex items-center justify-between p-3 rounded-xl mb-4"
        style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: globalMute ? '#fee2e2' : '#f0fdf4' }}
          >
            {globalMute ? <BellOff size={14} color="#dc2626" /> : <Volume2 size={14} color="#16a34a" />}
          </div>
          <div>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
              {globalMute ? 'Notifications Muted' : 'Notifications Active'}
            </p>
            <p style={{ fontSize: '11px', color: '#64748b' }}>
              {globalMute ? 'All notifications are currently disabled' : 'Choose how you want to be notified'}
            </p>
          </div>
        </div>
        <Switch
          checked={!globalMute}
          onCheckedChange={(checked) => handleGlobalMute(!checked)}
        />
      </div>

      {/* Channel Legend */}
      <div
        className="flex items-center gap-4 mb-4 p-2 rounded-lg"
        style={{ backgroundColor: '#f8fafc' }}
      >
        {availableChannels.map((channel) => {
          const ChannelIcon = CHANNEL_ICONS[channel];
          return (
            <div key={channel} className="flex items-center gap-1">
              <ChannelIcon size={12} color="#64748b" />
              <span style={{ fontSize: '11px', color: '#64748b' }}>{CHANNEL_LABELS[channel]}</span>
            </div>
          );
        })}
      </div>

      {/* Essential Notifications */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 text-xs">
            Essential
          </Badge>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Important alerts about your learning</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {essentialTypes.map(renderPreferenceCard)}
        </div>
      </div>

      {/* Medium Priority Notifications */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 text-xs">
            Optional
          </Badge>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Additional activity updates</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {mediumTypes.map(renderPreferenceCard)}
        </div>
      </div>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={saving || !hasChanges}
        className="w-full"
        style={{
          background: hasChanges
            ? 'linear-gradient(135deg, #1d4ed8, #2563eb)'
            : 'linear-gradient(135deg, #94a3b8, #cbd5e1)',
        }}
      >
        {saving ? (
          <>
            <Loader2 size={16} className="mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          'Save Preferences'
        )}
      </Button>
    </div>
  );
}
