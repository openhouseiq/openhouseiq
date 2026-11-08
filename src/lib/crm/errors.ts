/** A failed send to a CRM, with what the queue should do about it. */
export class CrmSendError extends Error {
  constructor(
    message: string,
    /** True when retrying later could work (rate limit, outage). */
    readonly retryable: boolean,
    /** True when the agency's access has been revoked or is invalid. */
    readonly authFailed = false,
  ) {
    super(message);
  }
}
