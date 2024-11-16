import { ErrorHandler } from "src/base/common/error";
import { ILogService } from "src/base/common/logger";
import { Strings } from "src/base/common/utilities/string";
import { IWindowConfiguration } from "src/platform/window/common/window";

export function initGlobalErrorHandler(getLogService: () => ILogService | undefined, windowConfiguration: IWindowConfiguration): void {

    // only enable infinity stack trace when needed for performance issue.
    if (windowConfiguration.log === 'trace' || windowConfiguration.log === 'debug') {
        Error.stackTraceLimit = Infinity;
    }
    
    // universal on unexpected error handling callback
    const onUnexpectedError = (error: any, additionalMessage?: any) => {
        const logService = getLogService();
        if (logService) {
            const safeAdditional = Strings.stringifySafe(additionalMessage, undefined, undefined, 4);
            logService.error('Renderer', `On unexpected error!!! ${safeAdditional}`, error);
        } else {
            console.error(error);
        }
    };

    // case1
    ErrorHandler.setUnexpectedErrorExternalCallback((error: any) => onUnexpectedError(error));

    // case2
    window.onerror = (message, source, lineno, colno, error) => {
        onUnexpectedError(error, { message, source, lineNumber: lineno, columnNumber: colno });
        return true; // prevent default handling (log to console)
    };

    // case3
    window.onunhandledrejection = (event: PromiseRejectionEvent) => {
        onUnexpectedError(event.reason, 'unexpected rejection');
        event.preventDefault(); // prevent default handling (log to console)
    };
}