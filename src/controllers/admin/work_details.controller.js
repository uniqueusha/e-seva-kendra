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

//add Work Details..
const addWorkDetails = async (req, res) => {
    const  work_details  = req.body.work_details  ? req.body.work_details.trim()  : '';
    const user_id  = req.companyData.user_id ;
     
    // Attempt to obtain a database connection
    let connection = await getConnection();
    try {
         //Start the transaction
         await connection.beginTransaction();
        //insert into Work Details
        const insertWorkDetailsQuery = `INSERT INTO work_details (work_details, user_id ) VALUES (?, ?)`;
        const insertWorkDetailsValues = [work_details, user_id];
        const workDetailsResult = await connection.query(insertWorkDetailsQuery, insertWorkDetailsValues);
       
        //commit the transation
        await connection.commit();
        res.status(200).json({
            status: 200,
            message: "Work Details added successfully",
        });
    } catch (error) {
        return error500(error, res);
    } finally {
        await connection.release();
    }
};

//Get Work Details List...
const getWorkDetails = async (req, res) => {
    const { page, perPage, key } = req.query;
    const user_id  = req.companyData.user_id ;
    // Attempt to obtain a database connection
    let connection = await getConnection();
    try {
        //Start the transaction
        await connection.beginTransaction();

        let getWorkDetailsQuery = `SELECT * FROM work_details WHERE user_id = ${user_id}`;
        let countQuery = `SELECT COUNT(*) AS total FROM work_details WHERE user_id = ${user_id}`;

        if (key) {
            const lowercaseKey = key.toLowerCase().trim();
            if (lowercaseKey === "activated") {
                getWorkDetailsQuery += ` AND status = 1`;
                countQuery += ` AND e.status = 1`;
            } else if (lowercaseKey === "deactivated") {
                getWorkDetailsQuery += ` AND status = 0`;
                countQuery += ` AND status = 0`;
            }
        }
        getWorkDetailsQuery += " ORDER BY created_at DESC";
        // Apply pagination if both page and perPage are provided
        let total = 0;
        if (page && perPage) {
            const totalResult = await connection.query(countQuery);
            total = parseInt(totalResult[0][0].total);

            const start = (page - 1) * perPage;
            getWorkDetailsQuery += ` LIMIT ${perPage} OFFSET ${start}`;
        }
        const result = await connection.query(getWorkDetailsQuery);
        const workDetails = result[0];

        const data = {
            status: 200,
            message: "Work Details retrieved successfully",
            data: workDetails,
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

// get Work Detail  by id...
const getWorkDetail= async (req, res) => {

    const workDetailId = parseInt(req.params.id);
    const user_id = req.companyData.user_id;
    
    // Attempt to obtain a database connection
    let connection = await getConnection();

    try {
        // Start a transaction
        await connection.beginTransaction();

        const workDetailQuery = `SELECT * FROM work_details WHERE work_details_id = ? && user_id = ?`;
        const workDetailResult = await connection.query(workDetailQuery, [workDetailId, user_id]);
        if (workDetailResult[0].length == 0) {
             return error422("Work Detail Not Found.", res);
        }
        const workDetail = workDetailResult[0][0];
        res.status(200).json({
            status: 200,
            message: "Work Detail Retrived Successfully",
            data: workDetail,
        });
} catch (error) {
    error500(error, res);
} finally {
    if (connection) {
        connection.releaseConnection();
    }
  }
};

//update Work Detail...
const updateWorkDetail = async (req, res) => {
    const workDetailId = parseInt(req.params.id);
    const work_details = req.body.work_details ? req.body.work_details.trim() : '';
    const user_id  = req.companyData.user_id;
    if (!workDetailId) {
        return error422("Work Detail Id is required.", res);
    } else if (!user_id) {
        return error422("User ID is required.", res);
    }

    // Check if Work Detail exists
    const workDetailQuery = "SELECT * FROM work_details WHERE work_details_id = ? AND user_id = ?";
    const workDetailResult = await pool.query(workDetailQuery, [workDetailId, user_id]);
    if (workDetailResult[0].length === 0) {
        return error422("Work Detail Not Found.", res);
    }

    // Attempt to obtain a database connection
    let connection = await getConnection();

    try {
        // Start a transaction
        await connection.beginTransaction();

        // Update Work Detail details
        const updateQuery = `UPDATE work_details SET work_details = ?, user_id = ? WHERE work_details_id = ?`;
        await connection.query(updateQuery, [work_details, user_id, workDetailId]);

        // Commit the transaction
        await connection.commit();
        return res.status(200).json({
            status: 200,
            message: "Work Detail updated successfully.",
        });
    } catch (error) {
        await connection.rollback();
        return error500(error, res);
    } finally {
        await connection.release();
    }
};

//status change of Work Details...
const onStatusChange = async (req, res) => {
    const workDetailId = parseInt(req.params.id);
    const status = parseInt(req.query.status); // Validate and parse the status parameter
    // Attempt to obtain a database connection
    let connection = await getConnection();

    try {
        // Start a transaction
        await connection.beginTransaction();
        // Check if the work Details  exists
        const workDetailsQuery = "SELECT * FROM work_details WHERE work_details_id = ?";
        const workDetailsResult = await connection.query( workDetailsQuery, [workDetailId]);
  
        if (workDetailsResult[0].length == 0) {
            return res.status(404).json({
                status: 404,
                message: "Work Details Not Found.",
            });
        }
  
        // Validate the status parameter
        if (status !== 0 && status !== 1) {
            return res.status(400).json({
                status: 400,
                message:"Invalid status value. Status must be 0 (inactive) or 1 (active).",
            });
        }
  
        // Soft update the work deatalis status
        const updateQuery = `
              UPDATE work_details
              SET status = ?
              WHERE work_details_id = ?`;
  
        await connection.query(updateQuery, [status, workDetailId]);
  
        const statusMessage = status === 1 ? "activated" : "deactivated";
        //commit the transation
        await connection.commit();
        return res.status(200).json({
            status: 200,
            message: `Work Details ${statusMessage} successfully.`,
        });
    } catch (error) {
        return error500(error, res);
    } finally {
        await connection.release();
    }
};
//get Work Details active...
const getWorkDetailsWma = async (req, res, next) => {
    
    // Attempt to obtain a database connection
    let connection = await getConnection();

    try {
        // Start a transaction
        await connection.beginTransaction();
        // Start a transaction
        let workDetailsQuery = `SELECT * FROM work_details WHERE status = 1`; 
        const workDetailsResult = await connection.query(workDetailsQuery);
        const workDetails = workDetailsResult[0];
  
        res.status(200).json({
            status: 200,
            message: "Work Details retrieved successfully.",
            data: workDetails,
      });
    } catch (error) {
        error500(error, res);
    } finally {
        if (connection) {
            connection.releaseConnection();
      }
    }
};
module.exports = {
    addWorkDetails,
    getWorkDetails,
    getWorkDetail,
    updateWorkDetail,
    onStatusChange,
    getWorkDetailsWma
}
