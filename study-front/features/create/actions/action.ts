// app/actions.ts
'use server'

import { redirect } from 'next/navigation'
import { fetchCreate } from '../api/fetchCreate';
import { formatCreateResponse } from '../utils/formatTodo';
import { ActionState, CreateTodoParams } from '../types';

export async function createAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const title = formData.get('title') as CreateTodoParams['title'];
  const description = formData.get('description') as CreateTodoParams['description'];

  if (!title) {
    return { error: 'タイトル必須' }
  }

  // API or DB処理
  const res = await fetchCreate({ title, description });
  const formatted = formatCreateResponse(res);
  

  redirect(`/todos/${formatted.id}`)
}