import db from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const registerBusiness = async (req, res) => {
  const { businessName, email, password, productType } = req.body;

  try {
    // 1. Check if user already exists BEFORE creating a business
    const userCheck = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (userCheck.rows.length > 0) {
      return res
        .status(400)
        .json({ msg: "User with this email already exists" });
    }

    // 2. Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPwd = await bcrypt.hash(password, salt);

    // 3. DATABASE TRANSACTION: Ensure both business and user are created, or neither is.
    // This prevents creating a business without an owner if the second query fails.
    await db.query("BEGIN");

    const bizResult = await db.query(
      "INSERT INTO businesses (business_name) VALUES ($1) RETURNING id",
      [businessName],
    );
    const businessId = bizResult.rows[0].id;

    await db.query(
      "INSERT INTO users (business_id, email, password_hash, role) VALUES ($1, $2, $3, $4)",
      [businessId, email, hashedPwd, "admin"],
    );

    await db.query(
      "INSERT INTO inventory (product_name,business_id) VALUES ($1,$2)",
      [productType, businessId],
    );

    await db.query("COMMIT");

    res
      .status(201)
      .json({ message: "Business and Admin account registered successfully!" });
  } catch (err) {
    await db.query("ROLLBACK"); // Cancel database changes if something went wrong
    console.error(err.message);
    res.status(500).json({ error: "Server error during registration" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    // We also fetch the business name so the frontend can say "Welcome, [Shop Name]"
    const userResult = await db.query(
      `SELECT users.*, businesses.business_name as business_name 
       FROM users 
       JOIN businesses ON users.business_id = businesses.id 
       WHERE users.email = $1`,
      [email],
    );
    console.log(userResult.rows);
    if (userResult.rows.length === 0) {
      console.log("wrong");

      return res.status(400).json({ msg: "Invalid Credentials" });
    }

    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ msg: "Invalid Credentials" });

    // CREATE JWT: Standard fields + your custom multi-tenant fields
    const token = jwt.sign(
      {
        userId: user.id,
        businessId: user.business_id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" },
    );

    // Send back everything the React app needs to set up the user session
    res.json({
      token,
      user: {
        email: user.email,
        role: user.role,
        businessId: user.business_id,
        businessName: user.business_name,
      },
    });
  } catch (err) {
    console.log(err);
    console.error(err.message);
    res.status(500).json({ error: "Server error during login" });
  }
};

export const superadminLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    // 1. Fetch user by email
    const result = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (result.rows.length === 0) {
      return res.status(400).json({ msg: "Invalid Credentials" });
    }

    const supaAdmin = result.rows[0];

    //check if they are superAdmins
    if (supaAdmin.role !== "superAdmin") {
      return res.status(403).json({ msg: "Access Denied: Not a SuperAdmin" });
    }

    // 3. Verify Password
    const isMatch = await bcrypt.compare(password, supaAdmin.password_hash);
    if (!isMatch) return res.status(400).json({ msg: "Invalid Credentials" });

    // 4. Sign Token (include role for the middleware to check)
    const token = jwt.sign(
      {
        userId: supaAdmin.id,
        businessId: supaAdmin.business_id,
        role: supaAdmin.role, // 'superadmin'
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" },
    );

    // 5. Send response
    res.json({
      token,
      user: {
        id: supaAdmin.id, // Good to include for frontend state
        email: supaAdmin.email,
        role: supaAdmin.role,
        businessId: supaAdmin.business_id,
        businessName: supaAdmin.business_name || "Master System",
      },
    });
  } catch (error) {
    // Fixed: changed 'err' to 'error' to match the catch variable
    console.error("Login Error:", error.message);
    res.status(500).json({ msg: "Server error during login" });
  }
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const adminId = req.user.userId;

  try {
    // 1. Get the admin from DB
    const result = await db.query("SELECT * FROM users WHERE id = $1", [
      adminId,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ msg: "User not found" });
    }

    const admin = result.rows[0];

    // 2. Check if the current password is correct
    const isMatch = await bcrypt.compare(currentPassword, admin.password_hash);
    if (!isMatch) {
      return res.status(400).json({ msg: "Current password is incorrect" });
    }

    // 3. Encrypt the new password
    const salt = await bcrypt.genSalt(10);
    const encryptedNewPassword = await bcrypt.hash(newPassword, salt);

    // 4. Update the database
    await db.query("UPDATE users SET password_hash = $1 WHERE id = $2", [
      encryptedNewPassword,
      adminId,
    ]);

    // 5. Send success response
    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Change Password Error:", error.message);

    res.status(500).json({ message: "Server internal error" });
  }
};
