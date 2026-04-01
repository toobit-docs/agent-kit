export type ErrorType =
  | "ConfigError"
  | "AuthenticationError"
  | "RateLimitError"
  | "ValidationError"
  | "DeltaApiError"
  | "NetworkError"
  | "InternalError";

export interface ToolErrorPayload {
  error: true;
  type: ErrorType;
  code?: string;
  message: string;
  suggestion?: string;
  endpoint?: string;
  timestamp: string;
}

export class DeltaMcpError extends Error {
  public readonly type: ErrorType;
  public readonly code?: string;
  public readonly suggestion?: string;
  public readonly endpoint?: string;

  public constructor(
    type: ErrorType,
    message: string,
    options?: {
      code?: string;
      suggestion?: string;
      endpoint?: string;
      cause?: unknown;
    },
  ) {
    super(message, options?.cause ? { cause: options.cause } : undefined);
    this.name = type;
    this.type = type;
    this.code = options?.code;
    this.suggestion = options?.suggestion;
    this.endpoint = options?.endpoint;
  }
}

export class ConfigError extends DeltaMcpError {
  public constructor(message: string, suggestion?: string) {
    super("ConfigError", message, { suggestion });
  }
}

export class ValidationError extends DeltaMcpError {
  public constructor(message: string, suggestion?: string) {
    super("ValidationError", message, { suggestion });
  }
}

export class RateLimitError extends DeltaMcpError {
  public constructor(message: string, suggestion?: string, endpoint?: string) {
    super("RateLimitError", message, { suggestion, endpoint });
  }
}

export class AuthenticationError extends DeltaMcpError {
  public constructor(message: string, suggestion?: string, endpoint?: string) {
    super("AuthenticationError", message, { suggestion, endpoint });
  }
}

export class DeltaApiError extends DeltaMcpError {
  public constructor(
    message: string,
    options?: {
      code?: string;
      suggestion?: string;
      endpoint?: string;
      cause?: unknown;
    },
  ) {
    super("DeltaApiError", message, options);
  }
}

export class NetworkError extends DeltaMcpError {
  public constructor(message: string, endpoint?: string, cause?: unknown) {
    super("NetworkError", message, {
      endpoint,
      cause,
      suggestion: "Please check network connectivity and retry the request in a few seconds.",
    });
  }
}

export function toToolErrorPayload(
  error: unknown,
  fallbackEndpoint?: string,
): ToolErrorPayload {
  if (error instanceof DeltaMcpError) {
    return {
      error: true,
      type: error.type,
      code: error.code,
      message: error.message,
      suggestion: error.suggestion,
      endpoint: error.endpoint ?? fallbackEndpoint,
      timestamp: new Date().toISOString(),
    };
  }

  const message = error instanceof Error ? error.message : String(error);

  return {
    error: true,
    type: "InternalError",
    message,
    suggestion: "Unexpected server error. Check tool arguments and retry.",
    endpoint: fallbackEndpoint,
    timestamp: new Date().toISOString(),
  };
}
