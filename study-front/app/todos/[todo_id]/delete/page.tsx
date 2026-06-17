// app/todos/[todo_id]/delete/page.tsx
import { Delete } from '@/features/delete/components/Delete';
import { TodoId } from '@/shared/types';

export default async function DeletePage({ params }: { params: Promise<{ todo_id: TodoId }> }) {
  const { todo_id } = await params;

  return <Delete todo_id={todo_id} />;
}
