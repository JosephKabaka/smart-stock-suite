import db from "../config/db.js";

export const getEmployeesPerformance = async (req, res) => {
  try {
    const { businessId } = req.user;
    const query = `
      SELECT e.id, e.name, e.is_active, e.phone,
        COALESCE(SUM(t.boxes_dispatched - t.boxes_returned) FILTER (WHERE t.status = 'closed'), 0) as total_sold_30_days
      FROM employees e
      LEFT JOIN transactions t ON e.id = t.employee_id AND t.date >= CURRENT_DATE - INTERVAL '30 days'
      WHERE e.business_id = $1
      GROUP BY e.id, e.name, e.is_active, e.phone
      ORDER BY e.is_active DESC, total_sold_30_days DESC;
    `;
    const result = await db.query(query, [businessId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Error loading employees" });
  }
};

export const addEmployee = async (req, res) => {
  const { name, phone } = req.body;
  const { businessId } = req.user;

  try {
    await db.query(
      "INSERT INTO employees (name, phone, business_id) VALUES ($1, $2, $3)",
      [name, phone, businessId],
    );
    res.status(201).json({ message: "Employee added!" });
  } catch (err) {
    res.status(500).json({ error: "Error adding employee" });
  }
};

export const toggleEmployeeStatus = async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;
  const { businessId } = req.user;

  try {
    const result = await db.query(
      "UPDATE employees SET is_active = $1 WHERE id = $2 AND business_id = $3 RETURNING id",
      [is_active, id, businessId],
    );
    res.json({ message: "Updated successfully" });
  } catch (err) {
    res.status(500).json({ error: "Error updating status" });
  }
};
