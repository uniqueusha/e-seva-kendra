const express = require("express");
const router = express.Router();
const documenttypeController = require("../../controllers/admin/document.type.controller");
const checkAuth = require("../../middleware/check.auth");

router.post('/',checkAuth,documenttypeController.addDocumentType);
router.get('/',checkAuth,documenttypeController.getDocumentTypes);
router.get('/:id',checkAuth,documenttypeController.getDocumentType);
router.put('/:id',checkAuth,documenttypeController.updateDocumentType);

module.exports = router 
