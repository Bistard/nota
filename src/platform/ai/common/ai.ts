import { Disposable } from "src/base/common/dispose";
import * as AIText from "src/platform/ai/common/aiText";

export namespace AI {

    /**
     * A name list of popular LLM models.
     */
    export const enum ModelName {
        ChatGPT = 'ChatGPT',
        DeepSeek = 'DeepSeek',
    }

    /**
     * A name list of different modalities.
     */
    export const enum Modality {
        Text = 'text',
        Voice = 'voice',
        Image = 'image',
        Video = 'video',
    }

    export interface ILLMModel extends Disposable {
        readonly modality: AI.Modality;
        readonly name: AI.ModelName;

        readonly apiKey: string;
        setAPIKey(newKey: string): void;
    }

    export import Text = AIText.AIText;
}
