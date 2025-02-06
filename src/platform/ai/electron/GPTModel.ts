import OpenAI from "openai";
import { AI } from "src/platform/ai/common/ai";
import { TextSharedOpenAIModel } from "src/platform/ai/electron/openAIModel";

export class TextGPTModel extends TextSharedOpenAIModel implements AI.Text.Model {
    
    // [field]

    public readonly name = AI.ModelName.ChatGPT;

    // [constructor]

    constructor(options: AI.Text.IModelOptions) {
        options.baseURL = undefined; // use default one 
        super(new OpenAI({ ...options }));
    }

    // [override methods]
    
    protected override __createNonStreamingSingleMessage(choice: OpenAI.Chat.Completions.ChatCompletion.Choice): AI.Text.SingleMessage {
        return {
            content: choice.message.content,
            reasoning_content: undefined,
            finishReason: choice.finish_reason,
            role: choice.message.role,
        };
    }
    protected override __createStreamingSingleMessage(choice: OpenAI.Chat.Completions.ChatCompletionChunk.Choice): AI.Text.SingleMessage {
        return {
            content: choice.delta.content,
            reasoning_content: undefined,
            finishReason: choice.finish_reason,
            role: choice.delta.role,
        };
    }
}