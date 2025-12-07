// Auth API client for Spring Boot backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081/api';

const TOKEN_KEY = 'gardenspace_token';
const USER_KEY = 'gardenspace_user';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'user' | 'admin';
  avatarUrl: string | null;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Token management
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

// User management in localStorage
export const getStoredUser = (): User | null => {
  const userStr = localStorage.getItem(USER_KEY);
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
  return null;
};

export const setStoredUser = (user: User): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const removeStoredUser = (): void => {
  localStorage.removeItem(USER_KEY);
};

// Auth API functions
export const authApi = {
  register: async (email: string, password: string, fullName: string, role: 'user' | 'admin' = 'user'): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, fullName, role }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    const data = await response.json();
    setToken(data.token);
    setStoredUser(data.user);
    return data;
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Invalid login credentials');
    }

    const data = await response.json();
    setToken(data.token);
    setStoredUser(data.user);
    return data;
  },

  logout: (): void => {
    removeToken();
    removeStoredUser();
  },

  getCurrentUser: async (): Promise<AuthResponse | null> => {
    const token = getToken();
    if (!token) return null;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        removeToken();
        removeStoredUser();
        return null;
      }

      const data = await response.json();
      setStoredUser(data.user);
      return data;
    } catch {
      removeToken();
      removeStoredUser();
      return null;
    }
  },
};

// Get auth headers for API requests
export const getAuthHeaders = (): Record<string, string> => {
  const token = getToken();
  if (token) {
    return { 'Authorization': `Bearer ${token}` };
  }
  return {};
};
