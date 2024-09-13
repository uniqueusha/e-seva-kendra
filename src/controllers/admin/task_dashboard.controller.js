const pool = require("../../../db");

// Function to obtain a database connection
const getConnection = async () => {
    try {
        const connection = await pool.getConnection();
        return connection;
    } catch (error) {
        throw new Error("Failed to obtain database connection: " + error.message);
    }
};
//errror 422 handler...
error422 = (message, res) => {
    return res.status(422).json({
        status: 422,
        message: message
    });
};

//error 500 handler...
error500 = (error, res) => {
    return res.status(500).json({
        status: 500,
        message: "Internal Server Error",
        error: error
    });
};

//getStatusCount
const getStatusCount = async (req, res) => {
    const { created_at, user_id, assigned_to } = req.query;
    // Attempt to obtain a database connection
    let connection = await getConnection();

    try {
        // Start a transaction
        await connection.beginTransaction();

        let task_status_total_list_count = 0;
        let task_status_total_amount_count = 0;
        let status_counts = [];

        // today total status count
        let todayTotalStatusCountQuery = `SELECT COUNT(*) AS total FROM status s
            JOIN task_header th
            ON s.status_id = th.status_id
            WHERE Date(th.created_at) = ? AND s.status = 1`;
        if (user_id) {
            todayTotalStatusCountQuery += ` AND th.user_id = '${user_id}'`;
        }
        if (assigned_to) {
            todayTotalStatusCountQuery += ` AND th.assigned_to = '${assigned_to}'`;
        }
        let todayTotalStatusCountResult = await connection.query(todayTotalStatusCountQuery, [created_at]);
        task_status_total_list_count = parseInt(todayTotalStatusCountResult[0][0].total);

        //amount total
        let taskStatusTotalAmountCountQuery = `SELECT SUM(th.amount) AS total FROM status s
            JOIN task_header th
            ON s.status_id = th.status_id
            WHERE Date(th.created_at) = ? AND s.status = 1`;
        if (user_id) {
            taskStatusTotalAmountCountQuery += ` AND th.user_id = '${user_id}'`;
        }
        if (assigned_to) {
            taskStatusTotalAmountCountQuery += ` AND th.assigned_to = '${assigned_to}'`;
        }
        let taskStatusTotalAmountCountResult = await connection.query(taskStatusTotalAmountCountQuery, [created_at]);
        task_status_total_amount_count = parseInt(taskStatusTotalAmountCountResult[0][0].total);

        // specific today total status count
        let specificStatusCountQuery = `
            SELECT th.status_id,s.status_name, SUM(th.amount) AS total_amount, COUNT(*) AS total
            FROM status s
            JOIN task_header th
            ON s.status_id = th.status_id
            WHERE Date(th.created_at) = ? AND s.status = 1`;
        if (user_id) {
            specificStatusCountQuery += ` AND th.user_id = '${user_id}'`;
        }
        if (assigned_to) {
            specificStatusCountQuery += ` AND th.assigned_to = '${assigned_to}'`;
        }

        specificStatusCountQuery += ` GROUP BY s.status_id, s.status_name `;
        let specificStatusCountResult = await connection.query(specificStatusCountQuery, [created_at]);

        const statusCount = {};
        const amountTotal = {};
        specificStatusCountResult[0].forEach(row => {
            statusCount[row.status_id] = parseInt(row.total);
            amountTotal[row.status_id] = parseInt(row.total_amount);

        });

        //get all status
        let allStatusesQuery = `SELECT status_id, status_name, status FROM status`;
        let allStatusesResult = await connection.query(allStatusesQuery);

        allStatusesResult[0].forEach(rows => {
            if (rows.status === 1) {
                status_counts.push({
                    status_id: rows.status_id,
                    status_name: rows.status_name,
                    status_total: statusCount[rows.status_id] || 0,
                    amount_total: amountTotal[rows.status_id] || 0
                });
            }
        });

        const data = {
            status: 200,
            message: "Task dashboard Status Count retrieved successfully",
            task_status_total_list_count: task_status_total_list_count,
            task_status_total_amount_count: task_status_total_amount_count,
            status_counts: status_counts
        };

        return res.status(200).json(data);
    } catch (error) {
        return error500(error, res);
    } finally {
        await connection.release();
    }
};

//getPaymentStatusCount
const getPaymentStatusCount = async (req, res) => {
    const { created_at, user_id, assigned_to } = req.query;
    // Attempt to obtain a database connection
    let connection = await getConnection();

    try {
        // Start a transaction
        await connection.beginTransaction();

        let task_payment_status_total_list_count = 0;
        let task_payment_status_total_amount_count = 0;
        let payment_status_counts = [];

        // today total status count
        let todayTotalPaymentStatusCountQuery = `SELECT COUNT(*) AS total FROM payment_status ps 
            JOIN task_header th
            ON ps.payment_status_id = th.payment_status_id
            WHERE Date(th.created_at) = ? AND ps.status = 1`;
        if (user_id) {
            todayTotalPaymentStatusCountQuery += ` AND th.user_id = '${user_id}'`;
        }
        if (assigned_to) {
            todayTotalPaymentStatusCountQuery += ` AND th.assigned_to = '${assigned_to}'`;
        }
        let todayTotalPaymentStatusCountResult = await connection.query(todayTotalPaymentStatusCountQuery, [created_at]);
        task_payment_status_total_list_count = parseInt(todayTotalPaymentStatusCountResult[0][0].total);

        //amount total
        let adhaPaymentStatusTotalAmountCountQuery = `SELECT SUM(th.amount) AS total FROM payment_status ps 
            JOIN task_header th
            ON ps.payment_status_id = th.payment_status_id
            WHERE Date(th.created_at) = ? AND ps.status = 1`;
        if (user_id) {
            adhaPaymentStatusTotalAmountCountQuery += ` AND th.user_id = '${user_id}'`;
        }
        if (assigned_to) {
            adhaPaymentStatusTotalAmountCountQuery += ` AND th.assigned_to = '${assigned_to}'`;
        }
        let adhaPaymentStatusTotalAmountCountResult = await connection.query(adhaPaymentStatusTotalAmountCountQuery, [created_at]);
        task_payment_status_total_amount_count = parseInt(adhaPaymentStatusTotalAmountCountResult[0][0].total);

        // specific today total payment status count
        let specificStatusCountQuery = `
            SELECT th.payment_status_id,ps.payment_status, SUM(th.amount) AS total_amount,COUNT(*) AS total
            FROM payment_status ps
            JOIN task_header th
            ON ps.payment_status_id = th.payment_status_id
            WHERE Date(th.created_at) = ? AND ps.status = 1`;
        if (user_id) {
            specificStatusCountQuery += ` AND th.user_id = '${user_id}'`;
        }
        if (assigned_to) {
            specificStatusCountQuery += ` AND th.assigned_to = '${assigned_to}'`;
        }
        specificStatusCountQuery += ` GROUP BY ps.payment_status_id, ps.payment_status `;
        let specificStatusCountResult = await connection.query(specificStatusCountQuery, [created_at]);

        const statusCount = {};
        const amountTotal = {};
        specificStatusCountResult[0].forEach(row => {
            statusCount[row.payment_status_id] = parseInt(row.total);
            amountTotal[row.payment_status_id] = parseInt(row.total_amount);

        });

        //get all payment status
        let allPaymentStatusesQuery = `SELECT payment_status_id, payment_status, status FROM payment_status`;
        let allPaymentStatusesResult = await connection.query(allPaymentStatusesQuery);

        allPaymentStatusesResult[0].forEach(rows => {
            if (rows.status === 1) {
                payment_status_counts.push({
                    payment_status_id: rows.payment_status_id,
                    payment_status: rows.payment_status,
                    payment_status_total: statusCount[rows.payment_status_id] || 0,
                    amount_total: amountTotal[rows.payment_status_id] || 0
                });
            }
        });

        const data = {
            status: 200,
            message: "Task dashboard Status Count retrieved successfully",
            task_payment_status_total_list_count: task_payment_status_total_list_count,
            task_payment_status_total_amount_count: task_payment_status_total_amount_count,
            payment_status_counts: payment_status_counts
        };

        return res.status(200).json(data);
    } catch (error) {
        return error500(error, res);
    } finally {
        await connection.release();
    }
};

module.exports = {
    getStatusCount,
    getPaymentStatusCount

};

