const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const dashboardService = require('../services/dashboard.service');

const getOverview = catchAsync(async (req, res) => {
  const overview = await dashboardService.getOverview();
  res.status(httpStatus.OK).send(overview);
});

const getWorkspaces = catchAsync(async (req, res) => {
  const workspaces = await dashboardService.getWorkspaces();
  res.status(httpStatus.OK).send(workspaces);
});

const startBackup = catchAsync(async (req, res) => {
  const job = await dashboardService.startBackup(req.body.workspaceSlackId);
  res.status(httpStatus.ACCEPTED).send({ message: 'Backup started', job });
});

const startSync = catchAsync(async (req, res) => {
  const job = await dashboardService.startSync(req.body.workspaceSlackId);
  res.status(httpStatus.ACCEPTED).send({ message: 'Channel sync started', job });
});

const getUsers = catchAsync(async (req, res) => {
  const users = await dashboardService.getUsers(req.query);
  res.status(httpStatus.OK).send(users);
});

const setUserBlocked = catchAsync(async (req, res) => {
  const user = await dashboardService.setUserBlocked(req.params.userId, req.body.isBlocked, req.user.id);
  res.status(httpStatus.OK).send(user);
});

module.exports = {
  getOverview,
  getWorkspaces,
  startBackup,
  startSync,
  getUsers,
  setUserBlocked,
};
