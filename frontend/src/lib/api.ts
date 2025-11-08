import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface User {
  _id?: string;
  name: string;
  email: string; // Add email field
  role: 'user' | 'admin';
  phone: string;
  address?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user: User;
}

export const userApi = {
  // Sign in with email and password
  signIn: async ({ email, password }: { email: string; password: string }) => {
    const response = await fetch('http://localhost:5001/api/users/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!response.ok) throw await response.json();
    return await response.json();
  },
  // Register a new user
  register: async ({ email, password, name, phone }: { email: string; password: string; name: string; phone: string }) => {
    const response = await fetch('http://localhost:5001/api/users/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, phone })
    });
    if (!response.ok) throw await response.json();
    return await response.json();
  },
  // Get all users
  getAllUsers: async () => {
    const response = await api.get<User[]>('/users');
    return response.data;
  },

  // Get user by ID
  getUserById: async (id: string) => {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  },

  // Update user
  updateUser: async (id: string, userData: Partial<User>) => {
    const response = await api.put<User>(`/users/${id}`, userData);
    return response.data;
  },

  // Update user profile
  updateProfile: async (userData: Partial<User>) => {
    const response = await api.put<User>('/users/profile', userData);
    return response.data;
  },

  // Delete user
  deleteUser: async (id: string) => {
    await api.delete(`/users/${id}`);
  },
};