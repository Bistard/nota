import { Disposable } from "src/base/common/dispose";
import { AsyncResult } from "src/base/common/result";
import { IAITextModel, IAIRequestTextMessage, IAiTextRequestOpts, IAITextResponse, IAITextServiceOpts, IAITextModelOpts, IAITextService, TextModelType } from "src/platform/ai/electron/textAI";
import { GPTModel } from "src/platform/ai/electron/gptModel";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";

export class MainAITextService extends Disposable implements IAITextService {

    declare _serviceMarker: undefined;
    
    // [fields]

    private _model: IAITextModel;
    private _modelType: TextModelType;

    // [constructor]

    constructor(
        opts: IAITextServiceOpts,
        @IInstantiationService private readonly instantiationService: IInstantiationService,
    ) {
        super();
        this._modelType = opts.type;
        this._model = this.__constructModel();
    }

    // [public methods]

    public init(opts: IAITextModelOpts): void {
        this._model.init(opts);
    }

    public switchModel(opts: IAITextServiceOpts): void {
        if (this._modelType === opts.type) {
            return;
        }
        this._modelType = opts.type;
        this._model.dispose();

        this._model = this.__constructModel();
    }

    public sendRequest(message: IAIRequestTextMessage[], opts: IAiTextRequestOpts): AsyncResult<IAITextResponse, Error> {
        return this._model.sendTextRequest(message, opts);
    }

    // [private helper methods]

    private __constructModel(): IAITextModel {
        switch (this._modelType) {
            case TextModelType.GPT:
                return new GPTModel();
            case TextModelType.DeepSeek:
            default:
                return new GPTModel();
        }
    }
}
