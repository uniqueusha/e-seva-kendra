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
    const { created_at, user_id } = req.query;
    // Attempt to obtain a database connection
    let connection = await getConnection();

    try {
        // Start a transaction
        await connection.beginTransaction();
        
        let adha_verification_status_total_list_count = 0;
        let verification_status_counts = [];
        
        // today total status count
        let todayTotalVerificationStatusCountQuery = `SELECT COUNT(*) AS total FROM verification_status vs
            JOIN adha a
            ON vs.verification_status_id = a.verification_status_id
            WHERE Date(a.created_at) = ?`;
            if (user_id) {
                todayTotalVerificationStatusCountQuery += ` AND a.user_id = '${user_id}'`;
            } 
        let todayTotalVerificationStatusCountResult = await connection.query(todayTotalVerificationStatusCountQuery,[created_at]);
        adha_verification_status_total_list_count = parseInt(todayTotalVerificationStatusCountResult[0][0].total);

        // specific today total status count
        let specificVerificationStatusCountQuery = `
            SELECT vs.verification_status_id,vs.verification_status, COUNT(*) AS total
            FROM verification_status vs
            LEFT JOIN adha a
            ON vs.verification_status_id = a.verification_status_id
            WHERE Date(a.created_at) = ?`;
            if (user_id) {
                specificVerificationStatusCountQuery += ` AND a.user_id = '${user_id}'`;
            } 
            specificVerificationStatusCountQuery += `GROUP BY vs.verification_status_id,vs.verification_status`;
        let specificVerificationStatusCountResult= await connection.query(specificVerificationStatusCountQuery,[created_at]);
        
        const statusCount = {};
        specificVerificationStatusCountResult[0].forEach(row => {
            statusCount[row.verification_status_id] = parseInt(row.total);
        });
        
        //get all verification status
        let allVerificationStatusesQuery = `SELECT verification_status_id, verification_status FROM verification_status`;
        let allVerificationStatusesResult = await connection.query(allVerificationStatusesQuery);

        allVerificationStatusesResult[0].forEach(rows => {
            verification_status_counts.push({
                verification_status_id: rows.verification_status_id,
                verification_status: rows.verification_status,
                verification_status_total: statusCount[rows.verification_status_id] || 0
            });
        });
    
        const data = {
            status: 200,
            message: "adha dashboard Status Count retrieved successfully",
            adha_verification_status_total_list_count:adha_verification_status_total_list_count,
            verification_status_counts:verification_status_counts
        };

        return res.status(200).json(data);
    } catch (error) {
        return error500(error, res);
    } finally {
        await connection.release();
    }
};

//getPaymentStatus
const getPaymentStatusCount = async (req, res) => {
    const { created_at, user_id } = req.query;
    // Attempt to obtain a database connection
    let connection = await getConnection();

    try {
        // Start a transaction
        await connection.beginTransaction();
        
        let adha_payment_status_total_list_count = 0;
        let payment_status_counts = [];
        
        // today total status count
        let todayTotalPaymentStatusCountQuery = `SELECT COUNT(*) AS total FROM payment_status ps
            JOIN adha a
            ON ps.payment_status_id = a.payment_status_id
            WHERE Date(a.created_at) = ?`;
            if (user_id) {
                todayTotalPaymentStatusCountQuery += ` AND a.user_id = '${user_id}'`;
            }
        let todayTotalPaymentStatusCountResult = await connection.query(todayTotalPaymentStatusCountQuery,[created_at]);
        adha_payment_status_total_list_count = parseInt(todayTotalPaymentStatusCountResult[0][0].total);
        
        // specific today total status count
        let specificPaymentStatusCountQuery = `
            SELECT ps.payment_status_id,ps.payment_status, COUNT(*) AS total
            FROM payment_status ps
            JOIN adha a
            ON ps.payment_status_id = a.payment_status_id
            WHERE Date(a.created_at) = ?`;
            if (user_id) {
                specificPaymentStatusCountQuery += ` AND a.user_id = '${user_id}'`;
            }
            specificPaymentStatusCountQuery += `GROUP BY ps.payment_status_id,ps.payment_status`;

        let specificPaymentStatusCountResult = await connection.query(specificPaymentStatusCountQuery,[created_at]);
    
        const statusCount = {};
        specificPaymentStatusCountResult[0].forEach(row => {
            statusCount[row.payment_status_id] = parseInt(row.total);
        });

        //get all verification status
        let allPaymentStatusesQuery = `SELECT payment_status_id, payment_status FROM payment_status`;
        let allPaymentStatusesResult = await connection.query(allPaymentStatusesQuery);

        allPaymentStatusesResult[0].forEach(rows => {
            payment_status_counts.push({
                payment_status_id: rows.payment_status_id,
                payment_status: rows.payment_status,
                payment_status_total: statusCount[rows.payment_status_id] || 0
            });
        });
        
        const data = {
            status: 200,
            message: "adha dashboard Status Count retrieved successfully",
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
