import { defaultPool, pool } from "../config/db.config.js";

const db_name = process.env.DB_NAME || "goods_tracking";

/* -------------------------------------------------
   1️⃣ Create the Database if it doesn't exist
-------------------------------------------------- */
export const createDatabase = async () => {
  try {
    const checkQuery = `SELECT 1 FROM pg_database WHERE datname = $1`;
    const checkResult = await defaultPool.query(checkQuery, [db_name]);

    if (checkResult.rowCount === 0) {
      await defaultPool.query(`CREATE DATABASE ${db_name}`);
      console.log("✅ Database created successfully!");
    } else {
      console.log(`ℹ️ Database "${db_name}" already exists.`);
    }
  } catch (error) {
    console.error("❌ Error creating database:", error.message);
  } finally {
    await defaultPool.end();
  }
};

/* -------------------------------------------------
   2️⃣ Create All Schemas & Tables
-------------------------------------------------- */
export const createTables = async () => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // ---------- AUTH SCHEMA ----------
    await client.query(`CREATE SCHEMA IF NOT EXISTS auth;`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS auth.users (
        user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(150) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        phone_number VARCHAR(40) UNIQUE,
        password_hash TEXT NOT NULL,
        department VARCHAR(150) NOT NULL,
        role VARCHAR(20) DEFAULT 'staff' CHECK (role IN ('staff', 'admin', 'super_admin')),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned')),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // ---------- PEOPLE SCHEMA ----------
    await client.query(`CREATE SCHEMA IF NOT EXISTS people;`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS people.customers (
        customer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        full_name VARCHAR(150) NOT NULL,
        phone VARCHAR(20),
        email VARCHAR(100),
        address TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // ---------- INVENTORY SCHEMA ----------
    await client.query(`CREATE SCHEMA IF NOT EXISTS inventory;`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS inventory.category (
        category_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS inventory.equipment (
        equipment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(150) NOT NULL,
        description TEXT,
        qr_code TEXT UNIQUE NOT NULL,
        quantity INT DEFAULT 0 CHECK (quantity >= 0),
        condition VARCHAR(50) CHECK (condition IN ('new', 'used', 'damaged')),
        category_id UUID REFERENCES inventory.category(category_id) ON DELETE CASCADE,
        equipment_image TEXT,
        status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'out', 'damaged', 'maintenance')),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS inventory.stock_history (
        history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        good_id UUID REFERENCES inventory.equipment(equipment_id) ON DELETE CASCADE,
        previous_qty INT,
        new_qty INT,
        change_type VARCHAR(20) CHECK (change_type IN ('add', 'remove', 'update')),
        changed_by UUID REFERENCES auth.users(user_id) ON DELETE SET NULL,
        remarks TEXT,
        timestamp TIMESTAMP DEFAULT NOW()
      );
    `);

    // ---------- OPERATION SCHEMA ----------
    await client.query(`CREATE SCHEMA IF NOT EXISTS operation;`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS operation.requests (
        request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(user_id) ON DELETE SET NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'fulfilled')),
        reason TEXT,
        start_date TIMESTAMP,
        end_date TIMESTAMP,
        approved_by UUID REFERENCES auth.users(user_id) ON DELETE SET NULL,
        approved_at TIMESTAMP,
        declined_by UUID REFERENCES auth.users(user_id) ON DELETE SET NULL,
        declined_at TIMESTAMP,
        decline_reason TEXT,
        note TEXT,
        requested_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
     await client.query(`
      CREATE TABLE IF NOT EXISTS operation.transactions (
        transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        request_id UUID REFERENCES operation.requests(request_id),
        checked_out BOOLEAN NOT NULL DEFAULT FALSE,
        user_id UUID REFERENCES auth.users(user_id) ON DELETE SET NULL,
        equipment_id UUID NOT NULL REFERENCES  inventory.equipment(equipment_id) ON DELETE CASCADE,
        quantity INT NOT NULL CHECK (quantity > 0),
        type VARCHAR(20) CHECK (type IN ('outgoing', 'returned')),
        scanned_by UUID REFERENCES auth.users(user_id) ON DELETE SET NULL,
        equipment_image TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS operation.request_items (
        item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        request_id UUID REFERENCES operation.requests(request_id) ON DELETE CASCADE,
        equipment_id UUID REFERENCES inventory.equipment(equipment_id) ON DELETE CASCADE,
        quantity INT NOT NULL CHECK (quantity > 0)
      );
    `);
    await client.query(`
     CREATE TABLE IF NOT EXISTS operation.activity_logs (
        log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(user_id) ON DELETE SET NULL,
        user_name VARCHAR(225),
        user_email VARCHAR(225),
        user_role VARCHAR(20) DEFAULT 'staff' CHECK (user_role IN ('staff', 'admin', 'super_admin')),
        action VARCHAR(150) NOT NULL,
        details TEXT,
        ip_address VARCHAR(50),
        user_agent VARCHAR(225),
        severity VARCHAR(150),
        category VARCHAR(150),
        affected_resource UUID,
        resource_type VARCHAR(150),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query("COMMIT");
    console.log("✅ All schemas and tables created successfully!");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error creating tables:", error.message);
  } finally {
    client.release();
  }
};

/* -------------------------------------------------
   3️⃣ Initialize Everything
-------------------------------------------------- */
export const initiateDatabase = async () => {
  await createDatabase();
  await createTables();
};
