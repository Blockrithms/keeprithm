const express = require('express');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const channelController = require('../controllers/channel.controller');
const channelVlidation = require('../validations/channel.validation');

const router = express.Router();
router.route('/').post(auth(), channelController.refreshChannels);
router.route('/:channelId').get(auth(), validate(channelVlidation.getChannel), channelController.getChannel);

module.exports = router;
