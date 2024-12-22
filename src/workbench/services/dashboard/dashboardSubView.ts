import { Priority } from "src/base/common/event";

export interface IDashboardSubView {
    /**
     * The unique identifier of the subview.
     */
    readonly id: string;

    /**
     * The priority of the subview when determining its display order.
     * Subviews with higher priority are displayed before others.
     * @default Priority.Low
     */
    priority?: Priority;

    /**
     * Renders the subview and appends it to the provided parent element.
     * @param parentElement - The DOM element to append the rendered subview to.
     * @returns The rendered subview element.
     */
    render(parentElement: HTMLElement): HTMLElement;

    /**
     * Cleans up resources and removes the subview when it is no longer needed.
     */
    dispose(): void;
}

export interface IDashboardSubViewOpts {
    /**
     * The unique identifier of the dashboard view.
     */
    id: string;

    /**
     * When adding/removing subview, the view with higher priority will show at top
     * first.
     * @default Priority.Low
     */
    priority?: Priority;

    /**
     * The title of the subview, typically displayed as a header.
     */
    title?: string;

    /**
     * The content of the subview, which can include an array of strings.
     */
    content?: string[];
}
