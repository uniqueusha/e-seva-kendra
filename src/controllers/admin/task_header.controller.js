// const pool = require("../../../db");
// // Function to obtain a database connection
// const getConnection = async () => {
//     try {
//         const connection = await pool.getConnection();
//         return connection;
//     } catch (error) {
//         throw new Error("Failed to obtain database connection: " + error.message);
//     }
// };
// //errror 422 handler...
// error422 = (message, res) => {
//     return res.status(422).json({
//         status: 422,
//         message: message
//     });
// }

// //error 500 handler...
// error500 = (error, res) => {
//      res.send({
//         status: 500,
//         message: "Internal Server Error",
//         error: error
//     });
// }

// //add Task Header..
// const addtaskHeader = async (req, res) => {
//     const  customer_name  = req.body.customer_name  ? req.body.customer_name.trim()  : '';
//     const  mobile_number  = req.body.mobile_number  ? req.body.mobile_number : '';
//     const  address  = req.body.address  ? req.body.address.trim() : '';
//     const  service_id  = req.body.service_id  ? req.body.service_id : '';
//     const  work_details  = req.body.work_details  ? req.body.work_details.trim()  : '';
//     const  document_type_id  = req.body.document_type_id  ? req.body.document_type_id : '';
//     const  assigned_to  = req.body.assigned_to  ? req.body.assigned_to.trim()  : '';
//     const  due_date  = req.body.due_date  ? req.body.due_date.trim()  : '';
//     const  payment_status  = req.body.payment_status  ? req.body.payment_status.trim()  : '';

//     const user_id  = req.companyData.user_id ;
 
//     if (!service_id) {
//         return error422("Service Id is required.", res);
//     }  else if (!user_id) {
//         return error422("User ID is required.", res);
//     }  else if (!work_details) {
//         return error422("work_details is required.", res);
//     }

//     //check Customer already is exists or not
//     const isExistCustomerQuery = `SELECT * FROM task_header WHERE LOWER(TRIM(customer_name))= ? && user_id =?`;
//     const isExistCustomerResult = await pool.query(isExistCustomerQuery, [ customer_name.toLowerCase(), user_id]);
//     if (isExistCustomerResult[0].length > 0) {
//         return error422(" Customer Name is already exists.", res);
//     } 

//     //check document type already is exists or not
//     const isExistDocumentTypeQuery = `SELECT * FROM document_type WHERE document_type_id = ? && user_id =?`;
//     const isExistDocumentTypeResult = await pool.query(isExistDocumentTypeQuery, [document_type_id, user_id]);
//     if (isExistDocumentTypeResult[0].length > 0) {
//         return error422(" Document Type is already exists.", res);
//     }

//     // Attempt to obtain a database connection
//     let connection = await getConnection();
//     try {
//          //Start the transaction
//          await connection.beginTransaction();
//         //insert into Task Header
//         const insertTaskHeaderQuery = `INSERT INTO task_header (customer_name, mobile_number, address, service_id, work_details, document_type_id, assigned_to, due_date, payment_status, user_id ) VALUES (?, ?)`;
//         const insertTaskHeaderValues = [priority_name, mobile_number, address, service_id, work_details, document_type_id, assigned_to, due_date, payment_status, user_id];
//         const taskHeaderResult = await connection.query(insertTaskHeaderQuery, insertTaskHeaderValues);
       
//         //commit the transation
//         await connection.commit();
//         res.status(200).json({
//             status: 200,
//             message: "Task Header added successfully",
//         });
//     } catch (error) {
//         return error500(error, res);
//     } finally {
//         await connection.release();
//     }
// };