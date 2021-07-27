# MarkdownNote
An open-sourced markdown editor.

# to do
* [x] titleBar
  * [x] ~~bug: cannot remove menu properly~~
  * [x] icon
  * [ ] dynamically change .svg color
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
      * [ ] new UI
      * [ ] scrollable
      * [ ] indent
      * [ ] node functionality
        * [ ] expand
        * [ ] close
        * [ ] manual move order
  * [ ] functionality
    * [ ] filter folders/files
    * [ ] right-click
    * [ ] config
      * [ ] directory config with local save
* [x] mdView
  * [x] vditor preview
  * [ ] vditor needs to be rendered before window created
  * [x] open and render a .md file (by inserting plainText)
  * [x] tool bar
    * [ ] remove default tool bar
  * [ ] file tab bar
    * [ ] different color
* [x] preload.js
  * [x] error: winMian is not found
* [x] Organiize Code
  * [ ] reduce suing document.getElementById()
  * [x] using classes
  * [X] Settings (Config)
    * [ ] UI config

# bugs
* [x] disabled vditor cache will displays some weird text
* [ ] since opening file is essentially inserting text, we need to clean history immediately
* [ ] fix - folderView.js - remove emptyFolderTag correctly
# ChangeLog
* 💙 => 'debug'
* 💛 => 'unstable'
* 💚 => 'stable'
* 🧡 => 'bug found'
* 🖤 => 'bug fix'
* 🤍 => 'others'
