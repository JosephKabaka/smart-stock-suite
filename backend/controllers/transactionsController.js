import db from "../config/db.js";

export const dispatchWorker = async (req, res) => {
  const { employeeId, boxes } = req.body;
  const { businessId } = req.user;
  const boxCount = parseInt(boxes);

  try {
    await db.query("BEGIN");
    // Check if worker already out for THIS business
    const activeCheck = await db.query(
      "SELECT id FROM transactions WHERE employee_id = $1 AND status = 'out' AND business_id = $2",
      [employeeId, businessId],
    );
    if (activeCheck.rows.length > 0) {
      await db.query("ROLLBACK");
      return res.status(400).json({ message: "Worker is already out!" });
    }

    // Check stock for THIS business
    const stockCheck = await db.query(
      "SELECT total_stock FROM inventory WHERE business_id = $1",
      [businessId],
    );
    if (stockCheck.rows[0].total_stock < boxCount) {
      await db.query("ROLLBACK");
      return res.status(400).json({ message: "Not enough stock!" });
    }

    await db.query(
      "UPDATE inventory SET total_stock = total_stock - $1 WHERE business_id = $2",
      [boxCount, businessId],
    );
    await db.query(
      "INSERT INTO transactions (employee_id, business_id, boxes_dispatched, status, date) VALUES ($1, $2, $3, 'out', CURRENT_DATE)",
      [employeeId, businessId, boxCount],
    );

    await db.query("COMMIT");
    res.json({ success: true });
  } catch (err) {
    await db.query("ROLLBACK");
    res.status(500).json({ message: "Dispatch failed" });
  }
};

export const settleWorker = async (req, res) => {
  const { employeeId, boxesReturned, amountCollected } = req.body;
  const { businessId } = req.user;

  try {
    await db.query("BEGIN");
    const findTrans = await db.query(
      "SELECT id FROM transactions WHERE employee_id = $1 AND status = 'out' AND business_id = $2 AND date = CURRENT_DATE",
      [employeeId, businessId],
    );

    if (findTrans.rows.length === 0) {
      await db.query("ROLLBACK");
      return res.status(404).json({ message: "No active dispatch found." });
    }

    await db.query(
      "UPDATE transactions SET boxes_returned = $1, cash_collected = $2, status = 'closed' WHERE id = $3",
      [boxesReturned, amountCollected, findTrans.rows[0].id],
    );
    await db.query(
      "UPDATE inventory SET total_stock = total_stock + $1 WHERE business_id = $2",
      [boxesReturned, businessId],
    );

    await db.query("COMMIT");
    res.json({ success: true });
  } catch (err) {
    await db.query("ROLLBACK");
    res.status(500).json({ message: "Settlement failed" });
  }
};

export const renderStockLogs = async (req, res) => {
  try {
    const { businessId } = req.user;
    const result = await db.query(
      `SELECT t.*, e.name AS worker_name, (t.boxes_dispatched - t.boxes_returned) AS sold,t.cash_collected as cash_collected
       FROM transactions t LEFT JOIN employees e ON t.employee_id = e.id
       WHERE t.business_id = $1 ORDER BY t.date DESC, t.id DESC`,
      [businessId],
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Error loading logs" });
  }
};
