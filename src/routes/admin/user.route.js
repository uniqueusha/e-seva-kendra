const express = require("express");
const router = express.Router();
const userController = require("../../controllers/admin/user.controller");
const checkAuth = require("../../middleware/check.auth");

router.post('/',userController.addUser);
router.post('/check-emailid',userController.checkEmailId);
router.get('/',userController.getUsers);
router.post('/login',userController.userLogin);
router.get('/status',userController.getStatusWma);
router.get('/wma',userController.getUserWma);
router.get('/employee',userController.getUserEmployee);
router.get('/operator',userController.getOperatorList);
router.get('/:id',userController.getUser);
router.put('/change-password',userController.onPasswordChange);
router.put('/:id',userController.updateUser);
router.patch('/:id',userController.onStatusChange);

module.exports = router