import * as crypto from 'crypto';

/*******************************************************************************
 * A universally unique identifier ({@link UUID}) is a 128-bit label used for 
 * information in computer systems. 
 * 
 * Their uniqueness does not depend on a central registration authority or 
 * coordination between the parties generating them, unlike most other numbering 
 * schemes. 
 * 
 * While the probability that a UUID will be duplicated is not zero, it is close 
 * enough to zero to be negligible.
 ******************************************************************************/

export type UUID = string;

/**
 * @description // TODO
 * @returns 
 */
export function getUUID(): UUID {
    return crypto.randomUUID();
}