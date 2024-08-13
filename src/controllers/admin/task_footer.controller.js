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

//Get Task Headers List...
const getTaskHeaders = async (req, res) => {
    const { page, perPage, key } = req.query;
    const user_id  = req.companyData.user_id ;
    // Attempt to obtain a database connection
    let connection = await getConnection();
    try {
        //Start the transaction
        await connection.beginTransaction();

        let getTaskHeaderQuery = `SELECT * FROM task_header WHERE user_id = ${user_id}`;
        let countQuery = `SELECT COUNT(*) AS total FROM task_header WHERE user_id = ${user_id}`;

        if (key) {
            const lowercaseKey = key.toLowerCase().trim();
            if (lowercaseKey === "activated") {
                getTaskHeaderQuery += ` AND e.status = 1`;
                countQuery += ` AND e.status = 1`;
            } else if (lowercaseKey === "deactivated") {
                getTaskHeaderQuery += ` AND e.status = 0`;
                countQuery += ` AND e.status = 0`;
            } else {
                getTaskHeaderQuery += ` AND  LOWER(customer_name) LIKE '%${lowercaseKey}%' `;
                countQuery += ` AND LOWER(customer_name) LIKE '%${lowercaseKey}%' `;
            }
        }
        // Apply pagination if both page and perPage are provided
        let total = 0;
        if (page && perPage) {
            const totalResult = await connection.query(countQuery);
            total = parseInt(totalResult[0][0].total);

            const start = (page - 1) * perPage;
            getTaskHeaderQuery += ` LIMIT ${perPage} OFFSET ${start}`;
        }
        const result = await connection.query(getTaskHeaderQuery);
        const tasKHeader = result[0];

        const data = {
            status: 200,
            message: "TasK Header retrieved successfully",
            data: tasKHeader,
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
