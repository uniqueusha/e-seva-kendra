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
error500 = (err, res) => {
    return res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      error: err
    });
};

// add role...
const addRole = async (req, res) => {
    const  role_name  = req.body.role_name  ? req.body.role_name.trim()  : '';
    const user_id  = req.companyData.user_id;

    if (!role_name) {
        return error422("Role Name is required.", res);
    }else if (!user_id) {
        return error422("User ID is required.", res);
    }

    //check role already exists or not
    const isExistRoleQuery = `SELECT * FROM roles WHERE role_name = ? AND user_id = ? `;
    const isExistRoleResult = await pool.query(isExistRoleQuery, [ role_name,user_id]);
    if (isExistRoleResult[0].length > 0) {
        return error422(" Role Name is already exists.", res);
    } 

    // attempt to obtain a database connection
    let connection = await getConnection();

    try {

        //start a transaction
        await connection.beginTransaction();

        //insert into roles 
        const insertRoleQuery = `INSERT INTO roles (role_name, user_id ) VALUES (?, ? )`;
        const insertRoleValues= [role_name, user_id ];
        const roleResult = await connection.query(insertRoleQuery, insertRoleValues);

         // Commit the transaction
         await connection.commit();
        res.status(200).json({
            status: 200,
            message: "Role added successfully",
        });
    } catch (error) {
        return error500(error, res);
    }finally {
        if (connection) connection.release()
    }
}

// get role list...
const getRoles = async (req, res) => {
    const { page, perPage, key } = req.query;
    const user_id = req.companyData.user_id;

    // attempt to obtain a database connection
    let connection = await getConnection();

    try {

        //start a transaction
        await connection.beginTransaction();

        let getRoleQuery = `SELECT r.*, u.user_name FROM roles r
        LEFT JOIN users u 
        ON r.user_id = u.user_id
        WHERE 1 AND r.user_id = ${user_id}`;

        let countQuery = `SELECT COUNT(*) AS total FROM roles r
        LEFT JOIN users u
        ON r.user_id = u.user_id
        WHERE 1 AND r.user_id = ${user_id} `;
        
        if (key) {
            const lowercaseKey = key.toLowerCase().trim();
            if (lowercaseKey === "activated") {
                getRoleQuery += ` AND r.status = 1`;
                countQuery += ` AND r.status = 1`;
            } else if (lowercaseKey === "deactivated") {
                getRoleQuery += ` AND r.status = 0`;
                countQuery += ` AND r.status = 0`;
            } else {
                getRoleQuery += ` AND  LOWER(r.role_name) LIKE '%${lowercaseKey}%' `;
                countQuery += ` AND  LOWER(r.role_name) LIKE '%${lowercaseKey}%' `;
            }
        }
        getRoleQuery += " ORDER BY r.created_at DESC";

        // Apply pagination if both page and perPage are provided
        let total = 0;
        if (page && perPage) {
            const totalResult = await connection.query(countQuery);
            total = parseInt(totalResult[0][0].total);

            const start = (page - 1) * perPage;
            getRoleQuery += ` LIMIT ${perPage} OFFSET ${start}`;
        }

        const result = await connection.query(getRoleQuery);
        const role = result[0];

        // Commit the transaction
        await connection.commit();
        const data = {
            status: 200,
            message: "Role retrieved successfully",
            data: role,
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
    }finally {
        if (connection) connection.release()
    }

}

// get role  by id...
const getRole = async (req, res) => {
    const roleId = parseInt(req.params.id);
    const user_id=req.companyData.user_id;
   
    // attempt to obtain a database connection
    let connection = await getConnection();

    try {

        //start a transaction
        await connection.beginTransaction();

        const roleQuery = `SELECT r.* FROM roles r
        LEFT JOIN  users u
        ON r.user_id=u.user_id
         WHERE r.role_id=? AND r.user_id=? `;
        const roleResult = await connection.query(roleQuery, [roleId,user_id]);
        
        if (roleResult[0].length == 0) {
            return error422("Role Not Found.", res);
        }
        const role = roleResult[0][0];
        
        return res.status(200).json({
            status: 200,
            message: "Role Retrived Successfully",
            data: role
        });
    } catch (error) {
        return error500(error, res);
    }finally {
        if (connection) connection.release()
    }
}

//role update...
const updateRole = async (req, res) => {
    const roleId = parseInt(req.params.id);
    const role_name = req.body.role_name ? req.body.role_name : '';
    const user_id = req.companyData.user_id;

    if (!role_name) {
        return error422("Role name is required.", res);
    } else if (!user_id) {
        return error422("User id is required.", res);
    } else if (!roleId) {
        return error422("Role id is required.", res);
    }

    // attempt to obtain a database connection
    let connection = await getConnection();

    try {

        //start a transaction
        await connection.beginTransaction();

        // Check if role exists
        const roleQuery = "SELECT * FROM roles WHERE role_id  = ? AND user_id=?";
        const roleResult = await connection.query(roleQuery, [roleId,user_id]);
        if (roleResult[0].length == 0) {
            return error422("Role Not Found.", res);
        }
        // Check if the provided role exists and is active 
        const existingRoleQuery = "SELECT * FROM roles WHERE role_name  = ? AND role_id!=? AND user_id = ?";
        const existingRoleResult = await connection.query(existingRoleQuery, [role_name, roleId, user_id]);

        if (existingRoleResult[0].length > 0) {
            return error422("Role Name already exists.", res);
        }
        
        // Update the roles record with new data
        const updateQuery = `
            UPDATE roles
            SET role_name = ?, user_id = ?
            WHERE role_id = ?
        `;

        await connection.query(updateQuery, [role_name, user_id, roleId]);
        // Commit the transaction
        await connection.commit();

        return res.status(200).json({
            status: 200,
            message: "Role updated successfully.",
        });
    } catch (error) {
        return error500(error,res);
    }finally {
        if (connection) connection.release()
    }
}
//status change of role...
const onStatusChange = async (req, res) => {
    const roleId = parseInt(req.params.id);
    const status = parseInt(req.query.status); // Validate and parse the status parameter
    const user_id = req.companyData.user_id;

    // attempt to obtain a database connection
    let connection = await getConnection();

    try {

        //start a transaction
        await connection.beginTransaction();

        // Check if the role  exists
        const roleQuery = "SELECT * FROM roles WHERE role_id = ? AND user_id=?";
        const roleResult = await connection.query(roleQuery, [roleId,user_id]);

        if (roleResult[0].length == 0) {
            return res.status(404).json({
                status: 404,
                message: "Role not found.",
            });
        }

        // Validate the status parameter
        if (status !== 0 && status !== 1) {
            return res.status(400).json({
                status: 400,
                message: "Invalid status value. Status must be 0 (inactive) or 1 (active).",
            });
        }

        // Soft update the roles status
        const updateQuery = `
            UPDATE roles
            SET status = ?
            WHERE role_id = ?
        `;

        await connection.query(updateQuery, [status, roleId]);

        const statusMessage = status === 1 ? "activated" : "deactivated";
        // Commit the transaction
        await connection.commit();
        return res.status(200).json({
            status: 200,
            message: `Role ${statusMessage} successfully.`,
        });
    } catch (error) {
        return error500(error,res);
    }finally {
        if (connection) connection.release()
    }
};

//get role active...
const getRoleWma = async (req, res) => {
    const user_id = req.companyData.user_id;

    const checkUserQuery = `SELECT * FROM users WHERE user_id = ${user_id} `;
    const userResult = await pool.query(checkUserQuery);
    

    let roleQuery = `SELECT r.* FROM roles r
    LEFT JOIN users u 
    ON u.user_id = r.user_id
    WHERE r.status = 1 ORDER BY r.role_name `;
    
    // attempt to obtain a database connection
    let connection = await getConnection();

    try {

        //start a transaction
        await connection.beginTransaction();

        const roleResult = await connection.query(roleQuery);
        const role = roleResult[0];

        // Commit the transaction
        await connection.commit();
        
        return res.status(200).json({
            status: 200,
            message: "Role retrieved successfully.",
            data: role,
        });
    } catch (error) {
        return error500(error,res);
    }finally {
        if (connection) connection.release()
    }
}
module.exports = {
    addRole,
    getRoles,
    getRole,
    updateRole,
    onStatusChange,
    getRoleWma
}