const express = require('express');
const authRoute = require('./auth.route');
const userRoute = require('./user.route');
const workspaceRoute = require('./workspace.route');
const channelRoute = require('./channel.route');
const messageRoute = require('./message.route');
const slackEventsRoute = require('./slackEvents.route');
const dashboardRoute = require('./dashboard.route');

const router = express.Router();

const defaultRoutes = [
  {
    path: 'auth',
    route: authRoute,
  },

  {
    path: 'user',
    route: userRoute,
  },
  {
    path: 'workspace',
    route: workspaceRoute,
  },
  {
    path: 'channel',
    route: channelRoute,
  },
  {
    path: 'message',
    route: messageRoute,
  },
  {
    path: 'dashboard',
    route: dashboardRoute,
  },
  {
    path: 'slack-events',
    route: slackEventsRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(`/${route.path}`, route.route);
});

module.exports = router;
