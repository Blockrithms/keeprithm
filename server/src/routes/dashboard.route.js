const express = require('express');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const dashboardValidation = require('../validations/dashboard.validation');
const dashboardController = require('../controllers/dashboard.controller');
const { ADMIN } = require('../config/roles');

const router = express.Router();

router.get('/overview', auth(ADMIN), dashboardController.getOverview);
router.get('/workspaces', auth(ADMIN), dashboardController.getWorkspaces);
router.post('/backups', auth(ADMIN), validate(dashboardValidation.startJob), dashboardController.startBackup);
router.post('/sync', auth(ADMIN), validate(dashboardValidation.startJob), dashboardController.startSync);
router.get('/users', auth(ADMIN), validate(dashboardValidation.getUsers), dashboardController.getUsers);
router.patch(
  '/users/:userId',
  auth(ADMIN),
  validate(dashboardValidation.setUserBlocked),
  dashboardController.setUserBlocked
);

module.exports = router;
