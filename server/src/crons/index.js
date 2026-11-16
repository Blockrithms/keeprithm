const slackBackupCron = require('./slackBackup.cron');

const startCrons = () => {
  slackBackupCron();
};

module.exports = startCrons;
