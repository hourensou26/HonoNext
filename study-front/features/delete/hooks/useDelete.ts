import { useEffect, useState } from 'react';
import { fetchDelete } from '../api/fetchDelete';
import { convertResponse } from '../utils/convertResponse';
import { TodoId, DeleteResponse } from '../types';

export const useDelete = (todo_id: TodoId) => {
  const [deleteResponse, setDeleteResponse] = useState<DeleteResponse>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let ignore = false;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetchDelete(todo_id);
        const changedResponse = convertResponse(response);
        setDeleteResponse(changedResponse);
      } catch (err) {
        if (!ignore) {
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
  }, []);

  return { deleteResponse, loading, error };
};
