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
}

//error 500 handler...
error500 = (error, res) => {
     res.send({
        status: 500,
        message: "Internal Server Error",
        error: error
    });
}

//add payment Status..
const addPaymentStatus = async (req, res) => {
    const  payment_status  = req.body.payment_status  ? req.body.payment_status.trim()  : '';
    if (!payment_status) {
        return error422("Payment Status is required.", res);
    }
    //check payment Status already is exists or not
    const isExistPaymentStatusQuery = `SELECT * FROM payment_status WHERE LOWER(TRIM(payment_status))= ? `;
    const isExistPaymentStatusResult = await pool.query(isExistPaymentStatusQuery, [ status_name.toLowerCase()]);
    if (isExistPaymentStatusResult[0].length > 0) {
        return error422("Payment Status is already exists.", res);
    } 
    // Attempt to obtain a database connection
    let connection = await getConnection();
    try {
        //Start the transaction
         await connection.beginTransaction();
  
        //insert into Payment Status
        const insertPaymentStatusQuery = `INSERT INTO payment_status (payment_status) VALUES (?)`;
        const insertPaymentStatusValues = [payment_status];
        const paymentStatusResult = await connection.query(insertPaymentStatusQuery, insertPaymentStatusValues);
       
        //commit the transation
        await connection.commit();
        res.status(200).json({
            status: 200,
            message: "Payment Status added successfully",
        });
    } catch (error) {
        return error500(error, res);
    } finally {
        await connection.release();
    }
};

//Get Payment status List...
const getPaymentStatus = async (req, res) => {
    const { page, perPage, key } = req.query;
    // Attempt to obtain a database connection
    let connection = await getConnection();
    try {
        //Start the transaction
        await connection.beginTransaction();

        let getPaymentStatusQuery = `SELECT * FROM payment_status WHERE 1`;
        let countQuery = `SELECT COUNT(*) AS total FROM payment_status WHERE 1`;

        if (key) {
            const lowercaseKey = key.toLowerCase().trim();
            if (lowercaseKey === "activated") {
                getPaymentStatusQuery += ` AND status = 1`;
                countQuery += ` AND status = 1`;
            } else if (lowercaseKey === "deactivated") {
                getPaymentStatusQuery += ` AND status = 0`;
                countQuery += ` AND status = 0`;
            } else {
                getPaymentStatusQuery += ` AND  LOWER(payment_status) LIKE '%${lowercaseKey}%' `;
                countQuery += ` AND LOWER(payment_status) LIKE '%${lowercaseKey}%' `;
            }
        }
        getPaymentStatusQuery += " ORDER BY created_at DESC";
        // Apply pagination if both page and perPage are provided
        let total = 0;
        if (page && perPage) {
            const totalResult = await connection.query(countQuery);
            total = parseInt(totalResult[0][0].total);

            const start = (page - 1) * perPage;
            getPaymentStatusQuery += ` LIMIT ${perPage} OFFSET ${start}`;
        }
        const result = await connection.query(getPaymentStatusQuery);
        const paymentStatus = result[0];

        const data = {
            status: 200,
            message: "payment status retrieved successfully",
            data: paymentStatus,
        };
        // Add pagination information if provided
        if (page && perPage) {
            data.pagination = {
                per_page: perPage,
                total: total,
                current_page: page,
                last_page: Math.ceil(total / perPage),
            };
        }

        return res.status(200).json(data);
    } catch (error) {
        return error500(error, res);
    } finally {
        await connection.release();
    }
};

// get payment staus by id...
const getPeymentStatusById = async (req, res) => {
    const paymentStatusId = parseInt(req.params.id);
    
    
    // Attempt to obtain a database connection
    let connection = await getConnection();

    try {
        // Start a transaction
        await connection.beginTransaction();

        const paymentStatusQuery = `SELECT * FROM payment_status WHERE payment_status_id = ?`;
        const paymentStatusResult = await connection.query(paymentStatusQuery, [paymentStatusId]);
        if (paymentStatusResult[0].length == 0) {
             return error422("payment status Not Found.", res);
        }
        const paymentStatus = paymentStatusResult[0][0];
        res.status(200).json({
            status: 200,
            message: "status Retrived Successfully",
            data: paymentStatus,
        });
} catch (error) {
    error500(error, res);
} finally {
    if (connection) {
        connection.release();
    }
  }
};

//update Payment Status...
const updatePaymentStatus = async (req, res) => {
    const paymentStatusId = parseInt(req.params.id);
    const payment_status = req.body.payment_status ? req.body.payment_status.trim() : '';
   
    if (!payment_status) {
        return error422("Payment Status is required.", res);
    }  
    
    // Attempt to obtain a database connection
    let connection = await getConnection()
    
    try {
        // Start a transaction
        await connection.beginTransaction();

        // Check if  payment status exists
        const paymentStatusQuery = "SELECT * FROM payment_status WHERE payment_status_id  = ?";
        const paymentStatusResult = await connection.query(paymentStatusQuery, [paymentStatusId]);
        if (paymentStatusResult[0].length == 0) {
            return error422(" Payment Status Not Found.", res);
        }

        //update Payment Status details
        const updateQuery = `UPDATE payment_status SET payment_status = ? WHERE payment_status_id = ?`;
        await connection.query(updateQuery, [payment_status,paymentStatusId]);

        //commit the transaction
        await connection.commit();
        return res.status(200).json({
            status: 200,
            message: "payment status updated successfully.",
    });
    } catch (error) {
        await connection.rollback();
        return error500(error, res);
    } finally {
        await connection.release();
    }
};

//status change of payment status table...
const onStatusChange = async (req, res) => {
    const paymentStatusId = parseInt(req.params.id);
    const status = parseInt(req.query.status); // Validate and parse the status parameter
    
    
    // Attempt to obtain a database connection
    let connection = await getConnection();

    try {
        // Start a transaction
        await connection.beginTransaction();

        // Check if the payment status exists
        const paymentStatusQuery = "SELECT * FROM payment_status WHERE payment_status_id = ?";
        const paymentStatusResult = await connection.query(paymentStatusQuery, [paymentStatusId]);
  
        if (paymentStatusResult[0].length == 0) {
            return res.status(404).json({
                status: 404,
                message: "Payment Status Not Found.",
            });
        }
  
        // Validate the status parameter
        if (status !== 0 && status !== 1) {
            return res.status(400).json({
                status: 400,
                message:"Invalid status value. Status must be 0 (inactive) or 1 (active).",
            });
        }
  
        // Soft update the payment status
        const updateQuery = `
              UPDATE payment_status
              SET status = ?
              WHERE payment_status_id = ?`;
  
        await connection.query(updateQuery, [status, paymentStatusId]);
  
        const statusMessage = status === 1 ? "activated" : "deactivated";
        //commit the transation
        await connection.commit();
        return res.status(200).json({
            status: 200,
            message: `Payment Status ${statusMessage} successfully.`,
        });
    } catch (error) {
        return error500(error, res);
    } finally {
        await connection.release();
    }
};

//get active status ...
const getStatusWma = async (req, res) => {
    // Attempt to obtain a database connection
    let connection = await getConnection();

    try {
        // Start a transaction
        await connection.beginTransaction();
        // Start a transaction
        let statusQuery = `SELECT * FROM payment_status WHERE status = 1 ORDER BY payment_status`; 
        const statusResult = await connection.query(statusQuery);
        const status = statusResult[0];
  
        res.status(200).json({
            status: 200,
            message: "status retrieved successfully.",
            data: status,
      });
    } catch (error) {
        error500(error, res);
    } finally {
        if (connection) {
            connection.release();
      }
    }
};

module.exports = {
    addPaymentStatus,
    getPaymentStatus,
    getPeymentStatusById,
    updatePaymentStatus,
    onStatusChange,
    getStatusWma
}