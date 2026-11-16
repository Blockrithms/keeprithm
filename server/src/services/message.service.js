/* eslint-disable camelcase */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const httpStatus = require('http-status');
const User = require('../models/user.model');
const config = require('../config/config');
const logger = require('../config/logger');
const { Message, Thread } = require('../models');
const channelService = require('./channel.service');
const slackRequest = require('../utils/slackRequest');
const downloadAndSaveFile = require('../utils/downloadAndSaveFile');
const ApiError = require('../utils/ApiError');
const delay = require('../utils/delay');
const workspaceService = require('./workspace.service');
const { getOpsJob, startOpsJob, finishOpsJob } = require('./opsJob');
const { encryptString, encryptJson, buildSearchIndex, buildQueryTokens } = require('../utils/crypto');

const searchMessage = async ({ query, channelScope }) => {
  const tokens = buildQueryTokens(query);
  if (!tokens.length) {
    return [];
  }

  const filters = {
    slackChannelId: channelScope,
    searchTokens: { $all: tokens },
  };

  return Message.find(filters).select('body slackChannelId sender ts threadTs replyCount').sort({ ts: -1 }).limit(50);
};

const getMessageById = async (messageId) => {
  const message = await Message.findOne({ _id: messageId });

  if (!message) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Message not found');
  }

  return message;
};

const getWorkspaceMessage = async (filters) => {
  return Message.findOne(filters);
};

const queryMessages = async ({ channelId, cursor, limit, messageId }) => {
  const DEFAULT_BATCH_SIZE = 35;
  const batchSize = parseInt(limit, 10) || DEFAULT_BATCH_SIZE;

  if (messageId && !cursor) {
    const target = await Message.findById(messageId);
    if (target && target.slackChannelId === channelId) {
      const newerCount = Math.floor(batchSize / 2);
      const olderCount = batchSize - newerCount;

      const [newer, olderProbe] = await Promise.all([
        Message.find({ slackChannelId: channelId, ts: { $gt: target.ts } })
          .sort({ ts: 1 })
          .limit(newerCount),
        Message.find({ slackChannelId: channelId, ts: { $lte: target.ts } })
          .sort({ ts: -1 })
          .limit(olderCount + 1),
      ]);

      const hasMoreOlder = olderProbe.length > olderCount;
      const olderPage = hasMoreOlder ? olderProbe.slice(0, olderCount) : olderProbe;
      const results = [...newer.reverse(), ...olderPage];
      const nextCursor = hasMoreOlder ? olderPage[olderPage.length - 1].ts : null;

      return { results, nextCursor, totalResults: results.length };
    }
  }

  const query = { slackChannelId: channelId };

  if (cursor) {
    query.ts = { $lt: cursor };
  }

  const messages = await Message.find(query)
    .sort({ ts: -1 })
    .limit(batchSize + 1);
  const hasMore = messages.length > batchSize;
  const page = hasMore ? messages.slice(0, batchSize) : messages;
  const nextCursor = hasMore ? page[page.length - 1].ts : null;

  return { results: page, nextCursor, totalResults: page.length };
};

/**
 * Encrypt every message / reply document explicitly before `bulkWrite` so
 * nothing ever lands in MongoDB unencrypted (Mongoose `bulkWrite` does not
 * automatically run schema setters on nested subdocuments across all shapes).
 */
const encryptMessageRecord = (item, includeSearchIndex) => {
  const plainBody = item.body || '';
  const senderObj =
    item.sender && typeof item.sender === 'object'
      ? {
          ...item.sender,
          name: encryptString(item.sender.name || 'Anonymous'),
        }
      : {
          name: encryptString('Anonymous'),
          slackId: String(item.sender || 'unknown'),
          avatar: null,
        };

  return {
    ...item,
    body: encryptString(plainBody),
    ...(includeSearchIndex ? { searchTokens: buildSearchIndex(plainBody) } : {}),
    sender: senderObj,
    mentions: item.mentions ? encryptJson(item.mentions) : null,
    files: encryptJson(item.files || []),
    reactions: encryptJson(item.reactions || []),
  };
};

const saveData = async (data, collection) => {
  if (!data.length) return;

  const isMessageCollection = collection === Message;

  const bulkOps = data.map((item) => {
    const { ts, slackChannelId } = item;
    const encryptedItem = encryptMessageRecord(item, isMessageCollection);

    return {
      updateOne: {
        filter: { ts, slackChannelId },
        update: { $set: encryptedItem },
        upsert: true,
      },
    };
  });

  await collection.bulkWrite(bulkOps);
  logger.info(`Upserted ${data.length} docs.`);
};

const getThreadMessages = async (channelId, threadTs) => {
  const threadMessages = await Thread.find({ threadTs, slackChannelId: channelId }).sort({ ts: 1 });

  if (!threadMessages.length) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Thread messages not found');
  }

  return threadMessages;
};

const appendSenderDetails = async (processedMessages, botToken, workspaceId) => {
  const slackIds = [...new Set(processedMessages.flatMap((msg) => [msg.sender, ...(msg.mentions || [])]).filter(Boolean))];

  const userQuery = workspaceId ? { workspace: workspaceId, slackId: { $in: slackIds } } : { slackId: { $in: slackIds } };
  const usersFromDb = await User.find(userQuery);
  const userMap = new Map(usersFromDb.map((user) => [user.slackId, user]));

  const missingSlackIds = slackIds.filter((id) => !userMap.has(id));

  if (missingSlackIds.length) {
    const response = await slackRequest(`${config.slack.api.userListUrl}`, botToken);

    if (response?.members) {
      const slackUsers = response.members.map((userData) => {
        const { id, name, profile = {}, team_id, is_bot, deleted, is_email_confirmed } = userData;
        const email = profile.email ? profile.email.toLowerCase().trim() : undefined;
        return {
          slackId: id,
          name: profile.real_name || name || id,
          avatar: profile.image_192 || null,
          workspace: workspaceId || team_id,
          isBot: Boolean(is_bot),
          isDeleted: Boolean(deleted),
          isEmailVerified: Boolean(is_email_confirmed),
          ...(email ? { email } : {}),
        };
      });

      const newUsers = slackUsers.filter((user) => missingSlackIds.includes(user.slackId));

      newUsers.forEach((user) => userMap.set(user.slackId, user));

      if (newUsers.length) {
        await User.bulkWrite(
          newUsers.map((user) => ({
            updateOne: {
              filter: { slackId: user.slackId, workspace: user.workspace },
              update: { $setOnInsert: user },
              upsert: true,
            },
          }))
        );
      }
    }
  }

  return processedMessages.map((msg) => {
    const foundSender = userMap.get(msg.sender);
    const sender = foundSender
      ? {
          name: foundSender.name,
          slackId: foundSender.slackId,
          avatar: foundSender.avatar || null,
        }
      : { name: 'Anonymous', slackId: msg.sender || 'unknown', avatar: null };

    const mentionsList = Array.isArray(msg.mentions) ? msg.mentions : [];
    const mentionsMap = Object.fromEntries(mentionsList.map((userId) => [userId, userMap.get(userId)?.name || 'Anonymous']));

    return {
      ...msg,
      sender,
      mentions: Object.keys(mentionsMap).length > 0 ? mentionsMap : null,
    };
  });
};

const extractMentions = (message) => {
  const mentions = new Set();
  if (!message.blocks) return [];

  try {
    const processElement = (element) => {
      if (element.type === 'rich_text_section' && element.elements) {
        element?.elements.forEach((subElement) => {
          if (subElement.type === 'user' && subElement.user_id) {
            mentions.add(subElement.user_id);
          }
        });
      }
    };

    message.blocks.forEach((block) => {
      if (block.type === 'rich_text') {
        block?.elements.forEach((element) => {
          if (element.type === 'rich_text_list') {
            element?.elements.forEach(processElement);
          } else {
            processElement(element);
          }
        });
      }
    });

    return [...mentions];
  } catch {
    return [];
  }
};

const processFiles = async (filesArray, botToken) => {
  if (!filesArray || filesArray.length === 0) return [];

  const processed = await Promise.all(
    filesArray.map(async (file) => {
      try {
        const MAX_FILE_SIZE = 50 * 1024 * 1024;
        if (file.size > MAX_FILE_SIZE) {
          logger.warn(`Skipping large file: ${file.name} (${file.size} bytes)`);
          return null;
        }

        const flatFile = {
          slackId: file.id,
          name: file.name,
          mimetype: file.mimetype,
          filetype: file.filetype,
          size: file.size,
          urlPrivate: file.url_private,
          urlPrivateDownload: file.url_private_download,
          permalink: file.permalink,
          isPublic: file.is_public,
          created: file.created,
        };
        const cloudData = await downloadAndSaveFile(file.url_private, botToken, { folder: 'slack_backup' });

        if (cloudData) {
          flatFile.cloudUrl = cloudData.secure_url;
          flatFile.cloudKey = cloudData.public_id;
        }

        return flatFile;
      } catch (error) {
        logger.error(`File upload failed for ${file.name}`);
        return null;
      }
    })
  );

  return processed.filter(Boolean);
};

const fetchAndProcessReplies = async (message, channelId, workspaceId, botToken) => {
  try {
    const { channelRepliesUrl } = config.slack.api;
    const replyList = await slackRequest(`${channelRepliesUrl}?channel=${channelId}&ts=${message.ts}`, botToken);

    if (!replyList || !Array.isArray(replyList.messages)) {
      logger.warn(`No replyList or messages for channel ${channelId}, message ${message.ts}`);
      return;
    }

    const replies = await Promise.all(
      replyList.messages.map(async (reply) => {
        const files = await processFiles(reply.files, botToken);
        const mentions = extractMentions(reply);

        return {
          sender: reply.user,
          body: reply.text || '',
          ts: reply.ts,
          threadTs: reply.thread_ts,
          slackChannelId: channelId,
          slackWorkspaceId: workspaceId,
          reactions: reply.reactions || [],
          mentions,
          files,
        };
      })
    );

    const finalRepliesData = await appendSenderDetails(replies, botToken, workspaceId);
    await saveData(finalRepliesData, Thread);
    logger.info(`Inserted ${finalRepliesData.length} replies into the database.`);
  } catch (error) {
    logger.error(error);
  }
};

const processMessage = async (message, channelId, botToken, workspaceId, processReplies = true) => {
  const mentions = extractMentions(message);
  const files = await processFiles(message.files, botToken);

  if (processReplies && message.reply_count) {
    logger.info(`Processing replies for message: ${message.ts}`);
    await fetchAndProcessReplies(message, channelId, workspaceId, botToken);
  }

  return {
    body: message.text || '',
    sender: message.user,
    ts: message.ts,
    slackChannelId: channelId,
    slackWorkspaceId: workspaceId,
    threadTs: message.thread_ts || null,
    replyCount: message.reply_count || 0,
    replyUsersCount: message.reply_users_count || 0,
    replyUsers: message.reply_users || [],
    latestReplyTs: message.latest_reply || null,
    reactions: message.reactions || [],
    mentions,
    files,
  };
};

const fetchChannelMessages = async (channelId, botToken, lastBackupTs, limit = 200) => {
  const { channelHistoryUrl } = config.slack.api;
  const allMessages = [];
  let cursor = null;
  let hasMore = true;

  try {
    while (hasMore) {
      const url = `${channelHistoryUrl}?channel=${channelId}&limit=${limit}&oldest=${lastBackupTs}&inclusive=0${
        cursor ? `&cursor=${cursor}` : ''
      }`;

      const response = await slackRequest(url, botToken);
      if (!response) break;

      const messages = response.messages || [];
      allMessages.push(...messages);

      cursor = response.response_metadata?.next_cursor || null;
      hasMore = !!cursor;
    }

    if (allMessages.length) {
      await channelService.updateChannel(channelId, { lastBackupTs: allMessages[0].ts });
    }

    return allMessages;
  } catch (error) {
    logger.error(error);
    return [];
  }
};

const processChannelMessages = async (channel, botToken, workspaceId) => {
  try {
    const { slackId: channelId, lastBackupTs = 0 } = channel;

    logger.info(`Processing channel: ${channelId}`);

    const messages = await fetchChannelMessages(channelId, botToken, lastBackupTs);
    if (!messages.length) return logger.info(`No messages found in channel: ${channelId}`);

    logger.info(`Got ${messages.length} messages`);

    const processedMessages = await Promise.all(
      messages.map(async (msg) => {
        try {
          return await processMessage(msg, channelId, botToken, workspaceId);
        } catch (error) {
          logger.info(`Failed to process message: ${msg.ts}`);
          logger.error(error);
          return null;
        }
      })
    ).then((results) => results.filter(Boolean));

    logger.info(`Processed ${processedMessages.length} of channel: ${channelId}`);

    if (processedMessages.length) {
      const finalMessagesData = await appendSenderDetails(processedMessages, botToken, workspaceId);
      await saveData(finalMessagesData, Message);

      logger.info(`Saved ${processedMessages.length} messages from channel: ${channelId}`);

      return processedMessages;
    }

    return null;
  } catch (error) {
    logger.error(error);
    return null;
  }
};

const formatSlackBackupSummary = (workspaceName, details) => {
  if (!details || details.length === 0) {
    return `*${workspaceName}* — No messages were backed up.`;
  }

  let totalMessages = 0;
  let totalReplies = 0;
  let totalFiles = 0;

  const channelLines = details.map(({ channelName, messages }) => {
    const messageCount = messages.length;
    const replyCount = messages.reduce((acc, msg) => acc + (msg.replyCount || 0), 0);
    const fileCount = messages.reduce((acc, msg) => acc + (msg.files?.length || 0), 0);

    totalMessages += messageCount;
    totalReplies += replyCount;
    totalFiles += fileCount;

    return `• *${channelName}*: ${messageCount} messages, ${replyCount} replies, ${fileCount} files`;
  });

  return (
    `*Backup Completed for Workspace: ${workspaceName}*\n\n` +
    `*Overall Summary:*\n` +
    `• Total Messages: *${totalMessages}*\n` +
    `• Total Replies: *${totalReplies}*\n` +
    `• Total Files: *${totalFiles}*\n\n` +
    `*Per-Channel Breakdown:*\n${channelLines.join('\n')}`
  );
};

const backupWorkspaceMessages = async (workspaceSlackId) => {
  try {
    if (workspaceSlackId) {
      const workspace = await workspaceService.getWorkspaceBySlackId(workspaceSlackId);
      await channelService.syncWorkspaceChannels(workspace);
    } else {
      await channelService.syncAllWorkspacesChannels();
    }

    logger.info('Started backing up messages');

    const workspacesData = await channelService.getChannelsWithBot();
    const targets = workspaceSlackId
      ? workspacesData.filter((item) => item.workspace.slackId === workspaceSlackId)
      : workspacesData;

    for (const ws of targets) {
      const { workspace, channels } = ws;
      const { slackId, name, botToken } = workspace;

      logger.info(`Started backing up ${name}'s messages`);
      const backupDetails = [];

      for (const channel of channels) {
        const messages = await processChannelMessages(channel, botToken, slackId);

        if (messages && messages.length > 0) {
          backupDetails.push({
            channelName: channel.name,
            messages,
          });
        }

        await delay(2000);
      }

      if (workspace.notificationChannelId) {
        const summaryMessage = formatSlackBackupSummary(name, backupDetails);
        await channelService.sendBackupAcknowledgment(workspace.notificationChannelId, botToken, summaryMessage);
      }

      logger.info(`Finished backing up ${name}'s messages`);
      await delay(2000);
    }

    logger.info('Finished backing up messages');
  } catch (error) {
    logger.error(error);
  }
};

/**
 * Reject a second backup/sync, then archive in the background.
 * `workspaceSlackId` limits the run to one workspace.
 */
const beginBackup = (workspaceSlackId) => {
  const scope = workspaceSlackId ? `backup:${workspaceSlackId}` : 'backup:all';
  const started = startOpsJob(scope);

  setImmediate(() => {
    backupWorkspaceMessages(workspaceSlackId)
      .catch((error) => logger.error(error))
      .finally(() => finishOpsJob());
  });

  return started;
};

const updateEditedMessage = async (messageId, message, channelId, workspaceId, sender) => {
  const workspace = await workspaceService.getWorkspaceBySlackId(workspaceId);
  const newMessage = await processMessage(message, channelId, workspace.botToken, workspaceId, false);
  const [hydrated] = await appendSenderDetails([newMessage], workspace.botToken, workspaceId);

  const encryptedPayload = encryptMessageRecord(
    {
      ...hydrated,
      sender: sender || hydrated.sender,
    },
    true
  );

  await Message.findByIdAndUpdate(messageId, { $set: encryptedPayload });
};

module.exports = {
  searchMessage,
  getMessageById,
  getWorkspaceMessage,
  getThreadMessages,
  queryMessages,
  backupWorkspaceMessages,
  beginBackup,
  getBackupJob: getOpsJob,
  updateEditedMessage,
};
