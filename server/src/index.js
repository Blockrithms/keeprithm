const mongoose = require('mongoose');
const app = require('./app');
const config = require('./config/config');
const logger = require('./config/logger');
const { User, Workspace, Message, Thread, Token } = require('./models');

let server;
mongoose.connect(config.mongoose.url).then(async () => {
  logger.info('Connected to MongoDB');

  try {
    await Promise.all([
      User.syncIndexes(),
      Workspace.syncIndexes(),
      Message.syncIndexes(),
      Thread.syncIndexes(),
      Token.syncIndexes(),
    ]);
    logger.info('Synchronized MongoDB indexes');
  } catch (indexError) {
    logger.error('Failed to sync MongoDB indexes: %o', indexError);
  }

  server = app.listen(config.port, () => {
    logger.info(`Listening to port ${config.port}`);
  });
});

const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  logger.error(error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  if (server) {
    server.close();
  }
});
