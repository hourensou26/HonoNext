import type { MDXComponents } from 'mdx/types';

import { mdxComponents } from '@/shared/components/Mdx/markdownComponents';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...mdxComponents,
    ...components,
  };
}
