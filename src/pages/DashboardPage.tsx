import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { logoutUser } from "../services/authService";
import {
  getTasks,
  createTask,
  toggleTaskCompleted,
  updateTaskTitle,
  deleteTask,
} from "../services/taskService";
import type { Task } from "../types/Task";

function DashboardPage() {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  useEffect(() => {
    async function loadTasks() {
      if (!currentUser) return;
      const data = await getTasks(currentUser.uid);
      setTasks(data);
      setLoadingTasks(false);
    }
    loadTasks();
  }, [currentUser]);

  async function refreshTasks() {
    if (!currentUser) return;
    const data = await getTasks(currentUser.uid);
    setTasks(data);
  }

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser || newTitle.trim() === "") return;

    await createTask(currentUser.uid, newTitle.trim());
    setNewTitle("");
    await refreshTasks();
  }

  async function handleToggleCompleted(task: Task) {
    await toggleTaskCompleted(task.id, !task.completed);
    await refreshTasks();
  }

  function startEditing(task: Task) {
    setEditingTaskId(task.id);
    setEditingTitle(task.title);
  }

  function cancelEditing() {
    setEditingTaskId(null);
    setEditingTitle("");
  }

  async function saveEditing(taskId: string) {
    if (editingTitle.trim() === "") return;
    await updateTaskTitle(taskId, editingTitle.trim());
    setEditingTaskId(null);
    setEditingTitle("");
    await refreshTasks();
  }

  async function handleDeleteTask(taskId: string) {
    const confirmed = window.confirm("¿Seguro que quieres eliminar esta tarea?");
    if (!confirmed) return;

    await deleteTask(taskId);
    await refreshTasks();
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">{currentUser?.email}</p>
          <button
            onClick={() => logoutUser()}
            className="bg-red-600 text-white px-3 py-1 rounded-md text-sm hover:bg-red-700"
          >
            Cerrar sesión
          </button>
        </div>

        <h1 className="text-xl font-semibold text-gray-800">Mis tareas</h1>

        <form onSubmit={handleCreateTask} className="flex gap-2">
          <input
            type="text"
            placeholder="Nueva tarea"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Agregar
          </button>
        </form>

        {loadingTasks && <p className="text-gray-500">Cargando tareas...</p>}

        {!loadingTasks && tasks.length === 0 && (
          <p className="text-gray-500">Todavía no tienes tareas.</p>
        )}

        <ul className="flex flex-col gap-2">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="flex items-center gap-2 border border-gray-200 rounded-md px-3 py-2"
            >
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => handleToggleCompleted(task)}
              />

              {editingTaskId === task.id ? (
                <>
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-md px-2 py-1"
                  />
                  <button
                    onClick={() => saveEditing(task.id)}
                    className="text-green-600 text-sm font-medium"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={cancelEditing}
                    className="text-gray-500 text-sm"
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <>
                  <span
                    className={
                      "flex-1 " +
                      (task.completed ? "line-through text-gray-400" : "")
                    }
                  >
                    {task.title}
                  </span>
                  <button
                    onClick={() => startEditing(task)}
                    className="text-blue-600 text-sm"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="text-red-600 text-sm"
                  >
                    Eliminar
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default DashboardPage;
