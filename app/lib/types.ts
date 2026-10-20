export type Role = "OWNER" | "ADMIN" | "MEMBER";

export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: Role;
  user: User;
}

export interface TaskAssignee {
  user: User;
}

export interface Task {
  id: string;
  columnId: string;
  title: string;
  description: string | null;
  priority: Priority;
  dueDate: string | null;
  position: number;
  createdAt: string;
  assignees: TaskAssignee[];
  _count?: { comments: number };
  comments?: Comment[];
  column?: { id: string; title: string };
}

export interface BoardColumn {
  id: string;
  projectId: string;
  title: string;
  position: number;
  tasks: Task[];
}

export interface Project {
  id: string;
  title: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
  members: ProjectMember[];
  columns: BoardColumn[];
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
  user: User;
}

export interface AppNotification {
  id: string;
  userId: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}
