const express = require("express");
const router = express.Router();
const rolesController = require("../../controllers/admin/roles.controller");
const checkAuth = require("../../middleware/check.auth");

router.post('/',checkAuth,rolesController.addRole);
router.get('/',checkAuth,rolesController.getRoles);
router.get('/wma',checkAuth,rolesController.getRoleWma);
router.get('/:id',checkAuth,rolesController.getRole);
router.put('/:id',checkAuth,rolesController.updateRole);
router.patch('/:id',checkAuth,rolesController.onStatusChange);


module.exports = router 
