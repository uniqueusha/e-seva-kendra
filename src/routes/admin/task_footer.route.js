const express = require("express");
const router = express.Router();
const taskFooterController = require("../../controllers/admin/task_footer.controller");
const checkAuth = require("../../middleware/check.auth");

router.post('/',checkAuth,taskFooterController.addtaskFooter);
router.get('/',checkAuth,taskFooterController.getTaskFooters);
router.put('/:id',checkAuth,taskFooterController.updatetaskFooter);

module.exports = router 