// API client for Spring Boot backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081/api';

interface Garden {
  id: string;
  name: string;
  description: string;
  address: string;
  basePricePerMonth: number;
  availablePlots: number;
  totalPlots: number;
  sizeSqm: number | null;
  amenities: string[] | null;
  images: string[] | null;
  ownerId: string;
}

interface Booking {
  id: string;
  gardenId: string;
  userId: string;
  startDate: string;
  endDate: string;
  durationMonths: number;
  totalPrice: number;
  status: string;
  paymentMethod: string | null;
}

interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
}

// Helper to convert snake_case API response to camelCase
const toCamelCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      acc[camelKey] = toCamelCase(obj[key]);
      return acc;
    }, {} as any);
  }
  return obj;
};

// Helper to convert camelCase to snake_case for API requests
const toSnakeCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase);
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      acc[snakeKey] = toSnakeCase(obj[key]);
      return acc;
    }, {} as any);
  }
  return obj;
};

async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return toCamelCase(data);
}

// Garden API
export const gardenApi = {
  getAll: () => apiRequest<Garden[]>('/gardens'),
  
  getById: (id: string) => apiRequest<Garden>(`/gardens/${id}`),
  
  getByOwner: (ownerId: string) => apiRequest<Garden[]>(`/gardens?ownerId=${ownerId}`),
  
  getAvailable: () => apiRequest<Garden[]>('/gardens/available'),
  
  search: (query: string) => apiRequest<Garden[]>(`/gardens/search?query=${encodeURIComponent(query)}`),
  
  create: (garden: Partial<Garden>) => 
    apiRequest<Garden>('/gardens', {
      method: 'POST',
      body: JSON.stringify(toSnakeCase(garden)),
    }),
  
  update: (id: string, garden: Partial<Garden>) =>
    apiRequest<Garden>(`/gardens/${id}`, {
      method: 'PUT',
      body: JSON.stringify(toSnakeCase(garden)),
    }),
  
  delete: (id: string) =>
    apiRequest<void>(`/gardens/${id}`, { method: 'DELETE' }),
};

// Booking API
export const bookingApi = {
  getAll: () => apiRequest<Booking[]>('/bookings'),
  
  getById: (id: string) => apiRequest<Booking>(`/bookings/${id}`),
  
  getByUser: (userId: string) => apiRequest<Booking[]>(`/bookings/user/${userId}`),
  
  getByGarden: (gardenId: string) => apiRequest<Booking[]>(`/bookings/garden/${gardenId}`),
  
  create: (booking: Partial<Booking>) =>
    apiRequest<Booking>('/bookings', {
      method: 'POST',
      body: JSON.stringify(toSnakeCase(booking)),
    }),
  
  confirm: (id: string, paymentMethod: string) =>
    apiRequest<Booking>(`/bookings/${id}/confirm?paymentMethod=${encodeURIComponent(paymentMethod)}`, {
      method: 'PATCH',
    }),
  
  cancel: (id: string) =>
    apiRequest<Booking>(`/bookings/${id}/cancel`, { method: 'PATCH' }),
  
  delete: (id: string) =>
    apiRequest<void>(`/bookings/${id}`, { method: 'DELETE' }),
};

// User API
export const userApi = {
  getAll: () => apiRequest<User[]>('/users'),
  
  getById: (id: string) => apiRequest<User>(`/users/${id}`),
  
  getGardens: (userId: string) => apiRequest<Garden[]>(`/users/${userId}/gardens`),
  
  update: (id: string, user: Partial<User>) =>
    apiRequest<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(toSnakeCase(user)),
    }),
};

export type { Garden, Booking, User };
