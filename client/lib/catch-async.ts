const isNextControlFlowError = (error: unknown) => {
  if (!error || typeof error !== "object") return false;
  const digest = "digest" in error ? String(error.digest) : "";
  return (
    digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_NOT_FOUND")
  );
};

export const catchAsync = <T, A extends any[]>(
  fn: (...args: A) => Promise<T>
) => {
  return async (...args: A) => {
    return fn(...args).catch((error) => {
      // redirect()/notFound() must propagate for Next.js to handle them.
      if (isNextControlFlowError(error)) {
        throw error;
      }

      const errMsg = error.response?.data?.message;
      const isProdution = process.env.NODE_ENV === "production";
      throw new Error(isProdution ? "Something went wrong" : errMsg);
    });
  };
};
