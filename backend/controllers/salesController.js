import db from "../config/db.js";

export const renderDashboard = async (req, res) => {
  try {
    await db.query("set timezone='Africa/Nairobi'");
    const query = `
            SELECT 
                (SELECT total_stock FROM inventory LIMIT 1) as warehouse_stock,
                COALESCE(SUM(boxes_dispatched - boxes_returned), 0) as sold_today,
                COALESCE(SUM(cash_collected), 0) as total_cash,
                COUNT(id) FILTER (WHERE status = 'out') as workers_out,
                COALESCE(SUM(boxes_dispatched) FILTER (WHERE status = 'out') , 0) as boxes_with_workers
            FROM transactions 
            WHERE date = CURRENT_DATE;
        `;

    const result = await db.query(query);
    const stats = result.rows[0];

    const employees = await db.query(
      `
SELECT DISTINCT ON (e.id) 
    e.id, 
    e.name, 
    t.status as current_status, 
    t.id as trans_id, 
    t.boxes_dispatched as boxes_out
  FROM employees e
  LEFT JOIN transactions t 
    ON e.id = t.employee_id 
    AND t.date = CURRENT_DATE 
    AND t.status = 'out'
  WHERE e.is_active = true
  ORDER BY e.id, e.name ASC
`,
    );

    res.json({
      stats: {
        warehouseStock: stats.warehouse_stock || 0,
        soldToday: stats.sold_today || 0,
        workerBoxes: stats.boxes_with_workers || 0,
        totalCash: stats.total_cash || 0,
        activeWorkers: stats.workers_out || 0,
      },
      employees: employees.rows,
    });
  } catch (err) {
    console.error("Dashboard Load Error:", err);
    res.status(500).send("Error loading dashboard data");
  }
};

export const dispatchWorker = async (req, res) => {
  const { employeeId, boxes } = req.body;
  const boxCount = parseInt(boxes);

  // Validation: Check if values are valid numbers
  if (isNaN(boxCount) || boxCount <= 0) {
    return res.status(400).json({ message: "Invalid box count provided" });
  }

  try {
    // Start transaction
    await db.query("BEGIN");
    await db.query("SET TIMEZONE='Africa/Nairobi'");

    // --- NEW FEATURE: CHECK IF WORKER IS ALREADY OUT ---
    const activeCheck = await db.query(
      "SELECT id FROM transactions WHERE employee_id = $1 AND status = 'out'",
      [employeeId],
    );

    if (activeCheck.rows.length > 0) {
      await db.query("ROLLBACK");

      return res.status(400).json({
        message:
          "This worker is already out! They must return and settle their current boxes before a new dispatch.",
      });
    }
    // ---------------------------------------------------

    // 1. Check stock
    const stockCheck = await db.query(
      "SELECT total_stock FROM inventory WHERE id = 1",
    );

    if (stockCheck.rows.length === 0) {
      await db.query("ROLLBACK");
      return res.status(404).json({ message: "Inventory record not found" });
    }

    const currentStock = stockCheck.rows[0].total_stock;

    if (currentStock < boxCount) {
      await db.query("ROLLBACK");
      return res
        .status(400)
        .json({ message: "Not enough stock in warehouse!" });
    }

    // 2. Deduct from Warehouse
    await db.query(
      "UPDATE inventory SET total_stock = total_stock - $1 WHERE id = 1",
      [boxCount],
    );

    // 3. Create transaction record
    await db.query(
      "INSERT INTO transactions (employee_id, boxes_dispatched, status, date) VALUES ($1, $2, $3, CURRENT_DATE)",
      [employeeId, boxCount, "out"],
    );

    await db.query("COMMIT");

    res.status(200).json({
      success: true,
      message: "Dispatch successful!",
    });
  } catch (err) {
    await db.query("ROLLBACK");
    console.error("Dispatch Error:", err);
    res.status(500).json({ message: "Server Error during dispatch" });
  }
};
//add production logic
export const addProduction = async (req, res) => {
  // 1. Match the name coming from your React frontend (boxes)
  const { boxes } = req.body;
  const boxesToAdd = parseInt(boxes);

  // Validation
  if (isNaN(boxesToAdd) || boxesToAdd <= 0) {
    return res
      .status(400)
      .json({ message: "Please enter a valid number of boxes." });
  }

  try {
    await db.query("SET TIMEZONE='Africa/Nairobi'");

    // Update the warehouse stock
    const result = await db.query(
      "UPDATE inventory SET total_stock = total_stock + $1 WHERE id = 1 RETURNING total_stock",
      [boxesToAdd],
    );

    console.log(`Added ${boxesToAdd} boxes to warehouse.`);

    // SUCCESS: Return JSON so React can update the UI
    res.status(200).json({
      success: true,
      message: "Stock updated successfully!",
      newTotal: result.rows[0].total_stock,
    });
  } catch (err) {
    console.error("Factory Update Error:", err);
    // Return JSON error
    res.status(500).json({ message: "Error updating warehouse stock" });
  }
};

//return workers in the end of the day
export const settleWorker = async (req, res) => {
  // Match the names from your React setReturnForm state
  const { employeeId, boxesReturned, amountCollected } = req.body;

  const returnedCount = parseInt(boxesReturned);
  const cashAmount = parseFloat(amountCollected);

  try {
    await db.query("BEGIN");
    await db.query("SET TIMEZONE='Africa/Nairobi'");

    // 1. Find the active 'out' transaction ID for this employee for today
    // This saves your father from having to manually find transaction IDs.
    const findTrans = await db.query(
      "SELECT id FROM transactions WHERE employee_id = $1 AND status = 'out' AND date = CURRENT_DATE",
      [employeeId],
    );

    if (findTrans.rows.length === 0) {
      await db.query("ROLLBACK");
      return res
        .status(404)
        .json({ message: "No active dispatch found for this worker today." });
    }

    const transactionId = findTrans.rows[0].id;

    // 2. Update the transaction: set boxes_returned, cash, and change status to 'closed'
    await db.query(
      `UPDATE transactions 
       SET boxes_returned = $1, cash_collected = $2, status = 'closed' 
       WHERE id = $3`,
      [returnedCount, cashAmount, transactionId],
    );

    // 3. Add the returned boxes back to the warehouse stock
    await db.query(
      "UPDATE inventory SET total_stock = total_stock + $1 WHERE id = 1",
      [returnedCount],
    );

    await db.query("COMMIT");

    // SUCCESS: Return JSON
    res.status(200).json({
      success: true,
      message: "Worker settled and stock updated!",
    });
  } catch (err) {
    await db.query("ROLLBACK");
    console.error("Settlement Error:", err);
    res.status(500).json({ message: "Error settling worker account" });
  }
};

export const renderStockLogs = async (req, res) => {
  try {
    console.log("hello");

    // Ensure the timezone is set correctly for Nairobi
    await db.query("SET timezone='Africa/Nairobi'");

    const query = `
      SELECT 
        t.id,
        t.date,
        e.name AS worker_name,
        t.boxes_dispatched,
        t.boxes_returned,
        (t.boxes_dispatched - t.boxes_returned) AS sold,
        t.cash_collected AS cash_received,
        t.status
      FROM transactions t
      LEFT JOIN employees e ON t.employee_id = e.id
      ORDER BY t.date DESC, t.id DESC;
    `;

    const result = await db.query(query);

    // CHANGE: Send JSON instead of rendering an EJS page
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Logs Error:", err);
    // CHANGE: Send JSON error message
    res.status(500).json({ error: "Error loading logs" });
  }
};

// 1. Get Employees and their 30-day performance (API Version)
export const getEmployeesPerformance = async (req, res) => {
  try {
    const query = `
      SELECT 
        e.id, 
        e.name, 
        e.is_active,
        e.phone,
        COALESCE(
          SUM(t.boxes_dispatched - t.boxes_returned) 
          FILTER (WHERE t.status = 'closed'), 0
        ) as total_sold_30_days
      FROM employees e
      LEFT JOIN transactions t ON e.id = t.employee_id 
        AND t.date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY e.id, e.name, e.is_active, e.phone
      ORDER BY e.is_active DESC, total_sold_30_days DESC;
    `;

    const result = await db.query(query);

    // Instead of res.render, we send JSON data back to React
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Database error in getEmployeesPerformance:", err);
    res.status(500).json({ error: "Error loading employee performance data" });
  }
};

// 2. Add a new employee
export const addEmployee = async (req, res) => {
  // 1. Destructure name and phone from the React frontend request
  const { name, phone } = req.body;

  // 2. Simple Validation
  if (!name || !phone) {
    return res.status(400).json({ error: "Name and phone are required" });
  }

  try {
    // 3. Insert into Database
    // Note: I'm using 'active' (string) or true (boolean) based on your previous preference
    // If your table uses a string for status, change true to 'active'
    await db.query("INSERT INTO employees (name, phone) VALUES ($1, $2)", [
      name,
      phone,
    ]);

    // 4. Send JSON response back to Axios
    res.status(201).json({ message: "Employee added successfully!" });
  } catch (err) {
    console.error("Error adding employee:", err);

    // Check for unique constraint (e.g., if phone number is already registered)
    if (err.code === "23505") {
      return res
        .status(400)
        .json({ error: "This phone number is already registered." });
    }

    res.status(500).json({ error: "Server error while adding employee" });
  }
};

// Toggle Employee Status (API Version)
export const toggleEmployeeStatus = async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body; // React sends the desired new status

  try {
    const result = await db.query(
      "UPDATE employees SET is_active = $1 WHERE id = $2 RETURNING id, is_active",
      [is_active, id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Employee not found" });
    }

    // Return success to React
    res.status(200).json({
      message: "Status updated successfully",
      employee: result.rows[0],
    });
  } catch (err) {
    console.error("Toggle Status Error:", err);
    res.status(500).json({ error: "Error updating employee status" });
  }
};
