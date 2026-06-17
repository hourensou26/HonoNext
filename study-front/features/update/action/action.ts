// app/actions.ts
'use server'

import { redirect } from 'next/navigation'
import { fetchUpdate } from '../api/fetchUpdate';
import { formatUpdate } from '../utils/formatUpdate';
import { ActionState, TodoId, UpdateTodoParams } from '../types';

export async function updateAction(todo_id: TodoId, _prevState: ActionState, formData: FormData): Promise<ActionState> { 
  const id = todo_id;
  const title = formData.get('title') as UpdateTodoParams['title'];
  const description = formData.get('description') as UpdateTodoParams['description'];
  const completed = formData.get('completed') === 'on'; // チェックボックスの値をbooleanに変換
    
  if (!title) {
    return { error: 'タイトル必須' }
  }

  // API or DB処理
  const res = await fetchUpdate({ id: Number(id), title, description, completed });
  const formatted = formatUpdate(res);

  redirect(`/todos/${formatted.id}`)
}