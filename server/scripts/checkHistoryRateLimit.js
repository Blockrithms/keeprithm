/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */
/**
 * See how Slack answers conversations.history for this installation.
 *
 * Prints the HTTP status, Slack error, and any rate-limit headers.
 * Message text is not printed.
 *
 *   yarn debug:history-limit
 *   yarn debug:history-limit -- --workspace T123 --channel C123
 *   yarn debug:history-limit -- --burst 10
 *
 * --burst sends extra limit=1 requests at the same channel and stops on the
 * first 429. That uses the workspace's history budget, so skip it during a backup.
 * Slack documents conversations.history as Tier 3 (about 50 requests per minute).
 * The headers below are what this workspace actually receives.
 */
const { default: axios } = require('axios');
const mongoose = require('mongoose');
const config = require('../src/config/config');
const Workspace = require('../src/models/workspace.model');
const Channel = require('../src/models/channel.model');

const MAX_BURST = 100;

const readArg = (name) => {
  const index = process.argv.indexOf(name);
  if (index === -1 || !process.argv[index + 1] || process.argv[index + 1].startsWith('--')) return null;
  return process.argv[index + 1];
};

const rateHeaders = (headers) => Object.entries(headers || {}).filter(([name]) => /rate|retry|limit/i.test(name));

const callHistory = async (token, channelId) => {
  const url = new URL(config.slack.api.channelHistoryUrl);
  url.searchParams.set('channel', channelId);
  url.searchParams.set('limit', '1');

  const response = await axios.get(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    validateStatus: () => true,
    timeout: 20000,
  });

  const data = response.data && typeof response.data === 'object' ? response.data : {};
  return {
    status: response.status,
    ok: data.ok === true,
    error: data.error || null,
    messageCount: Array.isArray(data.messages) ? data.messages.length : 0,
    headers: rateHeaders(response.headers),
    retryAfter: response.headers['retry-after'] || null,
  };
};

const printResult = (label, result) => {
  console.log(
    `${label} HTTP ${result.status} ok=${result.ok} error=${result.error || '-'} messages=${
      result.messageCount
    } retry-after=${result.retryAfter || '-'}`
  );
  if (result.headers.length === 0) {
    console.log('  rate-limit headers: none');
    return;
  }
  result.headers.forEach(([name, value]) => {
    console.log(`  ${name}: ${value}`);
  });
};

async function resolveWorkspace(slackId) {
  if (slackId) {
    const workspace = await Workspace.findOne({ slackId });
    if (!workspace) throw new Error(`No workspace with slack id ${slackId}`);
    return workspace;
  }

  const workspaces = await Workspace.find().select('name slackId');
  if (workspaces.length === 1) return Workspace.findById(workspaces[0].id);
  if (workspaces.length === 0) throw new Error('No workspace is installed');

  console.log('Pass --workspace. Installed workspaces:');
  workspaces.forEach((workspace) => console.log(`  ${workspace.slackId}  ${workspace.name}`));
  process.exitCode = 1;
  return null;
}

async function resolveChannel(workspaceSlackId, channelId) {
  if (channelId) {
    const channel = await Channel.findOne({ slackId: channelId, slackWorkspaceId: workspaceSlackId });
    if (!channel) throw new Error(`Channel ${channelId} is not in this workspace`);
    return channel;
  }

  const channel = await Channel.findOne({ slackWorkspaceId: workspaceSlackId, isBotAdded: true }).sort({ name: 1 });
  if (!channel) throw new Error('The bot is not in any channel. Pass --channel.');
  return channel;
}

async function run() {
  if (process.argv.includes('--help')) {
    console.log(
      'Usage: yarn debug:history-limit -- [--workspace T...] [--channel C...] [--burst N]\n' +
        'One conversations.history call (limit 1). --burst N stops at the first 429 (max 30).'
    );
    return;
  }

  const burst = readArg('--burst');
  const burstCount = burst ? Math.min(Math.max(Number(burst) || 0, 0), MAX_BURST) : 0;

  try {
    await mongoose.connect(config.mongoose.url);
    const workspace = await resolveWorkspace(readArg('--workspace'));
    if (!workspace) return;

    const channel = await resolveChannel(workspace.slackId, readArg('--channel'));
    const token = workspace.botToken;
    if (!token) throw new Error('Workspace has no bot token');

    console.log(`Workspace ${workspace.name} (${workspace.slackId})`);
    console.log(`Channel ${channel.name} (${channel.slackId})`);
    console.log(`Endpoint ${config.slack.api.channelHistoryUrl}`);

    const first = await callHistory(token, channel.slackId);
    printResult('probe', first);

    if (burstCount > 1 && first.status !== 429 && first.error !== 'ratelimited') {
      console.log(`Bursting up to ${burstCount} requests. Stopping at the first 429.`);
      for (let attempt = 2; attempt <= burstCount; attempt += 1) {
        const result = await callHistory(token, channel.slackId);
        printResult(`#${attempt}`, result);
        if (result.status === 429 || result.error === 'ratelimited') {
          console.log(`Limited after ${attempt} requests. Retry-After=${result.retryAfter || 'not set'} seconds.`);
          break;
        }
        if (attempt === burstCount) {
          console.log(`No 429 in ${burstCount} requests.`);
        }
      }
    }
  } catch (error) {
    console.error('Rate-limit check failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

run();
