# MarkdownNote
An open-sourced markdown editor.

# next TimeLine
* folderView
  * expand && collapse
* markdownView
  * remove default toolBar
* tabView
  * UI
  * open tab
* markdownView
  * show tab
# to do
* [ ] ⭐theme
  * [ ] dynamically change .svg color
* [x] ⭐titleBarView
  * [x] ~~bug: cannot remove menu properly~~
  * [x] icon
    * [x] switch mask-image to sth else
    * [x] maxBtn
      * [x] maxBtn switch to restoreBtn
      * [ ] holding onclick can change to mode 'always on top'
  * [ ] more
* [x] ⭐folderView
  * [x] interactive size
    * [x] middle three point button style
  * [x] folder tree view
    * [x] open empty folder dialog
    * [x] display current working directory
      * [x] new UI
      * [x] scrollable
      * [x] indent
      * [x] node functionality
        * [ ] expand
        * [ ] collapse
        * [ ] focus
        * [ ] manual move order
  * [ ] functionality
    * [ ] filter folders/files
    * [ ] right-click
    * [ ] config
      * [ ] directory config with local save
* [x] ⭐markdownView
  * [x] vditor preview
  * [ ] vditor needs to be rendered before window created
  * [x] open and render a .md file (by inserting plainText)
  * [x] tool bar
    * [ ] remove default tool bar
* [ ] ⭐tabView
  * [ ] UI
  * [ ] color
* [ ] ⭐gitView
  * [ ] functionality
    * [ ] .git
  * [ ] timeline view
* [x] preload.js
  * [x] error: winMian is not found
* [x] Organiize Code
  * [ ] reduce frequency of using document.getElementById()
  * [x] using classes
  * [X] Settings (Config)
    * [ ] UI config

# bugs
* [x] disabled vditor cache will displays some weird text
* [ ] since opening file is essentially inserting text, we need to clean history immediately
* [x] fix - folderView.js - remove emptyFolderTag correctly
# ChangeLog
* 💙 => 'debug'
* 💛 => 'unstable'
* 💚 => 'stable'
* 🧡 => 'bug found'
* 🖤 => 'bug fix'
* 🤍 => 'others'
