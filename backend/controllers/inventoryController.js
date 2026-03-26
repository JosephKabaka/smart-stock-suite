import db from "../config/db.js";

export const getStockLevels = async (req, res) => {
  try {
    const { businessId } = req.user;

    await db.query("SET timezone='Africa/Nairobi'");

    const query = `
      SELECT 
        (SELECT total_stock FROM inventory WHERE business_id = $1 LIMIT 1) as warehouse_stock,
        COALESCE(SUM(boxes_dispatched - boxes_returned), 0) as sold_today,
        COALESCE(SUM(cash_collected), 0) as total_cash,
        COUNT(id) FILTER (WHERE status = 'out') as workers_out,
        COALESCE(SUM(boxes_dispatched) FILTER (WHERE status = 'out') , 0) as boxes_with_workers
      FROM transactions 
      WHERE date = CURRENT_DATE AND business_id = $1;
    `;

    const result = await db.query(query, [businessId]);
    const stats = result.rows[0];

    // Fetch active workers for this business specifically
    const employees = await db.query(
      `SELECT DISTINCT ON (e.id) 
        e.id, e.name, t.status as current_status, t.id as trans_id, t.boxes_dispatched as boxes_out
      FROM employees e
      LEFT JOIN transactions t ON e.id = t.employee_id AND t.date = CURRENT_DATE AND t.status = 'out'
      WHERE e.is_active = true AND e.business_id = $1
      ORDER BY e.id, e.name ASC`,
      [businessId],
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
    res.status(500).json({ error: "Error loading dashboard data" });
  }
};

export const addProduction = async (req, res) => {
  const { boxes } = req.body;
  const { businessId } = req.user;
  const boxesToAdd = parseInt(boxes);
  if (isNaN(boxesToAdd) || boxesToAdd <= 0)
    return res.status(400).json({ message: "Invalid box count" });

  try {
    const result = await db.query(
      "UPDATE inventory SET total_stock = total_stock + $1 WHERE business_id = $2 RETURNING total_stock",
      [boxesToAdd, businessId],
    );
    res.json({ success: true, newTotal: result.rows[0].total_stock });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error updating stock" });
  }
};
