import { api } from './api';
import type {
  FuelEntry,
  MaintenanceEntry,
  OdometerUpdate,
  PaginationMeta,
  Reminder,
  Tokens,
  User,
  Vehicle,
} from './types';

type DataResponse<T> = {
  data: T;
};

type DataMetaResponse<T> = {
  data: T;
  meta: PaginationMeta;
};

type LoginPayload = {
  user: User;
  tokens: Tokens;
};

export async function login(email: string, password: string) {
  const response = await api.post<DataResponse<LoginPayload>>('/auth/login', {
    email,
    password,
  });

  return response.data.data;
}

export async function getCurrentUser() {
  const response = await api.get<DataResponse<{ user: User }>>('/auth/me');
  return response.data.data.user;
}

export async function listVehicles(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
}) {
  const response = await api.get<DataMetaResponse<{ vehicles: Vehicle[] }>>('/vehicles', {
    params,
  });

  return response.data;
}

export async function getVehicle(vehicleId: string) {
  const response = await api.get<DataResponse<{ vehicle: Vehicle }>>(`/vehicles/${vehicleId}`);
  return response.data.data.vehicle;
}

export async function createVehicle(payload: {
  description: string;
  plate: string;
  category?: string;
  currentOdometerKm?: number;
}) {
  const response = await api.post<DataResponse<{ vehicle: Vehicle }>>('/vehicles', payload);
  return response.data.data.vehicle;
}

export async function updateVehicle(
  vehicleId: string,
  payload: Partial<{
    description: string;
    plate: string;
    category: string;
    currentOdometerKm: number;
  }>
) {
  const response = await api.patch<DataResponse<{ vehicle: Vehicle }>>(
    `/vehicles/${vehicleId}`,
    payload
  );

  return response.data.data.vehicle;
}

export async function deleteVehicle(vehicleId: string) {
  await api.delete(`/vehicles/${vehicleId}`);
}

export async function updateVehicleOdometer(
  vehicleId: string,
  payload: {
    odometerKm: number;
    recordedAt?: string;
  }
) {
  const response = await api.post<
    DataResponse<{ vehicle: Vehicle; odometerUpdate: OdometerUpdate }>
  >(`/vehicles/${vehicleId}/odometer`, payload);

  return response.data.data;
}

export async function listFuelEntries(
  vehicleId: string,
  params?: {
    page?: number;
    pageSize?: number;
    fuelType?: string;
    from?: string;
    to?: string;
  }
) {
  const response = await api.get<DataMetaResponse<{ fuelEntries: FuelEntry[] }>>(
    `/vehicles/${vehicleId}/fuel-entries`,
    { params }
  );

  return response.data;
}

export async function createFuelEntry(
  vehicleId: string,
  payload: {
    odometerKm: number;
    unitPrice: number;
    fuelType: string;
    quantity: number;
    notes?: string | null;
    recordedAt?: string;
  }
) {
  const response = await api.post<
    DataResponse<{ fuelEntry: FuelEntry; vehicle: Vehicle }>
  >(`/vehicles/${vehicleId}/fuel-entries`, payload);

  return response.data.data;
}

export async function listMaintenanceEntries(
  vehicleId: string,
  params?: {
    page?: number;
    pageSize?: number;
    maintenanceType?: string;
    from?: string;
    to?: string;
  }
) {
  const response = await api.get<DataMetaResponse<{ maintenanceEntries: MaintenanceEntry[] }>>(
    `/vehicles/${vehicleId}/maintenance-entries`,
    { params }
  );

  return response.data;
}

export async function createMaintenanceEntry(
  vehicleId: string,
  payload: {
    maintenanceType: string;
    price: number;
    odometerKm: number;
    notes?: string | null;
    performedAt?: string;
  }
) {
  const response = await api.post<DataResponse<{ maintenanceEntry: MaintenanceEntry }>>(
    `/vehicles/${vehicleId}/maintenance-entries`,
    payload
  );

  return response.data.data.maintenanceEntry;
}

export async function listReminders(
  vehicleId: string,
  params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    due?: boolean;
  }
) {
  const response = await api.get<DataMetaResponse<{ reminders: Reminder[] }>>(
    `/vehicles/${vehicleId}/reminders`,
    { params }
  );

  return response.data;
}

export async function createReminder(
  vehicleId: string,
  payload: {
    reminderText: string;
    mileageIntervalKm?: number | null;
    remindAtOdometerKm?: number | null;
    monthInterval?: number | null;
    remindAtDate?: string | null;
  }
) {
  const response = await api.post<DataResponse<{ reminder: Reminder }>>(
    `/vehicles/${vehicleId}/reminders`,
    payload
  );

  return response.data.data.reminder;
}
