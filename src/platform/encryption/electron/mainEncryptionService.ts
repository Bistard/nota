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

    public async encrypt(value: string): Promise<string> {
        
        this.logService.trace('[MainEncryptionService]', 'Encrypting value...');
        const encrypted = safeStorage.encryptString(value);
        const str = Strings.stringifySafe2(encrypted).unwrap();
        this.logService.trace('[MainEncryptionService]', 'Encrypted value.');

        return str;
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