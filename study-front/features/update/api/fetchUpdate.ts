import { getTodo } from "@/shared/api/getTodo";
import { TodoResponse, UpdateTodoParams } from "../types";

export const fetchTodo = async (todo_id: string) => {
    return await getTodo(todo_id);
};


export const fetchUpdate = async ({id, title, description, completed}: UpdateTodoParams) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/todos/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            title: title,
            description: description,
            completed: completed,
        }),
    });
    if (!res.ok) {
        throw new Error(`Failed : ${res.status}`);
    }
    
    const data: { data: TodoResponse } = await res.json();

    return data.data;};