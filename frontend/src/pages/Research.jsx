import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { History, Menu, Plus, Scale, Send, Trash2, X } from 'lucide-react';
import AnalysisBody from '../components/AnalysisBody';
import ConfidenceCard from '../components/ConfidenceCard';
import { api, errorMessage } from '../lib/api';
import { formatWhen, parseEvaluation, splitAnalysis } from '../lib/analysis';
import { EXAMPLES } from '../lib/content';
import { getProfile, saveProfile } from '../lib/profile';

const LOADING_STEPS = {
  citizen: [
    'Rewriting the question for Indian law',
    'Searching the statute index and the live web',
    'Drafting a plain-language analysis',
    'Scoring confidence',
  ],
  lawyer: [
    'Extracting issues and facts',
    'Planning retrieval questions',
    'Searching statutes, cases, and the web',
    'Drafting, critiquing, and scoring',
  ],
};

function newThreadId() {
  return crypto.randomUUID();
}

export default function Research() {
  const [params] = useSearchParams();
  const initialRole = params.get('role') === 'lawyer' ? 'lawyer' : 'citizen';
  const [profile, setProfile] = useState(getProfile);
  const [role, setRole] = useState(initialRole);
  const [threadId, setThreadId] = useState(newThreadId);
  const [messages, setMessages] = useState([]);
  const [threads, setThreads] = useState([]);
  const [draft, setDraft] = useState(params.get('q') || '');
  const [loading, setLoading] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const scroller = useRef(null);
  const threadRef = useRef(threadId);

  useEffect(() => {
    threadRef.current = threadId;
  }, [threadId]);

  useEffect(() => {
    refreshThreads();
  }, [profile.id]);

  useEffect(() => {
    if (!loading) return undefined;
    const timer = setInterval(() => {
      setStepIndex((current) => (current + 1) % LOADING_STEPS[role].length);
    }, 4000);
    return () => clearInterval(timer);
  }, [loading, role]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const steps = LOADING_STEPS[role];
  const hasConversation = messages.length > 0;

  async function refreshThreads() {
    try {
      const response = await api.post('/get_chat_history', { user_id: profile.id });
      setThreads(response.data.threads || []);
    } catch (error) {
      console.error(error);
    }
  }

  function resetConversation(nextRole = role) {
    setRole(nextRole);
    setThreadId(newThreadId());
    setMessages([]);
    setNotice('');
    setSidebarOpen(false);
  }

  async function openThread(thread) {
    try {
      const response = await api.post('/get_thread_messages', { thread_id: thread.thread_id });
      const loaded = (response.data.messages || []).map((message) => ({
        id: crypto.randomUUID(),
        type: message.role === 'user' ? 'user' : 'bot',
        content: message.content,
        timestamp: message.timestamp,
      }));
      setThreadId(thread.thread_id);
      setMessages(loaded);
      setNotice('');
      setSidebarOpen(false);
    } catch (error) {
      setNotice(errorMessage(error));
    }
  }

  async function removeThread(id, event) {
    event.stopPropagation();
    try {
      await api.delete(`/delete_thread/${id}`);
      setThreads((current) => current.filter((thread) => thread.thread_id !== id));
      if (id === threadRef.current) resetConversation();
    } catch (error) {
      setNotice(errorMessage(error));
    }
  }

  async function submitQuery(text) {
    const query = text.trim();
    if (!query || loading) return;

    const activeThread = threadRef.current;
    const isFirstMessage = messages.every((message) => message.type !== 'user');
    const userMessage = {
      id: crypto.randomUUID(),
      type: 'user',
      content: query,
      timestamp: new Date().toISOString(),
    };

    setMessages((current) => [...current, userMessage]);
    setDraft('');
    setNotice('');
    setLoading(true);
    setStepIndex(0);

    try {
      if (isFirstMessage) {
        try {
          await api.post('/save_thread', {
            user_id: profile.id,
            thread_id: activeThread,
            title: query.length > 72 ? `${query.slice(0, 72)}…` : query,
          });
        } catch (saveError) {
          console.error(saveError);
        }
      }

      const response = await api.post('/process_query', {
        user_query: query,
        role,
        thread_id: activeThread,
      });

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          type: 'bot',
          content: response.data.final_analysis,
          timestamp: new Date().toISOString(),
        },
      ]);
      refreshThreads();
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          type: 'bot',
          content: errorMessage(error),
          timestamp: new Date().toISOString(),
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(event) {
    event.preventDefault();
    submitQuery(draft);
  }

  function rename(event) {
    const name = event.target.value;
    const next = saveProfile({ ...profile, name });
    setProfile(next);
  }

  const suggestions = useMemo(
    () => EXAMPLES.filter((example) => example.role === role).slice(0, 3),
    [role],
  );

  return (
    <div className="flex h-screen overflow-hidden bg-paper text-ink">
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-ink/40 lg:hidden"
          aria-label="Close history"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-80 flex-col border-r border-line bg-card transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <Link to="/" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-pine text-card">
              <Scale className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <span>
              <span className="block font-serif text-xl leading-none">L.A.R.A</span>
              <span className="text-xs text-mist">Research desk</span>
            </span>
          </Link>
          <button type="button" className="lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-4">
          <button
            type="button"
            onClick={() => resetConversation(role)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-pine px-4 py-3 text-sm font-semibold text-card hover:bg-pine-deep"
          >
            <Plus className="h-4 w-4" />
            New research
          </button>
        </div>

        <div className="mt-5 flex items-center gap-2 px-5 text-xs font-semibold uppercase tracking-[0.16em] text-mist">
          <History className="h-3.5 w-3.5" />
          History
        </div>
        <div className="mt-2 flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          {threads.length === 0 && (
            <p className="px-2 py-6 text-sm leading-6 text-mist">
              Saved questions from this browser appear here.
            </p>
          )}
          {threads.map((thread) => (
            <div
              key={thread.thread_id}
              className={`group flex items-start gap-2 rounded-2xl px-3 py-3 ${
                thread.thread_id === threadId ? 'bg-paper' : 'hover:bg-paper'
              }`}
            >
              <button type="button" onClick={() => openThread(thread)} className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-semibold">{thread.title || 'Untitled research'}</p>
                <p className="mt-1 text-xs text-mist">{formatWhen(thread.updated_at)}</p>
              </button>
              <button
                type="button"
                aria-label="Delete research"
                onClick={(event) => removeThread(thread.thread_id, event)}
                className="rounded-lg p-1 text-mist opacity-0 hover:text-clay group-hover:opacity-100"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <label className="border-t border-line px-5 py-4 text-xs text-mist">
          Saved on this browser as
          <input
            value={profile.name}
            onChange={rename}
            className="mt-2 w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-brass"
          />
        </label>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="relative flex items-center justify-center border-b border-line bg-paper/90 px-4 py-3 backdrop-blur sm:px-6">
          <button
            type="button"
            className="absolute left-4 rounded-xl border border-line p-2 lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open history"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex rounded-full border border-line bg-card p-1 text-sm">
            {[
              ['citizen', 'Citizen'],
              ['lawyer', 'Lawyer'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  if (value !== role) resetConversation(value);
                }}
                className={`rounded-full px-4 py-1.5 font-semibold ${
                  role === value ? 'bg-pine text-card' : 'text-mist hover:text-ink'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </header>

        {notice && (
          <div className="border-b border-line bg-card px-6 py-3 text-sm text-clay">{notice}</div>
        )}

        <div ref={scroller} className="flex-1 overflow-y-auto">
          <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 py-8 sm:px-6">
            {!hasConversation && !loading && (
              <div className="my-auto">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brass">
                  {role === 'lawyer' ? 'Lawyer mode' : 'Citizen mode'}
                </p>
                <h1 className="mt-3 font-serif text-4xl leading-tight">
                  {role === 'lawyer'
                    ? 'Ask for an issue-framed legal analysis.'
                    : 'Ask what a law means, or what to do next.'}
                </h1>
                <p className="mt-4 max-w-xl leading-7 text-mist">
                  {role === 'lawyer'
                    ? 'Lawyer mode extracts issues, plans searches, drafts, and critiques before it returns a scored analysis. A full pass can take a few minutes.'
                    : 'Citizen mode rewrites your question, searches the legal index and the web, then explains the result in plain language with a confidence score.'}
                </p>
                <div className="mt-6 flex flex-col gap-2">
                  {suggestions.map((example) => (
                    <button
                      key={example.text}
                      type="button"
                      onClick={() => submitQuery(example.text)}
                      className="rounded-2xl border border-line bg-card px-4 py-3 text-left text-sm leading-6 hover:border-brass"
                    >
                      {example.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-6">
              {messages.map((message) => (
                <Message key={message.id} message={message} />
              ))}
              {loading && (
                <article className="max-w-xl rounded-3xl border border-line bg-card px-5 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brass">Working</p>
                  <p className="mt-2 font-medium">{steps[stepIndex]}</p>
                  <p className="mt-1 text-sm text-mist">
                    Retrieval and drafting run on the server. Lawyer critiques can take several minutes.
                  </p>
                </article>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={onSubmit} className="border-t border-line bg-paper px-4 py-4 sm:px-6">
          <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-end">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  submitQuery(draft);
                }
              }}
              rows={3}
              placeholder={
                role === 'lawyer'
                  ? 'Describe the facts, the sections, or the judgment you want analyzed…'
                  : 'Ask about an Act, a right, or a procedure…'
              }
              className="min-h-24 flex-1 resize-none rounded-3xl border border-line bg-card px-5 py-4 text-base outline-none focus:border-brass"
            />
            <button
              type="submit"
              disabled={!draft.trim() || loading}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-pine px-5 py-3 font-semibold text-card disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
              Analyze
            </button>
          </div>
          <p className="mx-auto mt-3 max-w-3xl text-xs text-mist">
            Enter to send. Shift+Enter for a new line. Research assistance only — not legal advice.
          </p>
        </form>
      </section>
    </div>
  );
}

function Message({ message }) {
  if (message.type === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-3xl rounded-br-md bg-pine px-5 py-3 text-card">
          <p className="whitespace-pre-wrap leading-7">{message.content}</p>
        </div>
      </div>
    );
  }

  const { body, evaluation } = splitAnalysis(message.content);
  const score = message.isError ? null : parseEvaluation(evaluation);

  return (
    <article className={`max-w-[95%] rounded-3xl rounded-bl-md border px-5 py-4 ${
      message.isError ? 'border-clay/30 bg-clay/5' : 'border-line bg-card'
    }`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brass">L.A.R.A</p>
      <div className="mt-2">
        {message.isError ? (
          <p className="leading-7 text-clay">{body}</p>
        ) : (
          <AnalysisBody text={body} />
        )}
      </div>
      {score && <ConfidenceCard evaluation={score} />}
    </article>
  );
}
