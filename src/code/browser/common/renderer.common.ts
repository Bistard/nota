import { ErrorHandler } from "src/base/common/error";
import { ILogService } from "src/base/common/logger";
import { Strings } from "src/base/common/utilities/string";
import { createService, IService } from "src/platform/instantiation/common/decorator";
import { IWindowConfiguration } from "src/platform/window/common/window";

export function initGlobalErrorHandler(getLogService: () => ILogService | undefined, windowConfiguration: IWindowConfiguration, onError?: (err: any) => void): void {

    // only enable infinity stack trace when needed for performance issue.
    if (windowConfiguration.log === 'trace' || windowConfiguration.log === 'debug') {
        Error.stackTraceLimit = Infinity;
    }
    
    // universal on unexpected error handling callback
    const onUnexpectedError = (error: any, additionalMessage?: any) => {
        const logService = getLogService();
        if (onError) {
            onError(error);
        }
        else if (logService) {
            const safeAdditional = Strings.stringifySafe(additionalMessage, undefined, undefined, 4);
            logService.error('Renderer', `On unexpected error!!! ${safeAdditional}`, error);
        } 
        else {
            console.error(error);
        }
    };

    // case1
    ErrorHandler.setUnexpectedErrorExternalCallback((error: any) => onUnexpectedError(error));

    if (typeof window !== 'undefined') {
        // case2
        window.onerror = (message, source, lineno, colno, error) => {
            onUnexpectedError(error, { message, source, lineNumber: lineno, columnNumber: colno });
            return true; // prevent default handling (log to console)
        };

        // case3
        window.onunhandledrejection = (event: PromiseRejectionEvent) => {
            onUnexpectedError(event.reason, 'unhandled promise rejection');
            event.preventDefault(); // prevent default handling (log to console)
        };
    }

    if (typeof process !== 'undefined') {
        // case4
        process.on('uncaughtException', (error) => {
            onUnexpectedError(error);
        });
    
        // case5
        process.on('unhandledRejection', (reason, promise) => {
            onUnexpectedError(reason, 'unhandled promise rejection');
        });
    }
}

export const IBrowserService = createService<IBrowserService>('browser-service');

/**
 * An interface only for {@link BrowserInstance}.
 */
export interface IBrowserService extends IService {
    init(): void;
}
