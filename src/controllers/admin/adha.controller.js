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

// add adha...
const addAdha = async (req, res) => {
    const  name  = req.body.name  ? req.body.name.trim()  : '';
    const  mobile_number  = req.body.mobile_number  ? req.body.mobile_number.trim()  : '';
    const  enrollment_number  = req.body.enrollment_number  ? req.body.enrollment_number.trim()  : '';
    const  erollment_time  = req.body.erollment_time  ? req.body.erollment_time.trim()  : '';
    const  serivice_id  = req.body.serivice_id  ? req.body.serivice_id : '';
    const  document_type_id  = req.body.document_type_id  ? req.body.document_type_id : '';
    const  verification_status  = req.body.verification_status  ? req.body.verification_status.trim()  : '';
    const  payment_mode  = req.body.Payment_mode  ? req.body.Payment_mode.trim()  : '';
    const  amount  = req.body.amount  ? req.body.amount  : '';
    const user_id  =req.companyData.user_id;

    if (!name) {
        return error422("Name is required.", res);
    }if (!mobile_number) {
        return error422("Mobile Number is required.", res);
    }if (!enrollment_number) {
        return error422("Enrollment Number is required.", res);
    }if (!erollment_time) {
        return error422("Erollment_Time is required.", res);
    }if (!serivice_id) {
        return error422("Serivice id is required.", res);
    }if (!document_type_id) {
        return error422("Document Type id is required.", res);
    }if (!verification_status) {
        return error422("Verification Status is required.", res);
    }if (!payment_mode) {
        return error422("Payment Mode is required.", res);
    }if (!amount) {
        return error422("Amount is required.", res);
    }else if (!user_id) {
        return error422("User ID is required.", res);
    }

    //check adha  already  exists or not
    const isExistDesignationQuery = `SELECT * FROM adha WHERE name= ? AND user_id=? `;
    const isExistDesignationResult = await pool.query(isExistDesignationQuery, [ name,user_id]);
    if (isExistDesignationResult[0].length > 0) {
        return error422("Adha Name is already exists.", res);
    } 

    // attempt to obtain a database connection
    let connection = await getConnection();

    try {

        //start a transaction
        await connection.beginTransaction();

//SELECT `id`, `name`, `mobile_number`, `enrollment_number`, `erollment_time`, `serivice_id`, `document_type_id`, `verification_status`, `payment_mode`, `amount`, `user_id`, `created_at` FROM `adha` WHERE 1

        //insert into adha 
        const insertadhaQuery = `INSERT INTO designations (name,mobile_number,enrollment_number,erollment_time,serivice_id,document_type_id,verification_status,payment_mode,amount, user_id ) VALUES (?,?,?,?,?,?,?,?,?,? )`;
        const insertadhaValues= [name,mobile_number,enrollment_number,erollment_time,serivice_id,document_type_id,verification_status,payment_mode,amount, user_id ];
        const adhanResult = await connection.query(insertadhaQuery, insertadhaValues);

         // Commit the transaction
         await connection.commit();
        res.status(200).json({
            status: 200,
            message: "Adha added successfully",
        });
    } catch (error) {
        
        return error500(error, res);
    }finally {
        if (connection) connection.release()
    }
}
module.exports = {
    addAdha
}
