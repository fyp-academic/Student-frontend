import { useEffect, useState } from 'react';
import { Loader2, ThumbsUp, ThumbsDown, MessageSquare, Send, Lock } from 'lucide-react';
import { forumApi } from '../../services/api';
import { SafeHtml } from '../SafeHtml';

interface Props {
  activityId: string;
}

/** Round profile picture with a generated fallback when the user has none. */
function Avatar({ name, src, size = 32 }: { name: string; src: string | null; size?: number }) {
  const url = src || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=0891b2&color=fff&size=64`;
  return (
    <img
      src={url}
      alt={name}
      className="rounded-full object-cover flex-shrink-0 border border-gray-200"
      style={{ width: size, height: size }}
    />
  );
}

interface Reply {
  id: string;
  parent_id: string | null;
  content: string;
  depth_level: number;
  created_at: string;
  likes_count: number;
  dislikes_count: number;
  my_reaction: number;
  anonymous: boolean;
  author: { id: string | null; name: string; avatar: string | null };
  is_mine: boolean;
}

/**
 * Student view of a single-topic Discussion activity: the instructor's topic,
 * a reply composer, and threaded replies with like/dislike + reply counts.
 * Honors anonymity, "must post before viewing", sort order and threading options.
 */
export function DiscussionPanel({ activityId }: Props) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [body, setBody] = useState('');
  const [anon, setAnon] = useState(false);
  const [replyTo, setReplyTo] = useState<Reply | null>(null);
  const [posting, setPosting] = useState(false);

  const load = () => {
    setLoading(true);
    forumApi.discussion(activityId)
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };
  useEffect(load, [activityId]);

  const opts = data?.options ?? {};
  const discussionId: string = data?.discussion_id ?? '';

  const post = async () => {
    if (!body.trim() || !discussionId) return;
    setPosting(true);
    try {
      await forumApi.reply(discussionId, {
        content: body.trim(),
        parent_id: replyTo?.id ?? null,
        anonymous: anon,
      });
      setBody(''); setReplyTo(null); setAnon(false);
      load();   // refetch to apply gating + ordering + counts
    } catch { /* keep composer open */ }
    finally { setPosting(false); }
  };

  const react = async (r: Reply, value: 1 | -1) => {
    try {
      const res = await forumApi.react(r.id, value);
      const { likes_count, dislikes_count, my_reaction } = res.data;
      setData((prev: any) => prev ? {
        ...prev,
        replies: prev.replies.map((x: Reply) => x.id === r.id ? { ...x, likes_count, dislikes_count, my_reaction } : x),
      } : prev);
    } catch { /* ignore */ }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={22} className="animate-spin text-cyan-600" /></div>;
  if (!data) return <p className="text-sm text-gray-500 py-8 text-center">Could not load discussion.</p>;

  const replies: Reply[] = data.replies ?? [];

  return (
    <div className="space-y-5">
      {/* Topic */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        {data.topic_author && (
          <div className="flex items-center gap-2 mb-3">
            <Avatar name={data.topic_author.name ?? 'Instructor'} src={data.topic_author.avatar ?? null} size={36} />
            <div>
              <div className="text-sm font-semibold text-gray-800">{data.topic_author.name ?? 'Instructor'}</div>
              <div className="text-xs text-gray-400">Topic author</div>
            </div>
          </div>
        )}
        <h2 className="text-lg font-bold text-gray-900 mb-2">{data.title}</h2>
        <SafeHtml html={String(data.content ?? '')} className="prose prose-sm max-w-none text-gray-700" />
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
          <span className="inline-flex items-center gap-1"><MessageSquare size={13} /> {data.reply_count} replies</span>
          {opts.anonymous_mode && opts.anonymous_mode !== 'off' && <span>Anonymity: {opts.anonymous_mode}</span>}
        </div>
      </div>

      {/* Composer */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        {replyTo && (
          <div className="mb-2 text-xs text-gray-500 flex items-center gap-2">
            Replying to {replyTo.author?.name ?? 'Anonymous'}
            <button onClick={() => setReplyTo(null)} className="text-cyan-600 hover:underline">cancel</button>
          </div>
        )}
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Write a reply…"
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
        <div className="flex items-center justify-between mt-2">
          {opts.anonymous_mode === 'partial' ? (
            <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
              <input type="checkbox" checked={anon} onChange={e => setAnon(e.target.checked)} /> Post anonymously
            </label>
          ) : opts.anonymous_mode === 'full' ? (
            <span className="text-xs text-gray-400">Your reply will be anonymous</span>
          ) : <span />}
          <button onClick={post} disabled={posting || !body.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50">
            <Send size={14} /> {posting ? 'Posting…' : 'Reply'}
          </button>
        </div>
      </div>

      {/* Replies */}
      {data.locked ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
          <Lock size={18} className="mx-auto mb-2 text-gray-400" />
          You must post a reply before you can view what others have written.
        </div>
      ) : replies.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">No replies yet — be the first.</p>
      ) : (
        <div className="space-y-3">
          {replies.map((r) => {
            const indent = opts.disallow_threaded ? 0 : Math.min(Math.max((r.depth_level ?? 1) - 1, 0), 4) * 24;
            return (
              <div key={r.id} className="rounded-xl border border-gray-200 bg-white p-4 flex gap-3" style={{ marginLeft: indent }}>
                <Avatar name={r.author?.name ?? 'Anonymous'} src={r.author?.avatar ?? null} />
                <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-gray-800">{r.author?.name ?? 'Anonymous'}{r.is_mine && <span className="text-xs text-gray-400 font-normal"> · you</span>}</span>
                  <span className="text-xs text-gray-400">{r.created_at ? new Date(r.created_at).toLocaleString() : ''}</span>
                </div>
                <div className="text-sm text-gray-700 whitespace-pre-wrap">{r.content}</div>
                <div className="flex items-center gap-4 mt-2 text-xs">
                  {opts.allow_liking !== false && <>
                    <button onClick={() => react(r, 1)} className={`inline-flex items-center gap-1 ${r.my_reaction === 1 ? 'text-cyan-600 font-semibold' : 'text-gray-500 hover:text-cyan-600'}`}>
                      <ThumbsUp size={14} /> {r.likes_count ?? 0}
                    </button>
                    <button onClick={() => react(r, -1)} className={`inline-flex items-center gap-1 ${r.my_reaction === -1 ? 'text-red-600 font-semibold' : 'text-gray-500 hover:text-red-600'}`}>
                      <ThumbsDown size={14} /> {r.dislikes_count ?? 0}
                    </button>
                  </>}
                  {!opts.disallow_threaded && (
                    <button onClick={() => { setReplyTo(r); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-gray-500 hover:text-gray-700 inline-flex items-center gap-1">
                      <MessageSquare size={13} /> Reply
                    </button>
                  )}
                </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
