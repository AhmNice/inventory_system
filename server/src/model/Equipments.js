import { pool } from "../config/db.config.js";

export class Equipment {
  constructor({
    name,
    description,
    qr_code,
    quantity,
    condition,
    category_id,
    equipment_image,
    status,
  }) {
    this.name = name;
    this.description = description;
    this.qr_code = qr_code;
    this.quantity = quantity;
    this.condition = condition;
    this.category_id = category_id;
    this.equipment_image = equipment_image;
    this.status = status;
  }

  //  Create a new good
  async save() {
    try {
      const result = await pool.query(
        `INSERT INTO inventory.equipment
        (name, description, qr_code, quantity, condition, category_id, equipment_image, status)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        RETURNING *`,
        [
          this.name,
          this.description,
          this.qr_code,
          this.quantity,
          this.condition,
          this.category_id,
          this.equipment_image,
          this.status,
        ],
      );
      return result.rows[0];
    } catch (error) {
      console.error("Error saving good:", error.message);
      throw error;
    }
  }

  //  Find by ID
  static async findById(equipment_id) {
    try {
      const result = await pool.query(
        `SELECT * FROM inventory.equipment WHERE equipment_id = $1`,
        [equipment_id],
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error finding good by ID:", error.message);
      throw error;
    }
  }

  //  Update any number of fields dynamically
  static async update(equipment_id, fieldsToUpdate) {
    try {
      const keys = Object.keys(fieldsToUpdate);
      if (keys.length === 0) return null;

      const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(", ");
      const values = Object.values(fieldsToUpdate);

      const query = `
        UPDATE inventory.equipment
        SET ${setClause}, updated_at = NOW()
        WHERE equipment_id = $${keys.length + 1}
        RETURNING *`;

      const result = await pool.query(query, [...values, equipment_id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error updating good:", error.message);
      throw error;
    }
  }
  static async reduceQuantityByOne(equipmentId) {
    const query = `
   UPDATE inventory.equipment
SET
  quantity = quantity - 1,
  status = CASE
    WHEN quantity - 1 <= 0 THEN 'out'
    ELSE status
  END
WHERE equipment_id = $1
  AND quantity > 0
RETURNING equipment_id, quantity, status;

  `;

    const { rows } = await pool.query(query, [equipmentId]);

    if (rows.length === 0) {
      throw new Error("Equipment out of stock or not found");
    }

    return rows[0];
  }

  //  Delete by ID
  static async delete(equipment_id) {
    try {
      const result = await pool.query(
        `DELETE FROM inventory.equipment WHERE equipment_id = $1 RETURNING *`,
        [equipment_id],
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error deleting good:", error.message);
      throw error;
    }
  }

  //  Fetch all goods (optionally filter by status or category)
  static async findAll(filters = {}) {
    try {
      let query = `SELECT * FROM inventory.equipment`;
      const conditions = [];
      const values = [];

      if (filters.status) {
        values.push(filters.status);
        conditions.push(`status = $${values.length}`);
      }
      if (filters.category_id) {
        values.push(filters.category_id);
        conditions.push(`category_id = $${values.length}`);
      }

      if (conditions.length > 0) {
        query += ` WHERE ` + conditions.join(" AND ");
      }

      query += ` ORDER BY created_at DESC`;

      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      console.error("Error fetching goods:", error.message);
      throw error;
    }
  }
}
