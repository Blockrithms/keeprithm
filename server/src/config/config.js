const dotenv = require('dotenv');
const path = require('path');
const Joi = require('joi');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string().valid('production', 'development', 'test').required(),
    PORT: Joi.number().default(3000),
    MONGODB_URL: Joi.string().required().description('Mongo DB url'),
    JWT_SECRET: Joi.string().required().description('JWT secret key'),
    JWT_ACCESS_EXPIRATION_MINUTES: Joi.number().default(30).description('minutes after which access tokens expire'),
    JWT_REFRESH_EXPIRATION_DAYS: Joi.number().default(30).description('days after which refresh tokens expire'),
    JWT_RESET_PASSWORD_EXPIRATION_MINUTES: Joi.number()
      .default(10)
      .description('minutes after which reset password token expires'),
    JWT_VERIFY_EMAIL_EXPIRATION_MINUTES: Joi.number()
      .default(10)
      .description('minutes after which verify email token expires'),
    SMTP_HOST: Joi.string().description('server that will send the emails'),
    SMTP_PORT: Joi.number().description('port to connect to the email server'),
    SMTP_USERNAME: Joi.string().description('username for email server'),
    SMTP_PASSWORD: Joi.string().description('password for email server'),
    EMAIL_FROM: Joi.string().description('the from field in the emails sent by the app'),
    FRONTEND_URL: Joi.string().required().description('Frontend url is required!'),
    BACKEND_URL: Joi.string().description('Backend url is required!'),
    SLACK_CLIENT_ID: Joi.string().required(),
    SLACK_CLIENT_SECRET: Joi.string().required(),
    SLACK_OAUTH_AUTHORIZE_URL: Joi.string().required(),
    SLACK_OAUTH_TOKEN_EXCHANGE_URL: Joi.string().required(),
    SLACK_OAUTH_TOKEN_VALIDATION_URL: Joi.string().required(),
    SLACK_OPENID_AUTHORIZE_URL: Joi.string().required(),
    SLACK_OPENID_TOKEN_EXCHANGE_URL: Joi.string().required(),
    SLACK_OPENID_USER_INFO_URL: Joi.string().required(),
    SLACK_USER_LIST_URL: Joi.string().required(),
    SLACK_USER_INFO_URL: Joi.string().required(),
    SLACK_CHANNEL_INFO_URL: Joi.string().required(),
    SLACK_CHANNEL_MEMBERS_URL: Joi.string().required(),
    SLACK_CHANNEL_LIST_URL: Joi.string().required(),
    SLACK_CHANNEL_HISTORY_URL: Joi.string().required(),
    SLACK_CHANNEL_REPLIES_URL: Joi.string().required(),
    SLACK_WORKSPACE_INFO_URL: Joi.string().required(),
    SLACK_CHAT_POST_MESSAGE_URL: Joi.string().required(),
    SLACK_BACKUP_CRON_JOB_PATTERN: Joi.string().required(),
    SLACK_SIGNING_SECRET: Joi.string().required(),
    CLOUDINARY_CLOUD_NAME: Joi.string().required(),
    CLOUDINARY_API_KEY: Joi.string().required(),
    CLOUDINARY_API_SECRET: Joi.string().required(),
    ENCRYPTION_KEY: Joi.string()
      .pattern(/^[0-9a-fA-F]{64}$/)
      .required()
      .description('64-char hex (256-bit) master encryption key'),
    SLACK_ALLOWED_TEAM_IDS: Joi.string()
      .allow('')
      .optional()
      .description('Optional comma-separated allowlist of Slack workspace IDs'),
  })
  .unknown();

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

module.exports = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  mongoose: {
    url: envVars.MONGODB_URL,
  },
  jwt: {
    secret: envVars.JWT_SECRET,
    accessExpirationMinutes: envVars.JWT_ACCESS_EXPIRATION_MINUTES,
    refreshExpirationDays: envVars.JWT_REFRESH_EXPIRATION_DAYS,
    verifyEmailExpirationMinutes: envVars.JWT_VERIFY_EMAIL_EXPIRATION_MINUTES,
  },
  email: {
    smtp: {
      host: envVars.SMTP_HOST,
      port: envVars.SMTP_PORT,
      auth: {
        user: envVars.SMTP_USERNAME,
        pass: envVars.SMTP_PASSWORD,
      },
    },
    from: envVars.EMAIL_FROM,
  },
  frontend: {
    url: envVars.FRONTEND_URL,
  },
  backend: {
    url: envVars.BACKEND_URL,
  },
  slack: {
    clientId: envVars.SLACK_CLIENT_ID,
    clientSecret: envVars.SLACK_CLIENT_SECRET,
    signingSecret: envVars.SLACK_SIGNING_SECRET,
    allowedTeamIds: envVars.SLACK_ALLOWED_TEAM_IDS
      ? envVars.SLACK_ALLOWED_TEAM_IDS.split(',')
          .map((id) => id.trim())
          .filter(Boolean)
      : [],
    oauth: {
      authUrl: envVars.SLACK_OAUTH_AUTHORIZE_URL,
      exchangeTokenUrl: envVars.SLACK_OAUTH_TOKEN_EXCHANGE_URL,
      tokenValidationUrl: envVars.SLACK_OAUTH_TOKEN_VALIDATION_URL,
    },
    openid: {
      authUrl: envVars.SLACK_OPENID_AUTHORIZE_URL,
      exchangeTokenUrl: envVars.SLACK_OPENID_TOKEN_EXCHANGE_URL,
      userInfoUrl: envVars.SLACK_OPENID_USER_INFO_URL,
    },
    api: {
      userInfoUrl: envVars.SLACK_USER_INFO_URL,
      userListUrl: envVars.SLACK_USER_LIST_URL,
      workspaceInfoUrl: envVars.SLACK_WORKSPACE_INFO_URL,
      channelInfoUrl: envVars.SLACK_CHANNEL_INFO_URL,
      channelListUrl: envVars.SLACK_CHANNEL_LIST_URL,
      channelHistoryUrl: envVars.SLACK_CHANNEL_HISTORY_URL,
      channelRepliesUrl: envVars.SLACK_CHANNEL_REPLIES_URL,
      channelMembersUrl: envVars.SLACK_CHANNEL_MEMBERS_URL,
      chatPostMessageUrl: envVars.SLACK_CHAT_POST_MESSAGE_URL,
    },
  },
  cron: {
    slackBackup: envVars.SLACK_BACKUP_CRON_JOB_PATTERN,
  },
  cloudinary: {
    cloudName: envVars.CLOUDINARY_CLOUD_NAME,
    apiKey: envVars.CLOUDINARY_API_KEY,
    apiSecret: envVars.CLOUDINARY_API_SECRET,
  },
  encryption: {
    masterKeyHex: envVars.ENCRYPTION_KEY,
  },
};
