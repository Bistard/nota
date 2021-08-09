type ActionViewType = 'none' | 'folder' | 'outline' | 'search' | 'git';

/**
 * @description ActionViewModule displays different action view such as 
 * folderView, outlineView, gitView and so on.
 */
export class ActionViewModule {

    public whichActionView: ActionViewType;

    constructor() {

        this.whichActionView = 'none'

    }

    /**
     * @description switch to that action view given a specific name.
     */
    public switchToActionView(actionViewName: ActionViewType): void {
        if (actionViewName == this.whichActionView) {
            return
        }
        
        this.displayActionViewTopText(actionViewName)
        this.hideActionViewContent()
        
        if (actionViewName == 'folder') {
            $('#folder-tree-container').show(0)
        } else if (actionViewName == 'outline') {
            $('#outline-container').show(0)
        } else if (actionViewName == 'search') {

        } else if (actionViewName == 'git') {
        
        } else {
            throw 'error'
        }

        this.whichActionView = actionViewName
    }

    /**
     * @description display given text on the action view top.
     */
    public displayActionViewTopText(name: string): void {
        if (name == 'folder') {
            $('#action-view-top-text').html('Notebook')
        } else if (name == 'git') {
            $('#action-view-top-text').html('Git Control')
        } else {
            $('#action-view-top-text').html(name)
        }
    }

    /**
     * @description simple function for hiding the current content of action view.
     */
    public hideActionViewContent(): void {
        $('#action-view-content').children().each(function() {
            $(this).hide(0)
        })
    }

    /**
     * @description NOT displaying action view.
     */
    public closeActionView(): void {
        $('#action-view').hide(0)
        $('#resize').hide(0)
    }
    
    /**
     * @description displays action view.
     */
    public openActionView(): void {
        $('#action-view').show(0)
        $('#resize').show(0)
    }

}
