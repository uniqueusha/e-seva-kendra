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
    const  adhaDocumentsDetails = req.body.adhaDocumentsDetails ? req.body.adhaDocumentsDetails : [];
    const  user_id  =req.companyData.user_id;

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

   //check service already is exists or not
   const isExistServiceQuery = `SELECT * FROM services WHERE service_id = ?`;
   const isExistServiceResult = await pool.query(isExistServiceQuery, [service_id, user_id]);
   if (isExistServiceResult[0].length === 0) {
       return error422("Service not Found.", res);
   }
    
   //check document type already is exists or not
   const isExistDocumentTypeQuery = `SELECT * FROM document_type WHERE document_type_id = ?`;
   const isExistDocumentTypeResult = await pool.query(isExistDocumentTypeQuery, [document_type_id]);
   if (isExistDocumentTypeResult[0].length === 0) {
       return error422(" Document Type Not Found.", res);
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
        const id = adhaResult[0].insertId;
        //insert into documents in Array
        let documentsArray = adhaDocumentsDetails
        for (let i = 0; i < documentsArray.length; i++) {
            const element = documentsArray[i];
            const document_type_id  = element.document_type_id  ? element.document_type_id : '';
            const note = element.note ? element.note.trim() : '';
            if (!document_type_id) {
                await query("ROLLBACK");
                return error422("document type id is require", res);
            }
            let insertAdhaDocumentsDetailsQuery = 'INSERT INTO adha_documents (id, document_type_id, note) VALUES (?,?,?)';
            let insertAdhaDocumentsDetailsvalues = [id, document_type_id, note];
            let insertAdhaDocumentsDetailsResult = await connection.query(insertAdhaDocumentsDetailsQuery, insertAdhaDocumentsDetailsvalues);
        }
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
    const { page, perPage, key, userId } = req.query;
    
    // attempt to obtain a database connection
    let connection = await getConnection();

    try {

        //start a transaction
        await connection.beginTransaction();

        let getAdhaQuery = `SELECT a.*, u.user_name, s.services, dt.document_type FROM adha a
        JOIN users u 
        ON u.user_id = a.user_id
        JOIN services s
        ON s.service_id = a.service_id
        JOIN document_type dt
        ON dt.document_type_id = a.document_type_id
        WHERE 1 `;

        let countQuery = `SELECT COUNT(*) AS total FROM adha a
        JOIN users u 
        ON u.user_id = a.user_id
        JOIN services s
        ON s.service_id = a.service_id
        JOIN document_type dt
        ON dt.document_type_id = a.document_type_id
        WHERE 1`; 
        
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
        if (userId) {
            getAdhaQuery += ` AND a.user_id = ${userId}`;
            countQuery += `  AND a.user_id = ${userId}`;
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
        console.log(error);
        
        return error500(error, res);
    }finally {
        if (connection) connection.release()
    }

}

// get adha report...
const getAdhasReport = async (req, res) => {
    const { page, perPage, key, fromDate, toDate, service_id, verification_status, payment_mode, user_id, current_date } = req.query;
    

    
    // attempt to obtain a database connection
    let connection = await getConnection();

    try {

        //start a transaction
        await connection.beginTransaction();

        let getAdhaQuery = `SELECT a.*, u.user_name,s.services, d.document_type FROM adha a
        LEFT JOIN users u 
        ON u.user_id = a.user_id
        LEFT JOIN services s
        ON s.service_id = a.service_id
        LEFT JOIN document_type d
        ON d.document_type_id = a.document_type_id
        WHERE 1 `;

        let countQuery = `SELECT COUNT(*) AS total FROM adha a
        LEFT JOIN users u 
        ON u.user_id = a.user_id
        LEFT JOIN services s
        ON s.service_id = a.service_id
        LEFT JOIN document_type d
        ON d.document_type_id = a.document_type_id
        WHERE 1`;
 
        
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
        if (fromDate && toDate) {
            getAdhaQuery += ` AND DATE(a.created_at) BETWEEN '${fromDate}' AND '${toDate}'`;
            countQuery += ` AND DATE(a.created_at) BETWEEN '${fromDate}' AND '${toDate}'`;
        }
        if (service_id) {
            getAdhaQuery += ` AND a.service_id = '${service_id}'`;
            countQuery += ` AND a.service_id = '${service_id}'`;
        }
        if (verification_status) {
            getAdhaQuery += ` AND a.verification_status = '${verification_status}'`;
            countQuery += ` AND a.verification_status = '${verification_status}'`;
        }
        if (payment_mode) {
            getAdhaQuery += ` AND a.payment_mode = '${payment_mode}'`;
            countQuery += ` AND a.payment_mode = '${payment_mode}'`;
        }
        if (user_id) {
            getAdhaQuery += ` AND a.user_id = '${user_id}'`;
            countQuery += ` AND a.user_id = '${user_id}'`;
        }
        if (current_date) {
            getAdhaQuery += ` AND DATE(a.created_at) = '${current_date}'`;
            countQuery += ` AND DATE(a.created_at) = '${current_date}'`;
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

        const adhaQuery = `SELECT a.*, u.user_name, s.services, dt.document_type FROM adha a
        JOIN users u 
        ON u.user_id = a.user_id
        JOIN services s
        ON s.service_id = a.service_id
        JOIN document_type dt
        ON dt.document_type_id = a.document_type_id
         WHERE a.id=? AND a.user_id=?`;
        const adhaResult = await connection.query(adhaQuery, [adhaId,user_id]);
        
        if (adhaResult[0].length == 0) {
            return error422("Adha Not Found.", res);
        }
        let adha = adhaResult[0][0];
        //get documents
        const adhaDocumentsQuery = `SELECT ad.*,d.document_type FROM adha_documents ad 
        JOIN document_type d
        ON d.document_type_id = ad.document_type_id
        WHERE ad.id = ?`;
        const adhaDocumentsResult = await connection.query(adhaDocumentsQuery, [adhaId]);
        adha['ashaDocumentsDetails'] = adhaDocumentsResult[0];

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
    const adhaDocumentsDetails = req.body.adhaDocumentsDetails ? req.body.adhaDocumentsDetails : [];
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
        const adhaQuery = "SELECT * FROM adha WHERE id  = ?";
        const adhaResult = await connection.query(adhaQuery, [adhaId]);
        if (adhaResult[0].length == 0) {
            return error422("Adha Not Found.", res);
        }
        
        if(service_id){
            //check if check service_id exists
            const isExistServiceQuery="SELECT * FROM services WHERE service_id = ?";
            const serviceResult=await connection.query(isExistServiceQuery,[service_id]);
            if(serviceResult[0].length==0){
                return error422("Service Not Found",res);
            }
        }
        if(document_type_id){
            //check if check document_type_id_id exists
            const isExistDocumentTypeQuery="SELECT * FROM document_type WHERE document_type_id=?";
            const DocumentTypeResult=await connection.query(isExistDocumentTypeQuery,[document_type_id]);
            if(DocumentTypeResult[0].length==0){
                return error422("document type Not Found",res);
            }
        }

        // Update the adha record with new data
        const updateQuery = `UPDATE adha SET name = ?, mobile_number=?,enrollment_number=?,enollment_time=?,service_id=?,document_type_id=?,verification_status=?,payment_mode=?,amount=?, user_id = ? WHERE id = ?`;
        await connection.query(updateQuery, [name,mobile_number,enrollment_number,enollment_time,service_id,document_type_id,verification_status,payment_mode,amount, user_id,adhaId]);

        //update into adha documents
        let documentsArray = adhaDocumentsDetails
        for (let i = 0; i < documentsArray.length; i++) {
            const element = documentsArray[i];
            const adha_document_id = element.adha_document_id ? element.adha_document_id : '';
            const document_type_id  = element.document_type_id  ? element.document_type_id : '';
            const note = element.note ? element.note.trim() : '';
            if (!document_type_id) {
                await query("ROLLBACK");
                return error422("document type id is require", res);
            }
                let updateAdhaDocumentsDetailsQuery = `UPDATE Adha_documents SET document_type_id = ?, note = ? WHERE id= ? AND Adha_document_id= ?`;
                let updateAdhaDocumentsDetailsValues = [document_type_id, note, adhaId, adha_document_id];
                let updateAdhaDocumentsDetailsResult = await connection.query(updateAdhaDocumentsDetailsQuery, updateAdhaDocumentsDetailsValues);
            if (!adha_document_id) {
                let insertAdhaDocumentsDetailsQuery = 'INSERT INTO Adha_documents (id, document_type_id, note) VALUES (?,?,?)';
                let insertAdhaDocumentsDetailsValues = [AdhaId, document_type_id, note];
                let insertAdhaDocumentsDetailsResult = await connection.query(insertAdhaDocumentsDetailsQuery, insertAdhaDocumentsDetailsValues);
            }
        }
        // Commit the transaction
        await connection.commit();

        return res.status(200).json({
            status: 200,
            message: "Adha updated successfully.",
        });
    } catch (error) {
        console.log(error);
        
        return error500(error,res);
    }finally {
        if (connection) connection.release()
    }
}

module.exports = {
        addAdha,
        getAdhas,
        getAdha,
        updateAdha,
        getAdhasReport
}
