import * as AIText from "src/platform/ai/common/aiText";

export namespace AI {

    /**
     * A name list of popular LLM models.
     */
    export const enum ModelType {
        ChatGPT = 'ChatGPT',
        DeepSeek = 'DeepSeek',
    }

    export import Text = AIText.AIText;
}
