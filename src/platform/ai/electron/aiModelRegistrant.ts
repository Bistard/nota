import { Constructor } from "src/base/common/utilities/type";
import { AI } from "src/platform/ai/common/ai";
import { textModelRegister } from "src/platform/ai/common/aiModel.register";
import { IService } from "src/platform/instantiation/common/decorator";
import { IServiceProvider } from "src/platform/instantiation/common/instantiation";
import { IRegistrant, RegistrantType } from "src/platform/registrant/common/registrant";

type ModelConstructor = Constructor<
    AI.Text.Model,                          // instance
    [options: any, ...services: IService[]] // parameters
>;

/**
 * A main-process registrant that responsible for managing supported LLM models 
 * in our application. 
 * 
 * For example:
 *  - text: DeepSeek, ChatGPT, Llama, etc...
 *  - image: DeepSeek, ChatGPT, etc...
 *  - voice: ...
 *  - video: ...
 */
export interface IAIModelRegistrant extends IRegistrant<RegistrantType.AIModel> {
    registerModel(modality: AI.Modality, name: string, constructor: ModelConstructor): void;
    getRegisteredModel(modality: AI.Modality, name: string): ModelConstructor | undefined;
}

export class AIModelRegistrant implements IAIModelRegistrant {

    // [fields]

    public readonly type = RegistrantType.AIModel;
    private readonly _models: Map<AI.Modality, Array<{ name: string, ctor: ModelConstructor}>>;

    // [constructor]

    constructor() {
        this._models = new Map();
    }

    // [public methods]

    public initRegistrations(serviceProvider: IServiceProvider): void {
        textModelRegister(serviceProvider);
    }

    public registerModel(modality: AI.Modality, name: string, constructor: ModelConstructor): void {
        let models = this._models.get(modality);
        if (!models) {
            models = [];
            this._models.set(modality, models);
        }

        const matched = models.find(each => each.name === name);
        if (matched) {
            console.warn(`[AIModelRegistrant] Duplicate registration. Modality: ${modality}, name: ${name}.`);
            return;
        }

        models.push({ name: name, ctor: constructor });
    }

    public getRegisteredModel(modality: AI.Modality, name: string): ModelConstructor | undefined {
        const models = this._models.get(modality);
        if (!models) {
            return undefined;
        }
        
        const matched = models.find(each => each.name === name);
        return matched?.ctor;
    }
}