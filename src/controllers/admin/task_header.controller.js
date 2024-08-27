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

//add Task Header..
const addtaskHeader = async (req, res) => {
    const  customer_name  = req.body.customer_name  ? req.body.customer_name.trim()  : '';
    const  mobile_number  = req.body.mobile_number  ? req.body.mobile_number : '';
    const  address  = req.body.address  ? req.body.address.trim() : '';
    const  service_id  = req.body.service_id  ? req.body.service_id : '';
    const  work_details_id  = req.body.work_details_id  ? req.body.work_details_id : '';
    const  document_type_id  = req.body.document_type_id  ? req.body.document_type_id : '';
    const  assigned_to  = req.body.assigned_to  ? req.body.assigned_to  : '';
    const  due_date  = req.body.due_date  ? req.body.due_date.trim()  : '';
    const  payment_status  = req.body.payment_status  ? req.body.payment_status.trim()  : '';

    const user_id  = req.companyData.user_id ;
 
    if (!service_id) {
        return error422("Service Id is required.", res);
    }  else if (!user_id) {
        return error422("User ID is required.", res);
    }  else if (!work_details_id) {
        return error422("work_details is required.", res);
    }  

     //check Mobile Number already is exists or not
     const isExistMobileNumberQuery = `SELECT * FROM task_header WHERE mobile_number = ?`;
     const isExistMobileNumberResult = await pool.query(isExistMobileNumberQuery, [mobile_number]);
     if (isExistMobileNumberResult[0].length > 0) {
         return error422(" Mobile Number is already exists.", res);
     }  

    //check service already is exists or not
    const isExistServiceQuery = `SELECT * FROM services WHERE service_id = ? && status = 1`;
    const isExistServiceResult = await pool.query(isExistServiceQuery, [service_id]);
    if (isExistServiceResult[0].length === 0) {
        return error422("Service not Found.", res);
    }

    //check work details already is exists or not
    const isExistWorkDetailsQuery = `SELECT * FROM work_details WHERE work_details_id = ? && status = 1`;
    const isExistWorkDetailsResult = await pool.query(isExistWorkDetailsQuery, [work_details_id]);
    if (isExistWorkDetailsResult[0].length === 0) {
        return error422(" work detail Not Found.", res);
    }

    //check document type already is exists or not
    const isExistDocumentTypeQuery = `SELECT * FROM document_type WHERE document_type_id = ? && status = 1`;
    const isExistDocumentTypeResult = await pool.query(isExistDocumentTypeQuery, [document_type_id]);
    if (isExistDocumentTypeResult[0].length === 0) {
        return error422(" Document Type Not Found.", res);
    }

    //check assigned to already is exists or not
    const isExistAssignedQuery = `SELECT * FROM users WHERE user_id = ? `;
    const isExistAssignedResult = await pool.query(isExistAssignedQuery, [assigned_to]);
    if (isExistAssignedResult[0].length === 0) {
        return error422("Assigned to  not found.", res);
    }


    // Attempt to obtain a database connection
    let connection = await getConnection();
    try {
         //Start the transaction
         await connection.beginTransaction();
        //insert into Task Header
        const insertTaskHeaderQuery = `INSERT INTO task_header (customer_name, mobile_number, address, service_id, work_details_id, document_type_id, assigned_to, due_date, payment_status, user_id) VALUES (?, ?, ?, ?, ?, ? ,?, ?, ?, ?)`;
        const insertTaskHeaderValues = [customer_name, mobile_number, address, service_id, work_details_id, document_type_id, assigned_to, due_date, payment_status, user_id];
        const taskHeaderResult = await connection.query(insertTaskHeaderQuery, insertTaskHeaderValues);
       
        //commit the transation
        await connection.commit();
        res.status(200).json({
            status: 200,
            message: "Task Header added successfully",
        });
    } catch (error) {
        return error500(error, res);
    } finally {
        await connection.release();
    }
};

//Get Task Headers List...
const getTaskHeaders = async (req, res) => {
    const { page, perPage, key } = req.query;
    const user_id  = req.companyData.user_id ;
    // Attempt to obtain a database connection
    let connection = await getConnection();
    try {
        //Start the transaction
        await connection.beginTransaction();

        let getTaskHeaderQuery = `SELECT th.*,s.services,wd.work_details,d.document_type,u.user_name FROM task_header th
        JOIN services s
        ON s.service_id = th.service_id
        JOIN work_details wd
        ON wd.work_details_id = th.work_details_id
        JOIN document_type d
        ON d.document_type_id = th.document_type_id
        JOIN users u
        ON u.user_id = th.assigned_to
        WHERE th.user_id = ${user_id}`;
        let countQuery = `SELECT COUNT(*) AS total FROM task_header th
        JOIN services s
        ON s.service_id = th.service_id
        JOIN work_details wd
        ON wd.work_details_id = th.work_details_id
        JOIN document_type d
        ON d.document_type_id = th.document_type_id
        JOIN users u
        ON u.user_id = th.assigned_to
        WHERE th.user_id = ${user_id}`;
        if (key) {
            const lowercaseKey = key.toLowerCase().trim();
            if (lowercaseKey === "activated") {
                getTaskHeaderQuery += ` AND status = 1`;
                countQuery += ` AND status = 1`;
            } else if (lowercaseKey === "deactivated") {
                getTaskHeaderQuery += ` AND status = 0`;
                countQuery += ` AND status = 0`;
            } else {
                getTaskHeaderQuery += ` AND  LOWER(customer_name) LIKE '%${lowercaseKey}%' `;
                countQuery += ` AND LOWER(customer_name) LIKE '%${lowercaseKey}%' `;
            }
        }
        getTaskHeaderQuery += " ORDER BY created_at DESC";
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

// get Task Header by id...
const getTaskHeader = async (req, res) => {
    const taskHeaderId = parseInt(req.params.id);
    const user_id = req.companyData.user_id;
    
    // Attempt to obtain a database connection
    let connection = await getConnection();

    try {
        // Start a transaction
        await connection.beginTransaction();

        const taskHeaderQuery = `SELECT th.*,s.services,wd.work_details,d.document_type,u.user_name FROM task_header th
        JOIN services s
        ON s.service_id = th.service_id
        JOIN work_details wd
        ON wd.work_details_id = th.work_details_id
        JOIN document_type d
        ON d.document_type_id = th.document_type_id
        JOIN users u
        ON u.user_id = th.assigned_to
        WHERE th.task_header_id = ? && th.user_id = ?`;
        const taskHeaderResult = await connection.query(taskHeaderQuery, [taskHeaderId, user_id]);
        if (taskHeaderResult[0].length == 0) {
             return error422("Task Header Not Found.", res);
        }
        const taskHeader = taskHeaderResult[0][0];
        res.status(200).json({
            status: 200,
            message: "Task Header Retrived Successfully",
            data: taskHeader,
        });
} catch (error) {
    error500(error, res);
} finally {
    await connection.release();
}
};

//update Task Header...
const updateTaskheader = async (req, res) => {
    const taskHeaderId = parseInt(req.params.id);
    const  customer_name  = req.body.customer_name  ? req.body.customer_name.trim()  : '';
    const  mobile_number  = req.body.mobile_number  ? req.body.mobile_number : '';
    const  address  = req.body.address  ? req.body.address.trim() : '';
    const  service_id  = req.body.service_id  ? req.body.service_id : '';
    const  work_details_id  = req.body.work_details_id  ? req.body.work_details_id : '';
    const  document_type_id  = req.body.document_type_id  ? req.body.document_type_id : '';
    const  assigned_to  = req.body.assigned_to  ? req.body.assigned_to : '';
    const  due_date  = req.body.due_date  ? req.body.due_date.trim() : '';
    const  payment_status  = req.body.payment_status  ? req.body.payment_status.trim()  : '';
    const user_id  = req.companyData.user_id;

    if (!service_id) {
        return error422("Service Id is required.", res);
    }  else if (!user_id) {
        return error422("User ID is required.", res);
    }  else if (!work_details_id) {
        return error422("work details id is required.", res);
    }

    // Check if Task header exists
    const taskHeaderQuery = "SELECT * FROM task_header WHERE task_header_id = ? AND user_id = ?";
    const taskHeaderResult = await pool.query(taskHeaderQuery, [taskHeaderId, user_id]);
    if (taskHeaderResult[0].length === 0) {
        return error422("Task Header Not Found.", res);
    }
    
    //check Mobile Number already is exists or not
    const isExistMobileNumberQuery = `SELECT * FROM task_header WHERE mobile_number = ? AND task_header_id != ?`;
    const isExistMobileNumberResult = await pool.query(isExistMobileNumberQuery, [mobile_number,taskHeaderId]);
    if (isExistMobileNumberResult[0].length > 0) {
        return error422(" Mobile Number is already exists.", res);
    } 

    //check service already is exists or not
    const isExistServiceQuery = `SELECT * FROM services WHERE service_id = ?`;
    const isExistServiceResult = await pool.query(isExistServiceQuery, [service_id]);
    if (isExistServiceResult[0].length === 0) {
        return error422("Service not Found.", res);
    }

    //check work details already is exists or not
    const isExistWorkDetailsQuery = `SELECT * FROM work_details WHERE work_details_id = ?`;
    const isExistWorkDetailsResult = await pool.query(isExistWorkDetailsQuery, [work_details_id]);
    if (isExistWorkDetailsResult[0].length === 0) {
        return error422(" work detail Not Found.", res);
    }

    //check document type already is exists or not
    const isExistDocumentTypeQuery = `SELECT * FROM document_type WHERE document_type_id = ?`;
    const isExistDocumentTypeResult = await pool.query(isExistDocumentTypeQuery, [document_type_id]);
    if (isExistDocumentTypeResult[0].length === 0) {
        return error422(" Document Type Not Found.", res);
    }

    //check assigned to already is exists or not
    const isExistAssignedQuery = `SELECT * FROM users WHERE user_id = ? `;
    const isExistAssignedResult = await pool.query(isExistAssignedQuery, [assigned_to]);
    if (isExistAssignedResult[0].length === 0) {
        return error422("Assigned to  not found.", res);
    }

    // Attempt to obtain a database connection
    let connection = await getConnection();

    try {
        // Start a transaction
        await connection.beginTransaction();

        // Update Task Heater
        const updateQuery = `UPDATE task_header SET customer_name = ?,mobile_number = ?, address = ?, service_id = ?, work_details_id= ?, document_type_id = ?,assigned_to = ?, due_date = ?, payment_status = ?, user_id = ? WHERE task_header_id = ?`;
        await connection.query(updateQuery, [customer_name, mobile_number, address, service_id, work_details_id, document_type_id, assigned_to, due_date, payment_status, user_id, taskHeaderId]);

        // Commit the transaction
        await connection.commit();
        return res.status(200).json({
            status: 200,
            message: "Task Header updated successfully.",
        });
    } catch (error) {
        await connection.rollback();
        return error500(error, res);
    } finally {
        await connection.release();
    }
};

// get Task list by assigned to...
const getTaskAssignedTo = async (req, res) => {
    const assignedTo = parseInt(req.query.assignedTo);

   
    // Attempt to obtain a database connection
    let connection = await getConnection();

    try {
        // Start a transaction
        await connection.beginTransaction();

        const taskAssignedToQuery = `SELECT * FROM task_header WHERE assigned_to = ? `;

        const taskAssignedToResult = await connection.query(taskAssignedToQuery, [assignedTo]);
        if (taskAssignedToResult[0].length == 0) {
             return error422("Task Assigned To Not Found.", res);
        }
        const taskAssignedTo = taskAssignedToResult[0];
        res.status(200).json({
            status: 200,
            message: "Task Assigned To Retrived Successfully",
            data: taskAssignedTo,
        });
    } catch (error) {
    error500(error, res);
    } finally {
    await connection.release();
    }
};

//Report
const getReport = async (req, res) => {
    const { page, perPage, fromDate, toDate, assigned_to, status_id, service_id} = req.query;
 
    // Attempt to obtain a database connection
    let connection = await getConnection();
    try {
        //Start the transaction
        await connection.beginTransaction();

        let getReportQuery = `SELECT th.*,tf.status_id FROM task_header th
        JOIN task_footers tf
        ON th.task_header_id = tf.task_header_id
        WHERE 1`;
        
        
        let countQuery = `SELECT COUNT(*) AS total FROM task_header th
        JOIN task_footers tf
        ON th.task_header_id = tf.task_header_id
        WHERE 1`;

        // from date and to date
        if (fromDate && toDate) {
            getReportQuery += ` AND th.created_at >= '${fromDate}' AND th.created_at <= '${toDate}'`;
            countQuery += ` AND th.created_at >= '${fromDate}' AND th.created_at <= '${toDate}'`;
        }
        if (assigned_to) {
            getReportQuery += ` AND th.assigned_to = '${assigned_to}'`;
            countQuery += ` AND th.assigned_to = '${assigned_to}'`;
        }

        if (status_id) {
            getReportQuery += ` AND tf.status_id = '${status_id}'`;
            countQuery += ` AND tf.status_id = '${status_id}'`;
        }

        if (service_id) {
            getReportQuery += ` AND th.service_id = '${service_id}'`;
            countQuery += ` AND th.service_id = '${service_id}'`;
        }
    
        // Apply pagination if both page and perPage are provided
        let total = 0;
        if (page && perPage) {
            const totalResult = await connection.query(countQuery);
            total = parseInt(totalResult[0][0].total);

            const start = (page - 1) * perPage;
            getReportQuery += ` LIMIT ${perPage} OFFSET ${start}`;
        }
        const result = await connection.query(getReportQuery);
        const report = result[0];

        const data = {
            status: 200,
            message: "TasK Header retrieved successfully",
            data: report,
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

module.exports = {
    addtaskHeader,
    getTaskHeaders,
    getTaskHeader,
    updateTaskheader,
    getTaskAssignedTo,
    getReport
}