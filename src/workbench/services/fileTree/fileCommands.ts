import { ClipboardType, IClipboardService } from "src/platform/clipboard/common/clipboard";
import { Command } from "src/platform/command/common/command";
import { AllCommands } from "src/workbench/services/workbench/commandList";
import { IServiceProvider } from "src/platform/instantiation/common/instantiation";
import { IFileTreeService } from "src/workbench/services/fileTree/treeService";
import { WorkbenchContextKey } from "src/workbench/services/workbench/workbenchContextKeys";
import { URI } from "src/base/common/files/uri";
import { FileItem } from "src/workbench/services/fileTree/fileItem";
import { IContextService } from "src/platform/context/common/contextService";
import { INotificationService } from "src/workbench/services/notification/notificationService";
import { IFileService } from "src/platform/files/common/fileService";
import { FileOperationError, FileOperationErrorType } from "src/base/common/files/file";
import { parse } from "src/base/common/files/path";
import { ICommandService } from "src/platform/command/common/commandService";
import { Arrays } from "src/base/common/utilities/array";
import { IBatchResult, IChange, createBatchResult } from "src/base/common/undoRedo";
import { OrderChangeType } from "src/workbench/services/fileTree/fileTreeCustomSorter";
import { noop } from "src/base/common/performance";
import { assert, errorToMessage } from "src/base/common/utilities/panic";
import { ResourceMap } from "src/base/common/structures/map";

/**
 * @namespace FileCommands Contains a list of useful {@link Command}s that will
 * be registered into the command service.
 */
export namespace FileCommands {
    
    export class FileCut extends Command {

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

    export class FileCopy extends Command {
    
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
    
    export class FilePaste extends Command {
    
        private fileTreeService!: IFileTreeService;
        private clipboardService!: IClipboardService;
        private fileService!: IFileService;
        private notificationService!: INotificationService;
        private commandService!: ICommandService;

        constructor() {
            super({
                id: AllCommands.filePaste,
                when: WorkbenchContextKey.focusedFileTree,
            });
        }
    
        public override async run(provider: IServiceProvider, destination: FileItem, destinationIdx?: number, resources?: URI[]): Promise<boolean> {
            this.fileTreeService     = provider.getOrCreateService(IFileTreeService);
            this.clipboardService    = provider.getOrCreateService(IClipboardService);
            const contextService     = provider.getOrCreateService(IContextService);
            this.notificationService = provider.getOrCreateService(INotificationService);
            this.fileService         = provider.getOrCreateService(IFileService);
            this.commandService      = provider.getOrCreateService(ICommandService);

            const toPaste  = await this.__getResourcesToPaste(resources);
            const isCut    = assert(contextService.getContextValue<boolean>(WorkbenchContextKey.fileTreeOnCutKey));
            const isInsert = assert(contextService.getContextValue<boolean>(WorkbenchContextKey.fileTreeOnInsertKey));

            // nothing to paste, nothing happens.
            if (toPaste.length === 0) {
                return false;
            }
            
            // paste (normal)
            if (!isInsert) {
                return await this.__pasteNormal(toPaste, destination, isCut);
            }
            
            // paste (custom sorting)
            await this.__pasteInsert(destination, destinationIdx ?? 0, isCut);
            
            return true;
        }

        // [private helper methods]

        private async __getResourcesToPaste(resources?: URI[]): Promise<URI[]> {
            
            // paste the provided resources for higher priority
            let toPaste: URI[] = resources ?? [];

            /**
             * If no provided resources, fallback to read the sources from the
             * clipboard.
             */
            if (toPaste.length === 0) {
                toPaste = await this.clipboardService.read(ClipboardType.Resources);
            }

            // check parent-child relationship
            const resolvedToPaste = URI.distinctParents(toPaste);
            return resolvedToPaste;
        }

        private async __pasteNormal(toPaste: URI[], destination: FileItem, isCut: boolean): Promise<boolean> {
            if (destination.isFile()) {
                return false;
            }
            
            // paste
            await this.__doPasteNormal(toPaste, destination, isCut);
            
            this.__clearFileTreeTraits();
            return true;
        }

        private async __doPasteNormal(toPaste: URI[], destination: FileItem, isCut: boolean): Promise<IBatchResult<IChange<URI>, FileOperationError>> {
            const operation = isCut ? this.__doMoveLot : this.__doCopyLot;
            const batch = await operation.call(this, toPaste, destination);
            
            if (batch.failed.length) {
                this.__onResourceBatchError(batch, isCut, destination.uri);
            }

            return batch;
        }

        private async __pasteInsert(destination: FileItem, destinationIdx: number, isCut: boolean): Promise<void> {
            /**
             * On detecting an insertion, the operation must be conducted from 
             * the UI perspective. Therefore, instead of utilizing the given 
             * URIs (toPaste), we retrieve 'FileItem's directly from the 
             * clipboard.
             * 
             * This also check parent-child relationship.
             */
            const toInsert = assert(await this.clipboardService.read<FileItem[]>(ClipboardType.Arbitrary, 'dndInsertionItems'));
            const dragItems = URI.distinctParentsByUri(toInsert, item => item.uri);

            /**
             * Indicate if any file/dir are actually pasted to the destination
             * in the file system.
             */
            let anyPasted = false;
            this.fileTreeService.freeze();

            /**
             * We are pasting resources grouped by the same parent at the same 
             * time. This reduces the disk reading when updating custom sorting 
             * metadata.
             */
            const groups = Arrays.group(dragItems, item => item.parent);
            for (const group of groups.values()) {
                const pasted = await this.__doPasteInsert(group, destination, destinationIdx, isCut);
                if (pasted) {
                    anyPasted = true;
                }
            }

            // after pasting, clear the traits in the view perspective.
            this.__clearFileTreeTraits();
            this.fileTreeService.unfreeze();

            /**
             * Since no file/dir is actually pasted, thus there will not trigger
             * the 'onDidResourceChange' event in the file system to update the
             * latest sorting order. 
             * 
             * We need to manually refresh here.
             */
            if (!anyPasted) {
                await this.fileTreeService.refresh();
            }
        }

        private async __doPasteInsert(toPaste: FileItem[], destination: FileItem, destinationIdx: number, isCut: boolean): Promise<boolean> {
            const toPasteParent = assert(toPaste[0]!.parent);
            const insertAtSameParent = URI.equals(toPasteParent.uri, destination.uri);

            const batch = insertAtSameParent
                ? createBatchResult<IChange<URI>>({ passed: toPaste.map(item => ({ old: item.uri, new: URI.join(destination.uri, URI.basename(item.uri)) })) })
                : await this.__doPasteNormal(toPaste.map(item => item.uri), destination, isCut);
            
            // error handling to those who fails
            if (batch.failed.length) {
                this.__onResourceBatchError(batch, isCut, destination.uri);
            }

            // update metadata to those who successes
            await this.__doUpdateMetadataLot(batch, isCut, toPaste, destination, destinationIdx, insertAtSameParent);

            // determine if any file/dir is actually pasted in the file system
            const pasted = !insertAtSameParent && batch.passed.length > 0;
            return pasted;
        }

        private async __doUpdateMetadataLot(
            batch: IBatchResult<IChange<URI>>, 
            isCut: boolean, 
            pastedItems: FileItem[], 
            destination: FileItem, 
            destinationIdx: number, // the view index of the destination relative to its parent
            insertAtSameParent: boolean,
        ): Promise<void> 
        {
            // no passed items, do nothing for metadata update.
            if (batch.passed.length === 0) {
                return;
            }

            /**
             * // REVIEW
             * When updating the metadata in disk. I'm not sure if 'unwrap' is 
             * the right thing to do. The error expected to be disk-related. I 
             * guess there is not much that we can do if error encounters. So I 
             * choose'unwrap' for now.
             */

            /**
             * Update metadata only for successfully processed resources. 
             *  - e.g, if an operation involving 10 files where 7 succeed and 3 
             *    fail, metadata will only be updated for the 7 successful files, 
             *    leaving the others unchanged.
             */
            const passedOldUriMap = new ResourceMap<URI>();
            for (const passed of batch.passed) {
                passedOldUriMap.set(passed.old, passed.new);
            }

            const passedItems: FileItem[] = [];
            const passedCount = passedOldUriMap.size;

            const passedOldDirUri: URI[] = [];
            const passedNewDirUri: URI[] = [];
            const passedOldUri   : URI[] = [];
            const passedNewUri   : URI[] = [];
            const oldParent: FileItem = assert(pastedItems[0]!.parent);

            // filter out only the passed items
            for (const pastedItem of pastedItems) {
                const oldUri = pastedItem.uri;
                const newUri = passedOldUriMap.get(oldUri);
                if (!newUri) {
                    continue;
                }
                passedItems.push(pastedItem);
                passedOldUri.push(oldUri);
                passedNewUri.push(newUri);

                if (pastedItem.isDirectory()) {
                    passedOldDirUri.push(oldUri);
                    passedNewDirUri.push(newUri);
                }
            }
            
            console.log('isCut:', isCut);
            console.log('destinationName:', destination.basename);
            console.log('destinationIdx:', destinationIdx);
            console.table({
                passedItems,
                passedOldDirUri,
                passedNewDirUri,
                passedOldUri,
                passedNewUri,
            });

            // debugger; // TEST

            if (insertAtSameParent) {
                /**
                 * Step 0: Handling insertion within the same parent directory.
                 * In scenarios where the items being pasted remain within the 
                 * same parent directory from which they were cut or copied, the
                 * removing and adding happens at the directory, we can integrate 
                 * two operations. This operation effectively updates the sorting 
                 * order of the items within the same directory.
                 */
                if (isCut) {
                    const toMoveIndice = passedItems.map(item => this.fileTreeService.getItemIndex(item));
                    await this.fileTreeService.updateCustomSortingMetadata(OrderChangeType.Move, oldParent, toMoveIndice, destinationIdx).unwrap();
                } 
                else {
                    const addIndice = Arrays.fill(destinationIdx, passedCount);
                    await this.fileTreeService.updateCustomSortingMetadata(OrderChangeType.Add, passedItems, addIndice).unwrap();
                }
            } 
            else {
                /**
                 * Step 1: In the general cut operation, after items are moved 
                 * to their new location, the metadata at the original location 
                 * should be removed.
                 */
                if (isCut) {
                    const removeIndice: number[] = [];
                    for (const item of passedItems) {
                        const idx = this.fileTreeService.getItemIndex(item);
                        removeIndice.push(idx);
                    }
                    
                    await this.fileTreeService.updateCustomSortingMetadata(
                        OrderChangeType.Remove, 
                        oldParent, 
                        removeIndice,
                    ).unwrap();
                }
    
                /**
                 * Step 2: Update the metadata at the new location with the newly 
                 * pasting items.
                 */
                const passedNames = passedItems.map(item => item.name);
                const addIndice = Arrays.fill(destinationIdx, passedCount);
                await this.fileTreeService.updateCustomSortingExistMetadata(
                    OrderChangeType.Add,
                    destination.uri,
                    passedNames,
                    addIndice
                ).unwrap();

                // FIX: SHOULD BE RECURSIVE
                /**
                 * Step 3: To those who passed are directory, we need to move its entire
                 * metadata to a new location.
                 */
                Arrays.Async.parallelEach([passedOldDirUri, passedNewDirUri], async (oldDirUri, newDirUri) => {
                    await this.fileTreeService.updateDirectoryMetadata(oldDirUri, newDirUri, isCut).unwrap();
                });
            }
        }

        private async __doMoveLot(toPaste: URI[], destination: FileItem): Promise<IBatchResult<IChange<URI>, FileOperationError>> {
            const result: IBatchResult<IChange<URI>, FileOperationError> = {
                passed: [],
                failed: [],
                failedError: [],
            };

            // TODO: seems like if move fails, file or folders got deleted?

            /**
             * Iterate every pasting items and try to move to the destination. 
             * If any existing files or folders found at the destination, a 
             * window will pop up and ask for user permission if to overwrite.
             */
            for (const resource of toPaste) {
                const resourceName = URI.basename(resource);
                const newDestination = URI.join(destination.uri, resourceName);
                const change = { old: resource, new: newDestination };

                const success = await this.fileService.moveTo(resource, newDestination);

                // complete
                if (success.isOk()) {
                    result.passed.push(change);
                    continue;
                }
                const error = success.unwrapErr();

                // only expect `FILE_EXISTS` error
                if (error.code !== FileOperationErrorType.FILE_EXISTS) {
                    await this.commandService.executeCommand(AllCommands.alertError, 'FilePaste', error);
                    continue;
                }

                // duplicate item found, ask permission from the user.
                const shouldOverwrite = await this.notificationService.confirm(
                    'Overwrite Warning',
                    `An item named ${resourceName} already exists in this location. Do you want to replace it with the one you're moving?`
                );

                if (!shouldOverwrite) {
                    result.failed.push(change);
                    continue;
                }

                // re-move to overwrite
                const move = await this.fileService.moveTo(resource, newDestination, true);
                if (move.isOk()) {
                    result.passed.push(change);
                    continue;
                }

                /**
                 * Error happens, we mark it as not completed, let the client to
                 * handle.
                 */
                result.failed.push(change);
                result.failedError?.push(move.unwrapErr());
            }

            return result;
        }

        private async __doCopyLot(toPaste: URI[], destination: FileItem): Promise<IBatchResult<IChange<URI>, FileOperationError>> {
            const result: IBatchResult<IChange<URI>, FileOperationError> = {
                passed: [],
                failed: [],
                failedError: [],
            };

            /**
             * Iterate every selecting items and try to copy to the destination. 
             * If a duplicate item name is encountered, append '_copy' as a 
             * postfix to the name of the copied item.
             */
            for (const resource of toPaste) {
                const resourceName = URI.basename(resource);
                const { name: baseName, ext: extName } = parse(resourceName);

                let newDestination = URI.join(destination.uri, resourceName);
                if (URI.equals(resource, newDestination)) {
                    newDestination = URI.join(destination.uri, `${baseName}_copy${extName}`);
                }
                const change = { old: resource, new: newDestination };
                
                const copy = await this.fileService.copyTo(resource, newDestination);
                
                // complete
                if (copy.isOk()) {
                    result.passed.push(change);
                    continue;
                }

                /**
                 * Error happens, we mark it as not completed, let the client to
                 * handle.
                 */
                result.failed.push(change);
                result.failedError?.push(copy.unwrapErr());
            }

            return result;
        }

        private __onResourceBatchError(batch: IBatchResult<IChange<URI>>, isCut: boolean, destination: URI): void {
            Arrays.parallelEach([batch.failed, batch.failedError], (failed, error) => {
                const operation = isCut ? 'move' : 'copy';
                const targetName = URI.basename(failed.old);
                const destinName = URI.basename(destination);

                this.notificationService.notify({ 
                    title: 'FilePaste Fails',
                    message: `Cannot ${operation} ${targetName} to ${destinName}. Reason: ${errorToMessage(error)}`,
                    actions: [
                        { label: 'Ok', run: noop },
                        { label: 'Retry', run: () => this.commandService.executeAnyCommand(AllCommands.filePaste, destination, [failed]) }
                    ]
                });
            });
        }

        private __clearFileTreeTraits(): void {
            this.fileTreeService.setSelections([]);
            this.fileTreeService.setFocus(null);
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

    const resources = selections.map(item => item.uri);
    clipboard.write(ClipboardType.Resources, resources);

    return true;
}