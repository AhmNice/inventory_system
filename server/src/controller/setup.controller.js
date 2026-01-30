import bcrypt from "bcryptjs";
import { pool } from "../config/db.config.js";

// ✅ Create first super admin
export const createSuperAdmin = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // 🧾 Check if super admin already exists
    const { rows } = await pool.query(
      "SELECT * FROM auth.users WHERE role = 'super_admin'"
    );

    if (rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Super admin already exists",
      });
    }

    // 🔑 Hash password and insert
    const password_hash = await bcrypt.hash(password, 10);
    await pool.query(
      `INSERT INTO auth.users (name, email, password_hash, role, department)
       VALUES ($1, $2, $3, 'super_admin', 'admin')`,
      [name, email, password_hash]
    );

    return res.status(201).json({
      success: true,
      message: "Super admin created successfully",
    });
  } catch (error) {
    console.error("Error creating super admin:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Check if a super admin exists
export const checkSuperAdmin = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT COUNT(*) FROM auth.users WHERE role = 'super_admin'"
    );

    const exists = parseInt(result.rows[0].count) > 0;

    return res.status(200).json({
      success: true,
      super_admin_exists: exists,
    });
  } catch (error) {
    console.error("Error checking super admin:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
export const verifySecretKey = async (req, res) => {
  const { secret_key } = req.body;

  try {
    if (!secret_key) {
      return res.status(400).json({
        success: false,
        message: "Secret key is required",
      });
    }

    if (process.env.SUPER_ADMIN_KEY !== secret_key) {
      return res.status(400).json({
        success: false,
        message: "Invalid secret key",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Secret key verified successfully",
    });
  } catch (error) {
    console.error("Error verifying secret key:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error while verifying secret key",
    });
  }
};
