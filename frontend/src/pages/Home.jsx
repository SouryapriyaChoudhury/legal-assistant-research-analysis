import { Link } from 'react-router-dom';
import { ArrowRight, Scale } from 'lucide-react';
import { EXAMPLES, FEATURES, PIPELINE } from '../lib/content';

function Mark({ className = 'h-10 w-10' }) {
  return (
    <span className={`grid place-items-center rounded-2xl bg-pine text-card ${className}`}>
      <Scale className="h-5 w-5" strokeWidth={1.75} />
    </span>
  );
}

export default function Home() {
  return (
    <div className="paper-grid min-h-screen text-ink">
      <header className="sticky top-0 z-20 border-b border-line/80 bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-3">
            <Mark />
            <span>
              <span className="block font-serif text-xl leading-none">L.A.R.A</span>
              <span className="text-xs tracking-wide text-mist">Legal Analysis & Research</span>
            </span>
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            <a href="#workflows" className="hidden px-3 py-2 text-mist hover:text-ink sm:inline">
              Workflows
            </a>
            <a href="#pipeline" className="hidden px-3 py-2 text-mist hover:text-ink sm:inline">
              Pipeline
            </a>
            <Link
              to="/research"
              className="rounded-full bg-pine px-4 py-2 font-semibold text-card hover:bg-pine-deep"
            >
              Open research
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:py-24">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brass">
              Indian law · multi-agent research
            </p>
            <h1 className="mt-4 max-w-xl font-serif text-5xl leading-[1.05] text-ink sm:text-6xl">
              A research desk for statutes, cases, and clear answers.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-mist">
              L.A.R.A turns a plain-language question into a law-aware search, retrieves
              the statute index and the live web, then drafts a structured analysis with
              a calibrated confidence score.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/research?role=citizen"
                className="inline-flex items-center gap-2 rounded-full bg-pine px-5 py-3 font-semibold text-card hover:bg-pine-deep"
              >
                Citizen guidance
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/research?role=lawyer"
                className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-5 py-3 font-semibold text-ink hover:border-brass"
              >
                Lawyer analysis
              </Link>
            </div>
          </div>

          <aside className="rounded-[28px] border border-line bg-card p-6 shadow-[0_24px_60px_rgba(23,27,34,0.06)]">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.16em] text-mist">
              <span>Sample structure</span>
              <span className="text-brass">Confidence 4.20 / 5</span>
            </div>
            <h2 className="mt-4 font-serif text-2xl">Section 2A, Railways Amendment Act, 2025</h2>
            <p className="mt-3 text-sm leading-6 text-mist">
              Issue, governing provision, what the amendment changes, and the practical
              consequence for passengers and the railway administration.
            </p>
            <ol className="mt-5 space-y-3 text-sm">
              {['Issue framed', 'Statute and section', 'Retrieved case context', 'Confidence and limits'].map(
                (step, index) => (
                  <li key={step} className="flex items-center gap-3">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-paper font-semibold text-pine">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ),
              )}
            </ol>
          </aside>
        </section>

        <section id="workflows" className="mx-auto grid max-w-6xl gap-4 px-5 pb-16 md:grid-cols-2">
          <article className="rounded-[28px] bg-pine p-8 text-card">
            <p className="text-xs uppercase tracking-[0.18em] text-brass-soft">Citizen mode</p>
            <h2 className="mt-3 font-serif text-3xl">Rights, procedure, and plain explanation.</h2>
            <p className="mt-4 leading-7 text-card/80">
              A hybrid retrieval workflow for people who need to understand an Act, a right,
              or the next procedural step without a full brief.
            </p>
          </article>
          <article className="rounded-[28px] border border-line bg-card p-8">
            <p className="text-xs uppercase tracking-[0.18em] text-brass">Lawyer mode</p>
            <h2 className="mt-3 font-serif text-3xl">Issues, plan, draft, then critique.</h2>
            <p className="mt-4 leading-7 text-mist">
              A LangGraph workflow that extracts issues, plans sub-queries, retrieves sources,
              drafts, and revises through up to three critique cycles.
            </p>
          </article>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-16">
          <h2 className="font-serif text-3xl">What the research includes</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <article key={feature.title} className="rounded-3xl border border-line bg-card/80 p-5">
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-mist">{feature.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="pipeline" className="mx-auto max-w-6xl px-5 pb-16">
          <h2 className="font-serif text-3xl">From question to scored analysis</h2>
          <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            {PIPELINE.map((step, index) => (
              <li key={step} className="rounded-2xl border border-line bg-card px-4 py-4">
                <span className="font-serif text-brass">{String(index + 1).padStart(2, '0')}</span>
                <p className="mt-2 text-sm font-semibold leading-5">{step}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-20">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-serif text-3xl">Start from a known question</h2>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {EXAMPLES.map((example) => (
              <Link
                key={example.text}
                to={`/research?role=${example.role}&q=${encodeURIComponent(example.text)}`}
                className="group rounded-2xl border border-line bg-card px-5 py-4 hover:border-brass"
              >
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brass">
                  {example.role}
                </span>
                <p className="mt-2 leading-6 group-hover:text-pine">{example.text}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-8 text-sm text-mist sm:flex-row sm:items-center sm:justify-between">
          <p>L.A.R.A assists research. It is not a lawyer and not legal advice.</p>
          <p>Indian law · FAISS corpus · Groq · Tavily</p>
        </div>
      </footer>
    </div>
  );
}
