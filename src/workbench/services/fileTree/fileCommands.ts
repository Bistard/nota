import { ClipboardType, IClipboardService } from "src/platform/clipboard/common/clipboard";
import { Command } from "src/platform/command/common/command";
import { AllCommands } from "src/workbench/services/workbench/commandList";
import { IServiceProvider } from "src/platform/instantiation/common/instantiation";
import { IFileTreeService } from "src/workbench/services/fileTree/treeService";
import { WorkbenchContextKey } from "src/workbench/services/workbench/workbenchContextKeys";

/**
 * @namespace FileCommands Contains a list of useful {@link Command}s that will
 * be registered into the command service.
 */
export namespace FileCommands {
    
    export class FileItemCut extends Command {

        constructor() {
            super({
                id: AllCommands.fileCut,
                when: WorkbenchContextKey.focusedFileTree,
            });
        }
    
        public override run(provider: IServiceProvider): boolean | Promise<boolean> {
            return __handleCutOrCopy(provider, 'cut');
        }
    }

    export class FileItemCopy extends Command {
    
        constructor() {
            super({
                id: AllCommands.fileCopy,
                when: WorkbenchContextKey.focusedFileTree,
            });
        }
    
        public override run(provider: IServiceProvider): boolean | Promise<boolean> {
            return __handleCutOrCopy(provider, 'copy');
        }
    }
}

function __handleCutOrCopy(provider: IServiceProvider, type: 'cut' | 'copy'): boolean {
    const service = provider.getOrCreateService(IFileTreeService);
    const clipboard = provider.getOrCreateService(IClipboardService);

    const selections = service.getSelections();
    if (selections.length === 0) {
        return false;
    }

    if (type === 'copy') {
        service.highlightSelectionAsCopy(selections);
    } else {
        service.highlightSelectionAsCut(selections);
    }
    
    const uris = selections.map(item => item.uri);
    clipboard.write(ClipboardType.Resources, uris);

    return true;
}