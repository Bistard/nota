import OpenAI from "openai";
import { Disposable } from "src/base/common/dispose";
import { Emitter, Event } from "src/base/common/event";
import { ILogService } from "src/base/common/logger";
import { AsyncResult, err } from "src/base/common/result";
import { isNullable } from "src/base/common/utilities/type";
import { AI } from "src/platform/ai/common/ai";
import { IAITextService } from "src/platform/ai/common/aiText";
import { TextDeepSeekModel } from "src/platform/ai/electron/deepSeekModel";
import { TextGPTModel } from "src/platform/ai/electron/GPTModel";
import { IConfigurationService } from "src/platform/configuration/common/configuration";
import { IEncryptionService } from "src/platform/encryption/common/encryptionService";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";
import { IpcChannel } from "src/platform/ipc/common/channel";
import { IMainLifecycleService } from "src/platform/lifecycle/electron/mainLifecycleService";
import { StatusKey } from "src/platform/status/common/status";
import { IMainStatusService } from "src/platform/status/electron/mainStatusService";
import { IMainWindowService } from "src/platform/window/electron/mainWindowService";
import { IWindowInstance } from "src/platform/window/electron/windowInstance";
import { WorkbenchConfiguration } from "src/workbench/services/workbench/configuration.register";

export class MainAITextService extends Disposable implements IAITextService {

    declare _serviceMarker: undefined;
    
    // [fields]

    private readonly _onDidError = this.__register(new Emitter<Error>());
    public readonly onDidError = this._onDidError.registerListener;
    private _model?: AI.Text.Model;

    // [constructor]

    constructor(
        @ILogService private readonly logService: ILogService,
        @IInstantiationService private readonly instantiationService: IInstantiationService,
        @IConfigurationService private readonly configurationService: IConfigurationService,
        @IMainStatusService private readonly statusService: IMainStatusService,
        @IMainWindowService private readonly mainWindowService: IMainWindowService,
        @IMainLifecycleService private readonly lifecycleService: IMainLifecycleService,
        @IEncryptionService private readonly encryptionService: IEncryptionService,
    ) {
        super();
        // Intialize when the browser window is ready.
        Event.onceSafe(this.mainWindowService.onDidOpenWindow)(window => {
            this.__registerListeners(window);
        });
    }

    // [public methods]

    public async constructOptions(): Promise<AI.Text.IModelOptions> {
        const modelType = this.configurationService.get<AI.Text.ModelType>(WorkbenchConfiguration.AiTextModel);
        const statusKey = `${StatusKey.textAPIKey}-${modelType}` as StatusKey;
        
        const encrypted = this.statusService.get<string>(statusKey);
        if (isNullable(encrypted) || encrypted === '') {
            this._onDidError.fire(new Error('No API Key provided.'));
        }
        
        const apiKey = encrypted 
            ? await this.encryptionService.decrypt(encrypted)
            : ''; // still provide mock string

        return {
            type: modelType,
            apiKey: apiKey, 
        };
    }

    public init(options: AI.Text.IModelOptions): void {
        if (this._model) {
            return;
        }
        this._model = this.__constructModel(options);
    }

    public getModel(): AsyncResult<AI.Text.Model, Error> {
        if (!this._model) {
            return AsyncResult.err(new Error('Text model is not initialized.'));
        }
        return AsyncResult.ok(this._model);
    }

    public switchModel(opts: AI.Text.IModelOptions): void {
        if (!this._model) {
            return;
        }
        
        if (this._model.type === opts.type) {
            return;
        }
        
        this.__destructCurrentModel();
        this._model = this.__constructModel(opts);
    }

    public sendRequest(options: OpenAI.ChatCompletionCreateParamsNonStreaming): AsyncResult<AI.Text.Response, Error> {
        return this
            .getModel()
            .andThen(model => model.sendTextRequest(options))
            .orElse(error => {
                this._onDidError.fire(error);
                return err(error);
            });
    }

    public sendTextRequestStream(options: OpenAI.ChatCompletionCreateParamsStreaming, onChunkReceived: (chunk: AI.Text.Response) => void): AsyncResult<void, Error> {
        return this
            .getModel()
            .andThen(model => model.sendTextRequestStream(options, onChunkReceived))
            .orElse(error => {
                this._onDidError.fire(error);
                return err(error);
            });
    }

    // [private helper methods]

    private async __registerListeners(window: IWindowInstance): Promise<void> {
        
        // alert errors to the user
        this.__register(this.onDidError(err => {
            window.sendIPCMessage(IpcChannel.rendererAlertError, err);
        }));

        /**
         * save data:
         *  1. API Key
         */
        this.__register(this.lifecycleService.onWillQuit(e => {
            const saveAPIKey = Promise.resolve()
                .then(() => {
                    if (isNullable(this._model?.apiKey)) {
                        return;
                    }
                    return this.encryptionService.encrypt(this._model?.apiKey);
                })
                .then(encrypted => {
                    if (!this._model) {
                        return;
                    }
                    const key = `${StatusKey.textAPIKey}-${this._model.type}` as StatusKey;
                    return this.statusService.set(key, encrypted).unwrap();
                });
            e.join(saveAPIKey);
        }));

        // initialize when the window is ready
        window.whenRendererReady().then(async () => {
            this.init(await this.constructOptions());
        });
    }

    private __constructModel(options: AI.Text.IModelOptions): AI.Text.Model {
        this.logService.debug('[MainAITextService]', `Constructing model (${options.type})...`);
        
        let model: AI.Text.Model;
        switch (options.type) {
            case AI.Text.ModelType.ChatGPT:
                model = this.instantiationService.createInstance(TextGPTModel, options);
                break;
            case AI.Text.ModelType.DeepSeek:
                model = this.instantiationService.createInstance(TextDeepSeekModel, options);
                break;
            default:
                this.logService.warn('[MainAITextService]', `Unknown model type: ${options.type}. Use ${AI.Text.ModelType.DeepSeek} instead.`);
                model = this.instantiationService.createInstance(TextDeepSeekModel, options);
        }
        return this.__register(model);
    }

    private __destructCurrentModel(): void {
        if (!this._model) {
            return;
        }
        this.release(this._model);
    }
}
