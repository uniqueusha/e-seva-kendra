const express = require("express");
const router = express.Router();
const adhaController = require("../../controllers/admin/adha.controller");
const checkAuth = require("../../middleware/check.auth");

router.post('/',checkAuth,adhaController.addAdha);

module.exports = router 
