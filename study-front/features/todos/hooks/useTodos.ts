import { useEffect, useState } from 'react';
import { fetchTodos } from '../api/fetchTodos';
import { formatTodo } from '../utils/formatTodo';
import { Todos } from '../types';

// すべてのTodoを取得するカスタムフック
export const useTodos = () => {
  const [todos, setTodos] = useState<Todos[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  //formatで成形してsetする
  useEffect(() => {
    let ignore = false; //コンポーネントがアンマウントされた後の状態更新を防止

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const fetchedTodos = await fetchTodos();
        const formattedTodos = fetchedTodos.map(todo => formatTodo(todo));
        setTodos(formattedTodos);
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
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
  }, []);

  return { todos, loading, error };
};
