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
    const user_id = req.body.user_id ? req.body.user_id : '';
    const role_id = req.body.role_id ? req.body.role_id : '';
   
    if (!role_id) {
        return error422("Role Id is required.", res);
    } else if (!user_id) {
        return error422("User ID is required.", res);
    }

    // Check if the user exists
    const isExistUserQuery = `SELECT * FROM users WHERE user_id = ?`;
    const isExistUserResult = await pool.query(isExistUserQuery, [user_id]);

    if (isExistUserResult[0].length === 0) {
        return error422("User not found.", res);
    }

    // Check if the role exists
    const isExistRoleQuery = `SELECT * FROM roles WHERE role_id = ?`;
    const isExistRoleResult = await pool.query(isExistRoleQuery, [role_id]);

    if (isExistRoleResult[0].length === 0) {
        // If no role is found, return an error
        return error422("Role not found.", res);
    }

    // Attempt to obtain a database connection
    let connection = await getConnection();
    try {
        // Start the transaction
        await connection.beginTransaction();

        // Insert into User Role
        const insertUserRoleQuery = `INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)`;
        const insertUserRoleValues = [user_id, role_id];
        await connection.query(insertUserRoleQuery, insertUserRoleValues);

        // Commit the transaction
        await connection.commit();
        res.status(200).json({
            status: 200,
            message: "User Role added successfully",
        });
    } catch (error) {
        // Rollback the transaction in case of an error
        await connection.rollback();
        return error500(error, res);
    } finally {
        await connection.release();
    }
};



//Get User_Role List...
const getUserRoles = async (req, res) => {
    const { page, perPage, key } = req.query;
    // Attempt to obtain a database connection
    let connection = await getConnection();
    try {
        //Start the transaction
        await connection.beginTransaction();

        let getUserRoleQuery = `SELECT ur.user_role_id,u.user_id,u.user_name,r.role_id,r.role_name,ur.created_at FROM user_roles ur
        JOIN users u
        ON u.user_id = ur.user_id
        JOIN roles r
        ON r.user_id = u.user_id
        WHERE 1`;
        let countQuery = `SELECT COUNT(*) AS total FROM user_roles ur
        JOIN users u
        ON u.user_id = ur.user_id
        JOIN roles r
        ON r.user_id = u.user_id
        WHERE 1`;

        if (key) {
            const lowercaseKey = key.toLowerCase().trim();
            if (lowercaseKey === "activated") {
                getUserRoleQuery += ` AND status = 1`;
                countQuery += ` AND status = 1`;
            } else if (lowercaseKey === "deactivated") {
                getUserRoleQuery += ` AND status = 0`;
                countQuery += ` AND status = 0`;
            } 
        }

        getUserRoleQuery += " ORDER BY created_at DESC";
        // Apply pagination if both page and perPage are provided
        let total = 0;
        if (page && perPage) {
            const totalResult = await connection.query(countQuery);
            total = parseInt(totalResult[0][0].total);

            const start = (page - 1) * perPage;
            getUserRoleQuery += ` LIMIT ${perPage} OFFSET ${start}`;
        }
        
        const result = await connection.query(getUserRoleQuery);
        const userRole = result[0];

        const data = {
            status: 200,
            message: "User Role retrieved successfully",
            data: userRole,
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

// get user role by id...
const getUserRole = async (req, res) => {
    const userRoleId = parseInt(req.params.id);
    
    // Attempt to obtain a database connection
    let connection = await getConnection();

    try {
        // Start a transaction
        await connection.beginTransaction();

        const userRoleQuery = `SELECT ur.user_role_id,u.user_id,u.user_name,r.role_id,r.role_name,ur.created_at FROM user_roles ur
        JOIN users u
        ON u.user_id = ur.user_id
        JOIN roles r
        ON r.user_id = u.user_id
        WHERE user_role_id = ?`;
        const userRoleResult = await connection.query(userRoleQuery, [userRoleId]);
        if (userRoleResult[0].length == 0) {
             return error422("User Role Not Found.", res);
        }
        const userRole = userRoleResult[0][0];
        res.status(200).json({
            status: 200,
            message: "User Role Retrived Successfully",
            data: userRole,
        });
} catch (error) {
    error500(error, res);
} finally {
    await connection.release();
}
};

//update User Role...
const updateUserRole = async (req, res) => {
    const userRoleId = parseInt(req.params.id);
    const user_id = req.body.user_id ? req.body.user_id : '';
    const role_id = req.body.role_id ? req.body.role_id : '';

    if (!userRoleId) {
        return error422("User Role is required.", res);
    } else if (!user_id) {
        return error422("User ID is required.", res);
    } else if (!role_id) {
        return error422("Role ID is required.", res);
    } 

    // Check if  role exists
    const userQuery = "SELECT * FROM users WHERE user_id = ?";
    const userResult = await pool.query(userQuery, [user_id]);
    if (userResult[0].length === 0) {
        return error422("User Not Found.", res);
    }

    // Check if  role exists
    const roleQuery = "SELECT * FROM roles WHERE role_id = ?";
    const roleResult = await pool.query(roleQuery, [role_id]);
    if (roleResult[0].length === 0) {
        return error422("Role Not Found.", res);
    }

    // Check if user role exists
    const roleUserQuery = "SELECT * FROM user_roles WHERE user_role_id = ?";
    const roleUserResult = await pool.query(roleUserQuery, [userRoleId]);
    if (roleUserResult[0].length === 0) {
        return error422("User Role Not Found.", res);
    }


    // Attempt to obtain a database connection
    let connection = await getConnection();

    try {
        // Start a transaction
        await connection.beginTransaction();

        // Update user role details
        const updateQuery = `UPDATE user_roles SET user_id = ?,role_id = ? WHERE user_role_id = ?`;
        await connection.query(updateQuery, [user_id,role_id,userRoleId]);

        // Commit the transaction
        await connection.commit();
        return res.status(200).json({
            status: 200,
            message: "user role updated successfully.",
        });
    } catch (error) {
        await connection.rollback();
        return error500(error, res);
    } finally {
        await connection.release();
    }
};

module.exports = { 
     addUserRole,
     getUserRoles,
     getUserRole,
     updateUserRole
}