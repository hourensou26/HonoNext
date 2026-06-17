import { useEffect, useState } from "react";
import { fetchTodo } from "../api/fetchUpdate";
import { formatUpdate } from "../utils/formatUpdate";
import { UpdateTodoParams, TodoId } from "../types";

export const useUpdate = (todo_id: TodoId) => {
    const [update, setUpdate] = useState<UpdateTodoParams| null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let ignore = false;

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            
            try {
                const fetchedTodo = await fetchTodo(todo_id);
                const formattedUpdate = formatUpdate(fetchedTodo);
                setUpdate(formattedUpdate);
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
    }, [todo_id]);

    return { update, loading, error };
};