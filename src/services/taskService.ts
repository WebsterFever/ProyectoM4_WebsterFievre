import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebase";
import type { Task } from "../types/Task";

export async function getTasks(userId: string): Promise<Task[]> {
  const tasksRef = collection(db, "tasks");
  const q = query(tasksRef, where("userId", "==", userId));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Task[];
}

export async function createTask(userId: string, title: string): Promise<void> {
  const tasksRef = collection(db, "tasks");
  const now = Date.now();

  await addDoc(tasksRef, {
    userId,
    title,
    completed: false,
    createdAt: now,
    updatedAt: now,
  });
}
