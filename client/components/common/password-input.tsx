"use client";
import { useState } from "react";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { FormError } from "~/components/common/form-error";

interface PasswordInputProps {
  name: string;
  label: string;
  errors?: Record<string, string[]>;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function PasswordInput({
  name,
  label,
  errors,
  value,
  onChange,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [internalValue, setInternalValue] = useState("");

  const currentValue = value !== undefined ? value : internalValue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(e);
    } else {
      setInternalValue(e.target.value);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          name={name}
          id={name}
          value={currentValue}
          onChange={handleChange}
          placeholder="********"
        />

        {currentValue && (
          <button
            type="button"
            className="absolute inset-y-0 right-3 flex items-center cursor-pointer"
            onClick={() => setShowPassword((prev) => !prev)}
          >
            {showPassword ? (
              <EyeOff size={18} className="text-gray-500" />
            ) : (
              <Eye size={18} className="text-gray-500" />
            )}
          </button>
        )}
      </div>
      <FormError errors={errors} field={name} />
    </div>
  );
}
