
const express=require('express');
const bodyParser=require("body-parser");
const cors = require('cors');
const app=express();
app.use(express.json({ limit: '100mb' }));  



//Admin route
const userRoute = require("./src/routes/admin/user.route");
const designationRoute = require("./src/routes/admin/designation.route");
const rolesRoute = require("./src/routes/admin/roles.route");
const serviceRoute = require("./src/routes/admin/services.route");
const documenttypeRoute = require("./src/routes/admin/document.type.route");
const prioritiesRoute = require("./src/routes/admin/priorities.route");
const statusRoute = require("./src/routes/admin/status.route");
const userRoleRoute = require("./src/routes/admin/user_roles.route");

const taskHeaderRoute = require("./src/routes/admin/task_header.route");
const workDetailsRoute = require("./src/routes/admin/work_details.route");

const adhaRoute = require("./src/routes/admin/adha.route");

// const taskHeaderRoute = require("./src/routes/admin/task_header.route");


app.use(bodyParser.json());
app.use((req,res,next)=>{
    res.setHeader("Access-Control-Allow-Origin","*");
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Origin,X-Requested-With,Content-Type,Accept, Authorization"
    );
    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET,POST,PATCH,PUT,DELETE,OPTIONS" 
    );
    next();
});
 app.use(cors());
//Admin route
app.use('/api/user',userRoute);
app.use('/api/designation',designationRoute);
app.use('/api/role',rolesRoute);
app.use('/api/service',serviceRoute);
app.use('/api/document',documenttypeRoute);
app.use('/api/priorities',prioritiesRoute);
app.use('/api/status',statusRoute);
app.use('/api/userRole',userRoleRoute);

app.use('/api/taskHeader',taskHeaderRoute);
app.use('/api/workDetails',workDetailsRoute);
app.use('/api/adha',adhaRoute);

module.exports = app;