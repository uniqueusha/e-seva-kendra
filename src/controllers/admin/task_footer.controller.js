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

//add Task Footer..
const addtaskFooter = async (req, res) => {
    const  task_header_id  = req.body.task_header_id  ? req.body.task_header_id : '';
    const  status_id  = req.body.status_id  ? req.body.status_id : '';
    const  note  = req.body.note  ? req.body.note.trim() : '';

    const user_id  = req.companyData.user_id ;
    
        //check task header is exists or not
        const isExistTaskHeaderQuery = `SELECT * FROM task_header WHERE task_header_id = ?`;
        const isExistTaskHeaderResult = await pool.query(isExistTaskHeaderQuery, [task_header_id]);
        if (isExistTaskHeaderResult[0].length === 0) {
            return error422("Task Header Not Found.", res);
        }

        //check status is exists or not
        const isExistStatusQuery = `SELECT * FROM Status WHERE status_id = ?`;
        const isExistStatusResult = await pool.query(isExistStatusQuery, [status_id]);
        if (isExistStatusResult[0].length === 0) {
            return error422("Status Not Found.", res);
        }

        // Attempt to obtain a database connection
        let connection = await getConnection();
        try {
             //Start the transaction
             await connection.beginTransaction();
            //insert into Task Footer
            const insertTaskFooterQuery = `INSERT INTO task_footers (task_header_id, status_id, note, user_id) VALUES (?, ?, ?, ?)`;
            const insertTaskFooterValues = [task_header_id, status_id, note, user_id];
            const taskFooterResult = await connection.query(insertTaskFooterQuery, insertTaskFooterValues);
           
            //commit the transation
            await connection.commit();
            res.status(200).json({
                status: 200,
                message: "Task Footer added successfully",
            });
        } catch (error) {
            return error500(error, res);
        } finally {
            await connection.release();
        }
    };

// Get All Task Footer....
const getTaskFooters = async (req, res) => {
    const { page, perPage } = req.query;
    const user_id  = req.companyData.user_id ;
    // Attempt to obtain a database connection
    let connection = await getConnection();
    try {
        //Start the transaction
        await connection.beginTransaction();

        let getTaskFootersQuery = `SELECT *FROM task_footers WHERE user_id = ${user_id}`;
        let countQuery = `SELECT COUNT(*) AS total FROM task_footers WHERE user_id = ${user_id}`;

        
        // Apply pagination if both page and perPage are provided
        let total = 0;
        if (page && perPage) {
            const totalResult = await connection.query(countQuery);
            total = parseInt(totalResult[0][0].total);

            const start = (page - 1) * perPage;
            getTaskFootersQuery += ` LIMIT ${perPage} OFFSET ${start}`;
        }
        const result = await connection.query(getTaskFootersQuery);
        const TaskFooters = result[0];

        const data = {
            status: 200,
            message: "TasK Footers retrieved successfully",
            data: TaskFooters,
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

 
// Update Task Footer
    const updatetaskFooter = async (req, res) => {
        const taskFooterId = parseInt(req.params.id);
        const  task_header_id  = req.body.task_header_id  ? req.body.task_header_id : '';
        const  status_id  = req.body.status_id  ? req.body.status_id : '';
        const  note  = req.body.note  ? req.body.note.trim() : '';
    
        const user_id  = req.companyData.user_id ;
        
             //check task footer is exists or not
            const isExistTaskFooterQuery = `SELECT * FROM task_footers WHERE task_footer_id = ?`;
            const isExistTaskFooterResult = await pool.query(isExistTaskFooterQuery, [taskFooterId]);
            if (isExistTaskFooterResult[0].length === 0) {
                return error422("Task Footer Not Found.", res);
            }
            //check task header is exists or not
            const isExistTaskHeaderQuery = `SELECT * FROM task_header WHERE task_header_id = ? $$ status = 1`;
            const isExistTaskHeaderResult = await pool.query(isExistTaskHeaderQuery, [task_header_id]);
            if (isExistTaskHeaderResult[0].length === 0) {
                return error422("Task Header Not Found.", res);
            }
    
            //check status is exists or not
            const isExistStatusQuery = `SELECT * FROM Status WHERE status_id = ? && status = 1`;
            const isExistStatusResult = await pool.query(isExistStatusQuery, [status_id]);
            if (isExistStatusResult[0].length === 0) {
                return error422("Status Not Found.", res);
            }

    // Attempt to obtain a database connection
    let connection = await getConnection();

    try {
        // Start a transaction
        await connection.beginTransaction();

        // Update Task Footer
        const updateQuery = `UPDATE task_footers SET task_header_id = ?,status_id = ?, note = ?, user_id = ? WHERE task_footer_id = ?`;
        await connection.query(updateQuery, [task_header_id,status_id,note,user_id, taskFooterId]);

        // Commit the transaction
        await connection.commit();
        return res.status(200).json({
            status: 200,
            message: "Task Footer updated successfully.",
        });
    } catch (error) {
        await connection.rollback();
        return error500(error, res);
    } finally {
        await connection.release();
    }
};

// get task footer by Task Header  id...
const getTaskHeaderId = async (req, res) => {
    const taskHeaderId = parseInt(req.params.id);
    
    // Attempt to obtain a database connection
    let connection = await getConnection();

    try {
        // Start a transaction
        await connection.beginTransaction();

        const taskHeaderQuery = `SELECT tf.*,th.customer_name,s.status_name,u.user_name FROM task_footers tf 
        JOIN task_header th
        ON th.task_header_id = tf.task_header_id
        JOIN status s
        ON s.status_id = tf.status_id
        JOIN users u
        ON u.user_id = tf.user_id
         WHERE tf.task_header_id = ?`;
        const taskHeaderResult = await connection.query(taskHeaderQuery, [taskHeaderId]);
        if (taskHeaderResult[0].length == 0) {
             return error422("Task Header Not Found.", res);
        }
        const taskHeader = taskHeaderResult[0];
        res.status(200).json({
            status: 200,
            message: "Task Footer ByTask Header Id Retrived Successfully",
            data: taskHeader,
        });
} catch (error) {
    error500(error, res);
} finally {
    await connection.release();
}
};
module.exports = {
    addtaskFooter,
    updatetaskFooter,
    getTaskFooters,
    getTaskHeaderId
}
