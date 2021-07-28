# MarkdownNote
An open-sourced markdown editor.

# to do
* [ ] theme
  * [ ] dynamically change .svg color
* [x] titleBar
  * [x] ~~bug: cannot remove menu properly~~
  * [x] icon
    * [x] switch mask-image to sth else
    * [x] maxBtn
      * [x] maxBtn switch to restoreBtn
      * [ ] holding onclick can change to mode 'always on top'
* [x] folderView
  * [x] interactive size
    * [x] middle three point button style
  * [x] folder tree view
    * [x] open empty folder dialog
    * [x] display current working directory
      * [x] new UI
      * [x] scrollable
      * [x] indent
      * [ ] node functionality
        * [ ] expand
        * [ ] close
        * [ ] focus
        * [ ] manual move order
  * [ ] functionality
    * [ ] filter folders/files
    * [ ] right-click
    * [ ] config
      * [ ] directory config with local save
* [ ] gitView
  * [ ] functionality
    * [ ] .git
  * [ ] timeline view
* [x] mdView
  * [x] vditor preview
  * [ ] vditor needs to be rendered before window created
  * [x] open and render a .md file (by inserting plainText)
  * [x] tool bar
    * [ ] remove default tool bar
* [ ] file tab bar
  * [ ] color
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
