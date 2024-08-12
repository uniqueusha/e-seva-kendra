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
    return res.status(500).json({
        status: 500,
        message: "Internal Server Error",
        error: error
    });
}

// add designation...
const addDesignation = async (req, res) => {
    const  designation_name  = req.body.designation_name  ? req.body.designation_name.trim()  : '';
    const user_id  =req.companyData.user_id;

    if (!designation_name) {
        return error422("Designation Name is required.", res);
    }else if (!user_id) {
        return error422("User ID is required.", res);
    }

    //check designation  already  exists or not
    const isExistDesignationQuery = `SELECT * FROM designations WHERE designation_name= ? AND user_id=? `;
    const isExistDesignationResult = await pool.query(isExistDesignationQuery, [ designation_name,user_id]);
    if (isExistDesignationResult[0].length > 0) {
        return error422("Designation Name is already exists.", res);
    } 

    // attempt to obtain a database connection
    let connection = await getConnection();

    try {

        //start a transaction
        await connection.beginTransaction();

        //insert into designation 
        const insertDesignationQuery = `INSERT INTO designations (designation_name, user_id ) VALUES (?, ? )`;
        const insertDesignationValues= [designation_name, user_id ];
        const designationResult = await connection.query(insertDesignationQuery, insertDesignationValues);

         // Commit the transaction
         await connection.commit();
        res.status(200).json({
            status: 200,
            message: "Designation added successfully",
        });
    } catch (error) {
        
        return error500(error, res);
    }finally {
        if (connection) connection.release()
    }
}

// get designation list...
const getDesignations = async (req, res) => {
    const { page, perPage, key } = req.query;
    const user_id = req.companyData.user_id;

    // attempt to obtain a database connection
    let connection = await getConnection();

    try {

        //start a transaction
        await connection.beginTransaction();

        let getDesignationQuery = `SELECT d.*, u.user_id FROM designations d
        LEFT JOIN users u 
        ON d.user_id = u.user_id
        WHERE 1 AND d.user_id = ${user_id}`;

        let countQuery = `SELECT COUNT(*) AS total FROM designations d
        LEFT JOIN users u
        ON d.user_id = u.user_id
        WHERE 1 AND d.user_id = ${user_id} `;
        
        if (key) {
            const lowercaseKey = key.toLowerCase().trim();
            if (lowercaseKey === "activated") {
                getDesignationQuery += ` AND d.status = 1`;
                countQuery += ` AND d.status = 1`;
            } else if (lowercaseKey === "deactivated") {
                getDesignationQuery += ` AND d.status = 0`;
                countQuery += ` AND d.status = 0`;
            } else {
                getDesignationQuery += ` AND  LOWER(d.designation_name) LIKE '%${lowercaseKey}%' `;
                countQuery += ` AND  LOWER(d.designation_name) LIKE '%${lowercaseKey}%' `;
            }
        }
        //getDesignationQuery += " ORDER BY d.cts DESC";

        // Apply pagination if both page and perPage are provided
        let total = 0;
        if (page && perPage) {
            const totalResult = await connection.query(countQuery);
            total = parseInt(totalResult[0][0].total);

            const start = (page - 1) * perPage;
            getDesignationQuery += ` LIMIT ${perPage} OFFSET ${start}`;
        }

        const result = await connection.query(getDesignationQuery);
        const designation = result[0];

        // Commit the transaction
        await connection.commit();
        const data = {
            status: 200,
            message: "Designation retrieved successfully",
            data: designation,
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

// get designation  by id...
const getDesignation = async (req, res) => {
    const designationId = parseInt(req.params.id);
    const user_id=req.companyData.user_id;

    // attempt to obtain a database connection
    let connection = await getConnection();

    try {

        //start a transaction
        await connection.beginTransaction();

        const designationQuery = `SELECT d.* FROM designations d
        LEFT JOIN users u
        ON d.user_id=u.user_id
         WHERE d.designation_id=? AND d.user_id=?`;
        const designationResult = await connection.query(designationQuery, [designationId,user_id]);
        
        if (designationResult[0].length == 0) {
            return error422("Designation Not Found.", res);
        }
        const designation = designationResult[0][0];
        
        return res.status(200).json({
            status: 200,
            message: "Designation Retrived Successfully",
            data: designation
        });
    } catch (error) {
        return error500(error, res);
    }finally {
        if (connection) connection.release()
    }
}

//designation  update...
const updateDesignation = async (req, res) => {
    const designationId = parseInt(req.params.id);
    const designation_name = req.body.designation_name ? req.body.designation_name : '';
    const user_id = req.companyData.user_id;

    if (!designation_name) {
        return error422("Designation name is required.", res);
    } else if (!user_id) {
        return error422("User id is required.", res);
    } else if (!designationId) {
        return error422("Designation id is required.", res);
    }

    // attempt to obtain a database connection
    let connection = await getConnection();

    try {

        //start a transaction
        await connection.beginTransaction();

        // Check if designation exists
        const designationQuery = "SELECT * FROM designations WHERE designation_id  = ? AND user_id=?";
        const designationResult = await connection.query(designationQuery, [designationId,user_id]);
        if (designationResult[0].length == 0) {
            return error422("Designation Not Found.", res);
        }
        // Check if the provided designation exists and is active 
        const existingDesignationQuery = "SELECT * FROM designations WHERE designation_name  = ? AND designation_id!=? AND user_id = ?";
        const existingDesignationResult = await connection.query(existingDesignationQuery, [designation_name, designationId, user_id]);

        if (existingDesignationResult[0].length > 0) {
            return error422("Designation Name already exists.", res);
        }
        
        // Update the designation record with new data
        const updateQuery = `
            UPDATE designations
            SET designation_name = ?, user_id = ?
            WHERE designation_id = ?
        `;

        await connection.query(updateQuery, [designation_name, user_id, designationId]);
        // Commit the transaction
        await connection.commit();

        return res.status(200).json({
            status: 200,
            message: "Designation updated successfully.",
        });
    } catch (error) {
        return error500(error,res);
    }finally {
        if (connection) connection.release()
    }
}

//status change of designation...
const onStatusChange = async (req, res) => {
    const designationId = parseInt(req.params.id);
    const status = parseInt(req.query.status); // Validate and parse the status parameter
    const user_id = req.companyData.user_id;

    // attempt to obtain a database connection
    let connection = await getConnection();

    try {

        //start a transaction
        await connection.beginTransaction();

        // Check if the designation  exists
        const designationQuery = "SELECT * FROM designations WHERE designation_id = ? AND user_id=?";
        const designationResult = await connection.query(designationQuery, [designationId,user_id]);

        if (designationResult[0].length == 0) {
            return res.status(404).json({
                status: 404,
                message: "Designation not found.",
            });
        }

        // Validate the status parameter
        if (status !== 0 && status !== 1) {
            return res.status(400).json({
                status: 400,
                message: "Invalid status value. Status must be 0 (inactive) or 1 (active).",
            });
        }

        // Soft update the designation status
        const updateQuery = `
            UPDATE designations
            SET status = ?
            WHERE designation_id = ?
        `;

        await connection.query(updateQuery, [status, designationId]);

        const statusMessage = status === 1 ? "activated" : "deactivated";
        // Commit the transaction
        await connection.commit();
        return res.status(200).json({
            status: 200,
            message: `Designation ${statusMessage} successfully.`,
        });
    } catch (error) {
        return error500(error,res);
    }finally {
        if (connection) connection.release()
    }
};

//get designation active...
const getDesignationWma = async (req, res) => {
    const user_id = req.companyData.user_id;

    const checkUserQuery = `SELECT * FROM users WHERE user_id = ${user_id}  `;
    const userResult = await pool.query(checkUserQuery);
    

    let designationQuery = `SELECT d.*  FROM designations d 
    LEFT JOIN users u 
    ON u.user_id = d.user_id 
    WHERE d.status = 1  ORDER BY d.designation_name`;
    
    // attempt to obtain a database connection
    let connection = await getConnection();

    try {

        //start a transaction
        await connection.beginTransaction();

        const designationResult = await connection.query(designationQuery);
        const designation = designationResult[0];

        // Commit the transaction
        await connection.commit();
        
        return res.status(200).json({
            status: 200,
            message: "Designation retrieved successfully.",
            data: designation,
        });
    } catch (error) {
        return error500(error,res);
    }finally {
        if (connection) connection.release()
    }
    
}
module.exports = {
    addDesignation,
    getDesignations,
    getDesignation,
    updateDesignation,
    onStatusChange,
    getDesignationWma
}