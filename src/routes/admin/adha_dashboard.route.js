const express = require("express");
const router = express.Router();
const adhaDashboardController = require("../../controllers/admin/adha_dashboard.controller");
const checkAuth = require("../../middleware/check.auth");


router.get('/verification_status',adhaDashboardController.getVerificationStatusCount);
router.get('/payment_status',adhaDashboardController.getPaymentStatusCount);




module.exports = router 