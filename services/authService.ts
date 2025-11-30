
import { User } from "../types";

const USERS_KEY = 'lumina_users';
const SESSION_KEY = 'lumina_session';

// Helper to simulate a delay for realism
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const registerUser = async (name: string, email: string, password: string): Promise<User> => {
  await delay(800); // Simulate network request

  const usersStr = localStorage.getItem(USERS_KEY);
  const users = usersStr ? JSON.parse(usersStr) : [];

  // Check if email exists
  if (users.find((u: any) => u.email === email)) {
    throw new Error("Email already registered");
  }

  const newUser = {
    id: Date.now().toString(),
    name,
    email,
    password, // In a real app, never store plain text passwords!
  };

  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));

  // Return user without password
  const { password: _, ...userSafe } = newUser;
  return userSafe;
};

export const loginUser = async (email: string, password: string): Promise<User> => {
  await delay(800);

  const usersStr = localStorage.getItem(USERS_KEY);
  const users = usersStr ? JSON.parse(usersStr) : [];

  const user = users.find((u: any) => u.email === email && u.password === password);

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const { password: _, ...userSafe } = user;
  
  // Save session
  localStorage.setItem(SESSION_KEY, JSON.stringify(userSafe));
  
  return userSafe;
};

export const logoutUser = () => {
  localStorage.removeItem(SESSION_KEY);
};

export const getSession = (): User | null => {
  const sessionStr = localStorage.getItem(SESSION_KEY);
  return sessionStr ? JSON.parse(sessionStr) : null;
};
