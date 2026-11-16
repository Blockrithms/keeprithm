interface FormErrorProps {
  errors?: Record<string, string[]>;
  field: string;
}

export function FormError({ errors, field }: FormErrorProps) {
  if (!errors?.[field]) return null;
  return <p className="text-destructive text-sm">{errors[field]?.[0]}</p>;
}
