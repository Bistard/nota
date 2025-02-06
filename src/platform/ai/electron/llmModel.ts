import { Disposable } from "src/base/common/dispose";
import { AI } from "src/platform/ai/common/ai";

/**
 * A base class for all LLM-related models.
 */
export abstract class LLMModel extends Disposable implements AI.ILLMModel {
    
    // [fields]

    public readonly abstract modality: AI.Modality;
    public readonly abstract name: AI.ModelName;

    // [constructor]

    constructor() {
        super();
    }

    // [abstract]

    abstract get apiKey(): string;
    public abstract setAPIKey(newKey: string): void;
}