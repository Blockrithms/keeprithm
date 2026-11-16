export type Person = {
  name: string;
  initials: string;
  tone: string;
};

export const people = {
  sara: { name: "Sara Okafor", initials: "SO", tone: "#d9b98a" },
  theo: { name: "Theo Park", initials: "TP", tone: "#a9b8a0" },
  mina: { name: "Mina Haddad", initials: "MH", tone: "#c9a2a0" },
  leo: { name: "Leo Brandt", initials: "LB", tone: "#a3afc0" },
  ana: { name: "Ana Ruiz", initials: "AR", tone: "#cdb4c9" },
  jonas: { name: "Jonas Weber", initials: "JW", tone: "#b7c4c0" },
} satisfies Record<string, Person>;

/** Slack Free: older than this is hidden. */
export const HIDDEN_AFTER = 90;
/** Slack Free: older than this is deleted. */
export const DELETED_AFTER = 365;

/** Slack Pro list price (USD / user / month, billed monthly). */
export const SLACK_PRO_MONTHLY = 8.75;
/** Slack Pro list price (USD / user / month, billed annually). */
export const SLACK_PRO_ANNUAL_MONTHLY = 7.25;

export const features = [
  {
    title: "Messages and every file type",
    description:
      "Back up threads, replies, reactions, and every attachment your team shares — images, PDFs, docs, audio, and video — then browse them in a reader that renders Slack the way you remember it.",
  },
  {
    title: "Persist deleted history",
    description:
      "Once Keeprithm has a copy, messages stay in your archive even after Slack hides them at day 90 or permanently deletes free-plan history after a year.",
  },
  {
    title: "Self-hosted on your infra",
    description:
      "We deploy Keeprithm into your cloud or on-prem environment. Your Slack history never leaves your security and compliance boundary.",
  },
  {
    title: "Your database, encrypted",
    description:
      "Archives live in your own database with encryption at rest. You hold the keys; we never host your conversations on our servers.",
  },
  {
    title: "Envelope encryption",
    description:
      "Sensitive payloads are wrapped with envelope encryption so data stays protected in storage without sacrificing searchable archives.",
  },
  {
    title: "One instance, many workspaces",
    description:
      "Connect multiple Slack workspaces to a single Keeprithm deployment. Configure channels and backup schedules per workspace.",
  },
];

export const costComparison = {
  headline: "Stop paying Slack per seat for history",
  subhead:
    "Slack Free hides messages after 90 days. Slack Pro unlocks history — at a per-member price that adds up fast. Keeprithm backs up what you already have, on your infra, for a fraction of that bill.",
  slackMonthly: SLACK_PRO_MONTHLY,
  slackAnnualMonthly: SLACK_PRO_ANNUAL_MONTHLY,
  exampleSeats: [10, 25, 50],
  keeprithmPitch:
    "One self-hosted deployment. No per-seat tax for keeping your own conversations.",
};

export const faqs = [
  {
    q: "Why does Slack hide our old messages?",
    a: "On the free plan, Slack only shows the most recent 90 days of messages and files. Since August 2024, it also permanently deletes free-plan history older than one year. Keeprithm keeps a complete copy before either happens.",
  },
  {
    q: "Can Keeprithm bring back messages Slack has already hidden?",
    a: "Keeprithm backs up everything Slack still makes available when you install it, which is usually the last 90 days, and every message after that. History that is already hidden can't be retrieved through Slack's API, so the best day to install is today.",
  },
  {
    q: "What exactly gets backed up?",
    a: "Messages, threads and replies, reactions, and every type of file shared in the channels you choose: images, PDFs, documents, audio and video. The Keeprithm reader renders all of it the way it looked in Slack.",
  },
  {
    q: "Do we need a paid Slack plan?",
    a: "No. Keeprithm is built for free workspaces. You install it as a Slack app. You don't need to upgrade, and you don't pay Slack per seat.",
  },
  {
    q: "Why is it self-hosted only?",
    a: "Your Slack history is some of the most sensitive data your company has. Instead of asking you to trust our servers, we deploy Keeprithm on yours, so the archive stays inside your own security and compliance boundary.",
  },
  {
    q: "How often does it back up?",
    a: "As often as you like. Choose hourly, nightly, weekly or any cron schedule, and Keeprithm runs incremental backups on that schedule. Each run only fetches what is new.",
  },
  {
    q: "How does deployment work, and what does it cost?",
    a: "Tell us about your infrastructure. We deploy Keeprithm into your cloud or on-prem environment with Docker, connect it to your workspace and hand over the keys. Pricing depends on your setup and support needs, so we quote each deployment individually.",
  },
];

export const CONTACT_EMAIL = "info@blockrithms.com";
