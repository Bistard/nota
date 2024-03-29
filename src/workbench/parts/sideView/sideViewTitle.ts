import { Widget } from "src/base/browser/basic/widget";

/**
 * @class The base class for top view part in the side view. The title part can
 * be ignored since the `render()` is decided by `ISideView`.
 */
export class SideViewTitlePart extends Widget {

    public override render(element: HTMLElement): void {
        element.classList.add('side-view-title');
        super.render(element);
    }
}
