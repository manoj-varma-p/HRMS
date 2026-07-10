export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ActivityEntry {
  id: string;
  action: string;
  actorEmployeeId: string;
  targetType: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface ActivityListResult {
  activities: ActivityEntry[];
  pagination: PaginationInfo;
}
