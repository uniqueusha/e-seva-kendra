const express = require("express");
const router = express.Router();
const statusController = require("../../controllers/admin/status.controller");
const checkAuth = require("../../middleware/check.auth");

router.post('/',checkAuth,statusController.addStatus);
router.get('/',checkAuth,statusController.getStatus);
router.get('/wma',statusController.getStatusWma);
router.get('/:id',checkAuth,statusController.getStatusById);
router.put('/:id',checkAuth,statusController.updateStatus);
router.patch('/:id',checkAuth,statusController.onStatusChange);


module.exports = router 