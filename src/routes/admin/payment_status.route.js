const express = require("express");
const router = express.Router();
const paymentStatusController = require("../../controllers/admin/payment_status_controller");
const checkAuth = require("../../middleware/check.auth");

router.post('/',paymentStatusController.addPaymentStatus);
router.get('/',paymentStatusController.getPaymentStatus);
router.get('/wma',paymentStatusController.getStatusWma);
router.get('/:id',paymentStatusController.getPeymentStatusById);
router.put('/:id',paymentStatusController.updatePaymentStatus);
router.patch('/:id',paymentStatusController.onStatusChange);


module.exports = router 