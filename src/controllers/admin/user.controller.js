const pool = require("../../../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
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

//add user..
const addUser = async (req, res) => {
    const user_name = req.body.user_name ? req.body.user_name.trim() : '';
    const email_id = req.body.email_id ? req.body.email_id.trim() : '';
    const designation_id = req.body.designation_id ? req.body.designation_id : '';
    const password = req.body.password ? req.body.password : '';
    if (!user_name) {
        return error422("User Name is required.", res);
    } else if (!password) {
        return error422("Password is required.", res);
    }

    //check User Name already is exists or not
    const isExistUserNameQuery = `SELECT * FROM users WHERE LOWER(TRIM(user_name))= ?`;
    const isExistUserNameResult = await pool.query(isExistUserNameQuery, [user_name.toLowerCase()]);
    if (isExistUserNameResult[0].length > 0) {
        return error422(" User Name is already exists.", res);
    }

    // Check if designation exists
    const designationQuery = "SELECT * FROM designations WHERE designation_id  = ?";
    const designationResult = await pool.query(designationQuery, [designation_id]);
    if (designationResult[0].length == 0) {
        return error422("Designation Not Found.", res);
    }

    // Attempt to obtain a database connection
    let connection = await getConnection();
    try {
        //Start the transaction
        await connection.beginTransaction();
        //insert into user
        const insertUserQuery = `INSERT INTO users (user_name, email_id, designation_id) VALUES (?, ?, ? )`;
        const insertUserValues = [user_name, email_id, designation_id];
        const insertuserResult = await connection.query(insertUserQuery, insertUserValues);
        const user_id = insertuserResult[0].insertId;

        const hash = await bcrypt.hash(password, 10); // Hash the password using bcrypt

        //insert into contrasena
        const insertContrasenaQuery = 'INSERT INTO contrasena (user_id, extenstions) VALUES (?,?)';
        const insertContrasenaValues = [user_id, hash];
        const contrasenaResult = await connection.query(insertContrasenaQuery, insertContrasenaValues);

        //commit the transation
        await connection.commit();
        res.status(200).json({
            status: 200,
            message: "User added successfully",
        });
    } catch (error) {
        await connection.rollback();
        console.log(error);
        
        return error500(error, res);
    } finally {
        await connection.release();
    }
};
//Login user...
const userLogin = async (req, res) => {
    const email_id = req.body.email_id ? req.body.email_id.trim() : "";
    const password = req.body.password ? req.body.password : "";
    if (!email_id) {
        return error422("Email Id is Required.", res);
    } else if (!password) {
        return error422("Password is Required.", res);
    }
    // Attempt to obtain a database connection
    let connection = await getConnection();
    try {
        //Start the transaction
        await connection.beginTransaction();
        // Check if the user with the provided user email id exists or not
        const checkUserQuery = "SELECT * FROM users WHERE LOWER(TRIM(email_id)) = ?";
        const checkUserResult = await connection.query(checkUserQuery, [email_id.toLowerCase()]);
        const check_user = checkUserResult[0][0];
        if (!check_user) {
            return error422("Authentication failed.", res);
        }
        // Check if the user with the provided user id exists
        const checkUserContrasenaQuery = "SELECT * FROM contrasena WHERE user_id = ?";
        const checkUserContrasenaResult = await connection.query(checkUserContrasenaQuery, [check_user.user_id]);
        const user_contrasena = checkUserContrasenaResult[0][0];
        if (!user_contrasena) {
            return error422("Authentication failed.", res);
        }

        const isPasswordValid = await bcrypt.compare(password, user_contrasena.extenstions);
        if (!isPasswordValid) {
            return error422("Password worng.", res);
        }
        // Generate a JWT token
        const token = jwt.sign(
            {
                user_id: user_contrasena.user_id,
                email_id: check_user.email_id,
            },
            "secret_this_should_be", // Use environment variable for secret key
            { expiresIn: "10h" }
        );
        const userDataQuery = `SELECT u.*, c.contrasena_id FROM  users u 
        LEFT JOIN contrasena c
        ON c.user_id =u.user_id 
        WHERE u.user_id = ? `;
        let userDataResult = await connection.query(userDataQuery, [check_user.user_id]);

        // Commit the transaction
        await connection.commit();
        return res.status(200).json({
            status: 200,
            message: "Authentication successfully",
            token: token,
            expiresIn: 36000000, // 10 hour in seconds,
            data: userDataResult[0][0],
        });

    } catch (error) {
        //Handle errors
        // await query("ROLLBACK");
        return error500(error, res)
    } finally {
        await connection.release();
    }

};

//Get users list...
const getUsers = async (req, res) => {
    const { page, perPage, key } = req.query;
    // Attempt to obtain a database connection
    let connection = await getConnection();
    try {
        //Start the transaction
        await connection.beginTransaction();

        let getUserQuery = `SELECT * FROM users`;
        let countQuery = `SELECT COUNT(*) AS total FROM user`;

        if (key) {
            const lowercaseKey = key.toLowerCase().trim();
            if (lowercaseKey === "activated") {
                getUserQuery += ` AND e.status = 1`;
                countQuery += ` AND e.status = 1`;
            } else if (lowercaseKey === "deactivated") {
                getUserQuery += ` AND e.status = 0`;
                countQuery += ` AND e.status = 0`;
            } else {
                getUserQuery += ` AND  LOWER(user_name) LIKE '%${lowercaseKey}%' `;
                countQuery += ` AND LOWER(user_name) LIKE '%${lowercaseKey}%' `;
            }
        }
        // Apply pagination if both page and perPage are provided
        let total = 0;
        if (page && perPage) {
            const totalResult = await pool.query(countQuery);
            total = parseInt(totalResult[0][0].total);

            const start = (page - 1) * perPage;
            getUserQuery += ` LIMIT ${perPage} OFFSET ${start}`;
        }
        const result = await pool.query(getUserQuery);
        const user = result[0];

        const data = {
            status: 200,
            message: "Employee retrieved successfully",
            data: user,
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

// get users by id...
const getUser = async (req, res, next) => {
    const userId = parseInt(req.params.id);

// Attempt to obtain a database connection
let connection = await getConnection();

try {
    // Start a transaction
    await connection.beginTransaction();

    const userQuery = `SELECT * FROM users WHERE user_id = ?`;
    const userResult = await connection.query(userQuery, [userId]);
    if (userResult[0].length == 0) {
        return error422("User Not Found.", res);
    }
    const user = userResult[0][0];
    res.status(200).json({
        status: 200,
        message: "user Retrived Successfully",
        data: user,
    });
} catch (error) {
    error500(error, res);
} finally {
    if (pool) {
      pool.releaseConnection();
    }
  }
};

//update user...
const updateUser = async (req, res) => {
    const userId = parseInt(req.params.id);
    const user_name = req.body.user_name ? req.body.user_name.trim() : '';
    const email_id = req.body.email_id ? req.body.email_id.trim() : '';
    const designation_id = req.body.designation_id ? req.body.designation_id : '';
    if (!userId) {
        return error422("User Id is required.", res);
    } else if(!user_name) {
        return error422("User Name is required.", res);
    }
    // Check if user exists
    const userQuery = "SELECT * FROM users WHERE user_id  = ?";
    const userResult = await pool.query(userQuery, [userId]);
    if (userResult[0].length == 0) {
    return error422("User Not Found.", res);
    }
    // check if designation exists
    const isDesignationExistsQuery = "SELECT * FROM designations WHERE designation_id = ?";
    const isDesignationExistsResult = await pool.query(isDesignationExistsQuery, [designation_id]);
    if (isDesignationExistsResult[0].length == 0) {
        return error422("Designation Not Found.", res);
    }
   
    // Attempt to obtain a database connection
    let connection = await getConnection()
    
    try {
        // Start a transaction
        await connection.beginTransaction();
        //update user details
        const updateQuery = `UPDATE users SET user_name = ?, email_id = ? ,designation_id= ? WHERE user_id = ?`;
        await connection.query(updateQuery, [user_name, email_id, designation_id, userId]);
        //commit the transaction
        await connection.commit();
        return res.status(200).json({
            status: 200,
            message: "Employee updated successfully.",
    });
    } catch (error) {
        await connection.rollback();
        return error500(error, res);
    } finally {
        await connection.release();
    }
};
//status change of user...
const onStatusChange = async (req, res) => {
    const userId = parseInt(req.params.id);
    const status = parseInt(req.query.status); // Validate and parse the status parameter
    // Attempt to obtain a database connection
    let connection = await getConnection();

    try {
        // Start a transaction
        await connection.beginTransaction();
        // Check if the user  exists
        const userQuery = "SELECT * FROM users WHERE user_id = ?";
        const userResult = await connection.query(userQuery, [userId]);
  
        if (userResult[0].length == 0) {
            return res.status(404).json({
                status: 404,
                message: "User Not Found.",
            });
        }
  
        // Validate the status parameter
        if (status !== 0 && status !== 1) {
            return res.status(400).json({
                status: 400,
                message:"Invalid status value. Status must be 0 (inactive) or 1 (active).",
            });
        }
  
        // Soft update the user status
        const updateQuery = `
              UPDATE users
              SET status = ?
              WHERE user_id = ?`;
  
        await connection.query(updateQuery, [status, userId]);
  
        const statusMessage = status === 1 ? "activated" : "deactivated";
  
        return res.status(200).json({
            status: 200,
            message: `User ${statusMessage} successfully.`,
        });
    } catch (error) {
        return error500(error, res);
    } finally {
        await connection.release();
    }
};
//get user active...
const getUserWma = async (req, res, next) => {
    
    // Attempt to obtain a database connection
    let connection = await getConnection();

    try {
        // Start a transaction
        let userQuery = `SELECT * FROM users WHERE status = 1`; 
        const userResult = await connection.query(userQuery);
        const user = userResult[0];
  
        res.status(200).json({
            status: 200,
            message: "Employee retrieved successfully.",
            data: user,
      });
    } catch (error) {
        error500(error, res);
    } finally {
        if (pool) {
            pool.releaseConnection();
      }
    }
};
module.exports = {
    addUser,
    userLogin,
    getUsers,
    getUser,
    updateUser,
    onStatusChange,
    getUserWma

}