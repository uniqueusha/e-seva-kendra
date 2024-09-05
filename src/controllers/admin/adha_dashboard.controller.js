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
//getVerificationStatusCount
const getVerificationStatusCount = async (req, res) => {
    const { created_at } = req.query;
    // Attempt to obtain a database connection
    let connection = await getConnection();

    try {
        // Start a transaction
        await connection.beginTransaction();
        
        let adha_verification_status_total_list_count = 0;
        let verification_status_counts = {};
        
        // today total status count
        let todayTotalVerificationStatusCountQuery = `SELECT COUNT(*) AS total FROM adha a
            JOIN verification_status vs
            ON vs.verification_status_id = a.verification_status_id
            WHERE Date(a.created_at) = ?`;
        let todayTotalVerificationStatusCountResult = await connection.query(todayTotalVerificationStatusCountQuery,[created_at]);
        adha_verification_status_total_list_count = parseInt(todayTotalVerificationStatusCountResult[0][0].total);
        
        let specificVerificationStatusCountQuery = `
            SELECT a.verification_status_id,vs.verification_status, COUNT(*) AS total
            FROM adha a
            JOIN verification_status vs
            ON vs.verification_status_id = a.verification_status_id
            WHERE Date(a.created_at) = ?
            GROUP BY vs.verification_status`;
        let specificVerificationStatusCountResult = await connection.query(specificVerificationStatusCountQuery,[created_at]);
        specificVerificationStatusCountResult[0].forEach(row => {
            verification_status_counts[row.verification_status] = parseInt(row.total);
        });
        
        const data = {
            status: 200,
            message: "Task dashboard Status Count retrieved successfully",
            adha_verification_status_total_list_count:adha_verification_status_total_list_count,
            verification_status_counts:verification_status_counts
        };

        return res.status(200).json(data);
    } catch (error) {
        console.log(error);
        return error500(error, res);
    } finally {
        await connection.release();
    }
};

//getPaymentStatus
const getPaymentStatusCount = async (req, res) => {
    const { created_at } = req.query;
    // Attempt to obtain a database connection
    let connection = await getConnection();

    try {
        // Start a transaction
        await connection.beginTransaction();
        
        let adha_payment_status_total_list_count = 0;
        let payment_status_counts = {};
        
        // today total status count
        let todayTotalPaymentStatusCountQuery = `SELECT COUNT(*) AS total FROM adha a
            JOIN payment_status ps
            ON ps.payment_status_id = a.payment_status_id
            WHERE Date(a.created_at) = ?`;
        let todayTotalPaymentStatusCountResult = await connection.query(todayTotalPaymentStatusCountQuery,[created_at]);
        adha_payment_status_total_list_count = parseInt(todayTotalPaymentStatusCountResult[0][0].total);
        
        let specificPaymentStatusCountQuery = `
            SELECT a.verification_status_id,ps.payment_status, COUNT(*) AS total
            FROM adha a
            JOIN payment_status ps
            ON ps.payment_status_id = a.payment_status_id
            WHERE Date(a.created_at) = ?
            GROUP BY ps.payment_status`;
        let specificPaymentStatusCountResult = await connection.query(specificPaymentStatusCountQuery,[created_at]);
        specificPaymentStatusCountResult[0].forEach(row => {
            payment_status_counts[row.payment_status] = parseInt(row.total);
        });
        
        const data = {
            status: 200,
            message: "Task dashboard Status Count retrieved successfully",
            adha_payment_status_total_list_count:adha_payment_status_total_list_count,
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
    getVerificationStatusCount,
    getPaymentStatusCount
};
