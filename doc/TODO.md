# to do
* [x] ⭐theme
  * [x] dynamically change .svg color
  * [x] UI redesign (big update)
* [x] ⭐actionBarView
  * [x] UI
    * [ ] app icon
    * [x] folderView
    * [x] outlineView
    * [ ] searchView
    * [ ] gitView
    * [ ] settings
    * [ ] ...
  * [ ] ...
  * [x] functionality
    * [x] focus
    * [x] switch
* [x] ⭐actionView
  * [x] functionality
    * [x] switch action view
      * [ ] UI
    * [ ] ...
  * [x] folderView
    * [x] interactive size
      * [x] middle three point button style
    * [x] folder tree view
      * [x] open empty folder dialog
      * [x] display current working directory
      * [x] functionality 
        * [x] new UI
          * [x] folder indent line
          * [x] more fluent scroll bar animation
          * [ ] when open a newTab, tabBar will scroll to the newTab position
        * [x] scrollable
        * [x] indent
        * [x] node functionality
          * [x] expand
          * [x] collapse
          * [ ] focus
          * [ ] manually switch file/folder's order
          * [ ] ...
      * [ ] functionality
        * [ ] auto update folder tree
        * [ ] expandALL/collapseALL
        * [ ] refresh
        * [ ] search
        * [ ] filter folders/files
        * [ ] right-click
        * [ ] config
          * [ ] directory config with local save
    * [x] outlineView
      * [ ] UI
        * [ ] ...
      * [ ] functionality
        * [ ] ...
      * [ ] ...
* [x] ⭐contentView
  * [x] titleBarView
    * [x] ~~bug: cannot remove menu properly~~
    * [x] icon
      * [x] switch mask-image to sth else
      * [x] maxBtn
        * [x] maxBtn switch to restoreBtn
        * [ ] holding onclick can change to mode 'always on top'
    * [x] toolBarView
      * [x] UI
        * [x] modeSwitch
        * [x] markdownToolBar
        * [x] tabBarView
          * [x] UI
            * [ ] good design - https://freefrontend.com/css-tab-bars/
            * ~~invisible when no tab is opened (included in UI redesign)~~
            * [x] horizontal scroll
              * [x] more fluent animation
              * [x] use middle mouse to scroll
              * [ ] tab view follows openTab
            * [x] color
          * [x] basic functionality
            * [ ] open tab will create a new markdown editor
            * [ ] right lick menu
            * [ ] change order
            * [x] close tab
              * [x] if auto-save is on, close tab will save file async
            * [x] shortcut
              * [x] using lib
            * [ ] empty click create temp file
      * [x] functionality
        * [x] able to expand and collapse
  * [x] markdownView
    * [x] md preview
      * [x] update @toast-editor to v3.0
      * [ ] reading mode (using viewer from v3.0)
    * ~~md needs to be rendered before window created (not sure if still necessary)~~
    * [x] open and render a .md file (by inserting plainText)
    * [x] tool bar
      * [x] remove default tool bar
        * [x] custom tool bar
      * [x] disable ctrl+R shortcut
    * [x] plugin
      * [x] Plugin to highlight code syntax
        * [x] import all languages
      * [x] Plugin to color editing text
      * [ ] Plugin to merge table columns
    * [x] functionality
      * [x] display file
        * [ ] default: displaying xxxx lines, if needed, see more in settings
      * [x] edit file
        * [x] delay callback
        * [ ] read/write behaviours depending on the size of file
      * [x] shortcut (ctrl+z || ctrl+shift+z and so on)
      * [ ] paste with plain text
* [x] ⭐Refactoring
  * [ ] register
* [x] ⭐Others
  * [ ] author preface (Chinese version)
  * [x] new folders
    * [x] doc
    * [ ] test
    * [ ] script
    * [x] src/code/browser
  * [x] install typescript
    * [x] refactor all javascript codes
      * [x] config.ts && main.module.ts
  * [x] code big refactoring
  * [x] error handling
    * [ ] local log system
  * [x] code comments
  * [ ] implement MVC (modle / view / controller) - https://stackoverflow.com/questions/16736483/best-way-to-organize-jquery-javascript-code-2013
  * [x] preload.js
  * [ ] remove using document.getElementById() instead using JQuery (maybe? check performance)
    * [x] error: winMian is not found
  * [ ] reduce frequency of using document.getElementById()
  * [x] using classes
  * [X] Settings (Config)
    * [ ] UI config
  * [ ] get used of 'github issue'

## main topic
* html
* css
* javascript
* typescript
* nodejs
* electron
* webpack
* jquery