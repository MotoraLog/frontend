export type ApiErrorResponse = {
  error?: {
    message?: string;
    code?: string;
    details?: unknown;
  };
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type User = {
  id: string;
  email: string;
  name: string;
};

export type Tokens = {
  accessToken: string;
  refreshToken: string;
};

export type Vehicle = {
  id: string;
  userId: string;
  description: string;
  plate: string;
  category: string;
  currentOdometerKm: number;
  createdAt: string | null;
  updatedAt: string | null;
};

export type OdometerUpdate = {
  id: string;
  userId: string;
  vehicleId: string;
  odometerKm: number;
  recordedAt: string | null;
  createdAt: string | null;
};

export type FuelEntry = {
  id: string;
  userId: string;
  vehicleId: string;
  odometerKm: number;
  unitPrice: number;
  fuelType: string;
  quantity: number;
  totalPrice: number;
  notes: string | null;
  recordedAt: string | null;
  createdAt: string | null;
};

export type MaintenanceEntry = {
  id: string;
  userId: string;
  vehicleId: string;
  maintenanceType: string;
  price: number | null;
  odometerKm: number;
  notes: string | null;
  performedAt: string | null;
  createdAt: string | null;
};

export type ReminderDueState = {
  dueByMileage: boolean;
  dueByDate: boolean;
  isDue: boolean;
};

export type Reminder = {
  id: string;
  userId: string;
  vehicleId: string;
  reminderText: string;
  currentOdometerKm: number;
  mileageIntervalKm: number | null;
  remindAtOdometerKm: number | null;
  monthInterval: number | null;
  remindAtDate: string | null;
  status: string;
  createdAt: string | null;
  updatedAt: string | null;
  dueState: ReminderDueState;
};
