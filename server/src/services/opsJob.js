const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');

const job = {
  running: false,
  startedAt: null,
  scope: null,
};

const getOpsJob = () => ({
  running: job.running,
  startedAt: job.startedAt,
  scope: job.scope,
});

const startOpsJob = (scope) => {
  if (job.running) {
    throw new ApiError(httpStatus.CONFLICT, 'A backup or sync is already running');
  }

  job.running = true;
  job.startedAt = new Date().toISOString();
  job.scope = scope;
  return getOpsJob();
};

const finishOpsJob = () => {
  job.running = false;
  job.startedAt = null;
  job.scope = null;
};

module.exports = {
  getOpsJob,
  startOpsJob,
  finishOpsJob,
};
