# to do
* [x] ⭐theme
  * [x] dynamically change .svg color
  * [ ] UI redesign (big update)
* [x] ⭐titleBarView
  * [x] ~~bug: cannot remove menu properly~~
  * [x] icon
    * [x] switch mask-image to sth else
    * [x] maxBtn
      * [x] maxBtn switch to restoreBtn
      * [ ] holding onclick can change to mode 'always on top'
  * [ ] ...
* [x] ⭐actionBarView
  * [x] UI
    * [ ] app icon
    * [x] folderView
    * [ ] outlineView
    * [ ] searchView
    * [ ] gitView
    * [ ] settings
    * [ ] ...
  * [ ] ...
  * [x] functionality
    * [x] focus
    * [ ] switch
* [ ] ⭐actionView
  * [ ] functionality
    * [ ] switch action view
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
          * [ ] manual move order
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
    * [ ] outlineView
      * [ ] ...
* [x] ⭐markdownView
  * [x] md preview
    * [x] update @toast-editor to v3.0
    * [ ] reading mode (using viewer from v3.0)
  * ~~md needs to be rendered before window created (not sure if still necessary)~~
  * [x] open and render a .md file (by inserting plainText)
  * [x] tool bar
    * [ ] remove default tool bar
      * [ ] our own custom action-buttion-container
    * [x] disable ctrl+R shortcut
  * [x] plugin
    * [x] Plugin to highlight code syntax
    * [x] Plugin to color editing text
    * [ ] Plugin to merge table columns
  * [x] functionality
    * [x] display file
      * [ ] default: displaying xxxx lines, if needed, see more in settings
    * [x] edit file
      * [x] delay callback
    * [x] shortcut (ctrl+z || ctrl+shift+z and so on)
    * [ ] paste with plain text
* [x] ⭐tabView
  * [x] UI
    * [ ] good design - https://freefrontend.com/css-tab-bars/
    * ~~invisible when no tab is opened (included in UI redesign)~~
    * [x] horizontal scroll
      * [x] more fluent animation
      * [x] use middle mouse to scroll
      * [ ] tab view follows openTab
    * [x] color
  * [x] basic functionality
    * [ ] right lick menu
    * [ ] change order
    * [x] close tab
      * [ ] if auto-save is on, close tab will save file async
    * [x] shortcut
      * [x] using lib
    * [ ] empty click create temp file
* [ ] ⭐settingView
  * [ ] ...
* [ ] ⭐gitView
  * [ ] functionality
    * [ ] .git
  * [ ] timeline view
  * [ ] ...
* [x] ⭐Others
  * [ ] error handling
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
