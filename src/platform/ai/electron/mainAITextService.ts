import OpenAI from "openai";
import { Disposable } from "src/base/common/dispose";
import { AIError } from "src/base/common/error";
import { Emitter, Event } from "src/base/common/event";
import { ILogService } from "src/base/common/logger";
import { AsyncResult, err, ok, Result } from "src/base/common/result";
import { panic } from "src/base/common/utilities/panic";
import { isNullable } from "src/base/common/utilities/type";
import { AI } from "src/platform/ai/common/ai";
import { IAITextService } from "src/platform/ai/common/aiText";
import { IAIModelRegistrant } from "src/platform/ai/electron/aiModelRegistrant";
import { IConfigurationService } from "src/platform/configuration/common/configuration";
import { IEncryptionService } from "src/platform/encryption/common/encryptionService";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";
import { IpcChannel } from "src/platform/ipc/common/channel";
import { IMainLifecycleService } from "src/platform/lifecycle/electron/mainLifecycleService";
import { RegistrantType } from "src/platform/registrant/common/registrant";
import { IRegistrantService } from "src/platform/registrant/common/registrantService";
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
    
    private readonly _registrant: IAIModelRegistrant;
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
        @IRegistrantService registrantService: IRegistrantService,
    ) {
        super();
        this._registrant = registrantService.getRegistrant(RegistrantType.AIModel);

        // Initialize when the browser window is ready.
        Event.onceSafe(this.mainWindowService.onDidOpenWindow)(window => {
            this.__registerListeners(window);
        });
    }

    // [public methods]

    public async init(): Promise<void> {
        if (this._model) {
            return;
        }
        this.logService.debug('MainAITextService', `Initializing...`);
        const options = await this.__constructOptions();
        this._model = this.__constructModel(options);
        this.logService.debug('MainAITextService', `Initialized successfully.`);
    }

    public async updateAPIKey(newKey: string, modelType: AI.ModelName | null, persisted: boolean = true): Promise<void> {
        if (newKey === '') {
            return;
        }
        this.logService.debug('MainAITextService', `Updating API key (model: ${modelType})...`);

        const encrypted = await this.encryptionService.encrypt(newKey);
        const resolvedType = modelType || this._model?.name;

        // if persisted and desired to change specific model APIKey
        if (persisted && resolvedType) {
            const key = this.__getStatusAPIKey(resolvedType);
            await this.statusService.set(key, encrypted).unwrap();
        }

        // if any current model, we update its API Key in memory.
        if (this._model) {
            this._model.setAPIKey(newKey);
        }

        this.logService.debug('MainAITextService', `Updated API key (model: ${resolvedType}).`);
    }

    public getModel(): Result<AI.Text.Model, AIError> {
        if (!this._model) {
            return err(new AIError(null, 'service not initialized'));
        }
        return ok(this._model);
    }

    public async switchModel(opts: AI.Text.IModelOptions): Promise<void> {
        if (!this._model) {
            return;
        }
        
        if (this._model.name === opts.name) {
            return;
        }
        
        this.__destructCurrentModel();
        this._model = this.__constructModel(opts);
    }

    public sendRequest(options: OpenAI.ChatCompletionCreateParamsNonStreaming): AsyncResult<AI.Text.Response, AIError> {
        return this
            .getModel()
            .toAsync()
            .andThen(model => model.sendRequest(options));
    }

    public sendRequestStream(options: OpenAI.ChatCompletionCreateParamsStreaming, onChunkReceived: (chunk: AI.Text.Response) => void): AsyncResult<void, AIError> {
        return this
            .getModel()
            .toAsync()
            .andThen(model => model.sendRequestStream(options, onChunkReceived));
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
            const saveAPIKey = (async () => {
                if (!this._model) {
                    return;
                }
                const encrypted = await this.encryptionService.encrypt(this._model.apiKey);
                const key = this.__getStatusAPIKey(this._model.name);
                return this.statusService.set(key, encrypted).unwrap();
            })();
            e.join(saveAPIKey);
        }));

        // initialize when the window is ready
        window.whenRendererReady().then(async () => {
            this.init();
        });
    }

    private async __constructOptions(): Promise<AI.Text.IModelOptions> {
        const modelName = this.configurationService.get<AI.ModelName>(WorkbenchConfiguration.AiTextModel);
        const encrypted = this.statusService.get<string>(this.__getStatusAPIKey(modelName));

        const apiKey = encrypted 
            ? await this.encryptionService.decrypt(encrypted)
            : ''; // still provide mock string

        if (isNullable(apiKey) || apiKey === '') {
            this._onDidError.fire(new Error('No API Key provided.'));
        }

        return {
            name: modelName,
            apiKey: apiKey, 
        };
    }

    private __constructModel(options: AI.Text.IModelOptions): AI.Text.Model {
        
        // log options, make sure to exclude API keys.
        const logOptions: any = Object.assign({}, options);
        delete logOptions.apiKey;
        this.logService.debug('[MainAITextService]', `Constructing (text) model (${options.name}) with options:`, logOptions);
        
        // model construction
        const modelName = options.name;
        const modelCtor = this._registrant.getRegisteredModel(AI.Modality.Text, modelName);
        if (!modelCtor) {
            panic(new Error(`[MainAITextService] Cannot find proper (text) model with name (${modelName}) to construct.`));
        }
        const model = this.instantiationService.createInstance(modelCtor, options);
        return this.__register(model);
    }

    private __destructCurrentModel(): void {
        if (!this._model) {
            return;
        }
        this.release(this._model);
    }

    private __getStatusAPIKey(modelType: AI.ModelName): StatusKey {
        return `${StatusKey.textAPIKey}-${modelType}` as StatusKey;
    }
}
