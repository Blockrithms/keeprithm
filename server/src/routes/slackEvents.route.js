const express = require('express');
const slackEventsController = require('../controllers/slackEvents.controller');
const verifySlackSignature = require('../middlewares/verifySlackSignature');

const router = express.Router();

router.post('/', verifySlackSignature, slackEventsController.handleSlackEevents);

module.exports = router;
