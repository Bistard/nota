import { Disposable, IDisposable } from "src/base/common/dispose";
import { AsyncResult } from "src/base/common/result";
import { IAICoreModel, ModelType, IAIRequestTextMessage, IAiTextRequestOpts, IAITextResponse, IAiCoreServiceOpts, IAICoreModelOpts, IAiCoreService } from "src/platform/ai/electron/ai";
import { GPTModel } from "src/platform/ai/electron/gptModel";
import { IService, createService } from "src/platform/instantiation/common/decorator";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";

export const IMainAiCoreService = createService<IAiCoreService>('ai-core-service');

export class MainAiCoreService extends Disposable implements IAiCoreService {

    declare _serviceMarker: undefined;

    private _aiModel: IAICoreModel;
    private _modelType: ModelType;

    constructor(opts: IAiCoreServiceOpts,
                @IInstantiationService private readonly instantiationService: IInstantiationService) {
        super();
        this._modelType = opts.modelType;
        this._aiModel = this.__createModelBasedOnType();
    }

    public init(opts: IAICoreModelOpts) {
        this._aiModel.init(opts);
    }


    public switchModel(opts: IAiCoreServiceOpts): void {
        if (this._modelType === opts.modelType) {
            return;
        }
        this._modelType = opts.modelType;
        this._aiModel.dispose();
        this._aiModel = this.__createModelBasedOnType();
    }

    public sendRequest(message: IAIRequestTextMessage[], opts: IAiTextRequestOpts): AsyncResult<IAITextResponse, Error> {
        return this._aiModel.sendTextRequest(message, opts);
    }

    private __createModelBasedOnType(): IAICoreModel {
        let model: IAICoreModel;
        switch (this._modelType) {
            case ModelType.GPT:
                return new GPTModel();
        }
    }
}


