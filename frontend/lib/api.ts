const PRIMARY_API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
// Falls back to the Dockerized backend when nothing is listening locally on :4000.
const FALLBACK_API_BASE = process.env.NEXT_PUBLIC_API_URL_FALLBACK || 'http://192.168.1.10:8091/api';

let apiBasePromise: Promise<string> | null = null;

// Resolved once per page load, then cached — every call after the first reuses
// whichever base actually answered instead of re-probing on every request.
//THIS THROWS AN ERROR WHEN LOCALHOST 4000 IS NOT AVAILABLE, SO IT FALLS BACK TO THE DOCKERIZED BACKEND
function resolveApiBase(): Promise<string> {
  if (!apiBasePromise) {
    apiBasePromise = fetch(`${PRIMARY_API_BASE}/health`)
      .then((res) => (res.ok ? PRIMARY_API_BASE : FALLBACK_API_BASE))
      .catch(() => FALLBACK_API_BASE);
  }
  return apiBasePromise;
}

async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const base = await resolveApiBase();
  return fetch(`${base}${path}`, init);
}

export interface School {
  SchoolNumber: string;
  SchoolName: string;
}

export interface AppUser {
  UserID: number;
  SchoolNumber: string;
  SchoolName: string;
  NetworkID: string;
  FullName: string;
  IsPowerUser: boolean;
  IsNotificationRecipient: boolean;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface AppUserInput {
  schoolNumber: string;
  networkId: string;
  fullName: string;
  isPowerUser: boolean;
  isNotificationRecipient: boolean;
}

export type UserFilter = 'all' | 'power' | 'notifications' | 'district';

export type DashboardRange = 'today' | 'week' | 'month';

export interface Inspection {
  InspectionID: number;
  SchoolNumber: string;
  SchoolName: string;
  ClassroomNumber: string;
  TemperatureReading: number;
  IssueDescription: string | null;
  CleanlinessRating: number;
  CleaningNotes: string | null;
  InspectedBy: string | null;
  InspectedAt: string;
}

export interface InspectionInput {
  schoolNumber: string;
  classroomNumber: string;
  temperatureReading: number;
  issueDescription?: string;
  cleanlinessRating: number;
  cleaningNotes?: string;
  inspectedBy?: string;
}

export interface DashboardSummary {
  inspectionsCount: number;
  tempAlerts: number;
  cleanlinessAlerts: number;
  avgCleanliness: number | null;
  tempByDay: { day: string; avgTemp: number; isAlert: boolean }[];
  cleanlinessBySchool: { schoolNumber: string; schoolName: string; avgCleanliness: number }[];
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed with status ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const SchoolsApi = {
  async list(): Promise<School[]> {
    const res = await apiFetch('/schools');
    return handleResponse(res);
  },
};

export const UsersApi = {
  async list(params?: { filter?: UserFilter; search?: string }): Promise<AppUser[]> {
    const query = new URLSearchParams();
    if (params?.filter && params.filter !== 'all') query.set('filter', params.filter);
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    const res = await apiFetch(`/users${qs ? `?${qs}` : ''}`);
    return handleResponse(res);
  },

  async create(input: AppUserInput): Promise<AppUser> {
    const res = await apiFetch('/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    return handleResponse(res);
  },

  async update(userId: number, input: AppUserInput): Promise<AppUser> {
    const res = await apiFetch(`/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    return handleResponse(res);
  },

  async remove(userId: number): Promise<void> {
    const res = await apiFetch(`/users/${userId}`, { method: 'DELETE' });
    return handleResponse(res);
  },
};

export const InspectionsApi = {
  async create(input: InspectionInput): Promise<Inspection> {
    const res = await apiFetch('/inspections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    return handleResponse(res);
  },
};

export const DashboardApi = {
  async summary(params?: { range?: DashboardRange; schoolNumber?: string }): Promise<DashboardSummary> {
    const query = new URLSearchParams();
    if (params?.range) query.set('range', params.range);
    if (params?.schoolNumber && params.schoolNumber !== 'all') query.set('schoolNumber', params.schoolNumber);
    const qs = query.toString();
    const res = await apiFetch(`/dashboard/summary${qs ? `?${qs}` : ''}`);
    return handleResponse(res);
  },
};
