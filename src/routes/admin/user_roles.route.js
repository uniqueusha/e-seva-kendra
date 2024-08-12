const express = require("express");
const router = express.Router();
const userRoleController = require("../../controllers/admin/user_roles.controller");
const checkAuth = require("../../middleware/check.auth");

router.post('/',checkAuth,userRoleController.addUserRole);
router.get('/',checkAuth,userRoleController.getUserRoles);
router.get('/:id',checkAuth,userRoleController.getUserRole);
router.put('/:id',checkAuth,userRoleController.updateUserRole);


module.exports = router 