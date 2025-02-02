import { createService, IService } from "src/platform/instantiation/common/decorator";

export const IEncryptionService = createService<IEncryptionService>('encryption-service');

/**
 * Encryption service provides methods for encrypting and decrypting data.
 * 
 * @note Encryption only supported in native environment (main process). Browser
 * may only access to encryption through IPC channel.
 */
export interface IEncryptionService extends IService {
    /**
     * @description Encrypts a given string and returns the encrypted one.
     * @param value The plaintext string to encrypt.
     * @returns the encrypted string.
     * @panic If the encryption fails.
     */
    encrypt(value: string): Promise<string>;

    /**
     * @description Decrypts an encrypted string and returns the original 
     * plaintext.
     *
     * @param value The encrypted string to decrypt.
     * @returns The decrypted plaintext.
     * @panic If the decryption fails.
     */
    decrypt(value: string): Promise<string>;

    /**
     * @description Whether encryption is available.
     * - On MacOS, returns true if Keychain is available. 
     * - On Windows, returns true once the app has emitted the `ready` event.
     * - On Linux, returns true if the app has emitted the `ready` event and the 
     *      secret key is available. 
     */
    isEncryptionAvailable(): Promise<boolean>;

    /**
     * @description This function on Linux will force the module to use an in 
     * memory password for creating symmetric key that is used for encrypt/decrypt 
     * functions when a valid OS password manager cannot be determined for the 
     * current active desktop environment. 
     * @note This function is a no-op on Windows and MacOS.
     * @panic If executed this function on Windows/MacOS.
     */
    setUsePlainTextEncryption(): Promise<void>;
}