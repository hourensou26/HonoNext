'use client';

import type { FC } from 'react';
import Link from 'next/link';
import { ArrowLeft, SquarePen, Trash2 } from 'lucide-react';

import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';

import { useTodo } from '../hooks/useTodo';
import { TodoId } from '../types';

interface TodoProps {
  todoId: TodoId;
}

// appからparameterを受け取る
export const Todo: FC<TodoProps> = ({ todoId }) => {
  const { todo, loading, error } = useTodo(todoId);

  if (loading) return <p className='mx-auto max-w-3xl text-sm text-slate-600'>読み込み中...</p>;
  if (error) return <p className='mx-auto max-w-3xl text-sm text-rose-700'>エラー: {error.message}</p>;
  if (!todo) return <p className='mx-auto max-w-3xl text-sm text-slate-500'>データがありません</p>;

  return (
    <section className='mx-auto flex w-full max-w-3xl flex-col gap-4'>
      <Button asChild className='w-fit' variant='ghost'>
        <Link href='/todos'>
          <ArrowLeft className='mr-2 h-4 w-4' />
          一覧に戻る
        </Link>
      </Button>

      <Card className='space-y-4'>
        <div className='flex items-center justify-between gap-3'>
          <h1 className='text-2xl font-bold text-slate-900'>{todo.title}</h1>
          <Badge className={todo.completed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>
            {todo.completed ? '完了' : '未完了'}
          </Badge>
        </div>
        <p className='rounded-xl bg-slate-50 p-4 text-sm leading-7 text-slate-700'>{todo.description || '説明なし'}</p>
        <p className='text-xs text-slate-500'>作成日: {new Date(todo.createdAt).toLocaleDateString('ja-JP')}</p>
      </Card>

      <div className='flex gap-2'>
        <Button asChild variant='secondary'>
          <Link href={`/todos/${todoId}/update`}>
            <SquarePen className='mr-2 h-4 w-4' />
            編集
          </Link>
        </Button>
        <Button asChild variant='danger'>
          <Link href={`/todos/${todoId}/delete`}>
            <Trash2 className='mr-2 h-4 w-4' />
            削除
          </Link>
        </Button>
      </div>
    </section>
  );
};
