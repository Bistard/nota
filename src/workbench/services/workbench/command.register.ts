import { AllCommands } from "src/workbench/services/workbench/commandList";
import { IHostService } from "src/platform/host/common/hostService";
import { ILifecycleService } from "src/platform/lifecycle/browser/browserLifecycleService";
import { RegistrantType, createRegister } from "src/platform/registrant/common/registrant";
import { FileCommands } from "src/workbench/services/fileTree/fileCommands";
import { Command } from "src/platform/command/common/command";
import { IServiceProvider } from "src/platform/instantiation/common/instantiation";
import { INotificationService } from "src/workbench/services/notification/notificationService";
import { errorToMessage } from "src/base/common/utilities/panic";
import { ILogService } from "src/base/common/logger";
import { webFrame } from "src/platform/electron/browser/global";

export const rendererWorkbenchCommandRegister = createRegister(
    RegistrantType.Command, 
    'rendererWorkbench',
    (registrant) => {
        registrant.registerCommandBasic(
            {
                id: AllCommands.toggleDevTool,
                command: (provider) => { provider.getOrCreateService(IHostService).toggleDevTools(); },
            },
        );
    
        registrant.registerCommandBasic(
            {
                id: AllCommands.reloadWindow,
                command: (provider) => { provider.getOrCreateService(IHostService).reloadWebPage(); },
            },
        );
    
        registrant.registerCommandBasic(
            {
                id: AllCommands.closeApplication,
                command: (provider) => { provider.getOrCreateService(ILifecycleService).quit(); },
            },
        );

        registrant.registerCommandBasic(
            {
                id: AllCommands.zoomIn,
                command: () => { webFrame.setZoomLevel(Math.min(8, webFrame.getZoomLevel() + 1)); },
            },
        );
        
        registrant.registerCommandBasic(
            {
                id: AllCommands.zoomOut,
                command: () => { webFrame.setZoomLevel(Math.max(-8, webFrame.getZoomLevel() - 1)); },
            },
        );
        
        registrant.registerCommandBasic(
            {
                id: AllCommands.zoomSet,
                command: (provider, level?: number) => { webFrame.setZoomLevel(Math.max(-8, Math.min(8, level ?? 0))); },
            },
        );
        
        registrant.registerCommand(new AlertError());
        registrant.registerCommand(new FileCommands.FilePaste());
    },
);

class AlertError extends Command {

    constructor() {
        super({
            id: AllCommands.alertError,
            when: null,
        });
    }

    public override run(provider: IServiceProvider, reporter: string, error: any): boolean {
        const notificationService = provider.getOrCreateService(INotificationService);
        const logService = provider.getOrCreateService(ILogService);

        let message: string;
        if (typeof error === 'string') {
            message = error;
        } else {
            message = errorToMessage(error.message ?? error, false);
        }

        logService.error(reporter, message, error);
        notificationService.error(message, { actions: [{ label: 'Close', run: 'noop' }] });

        return true;
    }
}