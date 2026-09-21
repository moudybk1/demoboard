/**
 * Shared error type for the domain layer. Services throw these so route
 * handlers stay thin mappers: catch, read `status`, respond.
 */
export class ServiceError extends Error {
  readonly status: number;

  constructor(message: string, status = 400, name = "ServiceError") {
    super(message);
    this.name = name;
    this.status = status;
  }
}

/**
 * Reusable subclass factory. Each service keeps its own named error type so
 * `instanceof` checks at the route layer stay precise, without every file
 * re-declaring the same constructor.
 */
export function defineServiceError(name: string) {
  return class extends ServiceError {
    constructor(message: string, status = 400) {
      super(message, status, name);
    }
  };
}

/** Map a domain result code to an HTTP status. Unknown codes are a conflict. */
export function statusForCode(
  code: string,
  overrides: Record<string, number> = {},
): number {
  return overrides[code] ?? DEFAULT_CODE_STATUS[code] ?? 409;
}

/**
 * Status for the result codes shared across room/game services. Routes used to
 * repeat this as a ternary chain, which drifted between endpoints.
 */
  const DEFAULT_CODE_STATUS: Record<string, number> = {
  NOT_FOUND: 404,
  USER_NOT_FOUND: 401,
  NOT_AUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_YOUR_TURN: 403,
  ALREADY_ROLLED: 403,
  ILLEGAL_MOVE: 403,
  ELIMINATED: 403,
  FINISHED: 403,
  INSUFFICIENT_BALANCE: 402,
  INSUFFICIENT_CASH: 402,
  WRONG_GAME: 400,
  INVALID_MOVE: 400,
  BAD_TX: 400,
  NOT_OPEN: 409,
  FULL: 409,
  ALREADY_JOINED: 409,
  ALREADY_SEATED: 409,
  TX_USED: 409,
  ALREADY_SETTLED: 409,
  NOT_READY: 409,
  NOT_WAITING: 409,
  REFUND_FAILED: 503,
};
