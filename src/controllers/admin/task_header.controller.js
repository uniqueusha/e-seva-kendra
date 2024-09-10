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

//add Task Header..
const addTaskHeader = async (req, res) => {
    const  customer_name  = req.body.customer_name  ? req.body.customer_name.trim()  : '';
    const  mobile_number  = req.body.mobile_number  ? req.body.mobile_number : '';
    const  address  = req.body.address  ? req.body.address.trim() : '';
    const  service_id  = req.body.service_id  ? req.body.service_id : '';
    const  work_details_id  = req.body.work_details_id  ? req.body.work_details_id : '';
    const  assigned_to  = req.body.assigned_to  ? req.body.assigned_to  : '';
    const  due_date  = req.body.due_date  ? req.body.due_date.trim()  : '';
    const  payment_status_id  = req.body.payment_status_id  ? req.body.payment_status_id : '';
    const  amount  = req.body.amount  ? req.body.amount : '';
    const  status_id  = req.body.status_id  ? req.body.status_id : '';
    const  task_note  = req.body.task_note  ? req.body.task_note.trim() : '';
    const  taskDocumentsDetails = req.body.taskDocumentsDetails ? req.body.taskDocumentsDetails : [];
    const  user_id  = req.companyData.user_id ;
 
    if (!service_id) {
        return error422("Service Id is required.", res);
    }  else if (!user_id) {
        return error422("User ID is required.", res);
    }  else if (!work_details_id) {
        return error422("work_details is required.", res);
    } 

    //check service already is exists or not
    const isExistServiceQuery = `SELECT * FROM services WHERE service_id = ? && status = 1`;
    const isExistServiceResult = await pool.query(isExistServiceQuery, [service_id]);
    if (isExistServiceResult[0].length === 0) {
        return error422("Service not Found.", res);
    }

    //check work details is exists or not
    const isExistWorkDetailsQuery = `SELECT * FROM work_details WHERE work_details_id = ? && status = 1`;
    const isExistWorkDetailsResult = await pool.query(isExistWorkDetailsQuery, [work_details_id]);
    if (isExistWorkDetailsResult[0].length === 0) {
        return error422(" work detail Not Found.", res);
    }


    //check assigned to is exists or not
    const isExistAssignedQuery = `SELECT * FROM users WHERE user_id = ? `;
    const isExistAssignedResult = await pool.query(isExistAssignedQuery, [assigned_to]);
    if (isExistAssignedResult[0].length === 0) {
        return error422("Assigned to  not found.", res);
    }

    //check payment status already is exists or not
    const isExistPaymentStatusQuery = `SELECT * FROM payment_status WHERE payment_status_id = ? `;
    const isExistPaymentStatusResult = await pool.query(isExistPaymentStatusQuery, [payment_status_id]);
    if (isExistPaymentStatusResult[0].length === 0) {
        return error422("Payment Sataus not found.", res);
    }


    // Attempt to obtain a database connection
    let connection = await getConnection();
    try {
         //Start the transaction
         await connection.beginTransaction();
        //insert into Task Header
        const insertTaskHeaderQuery = `INSERT INTO task_header (customer_name, mobile_number, address, service_id, work_details_id, assigned_to, due_date, payment_status_id, amount, status_id, task_note, user_id) VALUES ( ?, ?, ?, ?, ?, ? ,?, ?, ?, ?, ?, ?)`;
        const insertTaskHeaderValues = [customer_name, mobile_number, address, service_id, work_details_id, assigned_to, due_date, payment_status_id, amount, status_id, task_note, user_id];
        const taskHeaderResult = await connection.query(insertTaskHeaderQuery, insertTaskHeaderValues);
        const task_header_id = taskHeaderResult[0].insertId;
       
        
        //insert into documents in Array
        let documentsArray = taskDocumentsDetails
        for (let i = 0; i < documentsArray.length; i++) {
            const element = documentsArray[i];
            const document_type_id  = element.document_type_id  ? element.document_type_id : '';
            const note = element.note ? element.note.trim() : '';
            if (!document_type_id) {
                await query("ROLLBACK");
                return error422("document type id is require", res);
            }
            let insertTaskDocumentsDetailsQuery = 'INSERT INTO task_documents (task_header_id, document_type_id, note) VALUES (?,?,?)';
            let insertTaskDocumentsDetailsvalues = [task_header_id, document_type_id, note];
            let insertTaskDocumentsDetailsResult = await connection.query(insertTaskDocumentsDetailsQuery, insertTaskDocumentsDetailsvalues);
        }
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
    const { page, perPage, key, user_id, current_date } = req.query;
    // Attempt to obtain a database connection
    let connection = await getConnection();
    try {
        //Start the transaction
        await connection.beginTransaction();

        let getTaskHeaderQuery = `SELECT th.*,s.services,wd.work_details,u.user_name,st.status_name,ps.payment_status FROM task_header th
        JOIN services s
        ON s.service_id = th.service_id
        JOIN work_details wd
        ON wd.work_details_id = th.work_details_id
        JOIN users u
        ON u.user_id = th.assigned_to
        JOIN status st
        ON st.status_id = th.status_id 
        JOIN payment_status ps
        ON ps.payment_status_id = th.payment_status_id WHERE 1`;
        let countQuery = `SELECT COUNT(*) AS total FROM task_header th
        JOIN services s
        ON s.service_id = th.service_id
        JOIN work_details wd
        ON wd.work_details_id = th.work_details_id
        JOIN users u
        ON u.user_id = th.assigned_to
        JOIN status st
        ON st.status_id = th.status_id
        JOIN payment_status ps
        ON ps.payment_status_id = th.payment_status_id WHERE 1`;
        if (key) {
            const lowercaseKey = key.toLowerCase().trim();
                getTaskHeaderQuery += ` AND (LOWER(th.customer_name) LIKE '%${lowercaseKey}%' || LOWER(th.mobile_number) LIKE '%${lowercaseKey}%' || LOWER(s.services) LIKE '%${lowercaseKey}%' || LOWER(u.user_name) LIKE '%${lowercaseKey}%')`;
                countQuery += ` AND (LOWER(th.customer_name) LIKE '%${lowercaseKey}%' || LOWER(th.mobile_number) LIKE '%${lowercaseKey}%' || LOWER(s.services) LIKE '%${lowercaseKey}%'|| LOWER(u.user_name) LIKE '%${lowercaseKey}%')`; 
        }
        if (user_id) {
            getTaskHeaderQuery += ` AND th.user_id = ${user_id}`;
            countQuery += `  AND th.user_id = ${user_id}`;
        }
        if (current_date) {
            getTaskHeaderQuery += ` AND DATE(th.created_at) = '${current_date}'`;
            countQuery += ` AND DATE(th.created_at) = '${current_date}'`;
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
        let result = await connection.query(getTaskHeaderQuery);
        const taskHeader = result[0];

        const data = {
            status: 200,
            message: "TasK Header retrieved successfully",
            data: taskHeader,
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
    
    // Attempt to obtain a database connection
    let connection = await getConnection();

    try {
        // Start a transaction
        await connection.beginTransaction();

        const taskHeaderQuery = `SELECT th.*,s.services,wd.work_details,u.user_name,st.status_name,ps.payment_status FROM task_header th
        JOIN services s
        ON s.service_id = th.service_id
        JOIN work_details wd
        ON wd.work_details_id = th.work_details_id
        JOIN users u
        ON u.user_id = th.assigned_to
        JOIN status st
        ON st.status_id = th.status_id
        JOIN payment_status ps
        ON ps.payment_status_id = th.payment_status_id
        WHERE th.task_header_id = ?`;
        const taskHeaderResult = await connection.query(taskHeaderQuery, [taskHeaderId]);
        if (taskHeaderResult[0].length == 0) {
             return error422("Task Header Not Found.", res);
        }
        let taskHeader = taskHeaderResult[0][0];
        //get documents
        const taskDocumentsQuery = `SELECT td.*,d.document_type FROM task_documents td 
        JOIN document_type d
        ON d.document_type_id = td.document_type_id
        WHERE td.task_header_id = ?`;
        const taskDocumentsResult = await connection.query(taskDocumentsQuery, [taskHeaderId]);
        taskHeader['taskDocumentsDetails'] = taskDocumentsResult[0];

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
    const  assigned_to  = req.body.assigned_to  ? req.body.assigned_to : '';
    const  due_date  = req.body.due_date  ? req.body.due_date.trim() : '';
    const  payment_status_id  = req.body.payment_status_id  ? req.body.payment_status_id : '';
    const  amount  = req.body.amount  ? req.body.amount : '';
    const  status_id  = req.body.status_id  ? req.body.status_id : '';
    const  task_note  = req.body.task_note  ? req.body.task_note.trim() : '';
    const  taskDocumentsDetails = req.body.taskDocumentsDetails ? req.body.taskDocumentsDetails : [];
    const user_id  = req.companyData.user_id;

    if (!service_id) {
        return error422("Service Id is required.", res);
    }  else if (!user_id) {
        return error422("User ID is required.", res);
    }  else if (!work_details_id) {
        return error422("work details id is required.", res);
    }

    // Check if Task header exists
    const taskHeaderQuery = "SELECT * FROM task_header WHERE task_header_id = ?";
    const taskHeaderResult = await pool.query(taskHeaderQuery, [taskHeaderId]);
    if (taskHeaderResult[0].length === 0) {
        return error422("Task Header Not Found.", res);
    }

    //check service is exists or not
    const isExistServiceQuery = `SELECT * FROM services WHERE service_id = ?`;
    const isExistServiceResult = await pool.query(isExistServiceQuery, [service_id]);
    if (isExistServiceResult[0].length === 0) {
        return error422("Service not Found.", res);
    }

    //check work details is exists or not
    const isExistWorkDetailsQuery = `SELECT * FROM work_details WHERE work_details_id = ?`;
    const isExistWorkDetailsResult = await pool.query(isExistWorkDetailsQuery, [work_details_id]);
    if (isExistWorkDetailsResult[0].length === 0) {
        return error422(" work detail Not Found.", res);
    }

    //check payment status is exists or not
    const isExistPaymentStatusQuery = `SELECT * FROM payment_status WHERE payment_status_id = ? `;
    const isExistPaymentStatusResult = await pool.query(isExistPaymentStatusQuery, [payment_status_id]);
    if (isExistPaymentStatusResult[0].length === 0) {
        return error422("Payment Sataus not found.", res);
    }

    //check assigned to is exists or not
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
        const updateQuery = `UPDATE task_header SET customer_name = ?,mobile_number = ?, address = ?, service_id = ?, work_details_id= ?, assigned_to = ?, due_date = ?, payment_status_id = ?, amount = ? ,status_id = ?, task_note = ?, user_id = ? WHERE task_header_id = ?`;
        await connection.query(updateQuery, [customer_name, mobile_number, address, service_id, work_details_id, assigned_to, due_date, payment_status_id, amount, status_id, task_note, user_id, taskHeaderId]);
        
        //update into task documents
        let documentsArray = taskDocumentsDetails
        for (let i = 0; i < documentsArray.length; i++) {
            const element = documentsArray[i];
            const task_document_id = element.task_document_id ? element.task_document_id : '';
            const document_type_id  = element.document_type_id  ? element.document_type_id : '';
            const note = element.note ? element.note.trim() : '';
            if (!document_type_id) {
                await query("ROLLBACK");
                return error422("document type id is require", res);
            }
                let updateTaskDocumentsDetailsQuery = `UPDATE task_documents SET document_type_id = ?, note = ? WHERE task_header_id= ? AND task_document_id= ?`;
                let updateTaskDocumentsDetailsValues = [document_type_id, note, taskHeaderId, task_document_id];
                let updateTaskDocumentsDetailsResult = await connection.query(updateTaskDocumentsDetailsQuery, updateTaskDocumentsDetailsValues);
            if (!task_document_id) {
                let insertTaskDocumentsDetailsQuery = 'INSERT INTO task_documents (task_header_id, document_type_id, note) VALUES (?,?,?)';
                let insertTaskDocumentsDetailsValues = [taskHeaderId, document_type_id, note];
                let insertTaskDocumentsDetailsResult = await connection.query(insertTaskDocumentsDetailsQuery, insertTaskDocumentsDetailsValues);
            }
        }
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
    const { page, perPage, key, statusId , current_date} = req.query;
    const assignedTo = parseInt(req.query.assignedTo);
    
    // Attempt to obtain a database connection
    let connection = await getConnection();

    try {
        // Start a transaction
        await connection.beginTransaction();

        let taskAssignedToQuery = `SELECT th.*,s.services,wd.work_details,u.user_name,st.status_name,ps.payment_status FROM task_header th
        JOIN services s
        ON s.service_id = th.service_id
        JOIN work_details wd
        ON wd.work_details_id = th.work_details_id
        JOIN users u
        ON u.user_id = th.assigned_to
        JOIN status st
        ON st.status_id = th.status_id
        JOIN payment_status ps
        ON ps.payment_status_id = th.payment_status_id
        WHERE assigned_to = ${assignedTo}`;
        let countQuery = `SELECT COUNT(*) AS total FROM task_header th
        JOIN services s
        ON s.service_id = th.service_id
        JOIN work_details wd
        ON wd.work_details_id = th.work_details_id
        JOIN users u
        ON u.user_id = th.assigned_to
        JOIN status st
        ON st.status_id = th.status_id
        JOIN payment_status ps
        ON ps.payment_status_id = th.payment_status_id
        WHERE assigned_to = ${assignedTo}`;
        if (key) {
            const lowercaseKey = key.toLowerCase().trim();
                taskAssignedToQuery += ` AND (LOWER(th.customer_name) LIKE '%${lowercaseKey}%' || LOWER(th.mobile_number) LIKE '%${lowercaseKey}%' || LOWER(s.services) LIKE '%${lowercaseKey}%' || LOWER(u.user_name) LIKE '%${lowercaseKey}%')`;
                countQuery += ` AND (LOWER(th.customer_name) LIKE '%${lowercaseKey}%' || LOWER(th.mobile_number) LIKE '%${lowercaseKey}%' || LOWER(s.services) LIKE '%${lowercaseKey}%'|| LOWER(u.user_name) LIKE '%${lowercaseKey}%')`; 
        }
        if (statusId) {
            taskAssignedToQuery += ` AND th.status_id = ${statusId}`;
            countQuery += `  AND th.status_id = ${statusId}`;
        }
        if (current_date) {
            taskAssignedToQuery += ` AND DATE(th.created_at) = '${current_date}'`;
            countQuery += ` AND DATE(th.created_at) = '${current_date}'`;
        }
        taskAssignedToQuery += " ORDER BY created_at DESC";
        
        // Apply pagination if both page and perPage are provided
        let total = 0;
        if (page && perPage) {
            const totalResult = await connection.query(countQuery);
            total = parseInt(totalResult[0][0].total);
            const start = (page - 1) * perPage;
            taskAssignedToQuery += ` LIMIT ${perPage} OFFSET ${start}`;
        }
        let taskAssignedToResult = await connection.query(taskAssignedToQuery);
        const taskAssignedTo = taskAssignedToResult[0];
        const data = {
            status: 200,
            message: "Task Assigned To Retrived Successfully",
            data: taskAssignedTo,
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

//Report
const getReport = async (req, res) => {
    const { page, perPage, fromDate, toDate, assigned_to, status_id, service_id, user_id, payment_status_id} = req.query;
 
    // Attempt to obtain a database connection
    let connection = await getConnection();
    try {
        //Start the transaction
        await connection.beginTransaction();

        let getReportQuery = `SELECT th.*, s.services, u.user_name, st.status_name, ps.payment_status FROM task_header th
        JOIN services s
        ON s.service_id = th.service_id
        JOIN users u
        ON u.user_id = th.assigned_to
        JOIN status st
        ON st.status_id = th.status_id 
        JOIN payment_status ps
        ON ps.payment_status_id = th.payment_status_id WHERE 1`;
        
        
        let countQuery = `SELECT COUNT(*) AS total FROM task_header th
        JOIN services s
        ON s.service_id = th.service_id
        JOIN users u
        ON u.user_id = th.assigned_to
        JOIN status st
        ON st.status_id = th.status_id 
        JOIN payment_status ps
        ON ps.payment_status_id = th.payment_status_id WHERE 1`;
        

        // from date and to date
        if (fromDate && toDate) {
            getReportQuery += ` AND DATE(th.created_at) BETWEEN '${fromDate}' AND '${toDate}'`;
            countQuery += ` AND DATE(th.created_at) BETWEEN '${fromDate}' AND '${toDate}'`;
        }
        if (assigned_to) {
            getReportQuery += ` AND th.assigned_to = '${assigned_to}'`;
            countQuery += ` AND th.assigned_to = '${assigned_to}'`;
        }

        if (status_id) {
            getReportQuery += ` AND th.status_id = '${status_id}'`;
            countQuery += ` AND th.status_id = '${status_id}'`;
        }

        if (service_id) {
            getReportQuery += ` AND th.service_id = '${service_id}'`;
            countQuery += ` AND th.service_id = '${service_id}'`;
        }

        if (user_id) {
            getReportQuery += ` AND th.user_id = '${user_id}'`;
            countQuery += `  AND th.user_id = '${user_id}'`;
        }

        if (payment_status_id) {
            getReportQuery += ` AND th.payment_status_id = '${payment_status_id}'`;
            countQuery += `  AND th.payment_status_id = '${payment_status_id}'`;
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

// Delete Task Document.
const deleteTaskDocuments = async (req, res) => {
    const taskHeaderId = parseInt(req.params.id);
    const taskDocumentId = parseInt(req.query.Id);
    
    // Attempt to obtain a database connection
    let connection = await getConnection();

    try {
        // Start a transaction
        await connection.beginTransaction();
        //check task header exists
        const taskHeaderIdExistsQuery = "SELECT * FROM task_header WHERE task_header_id = ?";
        const taskHeaderIdExistsResult = await connection.query(taskHeaderIdExistsQuery, [taskHeaderId]);
        if (taskHeaderIdExistsResult[0].length === 0) {
            return error422("Task Header not Found.", res);
        }

        //delete task document..
        const deleteTaskDocumentQuery = `DELETE FROM task_documents WHERE task_header_id = ? AND task_document_id = ?`;
        const deleteTaskDocumentsResult = await connection.query(deleteTaskDocumentQuery, [taskHeaderId, taskDocumentId]);
        if (deleteTaskDocumentsResult[0].length == 0) {
             return error422("Task Document Not Found.", res);
        }
        
        // Commit the transaction
        await connection.commit();
        return res.status(200).json({
            status: 200,
            message: "Task Document Delete successfully.",
        });
    } catch (error) {
      await connection.rollback();
      return error500(error, res);
    } finally {
      await connection.release();
    }
};

// task status change..
const updateTaskStatusChange = async (req, res) => {
    const taskHeaderId = parseInt(req.params.id);
    const  status_id  = req.body.status_id  ? req.body.status_id : '';
    if (!taskHeaderId) {
        return error422("Task Header Id is required.", res);
    }  else if (!status_id) {
        return error422("Status ID is required.", res);
    }

    // Check if Task header exists
    const taskHeaderQuery = "SELECT * FROM task_header WHERE task_header_id = ? ";
    const taskHeaderResult = await pool.query(taskHeaderQuery, [taskHeaderId]);
    if (taskHeaderResult[0].length === 0) {
        return error422("Task Header Not Found.", res);
    }

    // Check if status exists
    const statusQuery = "SELECT * FROM status WHERE status_id  = ? && status = 1";
    const statusResult = await pool.query(statusQuery, [status_id]);
    if (statusResult[0].length == 0) {
        return error422("Status Not Found.", res);
    }

    // Attempt to obtain a database connection
    let connection = await getConnection();

    try {
        // Start a transaction
        await connection.beginTransaction();

        // update task Status
        const updateQuery = `UPDATE task_header SET status_id = ? WHERE task_header_id = ?`;
        await connection.query(updateQuery, [status_id, taskHeaderId]);

        //commit the transation
        await connection.commit();
        return res.status(200).json({
            status: 200,
            message: `Task Status update successfully.`,
        });
    } catch (error) {
        return error500(error, res);
    } finally {
        await connection.release();
    }
};



module.exports = {
    addTaskHeader,
    getTaskHeaders,
    getTaskHeader,
    updateTaskheader,
    getTaskAssignedTo,
    getReport,
    deleteTaskDocuments,
    updateTaskStatusChange
}