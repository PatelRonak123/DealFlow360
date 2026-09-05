import {
  adminRepository,
  AdminRepository,
  AdminDashboardMetrics,
} from '../repositories/admin.repository.js';
import { UpdateSettingsInput } from '../validators/settings.validator.js';
import { SystemSetting } from '../../../database/schema/index.js';

export class AdminService {
  constructor(private readonly repository: AdminRepository = adminRepository) {}

  async getDashboardMetrics(): Promise<AdminDashboardMetrics> {
    return this.repository.getDashboardMetrics();
  }

  async getSettings(): Promise<SystemSetting> {
    return this.repository.getSettings();
  }

  async updateSettings(data: UpdateSettingsInput): Promise<SystemSetting> {
    return this.repository.updateSettings(data);
  }
}

export const adminService = new AdminService();
