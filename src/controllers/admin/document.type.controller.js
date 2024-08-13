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

// add document_type...
const addDocumentType = async (req, res) => {
    const  document_type  = req.body.document_type  ? req.body.document_type.trim()  : '';
    const user_id  =req.companyData.user_id;

    if (!document_type) {
        return error422("Document Type  is required.", res);
    }else if (!user_id) {
        return error422("User ID is required.", res);
    }

    //check document type  already  exists or not
    const isExistDocumentTypeQuery = `SELECT * FROM document_type WHERE document_type= ? AND user_id=? `;
    const isExistDocumentTypeResult = await pool.query(isExistDocumentTypeQuery, [ document_type,user_id]);
    if (isExistDocumentTypeResult[0].length > 0) {
        return error422("Document Type is already exists.", res);
    } 

    // attempt to obtain a database connection
    let connection = await getConnection();

    try {

        //start a transaction
        await connection.beginTransaction();

        //insert into document_type 
        const insertDocumentTypeQuery = `INSERT INTO document_type (document_type, user_id ) VALUES (?, ?)`;
        const insertDocumentTypeValues= [document_type, user_id ];
        const documentTypeResult = await connection.query(insertDocumentTypeQuery, insertDocumentTypeValues);

         // Commit the transaction
         await connection.commit();
        res.status(200).json({
            status: 200,
            message: "Document Type added successfully",
        });
    } catch (error) {
        
        return error500(error, res);
    }finally {
        if (connection) connection.release()
    }
}

// get document type list...
const getDocumentTypes = async (req, res) => {
    const { page, perPage, key } = req.query;
    const user_id = req.companyData.user_id;

    // attempt to obtain a database connection
    let connection = await getConnection();

    try {

        //start a transaction
        await connection.beginTransaction();

        let getDocumentTypeQuery = `SELECT dt.*, u.user_id FROM document_type dt
        LEFT JOIN users u 
        ON dt.user_id = u.user_id
        WHERE 1 AND dt.user_id = ${user_id}`;

        let countQuery = `SELECT COUNT(*) AS total FROM document_type dt
        LEFT JOIN users u
        ON dt.user_id = u.user_id
        WHERE 1 AND dt.user_id = ${user_id} `;
        
        if (key) {
            const lowercaseKey = key.toLowerCase().trim();
            if (lowercaseKey === "activated") {
                getDocumentTypeQuery += ` AND dt.status = 1`;
                countQuery += ` AND dt.status = 1`;
            } else if (lowercaseKey === "deactivated") {
                getDocumentTypeQuery += ` AND dt.status = 0`;
                countQuery += ` AND dt.status = 0`;
            } else {
                getDocumentTypeQuery += ` AND  LOWER(dt.document_type) LIKE '%${lowercaseKey}%' `;
                countQuery += ` AND  LOWER(dt.document_type) LIKE '%${lowercaseKey}%' `;
            }
        }
        //getDocumentTypeQuery += " ORDER BY d.cts DESC";

        // Apply pagination if both page and perPage are provided
        let total = 0;
        if (page && perPage) {
            const totalResult = await connection.query(countQuery);
            total = parseInt(totalResult[0][0].total);

            const start = (page - 1) * perPage;
            getDocumentTypeQuery += ` LIMIT ${perPage} OFFSET ${start}`;
        }

        const result = await connection.query(getDocumentTypeQuery);
        const documentType = result[0];

        // Commit the transaction
        await connection.commit();
        const data = {
            status: 200,
            message: "Document Type retrieved successfully",
            data: documentType,
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
// get document type  by id...
const getDocumentType = async (req, res) => {
    const documentTypeId = parseInt(req.params.id);
    const user_id=req.companyData.user_id;

    // attempt to obtain a database connection
    let connection = await getConnection();

    try {

        //start a transaction
        await connection.beginTransaction();

        const documenttypeQuery = `SELECT dt.* FROM document_type dt
        LEFT JOIN users u
        ON dt.user_id=u.user_id
         WHERE dt.document_type_id=? AND dt.user_id=?`;
        const documenttypeResult = await connection.query(documenttypeQuery, [documentTypeId,user_id]);
        
        if (documenttypeResult[0].length == 0) {
            return error422("Document Type Not Found.", res);
        }
        const documentType = documenttypeResult[0][0];
        
        return res.status(200).json({
            status: 200,
            message: "Document Type Retrived Successfully",
            data: documentType
        });
    } catch (error) {
        return error500(error, res);
    }finally {
        if (connection) connection.release()
    }
}


//document type  update...
const updateDocumentType = async (req, res) => {
    const documentTypeId = parseInt(req.params.id);
    const document_type = req.body.document_type ? req.body.document_type : '';
    const user_id = req.companyData.user_id;

    if (!document_type) {
        return error422("Document type is required.", res);
    } else if (!user_id) {
        return error422("User id is required.", res);
    } else if (!documentTypeId) {
        return error422("Document Type id is required.", res);
    }

    // attempt to obtain a database connection
    let connection = await getConnection();

    try {

        //start a transaction
        await connection.beginTransaction();

        // Check if document_type exists
        const documentTypeQuery = "SELECT * FROM document_type WHERE document_type_id  = ? AND user_id=?";
        const documentTypeResult = await connection.query(documentTypeQuery, [documentTypeId,user_id]);
        if (documentTypeResult[0].length == 0) {
            return error422("Document Type Not Found.", res);
        }
        // Check if the provided document_type exists and is active 
        const existingdocumentTypeQuery = "SELECT * FROM document_type WHERE document_type  = ? AND document_type_id!=? AND user_id = ?";
        const existingdocumentTypeResult = await connection.query(existingdocumentTypeQuery, [document_type, documentTypeId, user_id]);

        if (existingdocumentTypeResult[0].length > 0) {
            return error422("Document Type already exists.", res);
        }
        
        // Update the document_type record with new data
        const updateQuery = `
            UPDATE document_type
            SET document_type = ?, user_id = ?
            WHERE document_type_id = ?
        `;

        await connection.query(updateQuery, [document_type, user_id, documentTypeId]);
        // Commit the transaction
        await connection.commit();

        return res.status(200).json({
            status: 200,
            message: "Document Type updated successfully.",
        });
    } catch (error) {
        return error500(error,res);
    }finally {
        if (connection) connection.release()
    }
}


module.exports = {
    addDocumentType,
    getDocumentTypes,
    getDocumentType,
    updateDocumentType
}