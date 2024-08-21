const express = require("express");
const router = express.Router();
const documenttypeController = require("../../controllers/admin/document.type.controller");
const checkAuth = require("../../middleware/check.auth");

router.post('/',checkAuth,documenttypeController.addDocumentType);
router.get('/',checkAuth,documenttypeController.getDocumentTypes);
router.get('/wma',documenttypeController.getDocumentTypeWma);
router.get('/:id',checkAuth,documenttypeController.getDocumentType);
router.put('/:id',checkAuth,documenttypeController.updateDocumentType);
router.patch('/:id',checkAuth,documenttypeController.onStatusChange);

module.exports = router 
