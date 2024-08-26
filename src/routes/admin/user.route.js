const express = require("express");
const router = express.Router();
const userController = require("../../controllers/admin/user.controller");
const checkAuth = require("../../middleware/check.auth");

router.post('/',userController.addUser);
router.get('/',userController.getUsers);
router.post('/login',userController.userLogin);
router.get('/wma',userController.getUserWma);
router.get('/employee',userController.getUserEmployee);
router.get('/:id',userController.getUser);
router.put('/:id',userController.updateUser);
router.patch('/:id',userController.onStatusChange);

module.exports = router 