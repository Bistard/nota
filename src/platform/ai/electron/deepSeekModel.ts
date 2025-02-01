import OpenAI from "openai";
import { AI } from "src/platform/ai/common/ai";
import { TextSharedOpenAIModel } from "src/platform/ai/electron/openAIModel";

export class TextDeepSeekModel extends TextSharedOpenAIModel implements AI.Text.Model {
    
    // [field]

    public readonly type = AI.Text.ModelType.DeepSeek;

    // [constructor]

    constructor(options: AI.Text.IModelOptions) {
        options.baseURL = 'https://api.deepseek.com';
        super(new OpenAI({ ...options }));
    }

    // [override methods]

    protected override __createNonStreamingSingleMessage(choice: OpenAI.Chat.Completions.ChatCompletion.Choice): AI.Text.SingleMessage {
        return {
            content: choice.message.content,
            reasoning_content: choice.message['reasoning_content'],
            finishReason: choice.finish_reason,
            role: choice.message.role,
        };
    }
    protected override __createStreamingSingleMessage(choice: OpenAI.Chat.Completions.ChatCompletionChunk.Choice): AI.Text.SingleMessage {
        return {
            content: choice.delta.content,
            reasoning_content: choice.delta['reasoning_content'],
            finishReason: choice.finish_reason,
            role: choice.delta.role,
        };
    }
}