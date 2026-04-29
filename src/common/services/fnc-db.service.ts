import { Injectable, Logger } from '@nestjs/common';
import { PoolClient } from 'pg';
import { PgPoolService } from './pg-pool.service';

@Injectable()
export class FncDB {
  private readonly logger = new Logger(FncDB.name);

  constructor(private readonly pgPool: PgPoolService) { }

  // ---------- Transaction Handling ----------

  /**
   * เริ่มต้น Transaction (คืนค่า Client เพื่อนำไปใช้ต่อในฟังก์ชันอื่นๆ)
   */
  async startTransaction(): Promise<PoolClient> {
    const client = await this.pgPool.pool.connect();
    await client.query('BEGIN');
    return client;
  }

  async commit(client: PoolClient) {
    try {
      await client.query('COMMIT');
    } finally {
      client.release();
    }
  }

  async rollback(client: PoolClient) {
    try {
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  }

  // ---------- Raw Execution ----------

  async query<T = any>(text: string, params?: any[]): Promise<T[]> {
    const result = await this.pgPool.pool.query(text, params);
    return result.rows;
  }

  async queryTx<T = any>(client: PoolClient, text: string, params?: any[]): Promise<T[]> {
    const result = await client.query(text, params);
    return result.rows;
  }

  // ---------- CRUD Helpers ----------

  /**
   * ค้นหาข้อมูล (Select) แบบง่าย
   * @example await this.db.select('users', { status: 'active' })
   */
  async select<T = any>(table: string, where?: Record<string, any>): Promise<T[]> {
    let sql = `SELECT * FROM "${table}"`;
    const params: any[] = [];

    if (where && Object.keys(where).length > 0) {
      const { clause, values } = this.buildWhereClause(where);
      sql += ` WHERE ${clause}`;
      params.push(...values);
    }

    return this.query<T>(sql, params);
  }

  /**
   * เพิ่มข้อมูล (Insert)
   * @example await this.db.insert('users', { username: 'test', email: 'test@mail.com' })
   */
  async insert<T = any>(table: string, data: Record<string, any>, client?: PoolClient): Promise<T> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const columns = keys.map(k => `"${k}"`).join(', ');

    const sql = `INSERT INTO "${table}" (${columns}) VALUES (${placeholders}) RETURNING *`;

    const rows = client
      ? await this.queryTx(client, sql, values)
      : await this.query(sql, values);

    return rows[0];
  }

  /**
   * แก้ไขข้อมูล (Update) - คืนค่าจำนวนแถวที่ถูกแก้ไข
   * @example await this.db.update('users', { name: 'New Name' }, { id: 1 })
   */
  async update(table: string, data: Record<string, any>, where: Record<string, any>, client?: PoolClient): Promise<number> {
    const updateKeys = Object.keys(data);
    const updateValues = Object.values(data);

    const setClause = updateKeys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
    const { clause: whereClause, values: whereValues } = this.buildWhereClause(where, updateKeys.length + 1);

    const sql = `UPDATE "${table}" SET ${setClause} WHERE ${whereClause}`;
    const allValues = [...updateValues, ...whereValues];

    const result = client
      ? await client.query(sql, allValues)
      : await this.pgPool.pool.query(sql, allValues);

    return result.rowCount || 0;
  }

  /**
   * ลบข้อมูล (Delete) - คืนค่าจำนวนแถวที่ถูกลบ
   * @example await this.db.delete('users', { id: 1 })
   */
  async delete(table: string, where: Record<string, any>, client?: PoolClient): Promise<number> {
    const { clause, values } = this.buildWhereClause(where);
    const sql = `DELETE FROM "${table}" WHERE ${clause}`;

    const result = client
      ? await client.query(sql, values)
      : await this.pgPool.pool.query(sql, values);

    return result.rowCount || 0;
  }

  private buildWhereClause(where: Record<string, any>, startIndex = 1) {
    const keys = Object.keys(where);
    const values = Object.values(where);
    const clause = keys.map((k, i) => `"${k}" = $${startIndex + i}`).join(' AND ');

    return {
      clause,
      values,
      nextIndex: startIndex + keys.length
    };
  }
}
