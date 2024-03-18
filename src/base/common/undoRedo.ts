

/**
 * Represents the result of a batch operation, categorizing the outcomes into 
 * successful and failed items.
 */
export interface IBatchResult<T, E = unknown> {
    readonly passed: T[];
    readonly failed: T[];
    readonly failedError: E[];
}