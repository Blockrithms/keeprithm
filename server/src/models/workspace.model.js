const mongoose = require('mongoose');
const { toJSON } = require('./plugins');
const { encryptString, decryptString } = require('../utils/crypto');

const workspaceSchema = new mongoose.Schema(
  {
    slackId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    owner: {
      type: String,
      required: true,
    },
    botToken: {
      type: String,
      required: true,
      private: true,
      set: encryptString,
      get: decryptString,
    },
    slackBotId: {
      type: String,
      required: true,
    },
    plan: {
      type: String,
      default: 'basic',
    },
    avatar: {
      type: String,
    },
    notificationChannelId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

workspaceSchema.plugin(toJSON);
const Workspace = mongoose.model('Workspace', workspaceSchema);
module.exports = Workspace;
