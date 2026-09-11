import { apiClient } from './client';
import {
  AuthUser,
  ApiDevice,
  ApiDeviceDetail,
  ApiRepairRequest,
  ApiQuote,
  ApiRepairJob,
  ApiRepairer,
  ApiRepairHistory,
  ApiReview,
  DeviceCategory,
  DeviceCondition,
  UrgencyLevel,
} from './types';

export * from './types';

// ----------------------------------------------------
// AUTH API
// ----------------------------------------------------
export const authApi = {
  register: (data: { name: string; email: string; password: string; role?: string; phone?: string }) =>
    apiClient<{ user: AuthUser; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    apiClient<{ user: AuthUser; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  logout: () => apiClient<{ message: string }>('/api/auth/logout', { method: 'POST' }),

  getMe: () => apiClient<{ user: AuthUser }>('/api/auth/me'),
};

// ----------------------------------------------------
// DEVICES API
// ----------------------------------------------------
export const devicesApi = {
  list: (params?: { page?: number; limit?: number; category?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.category) searchParams.set('category', params.category);
    return apiClient<ApiDevice[]>(`/api/devices?${searchParams.toString()}`);
  },

  getById: (id: string) => apiClient<ApiDeviceDetail>(`/api/devices/${id}`),

  create: (data: {
    category: DeviceCategory;
    brand: string;
    model: string;
    serialNumber: string;
    purchaseDate?: string | null;
    purchasePrice?: number | null;
    warrantyExpiry?: string | null;
    currentValue?: number | null;
    condition?: DeviceCondition;
    imageUrl?: string | null;
  }) => apiClient<ApiDevice>('/api/devices', { method: 'POST', body: JSON.stringify(data) }),

  update: (
    id: string,
    data: Partial<{
      category: DeviceCategory;
      brand: string;
      model: string;
      serialNumber: string;
      purchaseDate?: string | null;
      purchasePrice?: number | null;
      warrantyExpiry?: string | null;
      currentValue?: number | null;
      condition?: DeviceCondition;
      imageUrl?: string | null;
    }>
  ) => apiClient<ApiDevice>(`/api/devices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiClient<{ success: boolean }>(`/api/devices/${id}`, { method: 'DELETE' }),
};

// ----------------------------------------------------
// REPAIR REQUESTS API
// ----------------------------------------------------
export const repairRequestsApi = {
  list: (params?: { page?: number; limit?: number; status?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.status) searchParams.set('status', params.status);
    return apiClient<ApiRepairRequest[]>(`/api/repair-requests?${searchParams.toString()}`);
  },

  getById: (id: string) => apiClient<ApiRepairRequest>(`/api/repair-requests/${id}`),

  create: (data: { deviceId: string; description: string; urgency?: UrgencyLevel }) =>
    apiClient<ApiRepairRequest>('/api/repair-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<{ description: string; urgency: UrgencyLevel; status: string }>) =>
    apiClient<ApiRepairRequest>(`/api/repair-requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiClient<{ success: boolean }>(`/api/repair-requests/${id}`, { method: 'DELETE' }),

  listQuotes: (id: string) => apiClient<ApiQuote[]>(`/api/repair-requests/${id}/quotes`),

  submitQuote: (
    id: string,
    data: { estimatedCost: number; estimatedDays: number; notes?: string }
  ) =>
    apiClient<ApiQuote>(`/api/repair-requests/${id}/quotes`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ----------------------------------------------------
// QUOTES & JOBS API
// ----------------------------------------------------
export const quotesApi = {
  updateStatus: (id: string, data: { status: string; notes?: string }) =>
    apiClient<ApiQuote>(`/api/quotes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) => apiClient<{ success: boolean }>(`/api/quotes/${id}`, { method: 'DELETE' }),
};

export const repairJobsApi = {
  create: (quoteId: string) =>
    apiClient<ApiRepairJob>('/api/repair-jobs', {
      method: 'POST',
      body: JSON.stringify({ quoteId }),
    }),

  getById: (id: string) => apiClient<ApiRepairJob>(`/api/repair-jobs/${id}`),

  updateStatus: (id: string, data: { status: string; actualCost?: number; notes?: string }) =>
    apiClient<ApiRepairJob>(`/api/repair-jobs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

// ----------------------------------------------------
// REPAIR HISTORY & PASSPORT API
// ----------------------------------------------------
export const repairHistoryApi = {
  list: (params?: { page?: number; limit?: number; deviceId?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.deviceId) searchParams.set('deviceId', params.deviceId);
    return apiClient<ApiRepairHistory[]>(`/api/repair-history?${searchParams.toString()}`);
  },
};

// ----------------------------------------------------
// REPAIRERS & REVIEWS API
// ----------------------------------------------------
export const repairersApi = {
  list: (params?: { page?: number; limit?: number; verificationStatus?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    return apiClient<ApiRepairer[]>(`/api/repairers?${searchParams.toString()}`);
  },

  getById: (id: string) => apiClient<ApiRepairer>(`/api/repairers/${id}`),

  createProfile: (data: unknown) =>
    apiClient<ApiRepairer>('/api/repairers', { method: 'POST', body: JSON.stringify(data) }),

  listReviews: (id: string, params?: { page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    return apiClient<ApiReview[]>(`/api/repairers/${id}/reviews?${searchParams.toString()}`);
  },
};

export const reviewsApi = {
  create: (data: { repairJobId: string; rating: number; comment: string }) =>
    apiClient<ApiReview>('/api/reviews', { method: 'POST', body: JSON.stringify(data) }),
};
