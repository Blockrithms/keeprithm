const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

const { Schema } = mongoose;
const channelSchema = new Schema({
  slackId: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  slackWorkspaceId: {
    type: String,
    required: true,
  },
  members: {
    type: [String],
    required: true,
  },
  isPrivate: {
    type: Boolean,
  },
  isBotAdded: {
    type: Boolean,
    required: true,
  },
  lastBackupTs: {
    type: String,
  },
});

channelSchema.plugin(toJSON);
const Channel = mongoose.model('Channel', channelSchema);
module.exports = Channel;
