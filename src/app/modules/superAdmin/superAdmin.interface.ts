export type ISuperAdminDashboardStats = {
  totalProperties: number;
  activeCities: number;
  pendingRoles: number;
  activeProjects: number;
};

export type IActivityLog = {
  id: string;
  action: string;
  details: string;
  createdAt: Date;
};
