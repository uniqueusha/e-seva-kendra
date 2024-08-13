const express = require("express");
const router = express.Router();
const workDetailController = require("../../controllers/admin/work_details.controller");
const checkAuth = require("../../middleware/check.auth");

router.post('/',checkAuth,workDetailController.addWorkDetails);
router.get('/',checkAuth,workDetailController.getWorkDetails);
router.get('/wma',checkAuth,workDetailController.getWorkDetailsWma);
router.get('/:id',checkAuth,workDetailController.getWorkDetail);
router.put('/:id',checkAuth,workDetailController.updateWorkDetail);
router.patch('/:id',checkAuth,workDetailController.onStatusChange)



module.exports = router 