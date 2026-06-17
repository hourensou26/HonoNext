import { useEffect, useState } from 'react';
import { fetchTodo } from '../api/fetchTodo';
import { formatTodo } from '../utils/formatTodo';
import { Todo, TodoId } from '../types';

//IDに基づいて特定のTodoを取得
export const useTodo = (todo_id: TodoId) => {
  const [todo, setTodo] = useState<Todo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let ignore = false; //コンポーネントがアンマウントされた後の状態更新を防止

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const fetchedTodo = await fetchTodo(todo_id);
        const formattedTodo = formatTodo(fetchedTodo);
        setTodo(formattedTodo);
      } catch (err) {
        if (!ignore){
          setError(err as Error);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      ignore = true;
    };
  }, [todo_id]);

  return { todo, loading, error };
};
