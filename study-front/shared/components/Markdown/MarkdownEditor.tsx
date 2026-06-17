"use client";

import { useMemo, useSyncExternalStore } from 'react';
import dynamic from 'next/dynamic';

type SimpleMdeEditorProps = {
  value: string;
  onChange: (value: string) => void;
  options?: {
    autofocus?: boolean;
    spellChecker?: boolean;
    status?: boolean;
  };
};

const ReactSimpleMdeEditor = dynamic<SimpleMdeEditorProps>(
  () => import('react-simplemde-editor'),
  { ssr: false }
);
import 'easymde/dist/easymde.min.css';
import ReactMarkdown from 'react-markdown';
import breaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import { markdownComponents } from '@/shared/components/Mdx/markdownComponents';

const STORAGE_KEY = 'smde_saved_content';
const INITIAL_MARKDOWN = `# Markdown Editor

ここにMarkdownを書いてください。

- リスト
- **太字**
- \`code\`

| 見出し | 値 |
| --- | --- |
| サンプル | 1 |
`;

let cachedMarkdown: string | null = null;
const listeners = new Set<() => void>();

const getSnapshot = () => {
  if (typeof window === 'undefined') {
    return INITIAL_MARKDOWN;
  }

  if (cachedMarkdown === null) {
    cachedMarkdown = localStorage.getItem(STORAGE_KEY) ?? INITIAL_MARKDOWN;
  }

  return cachedMarkdown;
};

const getServerSnapshot = () => INITIAL_MARKDOWN;

const subscribe = (listener: () => void) => {
  listeners.add(listener);

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) {
      return;
    }

    cachedMarkdown = event.newValue ?? INITIAL_MARKDOWN;
    listener();
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorage);
  }

  return () => {
    listeners.delete(listener);

    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorage);
    }
  };
};

const setMarkdown = (value: string) => {
  cachedMarkdown = value;

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, value);
  }

  listeners.forEach(listener => listener());
};

export const MarkdownEditor = () => {
  const markdownValue = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const onChange = (value: string) => {
    setMarkdown(value);
  };

  const options = useMemo(() => {
    return {
      autofocus: true,
      spellChecker: false,
      status: false,
    };
  }, []);

  return (
    <section className='mx-auto grid w-full max-w-6xl gap-4 lg:grid-cols-2'>
      <div className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'>
        <h1 className='mb-3 text-xl font-bold text-slate-900'>Markdown Editor</h1>
        <ReactSimpleMdeEditor value={markdownValue} onChange={onChange} options={options} />
      </div>

      <div className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'>
        <h2 className='mb-3 text-xl font-bold text-slate-900'>プレビュー</h2>
        <div
          className='max-h-[70vh] overflow-y-auto rounded-none border-2 border-emerald-950 bg-emerald-50 p-4 shadow-[4px_4px_0_#052e16]'
        >
          <ReactMarkdown remarkPlugins={[remarkGfm, breaks]} components={markdownComponents}>
            {markdownValue}
          </ReactMarkdown>
        </div>
      </div>
    </section>
  );
};
