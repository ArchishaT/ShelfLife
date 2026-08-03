// Central place to hook up error reporting (Sentry, Bugsnag, PostHog, etc).
// Currently just logs to the console — swap the body of reportError() for a
// real provider's captureException call when you wire one up.

export function reportError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;

  const message =
    error instanceof Response
      ? `Response ${error.status}${error.url ? ` at ${error.url}` : ""}`
      : error instanceof Error
        ? error.message
        : String(error);

  console.error("[ShelfLife]", message, {
    route: window.location.pathname,
    ...context,
    stack: error instanceof Error ? error.stack : undefined,
  });

  // Example wiring for Sentry, once installed:
  // Sentry.captureException(error, { extra: { route: window.location.pathname, ...context } });
}
