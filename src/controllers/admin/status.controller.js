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

//add Status..
const addStatus = async (req, res) => {
    const  status_name  = req.body.status_name  ? req.body.status_name.trim()  : '';
    const user_id  = req.companyData.user_id ;
 
    if (!status_name) {
        return error422("Status Name is required.", res);
    }  else if (!user_id) {
        return error422("User ID is required.", res);
    }

    //check Status already is exists or not
    const isExistStatusQuery = `SELECT * FROM status WHERE LOWER(TRIM(status_name))= ? && user_id =?`;
    const isExistStatusResult = await pool.query(isExistStatusQuery, [ status_name.toLowerCase(), user_id]);
    if (isExistStatusResult[0].length > 0) {
        return error422(" Status Name is already exists.", res);
    } 
    // Attempt to obtain a database connection
    let connection = await getConnection();
    try {
         //Start the transaction
         await connection.beginTransaction();
        //insert into Status
        const insertStatusQuery = `INSERT INTO status (status_name, user_id ) VALUES (?, ?)`;
        const insertStatusValues = [status_name, user_id];
        const statusResult = await connection.query(insertStatusQuery, insertStatusValues);

        //commit the transation
        await connection.commit();
        res.status(200).json({
            status: 200,
            message: "Status added successfully",
        });
    } catch (error) {
        return error500(error, res);
    } finally {
        await connection.release();
    }
};

//Get status List...
const getStatus = async (req, res) => {
    const { page, perPage, key } = req.query;
    const user_id  = req.companyData.user_id ;
    // Attempt to obtain a database connection
    let connection = await getConnection();
    try {
        //Start the transaction
        await connection.beginTransaction();

        let getStatusQuery = `SELECT * FROM status WHERE user_id = ${user_id}`;
        let countQuery = `SELECT COUNT(*) AS total FROM status WHERE user_id = ${user_id}`;

        if (key) {
            const lowercaseKey = key.toLowerCase().trim();
            if (lowercaseKey === "activated") {
                getStatusQuery += ` AND status = 1`;
                countQuery += ` AND status = 1`;
            } else if (lowercaseKey === "deactivated") {
                getStatusQuery += ` AND status = 0`;
                countQuery += ` AND status = 0`;
            } else {
                getStatusQuery += ` AND  LOWER(status_name) LIKE '%${lowercaseKey}%' `;
                countQuery += ` AND LOWER(status_name) LIKE '%${lowercaseKey}%' `;
            }
        }
        getStatusQuery += " ORDER BY created_at DESC";
        // Apply pagination if both page and perPage are provided
        let total = 0;
        if (page && perPage) {
            const totalResult = await connection.query(countQuery);
            total = parseInt(totalResult[0][0].total);

            const start = (page - 1) * perPage;
            getStatusQuery += ` LIMIT ${perPage} OFFSET ${start}`;
        }
        const result = await connection.query(getStatusQuery);
        const status = result[0];

        const data = {
            status: 200,
            message: "status retrieved successfully",
            data: status,
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

// get staus by id...
const getStatusById = async (req, res) => {
    const statusId = parseInt(req.params.id);
    const user_id = req.companyData.user_id;
    
    // Attempt to obtain a database connection
    let connection = await getConnection();

    try {
        // Start a transaction
        await connection.beginTransaction();

        const statusQuery = `SELECT * FROM status WHERE status_id = ? && user_id = ?`;
        const statusResult = await connection.query(statusQuery, [statusId, user_id]);
        if (statusResult[0].length == 0) {
             return error422("status Not Found.", res);
        }
        const status = statusResult[0][0];
        res.status(200).json({
            status: 200,
            message: "status Retrived Successfully",
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

//update Status...
const updateStatus = async (req, res) => {
    const statusId = parseInt(req.params.id);
    const status_name = req.body.status_name ? req.body.status_name.trim() : '';
    const user_id  = req.companyData.user_id ;
    if (!status_name) {
        return error422("Status Name is required.", res);
    }  else if (!user_id) {
        return error422("User ID is required.", res);
    }
    
   
    // Attempt to obtain a database connection
    let connection = await getConnection()
    
    try {
        // Start a transaction
        await connection.beginTransaction();

        // Check if status exists
        const statusQuery = "SELECT * FROM status WHERE status_id  = ? && user_id";
        const statusResult = await connection.query(statusQuery, [statusId, user_id]);
        if (statusResult[0].length == 0) {
            return error422("Status Not Found.", res);
        }

        //update Status details
        const updateQuery = `UPDATE status SET status_name = ?, user_id = ? WHERE status_id = ?`;
        await connection.query(updateQuery, [status_name, user_id, statusId]);

        //commit the transaction
        await connection.commit();
        return res.status(200).json({
            status: 200,
            message: "status updated successfully.",
    });
    } catch (error) {
        await connection.rollback();
        return error500(error, res);
    } finally {
        await connection.release();
    }
};

//status change of status table...
const onStatusChange = async (req, res) => {
    const statusId = parseInt(req.params.id);
    const status = parseInt(req.query.status); // Validate and parse the status parameter
    const user_id  = req.companyData.user_id ;
    
    // Attempt to obtain a database connection
    let connection = await getConnection();

    try {
        // Start a transaction
        await connection.beginTransaction();
        // Check if the user exists
        const statusQuery = "SELECT * FROM status WHERE status_id = ? && user_id = ?";
        const statusResult = await connection.query(statusQuery, [statusId, user_id]);
  
        if (statusResult[0].length == 0) {
            return res.status(404).json({
                status: 404,
                message: "Status Not Found.",
            });
        }
  
        // Validate the status parameter
        if (status !== 0 && status !== 1) {
            return res.status(400).json({
                status: 400,
                message:"Invalid status value. Status must be 0 (inactive) or 1 (active).",
            });
        }
  
        // Soft update the priority status
        const updateQuery = `
              UPDATE status
              SET status = ?
              WHERE status_id = ?`;
  
        await connection.query(updateQuery, [status, statusId]);
  
        const statusMessage = status === 1 ? "activated" : "deactivated";
        //commit the transation
        await connection.commit();
        return res.status(200).json({
            status: 200,
            message: `Status ${statusMessage} successfully.`,
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
        let statusQuery = `SELECT * FROM status WHERE status = 1 ORDER BY status_name`; 
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
    addStatus,
    getStatus,
    getStatusById,
    updateStatus,
    onStatusChange,
    getStatusWma
}