const express = require("express");
const router = express.Router();
const adhaController = require("../../controllers/admin/adha.controller");
const checkAuth = require("../../middleware/check.auth");

router.post('/',checkAuth,adhaController.addAdha);

router.get('/',checkAuth,adhaController.getAdhasReport);
router.get('/',checkAuth,adhaController.getAdhas);
router.get('/:id',checkAuth,adhaController.getAdha);
router.put('/:id',checkAuth,adhaController.updateAdha);


module.exports = router 
