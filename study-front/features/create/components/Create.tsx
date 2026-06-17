'use client';

import { FC, useActionState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Input } from '@/shared/components/ui/Input';
import { Textarea } from '@/shared/components/ui/Textarea';

import { createAction } from '../actions/action';

export const Create: FC = () => {
  const [state, formAction, isPending] = useActionState(createAction, { error: '' });

  return (
    <section className='mx-auto flex w-full max-w-3xl flex-col gap-4'>
      <Button asChild className='w-fit' variant='ghost'>
        <Link href='/todos'>
          <ArrowLeft className='mr-2 h-4 w-4' />
          一覧に戻る
        </Link>
      </Button>

      <Card>
        <h2 className='text-2xl font-bold'>Todoを作成</h2>
        <p className='mt-1 text-sm text-slate-500'>タイトルと説明を入力して追加します。</p>

        <form action={formAction} className='mt-6 space-y-4'>
          <div className='space-y-2'>
            <label className='text-sm font-medium text-slate-700' htmlFor='title'>
              タイトル
            </label>
            <Input id='title' name='title' placeholder='例: TypeScript学習を30分進める' required />
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium text-slate-700' htmlFor='description'>
              説明
            </label>
            <Textarea id='description' name='description' placeholder='補足情報を入力' />
          </div>

          {state.error && <p className='text-sm text-rose-700'>エラー: {state.error}</p>}

          <Button disabled={isPending} type='submit'>
            {isPending ? '作成中...' : '作成する'}
          </Button>
        </form>
      </Card>
    </section>
  );
};
