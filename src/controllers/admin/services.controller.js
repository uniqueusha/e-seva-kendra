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

// add service...
const addService = async (req, res) => {
    const  services  = req.body.services  ? req.body.services.trim()  : '';
    const user_id  = req.companyData.user_id;

    if (!services) {
        return error422("Service is required.", res);
    }else if (!user_id) {
        return error422("User ID is required.", res);
    }

    //check service already exists or not
    const isExistServiceQuery = `SELECT * FROM services WHERE services = ? AND user_id = ? `;
    const isExistServiceResult = await pool.query(isExistServiceQuery, [ services,user_id]);
    if (isExistServiceResult[0].length > 0) {
        return error422("Service is already exists.", res);
    } 

    // attempt to obtain a database connection
    let connection = await getConnection();

    try {

        //start a transaction
        await connection.beginTransaction();

        //insert into service 
        const insertServiceQuery = `INSERT INTO services (services, user_id ) VALUES (?, ? )`;
        const insertServiceValues= [services, user_id ];
        const serviceResult = await connection.query(insertServiceQuery, insertServiceValues);

         // Commit the transaction
         await connection.commit();
        res.status(200).json({
            status: 200,
            message: "Service added successfully",
        });
    } catch (error) {
        return error500(error, res);
    }finally {
        if (connection) connection.release()
    }
}

// get services list...
const getServices = async (req, res) => {
    const { page, perPage, key } = req.query;
    const user_id = req.companyData.user_id;

    // attempt to obtain a database connection
    let connection = await getConnection();

    try {

        //start a transaction
        await connection.beginTransaction();

        let getServiceQuery = `SELECT s.*, u.user_name FROM services s
        LEFT JOIN users u 
        ON s.user_id = u.user_id
        WHERE 1 AND s.user_id = ${user_id}`;

        let countQuery = `SELECT COUNT(*) AS total FROM services s
        LEFT JOIN users u
        ON s.user_id = u.user_id
        WHERE 1 AND s.user_id = ${user_id} `;
        
        if (key) {
            const lowercaseKey = key.toLowerCase().trim();
            if (lowercaseKey === "activated") {
                getServiceQuery += ` AND s.status = 1`;
                countQuery += ` AND s.status = 1`;
            } else if (lowercaseKey === "deactivated") {
                getServiceQuery += ` AND s.status = 0`;
                countQuery += ` AND s.status = 0`;
            } else {
                getServiceQuery += ` AND  LOWER(s.services) LIKE '%${lowercaseKey}%' `;
                countQuery += ` AND  LOWER(s.services) LIKE '%${lowercaseKey}%' `;
            }
        }
        getServiceQuery += " ORDER BY s.created_at DESC";

        // Apply pagination if both page and perPage are provided
        let total = 0;
        if (page && perPage) {
            const totalResult = await connection.query(countQuery);
            total = parseInt(totalResult[0][0].total);

            const start = (page - 1) * perPage;
            getServiceQuery += ` LIMIT ${perPage} OFFSET ${start}`;
        }

        const result = await connection.query(getServiceQuery);
        const service = result[0];

        // Commit the transaction
        await connection.commit();
        const data = {
            status: 200,
            message: "Service retrieved successfully",
            data: service,
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

// get service  by id...
const getService = async (req, res) => {
    const serviceId = parseInt(req.params.id);
    const user_id=req.companyData.user_id;

    // attempt to obtain a database connection
    let connection = await getConnection();

    try {

        //start a transaction
        await connection.beginTransaction();

        const serviceQuery = `SELECT s.* FROM services s
        LEFT JOIN users u
        ON s.user_id=u.user_id
         WHERE s.service_id=? AND s.user_id=?`;
        const serviceResult = await connection.query(serviceQuery, [serviceId,user_id]);
        
        if (serviceResult[0].length == 0) {
            return error422("Service Not Found.", res);
        }
        const service = serviceResult[0][0];
        
        return res.status(200).json({
            status: 200,
            message: "Service Retrived Successfully",
            data: service
        });
    } catch (error) {
        return error500(error, res);
    }finally {
        if (connection) connection.release()
    }
}

//service  update...
const updateService = async (req, res) => {
    const serviceId = parseInt(req.params.id);
    const services = req.body.services ? req.body.services : '';
    const user_id = req.companyData.user_id;

    if (!services) {
        return error422("Designation name is required.", res);
    } else if (!user_id) {
        return error422("User id is required.", res);
    } else if (!serviceId) {
        return error422("Service id is required.", res);
    }

    // attempt to obtain a database connection
    let connection = await getConnection();

    try {

        //start a transaction
        await connection.beginTransaction();

        // Check if services exists
        const serviceQuery = "SELECT * FROM services WHERE service_id  = ? AND user_id = ? ";
        const serviceResult = await connection.query(serviceQuery, [serviceId,user_id]);
        if (serviceResult[0].length == 0) {
            return error422("Service  Not Found.", res);
        }
        // Check if the provided services exists and is active 
        const existingServiceQuery = "SELECT * FROM services WHERE services  = ? AND service_id!=? AND user_id = ?";
        const existingServiceResult = await connection.query(existingServiceQuery, [services, serviceId, user_id]);

        if (existingServiceResult[0].length > 0) {
            return error422("Service already exists.", res);
        }
        
        // Update the services record with new data
        const updateQuery = `
            UPDATE services
            SET services = ?, user_id = ?
            WHERE service_id = ?
        `;

        await connection.query(updateQuery, [services, user_id, serviceId]);
        // Commit the transaction
        await connection.commit();

        return res.status(200).json({
            status: 200,
            message: "Service updated successfully.",
        });
    } catch (error) {
        return error500(error,res);
    }finally {
        if (connection) connection.release()
    }
}
//status change of service...
const onStatusChange = async (req, res) => {
    const serviceId = parseInt(req.params.id);
    const status = parseInt(req.query.status); // Validate and parse the status parameter
    const user_id = req.companyData.user_id;

    // attempt to obtain a database connection
    let connection = await getConnection();

    try {

        //start a transaction
        await connection.beginTransaction();

        // Check if the service exists
        const serviceQuery = "SELECT * FROM services WHERE service_id = ? AND user_id=?";
        const serviceResult = await connection.query(serviceQuery, [serviceId,user_id]);

        if (serviceResult[0].length == 0) {
            return res.status(404).json({
                status: 404,
                message: "Service not found.",
            });
        }

        // Validate the status parameter
        if (status !== 0 && status !== 1) {
            return res.status(400).json({
                status: 400,
                message: "Invalid status value. Status must be 0 (inactive) or 1 (active).",
            });
        }

        // Soft update the services status
        const updateQuery = `
            UPDATE services
            SET status = ?
            WHERE service_id = ?
        `;

        await connection.query(updateQuery, [status, serviceId]);

        const statusMessage = status === 1 ? "activated" : "deactivated";
        // Commit the transaction
        await connection.commit();
        return res.status(200).json({
            status: 200,
            message: `Service ${statusMessage} successfully.`,
        });
    } catch (error) {
        return error500(error,res);
    }finally {
        if (connection) connection.release()
    }
};

//get service active...
const getServiceWma = async (req, res) => {
    const user_id = req.companyData.user_id;

    const checkUserQuery = `SELECT * FROM users WHERE user_id = ${user_id}  `;
    const userResult = await pool.query(checkUserQuery);
    

    let serviceQuery = `SELECT s.*  FROM services s 
    LEFT JOIN users u 
    ON u.user_id = s.user_id 
    WHERE s.status = 1  ORDER BY s.services`;
    
    // attempt to obtain a database connection
    let connection = await getConnection();

    try {

        //start a transaction
        await connection.beginTransaction();

        const  serviceResult = await connection.query(serviceQuery);
        const service =  serviceResult[0];

        // Commit the transaction
        await connection.commit();
        
        return res.status(200).json({
            status: 200,
            message: "Service retrieved successfully.",
            data:  service,
        });
    } catch (error) {
        return error500(error,res);
    }finally {
        if (connection) connection.release()
    }
    
}
module.exports = {
    addService,
    getServices,
    getService,
    updateService,
    onStatusChange,
    getServiceWma
}