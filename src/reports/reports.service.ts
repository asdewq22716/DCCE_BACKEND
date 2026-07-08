import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { FncReportDB } from '../common/services/fnc-report-db.service';
import { FncDB } from '../common/services/fnc-db.service';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private readonly reportDb: FncReportDB, // ฐานข้อมูลสำหรับ Report (Read-only)
    private readonly mainDb: FncDB          // ฐานข้อมูลหลัก (Main DB)
  ) {}

  async getFactApiDetail(orgBranchId: number) {
    // ระบบ Mapping รหัสสาขาระหว่างฝั่งเว็บ (org_id) กับฝั่ง Report DB (branch_id)
    const branchMapping: Record<number, number> = {
      50: 1, // สาขาการจัดการทรัพยากรน้ำ
      53: 2, // สาขาเกษตรและความมั่นคงทางอาหาร
      30: 3, // สาขาทรัพยากรธรรมชาติ
      40: 4, // สาขาการท่องเที่ยว
      33: 5, // สาขาสาธารณสุข
      26: 6, // สาขาการตั้งถิ่นฐานและความมั่นคงของมนุษย์
    };

    // แปลงรหัส หากไม่เจอใน Mapping จะคืนค่าเป็น null หรือตัวมันเอง (ขึ้นอยู่กับดีไซน์ แต่ในที่นี้จะกันพลาดให้เป็น null ถ้าไม่มี)
    const reportBranchId = branchMapping[orgBranchId];
    
    // ถ้าหา mapping ไม่เจอ อาจจะแปลว่า org_id นี้ไม่มีใน report หรือยังไม่ได้ทำ mapping
    const whereClause = reportBranchId ? `branch_id = '${reportBranchId}'` : `1 = 0`; // ถ้าไม่มีสิทธิ์/หาไม่เจอ ให้คืนค่าว่างเลย

    const rows = await this.reportDb.queryBuilder({
      select: `SELECT * FROM fact_api_detail`,
      where: whereClause,
      // ไม่มี limit/offset เพราะส่งข้อมูลทั้งหมดให้ระบบภายนอก
    });

    return {
      rows,
      total_fetched: rows.length,
    };
  }

  async getCredentials(requestId: string, userId: string) {
    // 1. ค้นหา Token ที่ถูกสร้างขึ้นตอนอนุมัติจากตาราง api_tokens
    const tokens = await this.mainDb.query(
      `SELECT * FROM api_tokens WHERE request_id = $1 AND is_active = 1 ORDER BY created_at DESC LIMIT 1`,
      [requestId]
    );

    if (tokens.length === 0) {
      throw new NotFoundException('ไม่พบข้อมูลคำขอใช้งาน API หรือคำขอยังไม่ได้รับการอนุมัติ');
    }

    const tokenData = tokens[0];
    const apiUrl = process.env.BASE_URL ? `${process.env.BASE_URL}/reports/fact-api-detail` : `http://localhost:3000/reports/fact-api-detail`;

    return {
      api_url: apiUrl,
      api_token: tokenData.token,
      expired_at: tokenData.expired_at,
      sample_json: {
        success: true,
        data: [
          {
            branch_id: "1",
            category: "สาขาการจัดการทรัพยากรน้ำ",
            subject_id: "SUBJ-001",
            subject_no: 1,
            subject_name: "การอนุรักษ์ฟื้นฟูแหล่งน้ำ",
            question_id: "Q-1001",
            question_no: 1,
            question_detail: "ปริมาณน้ำที่กักเก็บได้เพิ่มขึ้น",
            unit_name: "ลูกบาศก์เมตร",
            ans_ans_id: "ANS-9901",
            ans_ans_header_id: "HDR-500",
            ans_ans_status: 2,
            ans_created_by: 1045,
            ans_created_date: "2026-07-01T10:00:00.000Z",
            ans_created_name: "นาย สมชาย ใจดี",
            ans_division_id: 200,
            ans_division_name: "กรมทรัพยากรน้ำ",
            ans_period_end: "2026-12-31",
            ans_period_id: "PRD-2026-Q4",
            ans_period_start: "2026-10-01",
            ans_updated_by: 1045,
            ans_updated_date: "2026-07-02T14:30:00.000Z",
            av_calculate_name: "ผลรวมปริมาตรน้ำ",
            av_calculate_value: "1500000",
            av_file: "https://example.com/files/report.pdf",
            av_input_value: "1500000",
            av_unit: "ลูกบาศก์เมตร",
            av_year: "2026",
            sub_label: "ขนาดพื้นที่ (ตร.กม.)",
            sub_value: "120000",
            sub_river: "แม่น้ำเจ้าพระยา",
            sub_season: "ฤดูแล้ง",
            sub_region: "ภาคกลาง",
            sub_province_code: "กาญจนบุรี",
            sub_after: "ค่าหลังปรับปฏิทิน",
            sub_before: "ค่าก่อนปรับปฏิทิน",
            sub_plan_name: "แผนพัฒนาสุขภาพประชาชน"
          }
        ],
        total_fetched: 1
      }
    };
  }
}
