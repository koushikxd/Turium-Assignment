import type { ItemFailureCode } from "@turium-assignment/contracts";

// A failure the user sees on the item. The message is ours; the cause is only logged.
export class ItemFailure extends Error {
  constructor(
    readonly code: ItemFailureCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
  }
}
