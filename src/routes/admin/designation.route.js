const express = require("express");
const router = express.Router();
const designationController = require("../../controllers/admin/designation.controller");
const checkAuth = require("../../middleware/check.auth");

router.post('/',checkAuth,designationController.addDesignation);
router.get('/',checkAuth,designationController.getDesignations);
router.get('/wma',checkAuth,designationController.getDesignationWma);
router.get('/:id',checkAuth,designationController.getDesignation);
router.put('/:id',checkAuth,designationController.updateDesignation);
router.patch('/:id',checkAuth,designationController.onStatusChange);

module.exports = router 