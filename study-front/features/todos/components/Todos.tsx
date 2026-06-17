'use client';

import Link from 'next/link';
import { CirclePlus } from 'lucide-react';

import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';

import { useTodos } from '../hooks/useTodos';

export const Todos = () => {
  const { todos, loading, error } = useTodos();

  if (loading) return <p className='mx-auto max-w-4xl text-sm text-slate-600'>読み込み中...</p>;
  if (error) return <p className='mx-auto max-w-4xl text-sm text-rose-700'>エラー: {error.message}</p>;

  return (
    <section className='mx-auto flex w-full max-w-4xl flex-col gap-6'>
      <header className='flex flex-wrap items-end justify-between gap-3'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Todo List</h1>
          <p className='mt-1 text-sm text-slate-500'>やることを整理して、進捗を管理しましょう。</p>
        </div>
        <div className='flex gap-2'>
          <Button asChild variant='secondary'>
            <Link href='/mdx-page'>アプリ解説</Link>
          </Button>
          <Button asChild>
            <Link href='/todos/create'>
              <CirclePlus className='mr-2 h-4 w-4' />
              新規作成
            </Link>
          </Button>
        </div>
      </header>

      <div className='grid gap-3'>
        {todos.map(todo => (
          <Card key={todo.id} className='p-4'>
            <Link className='block' href={`/todos/${todo.id}`}>
              <div className='flex items-center justify-between gap-3'>
                <p className='text-base font-semibold text-slate-900'>{todo.title}</p>
                <Badge
                  className={
                    todo.completed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }
                >
                  {todo.completed ? '完了' : '未完了'}
                </Badge>
              </div>
            </Link>
          </Card>
        ))}
      </div>

      {todos.length === 0 && (
        <Card className='text-center'>
          <p className='text-sm text-slate-500'>Todo がまだありません。新規作成から追加してください。</p>
        </Card>
      )}
    </section>
  );
};
