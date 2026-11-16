const mongoose = require('mongoose');
const { toJSON } = require('./plugins');
const { encryptString, decryptString, encryptJson, decryptJson } = require('../utils/crypto');

const messageSchema = new mongoose.Schema(
  {
    body: {
      type: String,
      default: '',
      set: encryptString,
      get: decryptString,
    },
    searchTokens: {
      type: [String],
      default: [],
      index: true,
      private: true,
    },
    sender: {
      name: { type: String, required: true, set: encryptString, get: decryptString },
      slackId: { type: String, required: true },
      avatar: { type: String, default: null },
    },
    slackWorkspaceId: {
      type: String,
      required: true,
      index: true,
    },
    slackChannelId: {
      type: String,
      required: true,
    },
    ts: {
      type: String,
      required: true,
    },
    threadTs: {
      type: String,
    },
    replyCount: {
      type: Number,
    },
    replyUsersCount: {
      type: Number,
    },
    latestReplyTs: {
      type: String,
    },
    replyUsers: {
      type: [String],
    },
    mentions: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
      set: (val) => (val === null || val === undefined ? null : encryptJson(val)),
      get: (val) => decryptJson(val, null),
    },
    files: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
      set: encryptJson,
      get: (val) => decryptJson(val, []),
    },
    reactions: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
      set: encryptJson,
      get: (val) => decryptJson(val, []),
    },
  },
  {
    toObject: { getters: true },
  }
);

messageSchema.index({ slackChannelId: 1, ts: -1 });

messageSchema.plugin(toJSON);
const Message = mongoose.model('Message', messageSchema);
module.exports = Message;
