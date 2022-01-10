import { Disposable } from "src/base/common/dispose";
import { addDisposableListener, EventType, Orientation } from "src/base/common/dom";
import { ICreateable } from "src/code/browser/workbench/component";


export interface ISashOpts {
    orientation: Orientation;
}

/**
 * @description A {@link Sash} is a UI component that allows the user to resize
 * other components (using events). It's usually an invisible horizontal or 
 * vertical line which, when hovered, becomes highlighted and can be dragged 
 * along the perpendicular dimension to its direction.
 */
export class Sash extends Disposable implements ICreateable {

    /* The HTMLElement of the sash, will be created by calling `this.create()`. */
    private element: HTMLElement | undefined;
    /* The parent HTMLElement to be append to. Will be appended by calling `this.create()`. */
    private parentElement: HTMLElement;

    private disposed: boolean = false;

    /** 
     * {@link Orientation.Horizontal} means dragging horizontally.
     * {@link Orientation.vertical} means dragging vertically.
     */
    private orientation: Orientation;

    /* Constructor */
    constructor(parentElement: HTMLElement, opts?: ISashOpts) {
        super();

        this.parentElement = parentElement;

        if (opts) {
            this.orientation = opts.orientation;
        } else {
            this.orientation = Orientation.Horizontal;
        }
    }

    public override dispose(): void {
        super.dispose();
        this.element?.remove();
        this.disposed = true;
    }

    public create(): void {
        if (this.element || this.disposed) {
            return;
        }
        
        // render
        this.element = document.createElement('div');
        this.element.classList.add('sash');
        this.parentElement.append(this.element);
    }

    public registerListeners(): void {
        if (this.element === undefined) {
            return;
        }
        
        this.__register(addDisposableListener(this.element, EventType.mousedown, 
            // using anonymous callback to avoid `this` argument ambiguous.
            (e) => { 
                this._initDrag(e);
            }
        ));
    }

    /***************************************************************************
     * Private Helper Functions
     **************************************************************************/

    /* The start of coordinate (x / y) when mouse-downed. */
    private startCoordinate: number = 0;
    /* The start of dimension (width or height) of the sash when  mouse-downed. */
    private startDimention: number = 0;

    /**
     * @description Once the {@link Sash} has been mouse-downed, function will 
     * be invoked to achieve draggable animation.
     * @param event The mouse event when the mouse-downed.
     */
    private _initDrag(event: MouseEvent): void {
        
        /**
         * @readonly Comments on implementation of using local variable callbacks.
         *  1. So that listener can be removed properly.
         *  2. So that `this` argument is referring to Sash object instead of the actual HTMLElement.
         */

        // draging horizontally
        if (this.orientation === Orientation.Horizontal) {

            const doDragHelper = (event: MouseEvent) => {
                this.element!.style.left = (this.startDimention + event.clientX - this.startCoordinate) + 'px';
            };
    
            const stopDragHelper = () => {
                document.documentElement.removeEventListener(EventType.mousemove, doDragHelper, false);
                document.documentElement.removeEventListener(EventType.mouseup, stopDragHelper, false);
            }

            this.startCoordinate = event.clientX;
            this.startDimention = parseInt(document.defaultView!.getComputedStyle(this.element!).left, 10);

            document.documentElement.addEventListener(EventType.mousemove, doDragHelper, false);
            document.documentElement.addEventListener(EventType.mouseup, stopDragHelper, false);
        } 
        
        // draging vertically
        else {
            
            const doDragHelper = (event: MouseEvent) => {
                this.element!.style.top = (this.startDimention + event.clientY - this.startCoordinate) + 'px';
            };
    
            const stopDragHelper = () => {
                document.documentElement.removeEventListener(EventType.mousemove, doDragHelper, false);
                document.documentElement.removeEventListener(EventType.mouseup, stopDragHelper, false);
            }

            this.startCoordinate = event.clientY;
            this.startDimention = parseInt(document.defaultView!.getComputedStyle(this.element!).top, 10);

            document.documentElement.addEventListener(EventType.mousemove, doDragHelper, false);
            document.documentElement.addEventListener(EventType.mouseup, stopDragHelper, false);
        }
    }

}