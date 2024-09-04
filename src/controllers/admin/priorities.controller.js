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
error500 = (err, res) => {
    return res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      error: err
    });
};

//add Priorities..
const addPrioritie = async (req, res) => {
    const  priority_name  = req.body.priority_name  ? req.body.priority_name.trim()  : '';
    const user_id  = req.companyData.user_id ;
 
    if (!priority_name) {
        return error422("Priority Name is required.", res);
    }  else if (!user_id) {
        return error422("User ID is required.", res);
    }

    //check Prioritie already is exists or not
    const isExistPriorityQuery = `SELECT * FROM priorities WHERE LOWER(TRIM(priority_name))= ? && user_id =?`;
    const isExistPriorityResult = await pool.query(isExistPriorityQuery, [ priority_name.toLowerCase(), user_id]);
    if (isExistPriorityResult[0].length > 0) {
        return error422(" Priority Name is already exists.", res);
    } 
    // Attempt to obtain a database connection
    let connection = await getConnection();
    try {
         //Start the transaction
         await connection.beginTransaction();
        //insert into Prioritie
        const insertPriorityQuery = `INSERT INTO priorities (priority_name, user_id ) VALUES (?, ?)`;
        const insertPriorityValues = [priority_name, user_id];
        const priorityResult = await connection.query(insertPriorityQuery, insertPriorityValues);
       
        //commit the transation
        await connection.commit();
        res.status(200).json({
            status: 200,
            message: "Prioritie added successfully",
        });
    } catch (error) {
        return error500(error, res);
    } finally {
        await connection.release();
    }
};

//Get priorities List...
const getPriorities = async (req, res) => {
    const { page, perPage, key } = req.query;
    const user_id  = req.companyData.user_id ;
    // Attempt to obtain a database connection
    let connection = await getConnection();
    try {
        //Start the transaction
        await connection.beginTransaction();

        let getPrioritiesQuery = `SELECT * FROM priorities WHERE user_id = ${user_id}`;
        let countQuery = `SELECT COUNT(*) AS total FROM priorities WHERE user_id = ${user_id}`;

        if (key) {
            const lowercaseKey = key.toLowerCase().trim();
            if (lowercaseKey === "activated") {
                getPrioritiesQuery += ` AND status = 1`;
                countQuery += ` AND status = 1`;
            } else if (lowercaseKey === "deactivated") {
                getPrioritiesQuery += ` AND status = 0`;
                countQuery += ` AND status = 0`;
            } else {
                getPrioritiesQuery += ` AND  LOWER(priority_name) LIKE '%${lowercaseKey}%' `;
                countQuery += ` AND LOWER(priority_name) LIKE '%${lowercaseKey}%' `;
            }
        }
        getPrioritiesQuery += " ORDER BY created_at DESC";
        // Apply pagination if both page and perPage are provided
        let total = 0;
        if (page && perPage) {
            const totalResult = await connection.query(countQuery);
            total = parseInt(totalResult[0][0].total);

            const start = (page - 1) * perPage;
            getPrioritiesQuery += ` LIMIT ${perPage} OFFSET ${start}`;
        }
        const result = await connection.query(getPrioritiesQuery);
        const priorities = result[0];

        const data = {
            status: 200,
            message: "Priorities retrieved successfully",
            data: priorities,
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

// get priority by id...
const getpriority = async (req, res) => {

    const priorityId = parseInt(req.params.id);
    const user_id = req.companyData.user_id;
    
    // Attempt to obtain a database connection
    let connection = await getConnection();

    try {
        // Start a transaction
        await connection.beginTransaction();

        const priorityQuery = `SELECT * FROM priorities WHERE priority_id = ? && user_id = ?`;
        const priorityResult = await connection.query(priorityQuery, [priorityId, user_id]);
        if (priorityResult[0].length == 0) {
             return error422("priority Not Found.", res);
        }
        const priority = priorityResult[0][0];
        res.status(200).json({
            status: 200,
            message: "priority Retrived Successfully",
            data: priority,
        });
} catch (error) {
    error500(error, res);
} finally {
    if (connection) {
        connection.release();
    }
  }
};

//update priority...
const updatePriority = async (req, res) => {
    const priorityId = parseInt(req.params.id);
    const priority_name = req.body.priority_name ? req.body.priority_name.trim() : '';
    const user_id  = req.companyData.user_id;

    if (!priority_name) {
        return error422("Priority Name is required.", res);
    } else if (!user_id) {
        return error422("User ID is required.", res);
    }

    // Check if priority exists
    const priorityQuery = "SELECT * FROM priorities WHERE priority_id = ? AND user_id = ?";
    const priorityResult = await pool.query(priorityQuery, [priorityId, user_id]);
    if (priorityResult[0].length === 0) {
        return error422("Priority Not Found.", res);
    }

    // Check if the Priority Name already exists for a different priority under the same user
    const isPriorityNameExistsQuery = "SELECT * FROM priorities WHERE priority_name = ? AND priority_id != ? AND user_id = ?";
    const isPriorityNameExistsResult = await pool.query(isPriorityNameExistsQuery, [priority_name, priorityId, user_id]);
    if (isPriorityNameExistsResult[0].length > 0) {
        return error422("Priority Name already exists.", res);
    }

    // Attempt to obtain a database connection
    let connection = await getConnection();

    try {
        // Start a transaction
        await connection.beginTransaction();

        // Update Priority details
        const updateQuery = `UPDATE priorities SET priority_name = ?, user_id = ? WHERE priority_id = ?`;
        await connection.query(updateQuery, [priority_name, user_id, priorityId]);

        // Commit the transaction
        await connection.commit();
        return res.status(200).json({
            status: 200,
            message: "Priority updated successfully.",
        });
    } catch (error) {
        await connection.rollback();
        return error500(error, res);
    } finally {
        await connection.release();
    }
};


//status change of priority...
const onStatusChange = async (req, res) => {
    const priorityId = parseInt(req.params.id);
    const status = parseInt(req.query.status); // Validate and parse the status parameter
    const user_id  = req.companyData.user_id ;
    
    // Attempt to obtain a database connection
    let connection = await getConnection();

    try {
        // Start a transaction
        await connection.beginTransaction();
        // Check if the priority  exists
        const priorityQuery = "SELECT * FROM priorities WHERE priority_id  = ? && user_id = ?";
        const priorityResult = await connection.query(priorityQuery, [priorityId, user_id]);
  
        if (priorityResult[0].length == 0) {
            return res.status(404).json({
                status: 404,
                message: "priority Not Found.",
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
              UPDATE priorities
              SET status = ?
              WHERE priority_id = ?`;
  
        await connection.query(updateQuery, [status, priorityId]);
  
        const statusMessage = status === 1 ? "activated" : "deactivated";
        //commit the transation
        await connection.commit();
        return res.status(200).json({
            status: 200,
            message: `Priority ${statusMessage} successfully.`,
        });
    } catch (error) {
        return error500(error, res);
    } finally {
        await connection.release();
    }
};

//get active Priorities ...
const getPrioritiesWma = async (req, res) => {
    
    // Attempt to obtain a database connection
    let connection = await getConnection();

    try {
        // Start a transaction
        await connection.beginTransaction();
        // Start a transaction
        let prioritiesQuery = `SELECT * FROM priorities WHERE status = 1 ORDER BY priority_name`; 
        const prioritiesResult = await connection.query(prioritiesQuery);
        const priorities = prioritiesResult[0];
  
        res.status(200).json({
            status: 200,
            message: "Priority retrieved successfully.",
            data: priorities,
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
    addPrioritie,
    getPriorities,
    getpriority,
    updatePriority,
    onStatusChange,
    getPrioritiesWma
}
