import Link from "next/link";
import { Button } from "~/components/ui";
import { Mail, Phone } from "lucide-react";
import { contactOptions } from "./data";

export const Footer = () => {
  return (
    <div className="mt-16 mb-64 flex flex-col items-center justify-center space-y-4 text-center">
      <h2 className="text-2xl font-bold">Other Ways to Reach Us</h2>
      <div className="flex flex-wrap justify-center gap-4">
        <a
          href={`mailto:${contactOptions.email}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="outline" className="gap-2">
            <Mail className="h-4 w-4" />
            <span>{contactOptions.email}</span>
          </Button>
        </a>
        <a
          href={`tel:${contactOptions.phone}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="outline" className="gap-2">
            <Phone className="h-4 w-4" />
            <span>{contactOptions.phone}</span>
          </Button>
        </a>
      </div>
      <div className="mt-8">
        <Link href="/" className="text-primary hover:underline">
          Return to Home
        </Link>
      </div>
    </div>
  );
};
