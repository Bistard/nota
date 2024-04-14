import { Widget } from "src/base/browser/basic/widget";

/**
 * @class The base class for top view part in the side view. The title part can
 * be ignored since the `render()` is decided by `INavigationView`.
 */
export class NavigationViewTitlePart extends Widget {

    public override render(element: HTMLElement): void {
        element.classList.add('navigation-view-title');
        super.render(element);
    }
}
