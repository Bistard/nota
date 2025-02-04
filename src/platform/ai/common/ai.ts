import * as AIText from "src/platform/ai/common/aiText";

export namespace AI {

    /**
     * A name list of popular LLM models.
     */
    export const enum ModelType {
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

    export import Text = AIText.AIText;
}
