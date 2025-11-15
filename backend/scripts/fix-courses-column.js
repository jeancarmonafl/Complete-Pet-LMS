import pkg from "pg";
const { Pool } = pkg;
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

async function fixCoursesColumn() {
  try {
    console.log("🔍 Checking courses table structure...");

    // Check if is_active column exists
    const checkColumn = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'courses' AND column_name = 'is_active'
    `);

    if (checkColumn.rows.length === 0) {
      console.log("❌ Column 'is_active' does not exist. Adding it...");

      await pool.query(`
        ALTER TABLE courses
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE
      `);

      console.log("✅ Column 'is_active' added successfully!");
    } else {
      console.log("✅ Column 'is_active' already exists");
    }

    // Check if exception_positions column exists
    const checkExceptionColumn = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'courses' AND column_name = 'exception_positions'
    `);

    if (checkExceptionColumn.rows.length === 0) {
      console.log("❌ Column 'exception_positions' does not exist. Adding it...");

      await pool.query(`
        ALTER TABLE courses
        ADD COLUMN IF NOT EXISTS exception_positions TEXT[]
      `);

      console.log("✅ Column 'exception_positions' added successfully!");
    } else {
      console.log("✅ Column 'exception_positions' already exists");
    }

    console.log("\n✅ Courses table is now ready!");
    console.log("You can now run: node scripts/seed-dev-data.js");

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await pool.end();
  }
}

fixCoursesColumn();

