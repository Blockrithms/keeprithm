export const formFields: {
  id: string;
  name: string;
  label: string;
  placeholder: string;
  type?: string;
  component?: "input" | "textarea";
}[] = [
  {
    id: "name",
    name: "name",
    label: "Name",
    placeholder: "Your name",
  },
  {
    id: "email",
    name: "email",
    label: "Email",
    placeholder: "your.email@company.com",
    type: "email",
  },
  {
    id: "company",
    name: "company",
    label: "Company",
    placeholder: "Your company name",
  },
  {
    id: "message",
    name: "message",
    label: "Message",
    placeholder:
      "Tell us about your infrastructure and how many Slack workspaces you'd like to archive",
    component: "textarea",
  },
];

export const headerData = {
  title: "Request a Deployment",
  introText:
    "Keeprithm is sold as a self-hosted solution. Tell us about your environment and we'll deploy it on your infrastructure.",
  details: [
    "Your Slack history stays in your database, encrypted, inside your compliance boundary — we never host your conversations.",
    "Share a bit about your cloud or on-prem setup, team size, and workspaces. We'll follow up with a deployment plan and quote tailored to your needs.",
  ],
};

export const contactOptions = {
  email: "info@blockrithms.com",
  phone: "+92-347-709-9404",
};
