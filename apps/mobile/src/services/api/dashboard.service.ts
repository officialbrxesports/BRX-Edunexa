import apiClient from "../../lib/api-client";

export type DashboardStats = {
  students: number;
  teachers: number;
  staff: number;
  classes: number;
  activeStudents: number;
  activeTeachers: number;
  activeStaff: number;
  totalUsers: number;
  generatedAt: string;
};

const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const response = await apiClient.get<DashboardStats>(
      "/dashboard/overview",
    );

    return response.data;
  },
};

export default dashboardService;
