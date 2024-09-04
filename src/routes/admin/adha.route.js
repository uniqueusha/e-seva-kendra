
const express = require("express");
const router = express.Router();
const adhaController = require("../../controllers/admin/adha.controller");
const checkAuth = require("../../middleware/check.auth");

router.post('/',checkAuth,adhaController.addAdha);
router.get('/',checkAuth,adhaController.getAdhas);
router.get('/report',checkAuth,adhaController.getAdhasReport);
router.get('/:id',checkAuth,adhaController.getAdha);
router.put('/:id',checkAuth,adhaController.updateAdha);
router.patch('/:id',adhaController.verificationStatusChange)


module.exports = router

