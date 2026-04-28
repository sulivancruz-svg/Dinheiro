/**
 * List of fields that should NEVER be logged (all lowercase for case-insensitive matching)
 */
const SENSITIVE_FIELDS = [
  "renda",
  "rendafixa",
  "rendavariavel",
  "divida",
  "dividatotal",
  "parcelasmensais",
  "gastosfixos",
  "gastosvariaveis",
  "valorpoupado",
  "valorinvestido",
  "senha",
  "password",
  "token",
  "apikey",
  "creditcard",
];

/**
 * Removes sensitive fields from details object
 * @param details - Original details object
 * @returns Sanitized details with sensitive fields removed
 */
function sanitizeDetails(
  details?: Record<string, unknown>
): Record<string, unknown> {
  if (!details) {
    return {};
  }

  const sanitized: Record<string, unknown> = {};

  Object.entries(details).forEach(([key, value]) => {
    const lowerKey = key.toLowerCase();
    if (!SENSITIVE_FIELDS.includes(lowerKey)) {
      sanitized[key] = value;
    }
  });

  return sanitized;
}

/**
 * Logs a secure event without exposing PII
 * @param event - Event type/name
 * @param userId - User ID (safe to log)
 * @param ipAddress - IP address (safe to log)
 * @param details - Additional details (sensitive fields will be removed)
 */
export function logSecureEvent(
  event: string,
  userId?: string,
  ipAddress?: string,
  details?: Record<string, unknown>
): void {
  const safeDetails = sanitizeDetails(details);

  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    ...(userId && { userId }),
    ...(ipAddress && { ipAddress }),
    ...safeDetails,
  };

  console.log(JSON.stringify(logEntry));
}
