import { useState } from 'react';
import { useRouter } from 'next/navigation'
import { fetchCreate } from '../api/fetchCreate';
import { formatCreateResponse } from '../utils/formatTodo';
import { CreateTodoParams } from '../types';

export const useCreate = ({ title, description }: CreateTodoParams) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const router = useRouter();

    const create = async () => {
        setLoading(true);
        setError(null);
      try {
        const res = await fetchCreate({ title, description });
        const formatted = formatCreateResponse(res);
        
        router.push(`/todos/${formatted.id}`); //作成後にTodo一覧ページへ遷移    
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
        }
    };

    return { loading, error, create };
};