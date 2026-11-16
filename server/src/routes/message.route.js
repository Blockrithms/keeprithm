const experss = require('express');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const messageValidation = require('../validations/message.validation');
const messageController = require('../controllers/message.controller');
const { ADMIN } = require('../config/roles');

const router = experss.Router();

router.route('/').get(auth(), validate(messageValidation.queryMessages), messageController.getMessages);
router.post('/backup', auth(ADMIN), messageController.fetchAndSaveMessages);
router.route('/search').get(auth(), validate(messageValidation.searchMessage), messageController.searchMessage);
router
  .route('/thread/:channelId/:threadTs')
  .get(auth(), validate(messageValidation.getThreadMessages), messageController.getThreadMessages);

router.get('/:messageId', auth(), validate(messageValidation.getMessage), messageController.getMessageById);

module.exports = router;
