import Link from 'next/link';

import { MarkdownEditor } from '@/shared/components/Markdown/MarkdownEditor';
import { Button } from '@/shared/components/ui/Button';

export default function MarkdownEditorPage() {
  return (
    <div className='mx-auto flex w-full max-w-6xl flex-col gap-4'>
      <Button asChild className='w-fit' variant='ghost'>
        <Link href='/todos'>← Todo一覧へ戻る</Link>
      </Button>
      <MarkdownEditor />
    </div>
  );
}
