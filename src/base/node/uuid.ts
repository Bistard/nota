import * as crypto from 'crypto';
import { UUID } from 'src/base/common/utilities/string';

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

/**
 * @description Generates a {@link UUID}.
 */
export function getUUID(): UUID {
    return crypto.randomUUID();
}