const express = require("express");
const router = express.Router();
const serviceController = require("../../controllers/admin/services.controller");
const checkAuth = require("../../middleware/check.auth");

router.post('/',checkAuth,serviceController.addService);
router.get('/',checkAuth,serviceController.getServices);
router.get('/:id',checkAuth,serviceController.getService);
router.put('/:id',checkAuth,serviceController.updateService);


module.exports = router 
