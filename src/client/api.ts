import type {
  AppConfig,
  TrainConfig,
  TicketsResponse,
  SchedulerStatus,
} from '../shared/types.js';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, options);
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  getConfig: () => request<AppConfig>('/api/config'),

  updateConfig: (partial: Partial<AppConfig>) =>
    request<AppConfig>('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partial),
    }),

  addTrain: (train: Omit<TrainConfig, 'id' | 'enabled'>) =>
    request<TrainConfig>('/api/trains', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(train),
    }),

  deleteTrain: (id: string) =>
    request<{ success: boolean }>(`/api/trains/${id}`, { method: 'DELETE' }),

  getTickets: () => request<TicketsResponse>('/api/tickets'),

  setCellStatus: (trainNo: string, date: string, status: string, seatType?: string) =>
    request<{ success: boolean }>('/api/bought', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trainNo, date, status, seatType }),
    }),

  unmarkBought: (trainNo: string, date: string) =>
    request<{ success: boolean }>(`/api/bought/${trainNo}/${date}`, { method: 'DELETE' }),

  getSchedulerStatus: () => request<SchedulerStatus>('/api/scheduler'),

  startScheduler: () =>
    request<SchedulerStatus>('/api/scheduler/start', { method: 'POST' }),

  stopScheduler: () =>
    request<SchedulerStatus>('/api/scheduler/stop', { method: 'POST' }),
};
