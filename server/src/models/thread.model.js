const mongoose = require('mongoose');
const { toJSON } = require('./plugins');
const { encryptString, decryptString, encryptJson, decryptJson } = require('../utils/crypto');

const threadSchema = new mongoose.Schema(
  {
    body: {
      type: String,
      default: '',
      set: encryptString,
      get: decryptString,
    },
    sender: {
      name: { type: String, required: true, set: encryptString, get: decryptString },
      slackId: { type: String, required: true },
      avatar: { type: String, default: null },
    },
    slackWorkspaceId: {
      type: String,
      required: true,
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
      index: true,
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

threadSchema.index({ slackChannelId: 1, threadTs: 1, ts: 1 });

threadSchema.plugin(toJSON);
const Thread = mongoose.model('Thread', threadSchema);

module.exports = Thread;
