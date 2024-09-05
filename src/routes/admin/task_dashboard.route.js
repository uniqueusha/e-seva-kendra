const express = require("express");
const router = express.Router();
const taskDashboardController = require("../../controllers/admin/task_dashboard.controller");
const checkAuth = require("../../middleware/check.auth");


router.get('/status',taskDashboardController.getStatusCount);
router.get('/payment_status',taskDashboardController.getPaymentStatusCount);




module.exports = router 