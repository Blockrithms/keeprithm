/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/**
 * Encrypt plaintext that was stored before field encryption.
 *
 * Covers the fields the models decrypt on read:
 *   workspaces.botToken
 *   users.slackAccessToken
 *   messages / threads: body, sender.name, mentions, files, reactions
 *   messages.searchTokens (rebuilt from the plaintext body when missing)
 *
 * Passwords stay bcrypt hashes. Names, emails, and Slack ids stay plaintext.
 * Already-encrypted values are left alone, so the script can be run again.
 *
 *   yarn migrate:encrypt:dry
 *   yarn migrate:encrypt
 *
 * Run this with the production ENCRYPTION_KEY, while a backup is not writing.
 */
const crypto = require('crypto');
const mongoose = require('mongoose');
const config = require('../src/config/config');
const { User, Workspace, Message, Thread } = require('../src/models');
const {
  isEncrypted,
  encryptString,
  encryptJson,
  decryptString,
  decryptJson,
  buildSearchIndex,
} = require('../src/utils/crypto');

const BATCH_SIZE = 200;
const apply = process.argv.includes('--apply') && !process.argv.includes('--dry-run');

const sealString = (plain) => {
  const sealed = encryptString(String(plain));
  if (decryptString(sealed) !== String(plain)) {
    throw new Error('String round-trip failed');
  }
  return sealed;
};

const sealJson = (value) => {
  const sealed = encryptJson(value);
  const opened = decryptJson(sealed, value);
  if (JSON.stringify(opened) !== JSON.stringify(value)) {
    throw new Error('JSON round-trip failed');
  }
  return sealed;
};

const readPath = (doc, field) => field.split('.').reduce((value, key) => (value == null ? value : value[key]), doc);

async function assertKeyOpensExistingCiphertext(collection, field, label) {
  const query = { [field]: { $type: 'string', $regex: '^enc:v1:' } };
  const doc = await collection.findOne(query, { projection: { [field]: 1 } });
  if (!doc) {
    console.log(`${label}: no ciphertext yet`);
    return;
  }

  decryptString(readPath(doc, field));
  console.log(`${label}: existing ciphertext opens with this key`);
}

async function flush(collection, batch) {
  if (!batch.length || !apply) return 0;
  const result = await collection.bulkWrite(batch, { ordered: false });
  return result.modifiedCount || 0;
}

async function migrateTokenField(model, field, label) {
  const { collection } = model;
  const docs = await collection.find({ [field]: { $exists: true, $nin: [null, ''] } }).toArray();
  const batch = [];
  let queued = 0;
  let failed = 0;

  for (const doc of docs) {
    const raw = doc[field];
    if (typeof raw === 'string' && !isEncrypted(raw)) {
      try {
        batch.push({
          updateOne: {
            filter: { _id: doc._id, [field]: raw },
            update: { $set: { [field]: sealString(raw) } },
          },
        });
        queued += 1;
      } catch (error) {
        failed += 1;
        console.error(`${label} ${doc._id} skipped: ${error.message}`);
      }
    }
  }

  const written = apply ? await flush(collection, batch) : 0;
  console.log(
    `${label} with ${field}: ${docs.length}, ${apply ? 'encrypted' : 'would encrypt'}: ${
      apply ? written : queued
    }, failed: ${failed}`
  );
  return failed;
}

function planMessage(doc, withSearchIndex) {
  const patch = {};
  const filter = { _id: doc._id };

  if (typeof doc.body === 'string' && !isEncrypted(doc.body)) {
    patch.body = sealString(doc.body);
    filter.body = doc.body;
  }

  const plainBody = typeof doc.body === 'string' && isEncrypted(doc.body) ? decryptString(doc.body) : String(doc.body || '');
  if (withSearchIndex && plainBody && (!Array.isArray(doc.searchTokens) || doc.searchTokens.length === 0)) {
    patch.searchTokens = buildSearchIndex(plainBody);
    filter.body = doc.body === undefined ? { $exists: false } : doc.body;
  }

  if (doc.sender && typeof doc.sender === 'object' && typeof doc.sender.name === 'string' && !isEncrypted(doc.sender.name)) {
    patch['sender.name'] = sealString(doc.sender.name);
    filter['sender.name'] = doc.sender.name;
  }

  ['mentions', 'files', 'reactions'].forEach((field) => {
    const raw = doc[field];
    if (raw === undefined || raw === null) return;
    if (typeof raw === 'string' && isEncrypted(raw)) return;

    let value = raw;
    if (typeof raw === 'string') {
      try {
        value = JSON.parse(raw);
      } catch {
        throw new Error(`${field} is a string that is not ciphertext or JSON`);
      }
    }
    patch[field] = sealJson(value);
    filter[field] = raw;
  });

  if (Object.keys(patch).length === 0) return null;
  return { updateOne: { filter, update: { $set: patch } } };
}

async function migrateMessages(model, label, withSearchIndex) {
  const { collection } = model;
  const cursor = collection.find({}).batchSize(BATCH_SIZE);
  let batch = [];
  let scanned = 0;
  let queued = 0;
  let written = 0;
  let failed = 0;

  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    scanned += 1;

    try {
      const op = planMessage(doc, withSearchIndex);
      if (op) {
        batch.push(op);
        queued += 1;
      }
    } catch (error) {
      failed += 1;
      console.error(`${label} ${doc._id} skipped: ${error.message}`);
    }

    if (batch.length >= BATCH_SIZE) {
      written += await flush(collection, batch);
      batch = [];
      console.log(`${label} progress: scanned ${scanned}`);
    }
  }

  written += await flush(collection, batch);
  console.log(
    `${label} checked: ${scanned}, ${apply ? 'encrypted' : 'would encrypt'}: ${apply ? written : queued}, failed: ${failed}`
  );
  return failed;
}

async function verifyModelRead(model, storedField, label) {
  const doc = await model.findOne({ [storedField]: /^enc:v1:/ });
  if (!doc) {
    console.log(`${label}: nothing encrypted to verify`);
    return;
  }

  const opened = readPath(doc, storedField);
  if (typeof opened !== 'string' || isEncrypted(opened)) {
    throw new Error(`${label} did not decrypt through the model`);
  }
  console.log(`${label}: model getter decrypts stored ciphertext`);
}

async function run() {
  let failed = 0;

  try {
    await mongoose.connect(config.mongoose.url);
    const fingerprint = crypto.createHash('sha256').update(config.encryption.masterKeyHex).digest('hex').slice(0, 12);
    console.log(apply ? 'Applying encryption.' : 'Dry run. Nothing will be written. Pass --apply to write.');
    console.log(`ENCRYPTION_KEY fingerprint ${fingerprint}`);

    await assertKeyOpensExistingCiphertext(Workspace.collection, 'botToken', 'Workspaces');
    await assertKeyOpensExistingCiphertext(User.collection, 'slackAccessToken', 'Users');
    await assertKeyOpensExistingCiphertext(Message.collection, 'body', 'Messages');
    await assertKeyOpensExistingCiphertext(Thread.collection, 'body', 'Thread replies');

    failed += await migrateTokenField(Workspace, 'botToken', 'Workspaces');
    failed += await migrateTokenField(User, 'slackAccessToken', 'Users');
    failed += await migrateMessages(Message, 'Messages', true);
    failed += await migrateMessages(Thread, 'Thread replies', false);

    if (apply) {
      await verifyModelRead(Workspace, 'botToken', 'Workspaces');
      await verifyModelRead(User, 'slackAccessToken', 'Users');
      await verifyModelRead(Message, 'body', 'Messages');
      await verifyModelRead(Thread, 'body', 'Thread replies');
    }

    if (failed > 0) {
      throw new Error(`${failed} document(s) could not be encrypted`);
    }

    console.log(apply ? 'Encryption migration complete.' : 'Dry run complete.');
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

run();
