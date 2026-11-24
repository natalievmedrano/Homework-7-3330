
require('dotenv').config();

const express = require('express');
const { Pool } = require('pg');

const app = express();
const PORT = 3000;

// PostgreSQL database connection
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT)
});

// middleware
app.use(express.json());
app.use(express.static('public'));

app.get('/api/dashboard', async (req, res) => {
    try {
        const customerResult = await pool.query(
            'SELECT count(*) FROM customers'
        );

        const revenueResult = await pool.query(
            'SELECT sum(saleamount) FROM sales'
        );

        const ordersResult = await pool.query(
            'SELECT count(quantity) FROM orders'
        );

        const issuesResult = await pool.query(
            "SELECT count(id) FROM alerts WHERE type = 'issues'"
        );

        const notificationsResult = await pool.query(
            "SELECT count(id) FROM alerts WHERE type = 'notifications'"
        );

        res.json({
            customers: Number(customerResult.rows[0].count),
            revenue: Number(revenueResult.rows[0].sum),
            orders: Number(ordersResult.rows[0].count),
            issues: Number(issuesResult.rows[0].count),
            notifications: Number(notificationsResult.rows[0].count)
        });

    } catch (error) {
        console.error('Dashboard query error:', error);
        res.status(500).json({ error: 'Unable to retrieve dashboard data' });
    }
});

//query 2
app.get('/api/customers', async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
        const offset = (page - 1) * limit;

        const customers = await pool.query(
            'SELECT * FROM customers ORDER BY id LIMIT $1 OFFSET $2',
            [limit, offset]
        );

        const total = await pool.query(
            'SELECT count(*) FROM customers'
        );

        res.json({
            customers: customers.rows,
            total: Number(total.rows[0].count),
            page: page,
            limit: limit,
            totalPages: Math.ceil(Number(total.rows[0].count) / limit)
        });

    } catch (error) {
        console.error('Customer query error:', error);
        res.status(500).json({ error: 'Unable to retrieve customers' });
    }
});

app.get('/api/sales', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT products.name, sales.quantity, sales.saleamount
            FROM sales
            LEFT JOIN products ON sales.productid = products.id
            ORDER BY sales.id ASC
        `);

        res.json(result.rows);

    } catch (error) {
        console.error('Sales query error:', error);
        res.status(500).json({ error: 'Unable to retrieve sales' });
    }
});

app.get('/api/alerts/issues', async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM alerts WHERE type = 'issues'"
        );

        res.json(result.rows);

    } catch (error) {
        console.error('Issue alerts query error:', error);
        res.status(500).json({ error: 'Unable to retrieve issue alerts' });
    }
});

app.get('/api/alerts/notifications', async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM alerts WHERE type = 'notifications'"
        );

        res.json(result.rows);

    } catch (error) {
        console.error('Notification query error:', error);
        res.status(500).json({ error: 'Unable to retrieve notifications' });
    }
});


app.get('/api/alerts/tasks', async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM alerts WHERE type = 'tasks'"
        );

        res.json(result.rows);

    } catch (error) {
        console.error('Task query error:', error);
        res.status(500).json({ error: 'Unable to retrieve tasks' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
