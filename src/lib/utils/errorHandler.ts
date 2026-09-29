export interface AppError {
  message: string;
  code?: string;
  status?: number;
  type: "network" | "database" | "auth" | "validation" | "unknown";
}

export function parseAppError(error: unknown): AppError {
  if (!error) {
    return {
      message: "An unexpected error occurred.",
      type: "unknown",
    };
  }

  if (typeof error === "string") {
    return {
      message: error,
      type: "unknown",
    };
  }

  if (typeof error === "object") {
    const err = error as Record<string, unknown>;

    // Supabase PostgrestError
    if (typeof err.message === "string" && typeof err.code === "string" && "details" in err) {
      return {
        message: err.message,
        code: err.code,
        status: typeof err.status === "number" ? err.status : undefined,
        type: "database",
      };
    }

    // Supabase AuthApiError
    if (typeof err.__isAuthError === "boolean" || (typeof err.name === "string" && err.name.includes("Auth"))) {
      return {
        message: typeof err.message === "string" ? err.message : "Authentication error.",
        code: typeof err.code === "string" ? err.code : undefined,
        status: typeof err.status === "number" ? err.status : undefined,
        type: "auth",
      };
    }

    // Network / Fetch error
    if (err.name === "TypeError" && typeof err.message === "string" && err.message.toLowerCase().includes("fetch")) {
      return {
        message: "Network connection error. Please check your internet connection.",
        type: "network",
      };
    }

    // Standard JavaScript Error
    if (typeof err.message === "string") {
      return {
        message: err.message,
        type: "unknown",
      };
    }
  }

  return {
    message: "An unexpected error occurred.",
    type: "unknown",
  };
}

export function getErrorMessage(error: unknown, fallback = "An unexpected error occurred."): string {
  const parsed = parseAppError(error);
  return parsed.message || fallback;
}
