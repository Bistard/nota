import OpenAI from "openai";
import { Disposable } from "src/base/common/dispose";
import { AsyncResult } from "src/base/common/result";
import { AI } from "src/platform/ai/common/ai";
import { IAITextService } from "src/platform/ai/common/aiText";
import { TextDeepSeekModel } from "src/platform/ai/electron/deepSeekModel";
import { TextGPTModel } from "src/platform/ai/electron/GPTModel";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";

export class MainAITextService extends Disposable implements IAITextService {

    declare _serviceMarker: undefined;
    
    // [fields]

    private _model?: AI.Text.Model;

    // [constructor]

    constructor(
        @IInstantiationService private readonly instantiationService: IInstantiationService,
    ) {
        super();
    }

    // [public methods]

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
            .andThen(model => model.sendTextRequest(options));
    }

    public sendTextRequestStream(options: OpenAI.ChatCompletionCreateParamsStreaming, onChunkReceived: (chunk: AI.Text.Response) => void): AsyncResult<void, Error> {
        return this
            .getModel()
            .andThen(model => model.sendTextRequestStream(options, onChunkReceived));
    }

    // [private helper methods]

    private __constructModel(options: AI.Text.IModelOptions): AI.Text.Model {
        let model: AI.Text.Model;

        switch (options.type) {
            case AI.Text.ModelType.GPT:
                model = new TextGPTModel(options);
                break;
            case AI.Text.ModelType.DeepSeek:
            default:
                model = new TextDeepSeekModel(options);
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
