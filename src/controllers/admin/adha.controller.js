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
    const  name = req.body.name  ? req.body.name.trim(): '';
    const  mobile_number  = req.body.mobile_number  ? req.body.mobile_number : '';
    const  enrollment_number  = req.body.enrollment_number  ? req.body.enrollment_number : '';
    const  enollment_time  = req.body.enollment_time  ? req.body.enollment_time  : '';
    const  service_id  = req.body.service_id  ? req.body.service_id : '';
    const  document_type_id  = req.body.document_type_id  ? req.body.document_type_id : '';
    const  verification_status  = req.body.verification_status  ? req.body.verification_status  : '';
    const  payment_mode  = req.body.payment_mode  ? req.body.payment_mode : '';
    const  amount  = req.body.amount  ? req.body.amount  : '';
    const user_id  =req.companyData.user_id;

    if (!name) {
        return error422("Name is required.", res);
    }if (!mobile_number) {
        return error422("Mobile number is required.", res);
    }if (!enrollment_number) {
        return error422("Enrollment number is required.", res);
    }if (!enollment_time) {
        return error422("Enollment time is required.", res);
    }if (!service_id) {
        return error422("Service id is required.", res);
    }if (!document_type_id) {
        return error422("Document type id is required.", res);
    }if (!verification_status) {
        return error422("Verification status is required.", res);
    }if (!payment_mode) {
        return error422("Payment mode is required.", res);
    }if (!amount) {
        return error422("Amount is required.", res);
    }else if (!user_id) {
        return error422("User ID is required.", res);
    }

    //check adha already exists or not
    const isExistAdhaQuery = `SELECT * FROM adha WHERE name= ? AND user_id=? `;
    const isExistAdhaResult = await pool.query(isExistAdhaQuery, [name,user_id]);
    if (isExistAdhaResult[0].length > 0) {
        return error422("Adha Name is already exists.", res);
    } 

    // attempt to obtain a database connection
    let connection = await getConnection();

    try {

        //start a transaction
        await connection.beginTransaction();

        //insert into adha 
        const insertadhaQuery = `INSERT INTO adha (name,mobile_number,enrollment_number,enollment_time,service_id,document_type_id,verification_status,payment_mode,amount,user_id ) VALUES (?,?,?,?,?,?,?,?,?,? ) `;
        const insertadhaValues= [name,mobile_number,enrollment_number,enollment_time,service_id,document_type_id,verification_status,payment_mode,amount,user_id];
        const adhaResult = await connection.query(insertadhaQuery, insertadhaValues);

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

// get adha list...
const getAdhas = async (req, res) => {
    const { page, perPage, key } = req.query;
    const user_id = req.companyData.user_id;

    // attempt to obtain a database connection
    let connection = await getConnection();

    try {

        //start a transaction
        await connection.beginTransaction();

        let getAdhaQuery = `SELECT a.*, u.user_name FROM adha a
        LEFT JOIN users u 
        ON a.user_id = u.user_id
        LEFT JOIN services s
        ON a.service_id=s.service_id
        LEFT JOIN document_type dt
        ON a.document_type_id=dt.document_type_id
        WHERE 1 AND a.user_id = ${user_id}`;

        let countQuery = `SELECT COUNT(*) AS total FROM adha a
        LEFT JOIN users u
        ON a.user_id = u.user_id
        LEFT JOIN services s
        ON a.service_id=s.service_id
        LEFT JOIN document_type dt
        ON a.document_type_id=dt.document_type_id
        WHERE 1 AND a.user_id = ${user_id} `; 
        
        if (key) {
            const lowercaseKey = key.toLowerCase().trim();
            if (lowercaseKey === "activated") {
                getAdhaQuery += ` AND a.status = 1`;
                countQuery += ` AND a.status = 1`;
            } else if (lowercaseKey === "deactivated") {
                getAdhaQuery += ` AND a.status = 0`;
                countQuery += ` AND a.status = 0`;
            } else {
                getAdhaQuery += ` AND  LOWER(a.name) LIKE '%${lowercaseKey}%' `;
                countQuery += ` AND  LOWER(a.name) LIKE '%${lowercaseKey}%' `;
            }
        }
        getAdhaQuery += " ORDER BY a.created_at DESC";

        // Apply pagination if both page and perPage are provided
        let total = 0;
        if (page && perPage) {
            const totalResult = await connection.query(countQuery);
            total = parseInt(totalResult[0][0].total);

            const start = (page - 1) * perPage;
            getAdhaQuery += ` LIMIT ${perPage} OFFSET ${start}`;
        }

        const result = await connection.query(getAdhaQuery);
        const adha = result[0];

        // Commit the transaction
        await connection.commit();
        const data = {
            status: 200,
            message: "Adha retrieved successfully",
            data: adha,
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

// get adha  by id...
const getAdha = async (req, res) => {
    const adhaId = parseInt(req.params.id);
    const user_id=req.companyData.user_id;

    // attempt to obtain a database connection
    let connection = await getConnection();

    try {

        //start a transaction
        await connection.beginTransaction();

        const adhaQuery = `SELECT a.* FROM adha a
        LEFT JOIN users u
        ON a.user_id=u.user_id
        LEFT JOIN services s
        ON a.service_id=s.service_id
        LEFT JOIN document_type dt
        ON a.document_type_id=dt.document_type_id
         WHERE a.id=? AND a.user_id=?`;
        const adhaResult = await connection.query(adhaQuery, [adhaId,user_id]);
        
        if (adhaResult[0].length == 0) {
            return error422("Adha Not Found.", res);
        }
        const adha = adhaResult[0][0];
        
        return res.status(200).json({
            status: 200,
            message: "Adha Retrived Successfully",
            data: adha
        });
    } catch (error) {
        return error500(error, res);
    }finally {
        if (connection) connection.release()
    }
}


//adha  update...
const updateAdha = async (req, res) => {
    const adhaId = parseInt(req.params.id);
    const  name  = req.body.name  ? req.body.name.trim() : '';
    const mobile_number = req.body.mobile_number ? req.body.mobile_number : '';
    const enrollment_number = req.body.enrollment_number ? req.body.enrollment_number : '';
    const enollment_time = req.body.enollment_time ? req.body.enollment_time : '';
    const service_id = req.body.service_id ? req.body.service_id : '';
    const document_type_id = req.body.document_type_id ? req.body.document_type_id : '';
    const verification_status = req.body.verification_status ? req.body.verification_status : '';
    const payment_mode = req.body.payment_mode ? req.body.payment_mode : '';
    const amount = req.body.amount ? req.body.amount : '';
    const user_id = req.companyData.user_id;

    if (!name) {
        return error422("Name is required.", res);
    } else if (!user_id) {
        return error422("User id is required.", res);
    } else if (!adhaId) {
        return error422("Adha id is required.", res);
    }else if (!mobile_number) {
        return error422("Mobile number is required.", res);
    }else if (!enrollment_number) {
        return error422("Enrollment number is required.", res);
    }else if (!enollment_time) {
        return error422("Enollment time is required.", res);
    }else if (!service_id) {
        return error422("Service id is required.", res);
    }else if (!document_type_id) {
        return error422("Document type id is required.", res);
    }else if (!verification_status) {
        return error422("Verification status is required.", res);
    }else if (!payment_mode) {
        return error422("Payment mode is required.", res);
    }else if (!amount) {
        return error422("Amount is required.", res);
    }

    // attempt to obtain a database connection
    let connection = await getConnection();

    try {

        //start a transaction
        await connection.beginTransaction();

        // Check if adha exists
        const adhaQuery = "SELECT * FROM adha WHERE id  = ? AND user_id=?";
        const adhaResult = await connection.query(adhaQuery, [adhaId,user_id]);
        if (adhaResult[0].length == 0) {
            return error422("Adha Not Found.", res);
        }
        if(service_id){
            //check if check service_id exists
            const isExistServiceQuery="SELECT * FROM services WHERE service_id=? AND user_id=?";
            const serviceResult=await connection.query(isExistServiceQuery,[service_id,user_id]);
            if(serviceResult[0].length==0){
                return error422("Service Not Found",res);
            }
        }
        if(document_type_id){
            //check if check document_type_id_id exists
            const isExistDocumentTypeQuery="SELECT * FROM document_type WHERE document_type_id=? AND user_id=?";
            const DocumentTypeResult=await connection.query(isExistDocumentTypeQuery,[document_type_id,user_id]);
            if(DocumentTypeResult[0].length==0){
                return error422("document type Not Found",res);
            }
        }
        // Check if the provided adha exists and is active 
        const existingAdhaQuery = "SELECT * FROM adha WHERE name  = ? AND id!=? AND user_id = ?";
        const existingAdhaResult = await connection.query(existingAdhaQuery, [name, adhaId, user_id]);

        if (existingAdhaResult[0].length > 0) {
            return error422("Adha Name already exists.", res);
        }
        
        // Update the adha record with new data
        const updateQuery = `
            UPDATE adha
            SET name = ?, mobile_number=?,enrollment_number=?,enollment_time=?,service_id=?,document_type_id=?,verification_status=?,payment_mode=?,amount=?, user_id = ?
            WHERE id = ?
        `;

        await connection.query(updateQuery, [name,mobile_number,enrollment_number,enollment_time,service_id,document_type_id,verification_status,payment_mode,amount, user_id,adhaId]);
        // Commit the transaction
        await connection.commit();

        return res.status(200).json({
            status: 200,
            message: "Adha updated successfully.",
        });
    } catch (error) {
        return error500(error,res);
    }finally {
        if (connection) connection.release()
    }
}

module.exports = {
    addAdha,
    getAdhas,
    getAdha,
    updateAdha
}
