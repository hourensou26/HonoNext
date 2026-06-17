'use client';

import { FC, useActionState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Input } from '@/shared/components/ui/Input';
import { Textarea } from '@/shared/components/ui/Textarea';

import { useUpdate } from '../hooks/useUpdate';
import { TodoId } from '../types';
import { updateAction } from '../action/action';

interface UpdateProps {
  todoId: TodoId;
}

// appからparameterを受け取る
export const Update: FC<UpdateProps> = ({ todoId }) => {
  const [state, formAction, isPending] = useActionState(updateAction.bind(null, todoId), { error: '' });
  const { update, loading, error } = useUpdate(todoId);

  if (loading) return <p className='mx-auto max-w-3xl text-sm text-slate-600'>読み込み中...</p>;
  if (error) return <p className='mx-auto max-w-3xl text-sm text-rose-700'>エラー: {error.message}</p>;
  if (!update) return <p className='mx-auto max-w-3xl text-sm text-slate-500'>データがありません</p>;

  return (
    <section className='mx-auto flex w-full max-w-3xl flex-col gap-4'>
      <Button asChild className='w-fit' variant='ghost'>
        <Link href='/todos'>
          <ArrowLeft className='mr-2 h-4 w-4' />
          一覧に戻る
        </Link>
      </Button>

      <Card>
        <div className='flex items-center justify-between'>
          <h2 className='text-2xl font-bold'>Todoを編集</h2>
          <Badge className='bg-sky-100 text-sky-700'>ID: {update.id}</Badge>
        </div>
        <form action={formAction} className='mt-6 space-y-4'>
          <input name='id' type='hidden' value={update.id} />

          <div className='space-y-2'>
            <label className='text-sm font-medium text-slate-700' htmlFor='title'>
              タイトル
            </label>
            <Input defaultValue={update.title} id='title' name='title' required type='text' />
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium text-slate-700' htmlFor='description'>
              説明
            </label>
            <Textarea defaultValue={update.description} id='description' name='description' />
          </div>

          <label className='flex items-center gap-2 text-sm text-slate-700'>
            <input className='h-4 w-4 rounded border-slate-300 accent-sky-600' defaultChecked={update.completed} name='completed' type='checkbox' />
            完了
          </label>

          {state.error && <p className='text-sm text-rose-700'>エラー: {state.error}</p>}

          <Button disabled={isPending} type='submit'>
            {isPending ? '更新中...' : '更新する'}
          </Button>
        </form>
      </Card>
    </section>
  );
};
