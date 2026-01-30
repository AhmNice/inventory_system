import { pool } from "../config/db.config.js";
import fs from "fs";
import copyTo from "pg-copy-streams";
export class Request {
  constructor({ user_id, reason, status = "pending" }) {
    this.user_id = user_id;
    this.reason = reason;
    this.status = status
     }

  // 🧠 Save the main request and its items together
  async saveWithItems(equipmentArray = []) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1️⃣ Insert into operation.requests
      const requestResult = await client.query(
        `
        INSERT INTO operation.requests (user_id, reason, status)
        VALUES ($1, $2, $3)
        RETURNING *;
        `,
        [this.user_id, this.reason, this.status]
      );

      const request = requestResult.rows[0];

      // 2️⃣ Insert equipment items into operation.request_items
      for (const item of equipmentArray) {
        await client.query(
          `
          INSERT INTO operation.request_items (request_id, equipment_id, quantity)
          VALUES ($1, $2, $3);
          `,
          [request.request_id, item.equipment_id, item.quantity]
        );
      }

      await client.query("COMMIT");
      return request;
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("❌ Error saving request with items:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  // 🧭 Find request + its items
  static async findById(request_id) {
    try {
      const { rows: requests } = await pool.query(
        "SELECT * FROM operation.requests WHERE request_id = $1",
        [request_id]
      );
      if (requests.length === 0) return null;

      const { rows: items } = await pool.query(
        `
        SELECT ri.*, e.name AS equipment_name
        FROM operation.request_items ri
        JOIN inventory.equipment e ON ri.equipment_id = e.equipment_id
        WHERE ri.request_id = $1
        `,
        [request_id]
      );

      return { ...requests[0], items };
    } catch (error) {
      console.error("Error finding request by ID:", error);
      throw error;
    }
  }

  // 🔁 Update status
  static async updateStatus(request_id, status, activeUser, decline_reason) {
    console.log(activeUser);
    const updated_by = activeUser.user_id;

    const approve_query_base = `UPDATE operation.requests SET status = $1, approved_by = $2, approved_at = NOW(), updated_at = NOW()`;
    const decline_query_base = `UPDATE operation.requests SET status = $1, declined_by = $2, declined_at = NOW(), updated_at = NOW(), decline_reason = $3`;

    let queryText;
    let queryValues;

    if (status === "approved") {
      // For "approved", use the specific query structure and values
      queryText = approve_query_base + ` WHERE request_id = $3`;
      queryValues = [status, updated_by, request_id];
    } else {
      // For "declined", use the specific query structure and values
      queryText = decline_query_base + ` WHERE request_id = $4`;
      queryValues = [status, updated_by, decline_reason, request_id];
    }

    try {
      // Pass the specific text and values to pool.query
      const result = await pool.query(queryText, queryValues);
      return result.rows[0];
    } catch (error) {
      console.error("Error updating request status:", error);
      throw error;
    }
  }

  // 📦 Fetch all requests (with pagination)
  static async fetchAll({ limit = 10, offset = 0 }) {
    try {
      // 1️⃣ Fetch all main requests with user info
      const { rows: requests } = await pool.query(
        `SELECT rq.request_id, rq.user_id, u.name AS user_name, u.email AS user_email,
          u.phone_number AS user_phone,
          u.department AS user_department,
          rq.reason AS purpose,

          rq.status,
          rq.requested_at AS submitted_at,
          rq.approved_by,
          rq.approved_at,
          rq.declined_by,
          rq.declined_at,
          rq.decline_reason,
          rq.note
        FROM operation.requests rq
        JOIN auth.users u ON rq.user_id = u.user_id
        ORDER BY rq.requested_at DESC LIMIT $1 OFFSET $2
        `,
        [limit, offset]
      );

      // 2️⃣ Extract request IDs for batch fetching related equipment
      const requestIds = requests.map((request) => request.request_id);
      const equipmentMap = {};

      if (requestIds.length > 0) {
        const { rows: equipmentRows } = await pool.query(
          `
          SELECT
            ri.request_id,
            e.equipment_id AS good_id,
            e.name,
            e.quantity,
            ri.quantity AS requested_quantity,
            c.name AS category_name
          FROM operation.request_items ri
          JOIN inventory.equipment e ON ri.equipment_id = e.equipment_id
          LEFT JOIN inventory.category c ON e.category_id = c.category_id
          WHERE ri.request_id = ANY($1)
          `,
          [requestIds]
        );

        equipmentRows.forEach((eq) => {
          if (!equipmentMap[eq.request_id]) equipmentMap[eq.request_id] = [];
          equipmentMap[eq.request_id].push({
            good_id: eq.good_id,
            equipment_name: eq.name,
            quantity: eq.quantity,
            requested_quantity: eq.requested_quantity,
            category_name: eq.category_name,
          });
        });
      }
      const enrichedRequests = requests.map((r) => ({
        ...r,
        equipment: equipmentMap[r.request_id] || [],
      }));
      const { rows: totalRows } = await pool.query(
        `SELECT COUNT(*) FROM operation.requests`
      );

      return {
        success: true,
        message: "All requests fetched successfully",
        requests: enrichedRequests,
        pagination: {
          limit,
          offset,
          totalRequest: parseInt(totalRows[0].count, 10),
        },
      };
    } catch (error) {
      console.error("Error fetching all requests:", error);
      throw error;
    }
  }


}
