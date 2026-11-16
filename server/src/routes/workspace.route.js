const express = require('express');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const workspaceValidation = require('../validations/workspace.validation');
const workspaceController = require('../controllers/workspace.controller');

const router = express.Router();

router
  .route('/')
  .get(auth(), workspaceController.getUserWorkspace)
  .post(validate(workspaceValidation.registerWorkspace), workspaceController.registerWorkspace);

module.exports = router;
