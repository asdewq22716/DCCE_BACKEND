/**
 * ==========================================
 * 📂 organization.type.ts - ประเภทข้อมูลหน่วยงาน/สาขา
 * ==========================================
 */
export type OrganizationType = {
  org_id: number;
  org_name: string;
  parent_id: number | null;
  sort_order: number;
  level: number;
  is_active: number;
  unit_data_permissions?: number;
  unit_view_climate_index?: number;
  unit_view_ghg_emissions?: number;
  unit_edit_historical_data?: number;
  unit_approve_public_data?: number;
  unit_remark?: string | null;
  created_at?: Date;
  updated_at?: Date;

  // ฟิลด์ส่วนเสริมเพิ่มเติมกรณีการดึงข้อมูลสัมพันธ์
  units?: OrganizationType[];
  user_count?: number;
};
