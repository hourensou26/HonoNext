// app/todos/[todo_id]/update/page.tsx
import { Update } from '@/features/update';
import { TodoId } from '@/shared/types';

export default async function UpdatePage({ params }: { params: Promise<{ todo_id: TodoId }> }) {
  const { todo_id } = await params;

  return <Update todoId={todo_id} />;
}
