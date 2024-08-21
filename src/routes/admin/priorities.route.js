const express = require("express");
const router = express.Router();
const prioritiesController = require("../../controllers/admin/priorities.controller");
const checkAuth = require("../../middleware/check.auth");

router.post('/',checkAuth,prioritiesController.addPrioritie);
router.get('/',checkAuth,prioritiesController.getPriorities);
router.get('/wma',prioritiesController.getPrioritiesWma);
router.get('/:id',checkAuth,prioritiesController.getpriority);
router.put('/:id',checkAuth,prioritiesController.updatePriority);
router.patch('/:id',checkAuth,prioritiesController.onStatusChange);


module.exports = router 