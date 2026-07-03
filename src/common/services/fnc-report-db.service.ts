import { Injectable } from '@nestjs/common';
import { FncDB } from './fnc-db.service';
import { PgReportPoolService } from './pg-report-pool.service';

@Injectable()
export class FncReportDB extends FncDB {
  constructor(pgReportPool: PgReportPoolService) {
    // ส่งต่อ PgReportPoolService แทน PgPoolService เพื่อให้ FncDB คุยกับ Report Database
    super(pgReportPool as any);
  }
}
