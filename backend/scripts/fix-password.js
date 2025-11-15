import pkg from "pg";
const { Pool } = pkg;
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

async function fixPassword() {
  const email = "jeancarmona@complete-pet.com";
  const password = "12345";

  try {
    console.log("🔍 Checking password for:", email);

    // Get current password hash
    const result = await pool.query(
      "SELECT password_hash FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      console.log("❌ User not found!");
      await pool.end();
      return;
    }

    const currentHash = result.rows[0].password_hash;
    console.log(
      "Current password hash length:",
      currentHash ? currentHash.length : 0
    );

    // Test if password matches
    console.log('Testing password "12345"...');
    const match = await bcrypt.compare(password, currentHash);
    console.log("Password matches:", match ? "✅ YES" : "❌ NO");

    if (!match) {
      console.log("\n🔧 RESETTING PASSWORD...");

      // Create new hash
      const newHash = await bcrypt.hash(password, 12);

      // Update database
      await pool.query("UPDATE users SET password_hash = $1 WHERE email = $2", [
        newHash,
        email,
      ]);

      console.log("✅ Password reset complete!");

      // Verify it works
      const verify = await bcrypt.compare(password, newHash);
      console.log("Verification test:", verify ? "✅ SUCCESS" : "❌ FAILED");

      if (verify) {
        console.log("\n🎉 Password fixed! You can now login with:");
        console.log("   Email: jeancarmona@complete-pet.com");
        console.log("   Password: 12345");
        console.log("   Location: FL");
      }
    } else {
      console.log("\n✅ Password is already correct!");
      console.log("If login still fails, check the frontend API URL.");
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await pool.end();
  }
}

fixPassword();
