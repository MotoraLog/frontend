export type AuthStackParamList = {
  Login: undefined;
};

export type AppStackParamList = {
  Dashboard: undefined;
  Vehicles: undefined;
  VehicleForm: { vehicleId?: string } | undefined;
  VehicleDetail: { vehicleId: string };
  FuelForm: { vehicleId: string; vehicleDescription?: string };
  MaintenanceForm: { vehicleId: string; vehicleDescription?: string };
  ReminderForm: { vehicleId: string; vehicleDescription?: string };
  Profile: undefined;
};
