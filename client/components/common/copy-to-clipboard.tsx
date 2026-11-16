"use client";
import { useState } from "react";
import { Check, Clipboard } from "lucide-react";
import { cn } from "~/lib/utils";
import { Hint } from "./hint";

interface CopyButtonProps {
  text: string;
  className?: string;
}

export const CopyToClipboard = ({ text, className }: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Hint label="Copy">
      <button
        onClick={handleCopy}
        className={cn(
          "absolute top-2 right-2 z-10 flex items-center gap-1 px-1 py-1 text-xs rounded bg-primary hover:bg-primary/80 text-primary-foreground transition-all duration-300 cursor-pointer",
          className
        )}
      >
        {copied ? <Check size={14} /> : <Clipboard size={14} />}
      </button>
    </Hint>
  );
};
