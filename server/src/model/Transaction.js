import { pool } from "../config/db.config.js";

export class Transaction {
  constructor({
    transaction_id,
    user_id,
    good_id,
    quantity,
    type,
    scanned_by,

    notes,
  }) {
    this.transaction_id = transaction_id;
    this.user_id = user_id;
    this.good_id = good_id;
    this.quantity = quantity;
    this.type = type;
    this.scanned_by = scanned_by;

    this.notes = notes;
  }


  static async create({
    user_id,
    good_id,
    quantity,
    type,
    scanned_by,
    notes,
    request_id,checked_out
  }) {
    try {
      const result = await pool.query(
        `
        INSERT INTO operation.transactions
        (user_id, equipment_id, quantity, type, scanned_by, notes, request_id,checked_out)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
        `,
        [user_id, good_id, quantity, type, scanned_by, notes, request_id,checked_out]
      );

      return result.rows[0];
    } catch (error) {
      console.error("❌ Error creating transaction:", error.message);
      throw error;
    }
  }
  static async findById(transaction_id) {
    try {
      const result = await pool.query(
        `SELECT * FROM operation.transactions WHERE transaction_id = $1`,
        [transaction_id]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error("❌ Error finding transaction:", error.message);
      throw error;
    }
  }
  static async findByRequest({request_id, equipment_id}){
    try {
      const result = await pool.query(
        `SELECT * FROM operation.transactions WHERE request_id = $1  AND equipment_id = $2`,
        [request_id, equipment_id]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error("❌ Error finding transaction:", error.message);
      throw error;
    }
  }
  static async update(transaction_id, fieldsToUpdate) {
    const keys = Object.keys(fieldsToUpdate);
    if (keys.length === 0) return null;

    const setClause = keys.map((key, idx) => `${key} = $${idx + 1}`).join(", ");
    const values = Object.values(fieldsToUpdate);

    try {
      const result = await pool.query(
        `
        UPDATE operation.transactions
        SET ${setClause}, updated_at = NOW()
        WHERE transaction_id = $${keys.length + 1}
        RETURNING *
        `,
        [...values, transaction_id]
      );

      return result.rows[0];
    } catch (error) {
      console.error("❌ Error updating transaction:", error.message);
      throw error;
    }
  }
  static async delete(transaction_id) {
    try {
      await pool.query(
        `DELETE FROM operation.transactions WHERE transaction_id = $1`,
        [transaction_id]
      );
      return true;
    } catch (error) {
      console.error("❌ Error deleting transaction:", error.message);
      throw error;
    }
  }
  static async findAll(filters = {}) {
    const { type, user_id } = filters;
    let query = `SELECT * FROM operation.transactions WHERE 1=1`;
    const values = [];

    if (type) {
      values.push(type);
      query += ` AND type = $${values.length}`;
    }
    if (user_id) {
      values.push(user_id);
      query += ` AND user_id = $${values.length}`;
    }

    query += " ORDER BY created_at DESC";

    try {
      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      console.error("❌ Error fetching transactions:", error.message);
      throw error;
    }
  }
}
