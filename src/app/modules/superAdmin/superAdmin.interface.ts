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
  userId?: string | null;
  ipAddress?: string | null;
  createdAt: Date;
  user?: {
    email: string;
    fullName: string;
  } | null;
};
