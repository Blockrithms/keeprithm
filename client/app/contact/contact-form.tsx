"use client";

import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { Button, Input, Label } from "~/components/ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Textarea } from "~/components/ui/textarea";
import { formFields } from "./data";
import { LoadingSpinner } from "~/components/common";
import { toast } from "sonner";

// TODO: Implement bravo
export const ContactForm = () => {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const errors: Record<string, string> = {};
    if (!formData.name || formData.name.length < 2)
      errors.name = "Name is required";
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email))
      errors.email = "Invalid email address";
    if (!formData.company || formData.company.length < 2)
      errors.company = "Company name is required";
    if (!formData.message || formData.message.length < 10)
      errors.message = "Message should be more descriptive";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Message sent successfully!");
      setFormData({});
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <Card className="h-full">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Request Deployment</CardTitle>
            <CardDescription>
              Tell us about your infra — we&apos;ll follow up with a plan and
              quote.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {formFields.map(
              ({
                id,
                name,
                label,
                placeholder,
                type = "text",
                component = "input",
              }) => (
                <div key={id} className="space-y-2">
                  <Label htmlFor={id}>{label}</Label>
                  {component === "textarea" ? (
                    <Textarea
                      id={id}
                      name={name}
                      placeholder={placeholder}
                      className="min-h-30"
                      value={formData[name] || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          [name]: e.target.value,
                        }))
                      }
                    />
                  ) : (
                    <Input
                      id={id}
                      name={name}
                      type={type}
                      placeholder={placeholder}
                      value={formData[name] || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          [name]: e.target.value,
                        }))
                      }
                    />
                  )}
                  {fieldErrors[name] && (
                    <p className="text-sm text-destructive">
                      {fieldErrors[name]}
                    </p>
                  )}
                </div>
              )
            )}
          </CardContent>
          <CardFooter>
            <Button className="w-full gap-2" disabled={isSubmitting}>
              {isSubmitting ? (
                <LoadingSpinner />
              ) : (
                <>
                  Request Deployment
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
