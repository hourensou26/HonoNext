'use client';

import { FC } from 'react';
import Link from 'next/link';
import { ArrowLeft, CircleCheckBig } from 'lucide-react';

import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';

import { useDelete } from '../hooks/useDelete';
import { TodoId } from '../types';

interface DeleteProps {
  todo_id: TodoId;
}


export const Delete: FC<DeleteProps> = ({ todo_id }) => {
  const { deleteResponse, loading, error } = useDelete(todo_id);

  if (loading) return <p className='mx-auto max-w-3xl text-sm text-slate-600'>読み込み中...</p>;
  if (error) return <p className='mx-auto max-w-3xl text-sm text-rose-700'>エラー: {error.message}</p>;
  if (!deleteResponse) return <p className='mx-auto max-w-3xl text-sm text-slate-500'>データがありません</p>;

  return (
    <section className='mx-auto flex w-full max-w-3xl flex-col gap-4'>
      <Button asChild className='w-fit' variant='ghost'>
        <Link href='/todos'>
          <ArrowLeft className='mr-2 h-4 w-4' />
          一覧に戻る
        </Link>
      </Button>

      <Card className='space-y-4'>
        <div className='flex items-center gap-2 text-emerald-700'>
          <CircleCheckBig className='h-5 w-5' />
          <h1 className='text-xl font-bold'>削除完了</h1>
        </div>
        <p className='text-sm text-slate-700'>Todo ID: {todo_id}</p>
        <p className='text-sm text-slate-700'>削除リクエストが正常に完了しました。</p>
        <pre className='overflow-x-auto rounded-xl bg-slate-900 p-4 text-xs text-slate-100'>
          {JSON.stringify(deleteResponse, null, 2)}
        </pre>
      </Card>
    </section>
  );
};
