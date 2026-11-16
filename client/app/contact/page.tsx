import { Building, Clock } from "lucide-react";
import { ContactForm } from "./contact-form";
import { Footer } from "./footer";
import { InfoCard } from "./info-card";
import { Header } from "./header";

export const metadata = {
  title: "Request Deployment - Keeprithm",
  description:
    "Request a self-hosted Keeprithm deployment on your infrastructure.",
};

export default function ContactPage() {
  const cardData = [
    {
      icon: <Clock className="h-5 w-5 text-primary" />,
      title: "Quoted per deployment",
      description:
        "Pricing depends on your setup and support needs — we quote each deployment individually.",
    },
    {
      icon: <Building className="h-5 w-5 text-primary" />,
      title: "Your infrastructure",
      description:
        "We deploy Keeprithm into your cloud or on-prem environment so archives never leave your boundary.",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12 md:py-24 md:max-h-screen">
      <div className="grid gap-12 md:grid-cols-2">
        <div className="space-y-6">
          <Header />
          <div className="grid gap-4 md:grid-cols-2">
            {cardData.map((card, index) => (
              <InfoCard
                key={index}
                icon={card.icon}
                title={card.title}
                description={card.description}
              />
            ))}
          </div>
        </div>
        <ContactForm />
      </div>
      <Footer />
    </div>
  );
}
