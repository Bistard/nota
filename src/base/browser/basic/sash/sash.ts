import { Disposable } from "src/base/common/dispose";
import { addDisposableListener, EventType, Orientation } from "src/base/common/dom";
import { ComponentType, ICreateable } from "src/code/browser/workbench/component";


export interface ISashOpts {
    orientation: Orientation;
}

/**
 * @description A {@link Sash} is 
 */
export class Sash extends Disposable implements ICreateable {

    private element: HTMLElement | undefined;
    private parentElement: HTMLElement;
    private resizeElementID1: string;
    private resizeElementID2: string;

    private disposed: boolean = false;

    /** 
     * {@link Orientation.Horizontal} means sash moving horizontally.
     * {@link Orientation.vertical} means sash moving vertically.
     */
    private orientation: Orientation;

    constructor(parentElement: HTMLElement, resizeElementID1: string, resizeElementID2: string, opts?: ISashOpts) {
        super();

        this.parentElement = parentElement;
        this.resizeElementID1 = resizeElementID1;
        this.resizeElementID2 = resizeElementID2;

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

        this.__register(addDisposableListener(this.element, EventType.mousedown, (e) => { this._initDrag(e) }));
    }

    /***************************************************************************
     * Private Helper Functions
     **************************************************************************/

    private startCoordinate: number = 0;
    private startDimention: number = 0;

    private _initDrag(event: MouseEvent): void {
        
        if (this.orientation === Orientation.Horizontal) {

            const doDragHelper = (event: MouseEvent) => {
                this.element!.style.width = (this.startDimention + event.clientX - this.startCoordinate) + 'px';
            };
    
            const stopDragHelper = () => {
                document.documentElement.removeEventListener(EventType.mousemove, doDragHelper, false);
                document.documentElement.removeEventListener(EventType.mouseup, stopDragHelper, false);
            }

            this.startCoordinate = event.clientX;
            this.startDimention = parseInt(document.defaultView!.getComputedStyle(this.element!).width, 10);
            document.documentElement.addEventListener(EventType.mousemove, doDragHelper, false);
            document.documentElement.addEventListener(EventType.mouseup, stopDragHelper, false);
        } 
        
        else {
            const doDragHelper = (event: MouseEvent) => {
                this.element!.style.height = (this.startDimention + event.clientY - this.startCoordinate) + 'px';
            };
    
            const stopDragHelper = () => {
                document.documentElement.removeEventListener(EventType.mousemove, doDragHelper, false);
                document.documentElement.removeEventListener(EventType.mouseup, stopDragHelper, false);
            }

            this.startCoordinate = event.clientY;
            this.startDimention = parseInt(document.defaultView!.getComputedStyle(this.element!).height, 10);

            document.documentElement.addEventListener(EventType.mousemove, doDragHelper, false);
            document.documentElement.addEventListener(EventType.mouseup, stopDragHelper, false);
        }
    }

}