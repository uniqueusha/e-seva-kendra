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

//Add User Role
const addUserRole = async (req, res) => {
    const  role_id  = req.body.role_id  ? req.body.role_id.trim()  : '';
    const user_id  = req.companyData.user_id ;
 
    if (!role_id) {
        return error422("Role Id is required.", res);
    }  else if (!user_id) {
        return error422("User ID is required.", res);
    }

    //check Role already is exists or not
    const isExistRoleQuery = `SELECT * FROM priorities WHERE user_id =?`;
    const isExistRoleResult = await pool.query(isExistRoleQuery, [ priority_name.toLowerCase(), user_id]);
    if (isExistRoleResult[0].length > 0) {
        return error422("Role not found.", res);
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


//Get User_Role List...
const getUserRole = async (req, res) => {
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
                getPrioritiesQuery += ` AND e.status = 1`;
                countQuery += ` AND e.status = 1`;
            } else if (lowercaseKey === "deactivated") {
                getPrioritiesQuery += ` AND e.status = 0`;
                countQuery += ` AND e.status = 0`;
            } else {
                getPrioritiesQuery += ` AND  LOWER(priority_name) LIKE '%${lowercaseKey}%' `;
                countQuery += ` AND LOWER(priority_name) LIKE '%${lowercaseKey}%' `;
            }
        }
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