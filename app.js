
const express=require('express');
const bodyParser=require("body-parser");
const cors = require('cors');
const app=express();
app.use(express.json({ limit: '100mb' }));  



//Admin route
//const userRoute = require("./src/routes/admin/service_type.route");
const userRoute = require("./src/routes/admin/user.route");

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
//app.use('/api/service_type',servicetypeRoute);
app.use('/api/user',userRoute);


module.exports = app;