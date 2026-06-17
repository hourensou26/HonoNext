import type { ComponentPropsWithoutRef, JSX, ReactNode } from 'react';
import type { Element } from 'hast';
import type { MDXComponents } from 'mdx/types';
import type { Components as MarkdownComponents } from 'react-markdown';

import { Badge } from '@/shared/components/ui/Badge';
import { Card } from '@/shared/components/ui/Card';
import { cn } from '@/shared/lib/cn';

type MarkdownProps<T extends keyof JSX.IntrinsicElements> = ComponentPropsWithoutRef<T> & {
  node?: Element;
};

const pixelFont = 'font-mono tracking-[0.08em]';
const pixelShadow = 'shadow-[3px_3px_0_#052e16]';

const Heading1 = ({ node: _node, ...props }: MarkdownProps<'h1'>) => (
  <h1
    className={cn('text-2xl font-bold tracking-[0.18em] text-emerald-950', pixelFont)}
    {...props}
  />
);

const Heading2 = ({ node: _node, ...props }: MarkdownProps<'h2'>) => (
  <h2 className={cn('mt-8 text-xl font-bold tracking-[0.14em] text-emerald-900', pixelFont)} {...props} />
);

const Heading3 = ({ node: _node, ...props }: MarkdownProps<'h3'>) => (
  <h3 className={cn('mt-6 text-lg font-semibold tracking-[0.12em] text-emerald-900', pixelFont)} {...props} />
);

const Paragraph = ({ node: _node, ...props }: MarkdownProps<'p'>) => (
  <p className={cn('mt-3 text-sm leading-7 text-emerald-900', pixelFont)} {...props} />
);

const UnorderedList = ({ node: _node, ...props }: MarkdownProps<'ul'>) => (
  <ul className={cn('mt-3 list-[square] space-y-1 pl-6 text-sm text-emerald-900', pixelFont)} {...props} />
);

const OrderedList = ({ node: _node, ...props }: MarkdownProps<'ol'>) => (
  <ol className={cn('mt-3 list-decimal space-y-1 pl-6 text-sm text-emerald-900', pixelFont)} {...props} />
);

const ListItem = ({ node: _node, ...props }: MarkdownProps<'li'>) => (
  <li className='leading-7' {...props} />
);

const Anchor = ({ node: _node, ...props }: MarkdownProps<'a'>) => (
  <a
    className={cn(
      'font-semibold text-emerald-800 underline decoration-2 decoration-emerald-800 underline-offset-4 hover:text-emerald-700',
      pixelFont
    )}
    {...props}
  />
);

const HorizontalRule = ({ node: _node, ...props }: MarkdownProps<'hr'>) => (
  <hr className='my-8 border-t-2 border-emerald-900' {...props} />
);

type CodeProps = MarkdownProps<'code'> & { inline?: boolean };

const InlineCode = ({ node: _node, inline: _inline, className, ...props }: CodeProps) => (
  <code
    className={cn(
      'rounded-none border border-emerald-900 bg-emerald-50 px-1.5 py-0.5 text-[0.7rem] text-emerald-900',
      pixelFont,
      className
    )}
    {...props}
  />
);

const Preformatted = ({ node: _node, ...props }: MarkdownProps<'pre'>) => (
  <pre
    className={cn(
      'mt-3 overflow-x-auto rounded-none border-2 border-emerald-950 bg-emerald-950 p-4 text-[0.7rem] text-emerald-100',
      pixelFont,
      'shadow-[4px_4px_0_#052e16]'
    )}
    {...props}
  />
);

const Table = ({ node: _node, ...props }: MarkdownProps<'table'>) => (
  <table
    className={cn(
      'mt-4 w-full border-collapse border-2 border-emerald-950 text-sm text-emerald-900',
      pixelFont
    )}
    {...props}
  />
);

const TableHeader = ({ node: _node, ...props }: MarkdownProps<'th'>) => (
  <th
    className={cn(
      'border border-emerald-950 bg-emerald-900 px-3 py-2 text-left font-semibold text-emerald-100',
      pixelFont
    )}
    {...props}
  />
);

export const CustomTh = ({ node: _node, style, ...props }: MarkdownProps<'th'>) => (
  <th
    className={cn(
      'border border-emerald-950 bg-emerald-900 px-3 py-2 text-left font-semibold text-emerald-100',
      pixelFont
    )}
    style={style}
    {...props}
  />
);

const TableCell = ({ node: _node, ...props }: MarkdownProps<'td'>) => (
  <td className={cn('border border-emerald-950 px-3 py-2 align-top', pixelFont)} {...props} />
);

const Callout = ({ children }: { children: ReactNode }) => (
  <div
    className={cn(
      'rounded-none border-2 border-emerald-950 bg-emerald-50 p-4 text-sm text-emerald-900',
      pixelFont,
      pixelShadow
    )}
  >
    {children}
  </div>
);

const Blockquote = ({ node: _node, ...props }: MarkdownProps<'blockquote'>) => (
  <blockquote
    className={cn(
      'mt-4 rounded-none border-2 border-emerald-950 bg-emerald-50 px-4 py-3 text-sm text-emerald-900',
      pixelFont,
      pixelShadow
    )}
    {...props}
  />
);

export const mdxComponents: MDXComponents = {
  h1: Heading1,
  h2: Heading2,
  h3: Heading3,
  p: Paragraph,
  ul: UnorderedList,
  ol: OrderedList,
  li: ListItem,
  a: Anchor,
  hr: HorizontalRule,
  blockquote: Blockquote,
  code: InlineCode,
  pre: Preformatted,
  table: Table,
  th: TableHeader,
  td: TableCell,
  Card,
  Badge,
  Callout,
};

export const markdownComponents: MarkdownComponents = {
  h1: Heading1,
  h2: Heading2,
  h3: Heading3,
  p: Paragraph,
  ul: UnorderedList,
  ol: OrderedList,
  li: ListItem,
  a: Anchor,
  hr: HorizontalRule,
  blockquote: Blockquote,
  code: InlineCode,
  pre: Preformatted,
  table: Table,
  th: CustomTh,
  td: TableCell,
};
