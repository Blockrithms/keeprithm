const cron = require('node-cron');
const config = require('../config/config');
const logger = require('../config/logger');
const { beginBackup } = require('../services/message.service');

const slackBackupCron = () => {
  cron.schedule(config.cron.slackBackup, () => {
    try {
      beginBackup();
    } catch (error) {
      logger.error('Scheduled backup did not start: %s', error.message);
    }
  });
  logger.info(`✅ Slack Backup cron scheduled: ${config.cron.slackBackup}`);
};

module.exports = slackBackupCron;
