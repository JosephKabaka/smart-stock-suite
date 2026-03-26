import db from "../config/db.js";

export const updateBusinessProfile = async (req, res) => {
  const { businessName, productType } = req.body;
  const businessId = req.user.businessId;

  try {
    // Start Transaction
    await db.query("BEGIN");

    // 1. Update the Business Name in the 'businesses' table
    const businessResult = await db.query(
      "UPDATE businesses SET business_name = $1 WHERE id = $2 RETURNING *",
      [businessName, businessId],
    );

    if (businessResult.rows.length === 0) {
      await db.query("ROLLBACK");
      return res.status(404).json({ msg: "Business record not found." });
    }

    // 2. Update the Product Type in the 'inventory' table via business_id
    // Note: If a business can have multiple inventories, this updates all of them.
    await db.query(
      "UPDATE inventory SET product_name = $1 WHERE business_id = $2",
      [productType, businessId],
    );

    // Commit Transaction
    await db.query("COMMIT");

    res.status(200).json({
      message: "Business profile and inventory type updated successfully",
      business: businessResult.rows[0],
    });
  } catch (error) {
    // If anything fails, undo all changes
    await db.query("ROLLBACK");
    console.error("Update Profile Error:", error.message);
    res.status(500).json({ msg: "Server error while updating profile" });
  }
};
