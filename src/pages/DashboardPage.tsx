import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { logoutUser } from "../services/authService";
import {
  createTask,
  toggleTaskCompleted,
  updateTaskTitle,
  deleteTask,
  subscribeToTasks,
} from "../services/taskService";
import { sendEmail } from "../services/emailService";
import type { Task } from "../types/Task";

function DashboardPage() {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = subscribeToTasks(currentUser.uid, (data) => {
      setTasks(data);
      setLoadingTasks(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser || newTitle.trim() === "") return;

    await createTask(currentUser.uid, newTitle.trim());
    setNewTitle("");
  }

  async function handleToggleCompleted(task: Task) {
    await toggleTaskCompleted(task.id, !task.completed);
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
  }

  async function handleDeleteTask(taskId: string) {
    const confirmed = window.confirm("Are you sure you want to delete this task?");
    if (!confirmed) return;

    await deleteTask(taskId);
  }

  async function handleSendSummary() {
    setEmailStatus("sending");

    const summary = tasks
      .map((t) => `- [${t.completed ? "x" : " "}] ${t.title}`)
      .join("\n");

    try {
      await sendEmail({
        to: "webster.fievre@al.infnet.edu.br",
        subject: "Your task summary",
        message: `Here is your task summary:\n\n${summary || "You do not have any tasks yet."}`,
      });
      setEmailStatus("success");
    } catch (error) {
      setEmailStatus("error");
    }
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
            Sign out
          </button>
        </div>

        <h1 className="text-xl font-semibold text-gray-800">My Tasks</h1>

        <div className="flex flex-col gap-1">
          <button
            onClick={handleSendSummary}
            disabled={emailStatus === "sending"}
            className="bg-purple-600 text-white px-4 py-2 rounded-md text-sm hover:bg-purple-700 disabled:opacity-50"
          >
            {emailStatus === "sending" ? "Sending..." : "Send summary by email"}
          </button>
          {emailStatus === "success" && (
            <p className="text-green-600 text-sm">Email sent successfully.</p>
          )}
          {emailStatus === "error" && (
            <p className="text-red-600 text-sm">The email could not be sent.</p>
          )}
        </div>

        <form onSubmit={handleCreateTask} className="flex gap-2">
          <input
            type="text"
            placeholder="New task"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Add
          </button>
        </form>

        {loadingTasks && <p className="text-gray-500">Loading tasks...</p>}

        {!loadingTasks && tasks.length === 0 && (
          <p className="text-gray-500">You do not have any tasks yet.</p>
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
                    Save
                  </button>
                  <button
                    onClick={cancelEditing}
                    className="text-gray-500 text-sm"
                  >
                    Cancel
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
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="text-red-600 text-sm"
                  >
                    Delete
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
