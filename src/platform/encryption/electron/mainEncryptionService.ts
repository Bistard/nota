import { app, safeStorage } from "electron";
import { ILogService } from "src/base/common/logger";
import { IS_MAC, IS_WINDOWS } from "src/base/common/platform";
import { panic } from "src/base/common/utilities/panic";
import { Strings } from "src/base/common/utilities/string";
import { IEncryptionService } from "src/platform/encryption/common/encryptionService";

export class MainEncryptionService implements IEncryptionService {

    declare _serviceMarker: undefined;

    // [constructors]

    constructor(
        @ILogService private readonly logService: ILogService,
    ) {
        /**
         * Downgrade the encryption level if required.
         * This only works in Linux. It is no-op on Windows or Mac.
         * @see https://www.electronjs.org/docs/latest/api/safe-storage#safestoragesetuseplaintextencryptionuseplaintext
         */
        if (app.commandLine.getSwitchValue('password-store') === 'basic') {
			this.__doSetUsePlainTextEncryption(true);
		}
    }

    // [public methods]

    public async isEncryptionAvailable(): Promise<boolean> {
        return safeStorage.isEncryptionAvailable();
    }

    public async encrypt(value: string): Promise<string> {
        
        this.logService.trace('[MainEncryptionService]', 'Encrypting value...');
        const encryptedBuffer = safeStorage.encryptString(value);
        /**
         * Using {@link Buffer.toString()} directly may result in encoding issues, 
         * as not all bytes can be safely represented in UTF-8.
         * 
         * Instead, we use {@link JSON.stringify()} to serialize the buffer into 
         * a structured format (`{"type":"Buffer","data":[…]}`), ensuring 
         * consistent encoding.
         * 
         * @example
         * const buffer = Buffer.from([0x00, 0x80, 0xFF]);
         * const str = buffer.toString();
         * console.log(str); // '��'
         * 
         * // the following is corrupted
         * console.log(JSON.stringify(str)); // {"type":"Buffer","data":[0,239,191,189,239,191,189]}
         */
        const encrypted = Strings.stringifySafe2(encryptedBuffer).unwrap();
        this.logService.trace('[MainEncryptionService]', 'Encrypted value.');

        return encrypted;
    }
    
    public async decrypt(value: string): Promise<string> {
        const parsedValue = JSON.parse(value);
        if (!parsedValue.data) {
            panic(`[MainEncryptionService]', 'Invalid encrypted value: ${value}`);
        }
        const bufferToDecrypt = Buffer.from(parsedValue.data);
        
        this.logService.trace('[MainEncryptionService]', 'Decrypting value...');
        const result = safeStorage.decryptString(bufferToDecrypt);
        this.logService.trace('[MainEncryptionService]', 'Decrypted value.');
        
        return result;
    }

    public async setUsePlainTextEncryption(): Promise<void> {
		if (IS_WINDOWS) {
			panic('Setting plain text encryption is not supported on Windows.');
		}

		if (IS_MAC) {
			panic('Setting plain text encryption is not supported on macOS.');
		}

		if (!safeStorage.setUsePlainTextEncryption) {
			panic('Setting plain text encryption is not supported.');
		}

		this.__doSetUsePlainTextEncryption(true);
	}

    private __doSetUsePlainTextEncryption(value: boolean): void {
        this.logService.trace('[MainEncryptionService]', 'Setting "usePlainTextEncryption" to true...');
		safeStorage.setUsePlainTextEncryption?.(true);
		this.logService.trace('[MainEncryptionService]', 'Set "usePlainTextEncryption" to true');
    }
}