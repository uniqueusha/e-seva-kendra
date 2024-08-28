const express = require("express");
const router = express.Router();
const taskHeaderController = require("../../controllers/admin/task_header.controller");
const checkAuth = require("../../middleware/check.auth");

router.post('/',checkAuth,taskHeaderController.addTaskHeader);
router.get('/',checkAuth,taskHeaderController.getTaskHeaders);
router.get('/report',taskHeaderController.getReport);
router.get('/task_assigne',checkAuth,taskHeaderController.getTaskAssignedTo)
router.get('/:id',checkAuth,taskHeaderController.getTaskHeader);
router.put('/status:id',checkAuth,taskHeaderController.updateTaskStatusChange);
router.put('/:id',checkAuth,taskHeaderController.updateTaskheader);
router.delete('/:id',checkAuth,taskHeaderController.deleteTaskDocuments);
module.exports = router 