import { getTodo } from "@/shared/api/getTodo";

export const fetchTodo = async (todo_id: string) => {
  return await getTodo(todo_id);
}


export const fetchDelete = async (todo_id: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/todos/${todo_id}`, {
        method: 'DELETE',
    });
    if (!res.ok) {
        throw new Error(`Failed : ${res.status}`);
    }
  
    const data = await res.json();
    return {
        statusCode: data.statusCode,
        data: data.data,
    };
}