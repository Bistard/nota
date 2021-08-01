# MarkdownNote (still in progress)
An open-sourced markdown editor && noteTaking desktop application based on .md

基于markdown管理的笔记软件

# expect feature

* supports WYSIWYG (rich text), instant rendering, tranditional split view editing
* supports git and github
* provides great noteTaking-like user experience

# to do
* [ ] ⭐theme
  * [ ] dynamically change .svg color
  * [ ] UI redesign (big update)
* [x] ⭐titleBarView
  * [x] ~~bug: cannot remove menu properly~~
  * [x] icon
    * [x] switch mask-image to sth else
    * [x] maxBtn
      * [x] maxBtn switch to restoreBtn
      * [ ] holding onclick can change to mode 'always on top'
  * [ ] ...
* [x] ⭐folderView
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
    * [ ] filter folders/files
    * [ ] right-click
    * [ ] config
      * [ ] directory config with local save
* [x] ⭐markdownView
  * [x] md preview
  * ~~md needs to be rendered before window created (not sure if still necessary)~~
  * [x] open and render a .md file (by inserting plainText)
  * [x] tool bar
    * [ ] remove default tool bar
    * [x] disable ctrl+R shortcut
  * [x] functionality
    * [x] display file
      * [ ] default: displaying xxxx lines, if needed, see more in settings
    * [ ] 🏃‍edit file
      * [x] delay callback
    * [ ] shortcut (ctrl+z || ctrl+shift+z and so on)
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

# bugs
* [ ] (debug state) since opening file is essentially inserting text, we need to clean history immediately
* [x] fix - folderView.js - remove emptyFolderTag correctly
# ChangeLog
* ⭐ => 'big update'
* 💙 => 'debug'
* 💛 => 'unstable'
* 💚 => 'stable'
* 🧡 => 'bug found'
* 🖤 => 'bug fix'
* 🤍 => 'others'
