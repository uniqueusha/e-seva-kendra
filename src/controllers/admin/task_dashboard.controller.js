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
    const { created_at } = req.query;
    // Attempt to obtain a database connection
    let connection = await getConnection();

    try {
        // Start a transaction
        await connection.beginTransaction();
        
        let task_status_total_list_count = 0;
        let status_counts = {};
        
        // today total status count
        let todayTotalStatusCountQuery = `SELECT COUNT(*) AS total FROM task_header th
            JOIN status s
            ON s.status_id = th.status_id
            WHERE Date(th.created_at) = ?`;
        let todayTotalStatusCountResult = await connection.query(todayTotalStatusCountQuery,[created_at]);
        task_status_total_list_count = parseInt(todayTotalStatusCountResult[0][0].total);
        
        let specificStatusCountQuery = `
            SELECT th.status_id,s.status_name, COUNT(*) AS total
            FROM task_header th
            JOIN status s
            ON s.status_id = th.status_id
            WHERE Date(th.created_at) = ?
            GROUP BY s.status_name`;
        let specificStatusCountResult = await connection.query(specificStatusCountQuery,[created_at]);
        specificStatusCountResult[0].forEach(row => {
            status_counts[row.status_name] = parseInt(row.total);
        });
        
        const data = {
            status: 200,
            message: "Task dashboard Status Count retrieved successfully",
            task_status_total_list_count:task_status_total_list_count,
            status_counts:status_counts
        };

        return res.status(200).json(data);
    } catch (error) {
        console.log(error);
        return error500(error, res);
    } finally {
        await connection.release();
    }
};

//getPaymentStatusCount
const getPaymentStatusCount = async (req, res) => {
    const { created_at } = req.query;
    // Attempt to obtain a database connection
    let connection = await getConnection();

    try {
        // Start a transaction
        await connection.beginTransaction();
        
        let task_payment_status_total_list_count = 0;
        let payment_status_counts = {};
        
        // today total status count
        let todayTotalPaymentStatusCountQuery = `SELECT COUNT(*) AS total FROM task_header th
            JOIN payment_status ps
            ON ps.payment_status_id = th.payment_status_id
            WHERE Date(th.created_at) = ?`;
        let todayTotalPaymentStatusCountResult = await connection.query(todayTotalPaymentStatusCountQuery,[created_at]);
        task_payment_status_total_list_count = parseInt(todayTotalPaymentStatusCountResult[0][0].total);
        
        let specificStatusCountQuery = `
            SELECT th.status_id,ps.payment_status, COUNT(*) AS total
            FROM task_header th
            JOIN payment_status ps
            ON ps.payment_status_id = th.payment_status_id
            WHERE Date(th.created_at) = ?
            GROUP BY ps.payment_status`;
        let specificStatusCountResult = await connection.query(specificStatusCountQuery,[created_at]);
        specificStatusCountResult[0].forEach(row => {
            payment_status_counts[row.payment_status] = parseInt(row.total);
        });
        
        const data = {
            status: 200,
            message: "Task dashboard Status Count retrieved successfully",
            task_payment_status_total_list_count:task_payment_status_total_list_count,
            payment_status_counts:payment_status_counts
        };

        return res.status(200).json(data);
    } catch (error) {
        console.log(error);
        return error500(error, res);
    } finally {
        await connection.release();
    }
};

module.exports = {
    getStatusCount,
    getPaymentStatusCount

};

