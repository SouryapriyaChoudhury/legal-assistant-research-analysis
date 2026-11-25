export const EXAMPLES = [
  {
    role: 'citizen',
    text: 'The Securities and Exchange Board of India (SEBI) Act, 1992.',
  },
  {
    role: 'citizen',
    text: 'Foreign Exchange Management Act (FEMA), 1999.',
  },
  {
    role: 'lawyer',
    text: 'Summarize the judgment in Chunna @ Charan Singh vs State of M.P.',
  },
  {
    role: 'lawyer',
    text: 'Explain Section 2A introduced in the Railways Amendment Act, 2025.',
  },
  {
    role: 'citizen',
    text: 'The Insolvency and Bankruptcy Code (IBC).',
  },
  {
    role: 'lawyer',
    text: 'Compare provisions under IPC Sections 302 and 304B with recent case law.',
  },
];

export const FEATURES = [
  {
    title: 'Law-aware query rewriting',
    copy: 'Natural questions are rewritten into retrieval prompts that name statutes, sections, and issues.',
  },
  {
    title: 'Two research workflows',
    copy: 'Citizen mode explains rights and procedure. Lawyer mode runs issue extraction, planning, drafting, and critique.',
  },
  {
    title: 'Hybrid retrieval',
    copy: 'Answers draw on a FAISS index of Indian legal texts and live web results from Tavily.',
  },
  {
    title: 'Iterative lawyer critique',
    copy: 'Lawyer mode can revise a draft through up to three critique passes before it finalizes.',
  },
  {
    title: 'Cited legal analysis',
    copy: 'Statutes, acts, and case law are synthesized into a structured note you can trace.',
  },
  {
    title: 'Calibrated confidence',
    copy: 'Each answer carries a score from 1.0 to 5.0, blending model review with semantic similarity.',
  },
];

export const PIPELINE = [
  'Query rewrite',
  'Issue extraction',
  'Hybrid retrieval',
  'Draft',
  'Critique',
  'Confidence score',
];
