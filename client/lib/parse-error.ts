import { isAxiosError } from "axios";

export type ParsedError = {
  status?: number;
  message: string;
  raw?: unknown;
};

export function parseError(error: unknown): ParsedError {
  if (isAxiosError(error)) {
    return {
      status: error.response?.status,
      message:
        error.response?.data?.message || error.message || "Unknown Axios error",
      raw: error,
    };
  }

  if (error instanceof Error) {
    // Normal JS or server error
    const status = (error as any)?.status;
    return {
      status: typeof status === "number" ? status : undefined,
      message: error.message,
      raw: error,
    };
  }

  // Unknown or non-standard error
  return {
    status: 500,
    message: "Unexpected error occurred",
    raw: error,
  };
}
