// app/todos/[todo_id]/page.tsx
import { Todo } from '@/features/todo';
import { TodoId } from '@/shared/types';
  
export default async function TodoPage({ params }: { params: Promise<{ todo_id: TodoId }> }) {
  const { todo_id } = await params;

  return <Todo todoId={todo_id} />;
}
