# 🏃‍to do
This todo list is currently maintained by Chris Li (@Bistard), Jody Zhou (@JodyZ0203), Sherry Li (@lixiaoru611), Cindy Yang (@cindy-cyber).

| mark        | Description |
| ----------- | ----------- |
| bullet      | not started |
| check mark  | completed   |
| 🚴‍♂️          | on-going    |
| 🚳          | not for now |
| ...         | lots of unfinished |

## Performance && Security
* [ ] ...
## Extension
* [ ] ...
## UI
* [x] Workbench
  * [ ] theme
    * [ ] light theme
    * [ ] dark theme
    * [ ] app icon
* [x] actionBar
  * [ ] ...
* [x] actionView
  * [x] folderView
    * [x] open empty folder dialog
    * [x] display current working directory
    * [ ] auto update folder tree/note tree
    * [x] tranditional folder tree explorer
        * [ ] styles when a file is selected
        * [ ] ...
    * [ ] note-taking-like explorer
      * [ ] custom order
      * [ ] custom indent
      * [ ] ...
  * [ ] outlineView
    * [ ] ...
  * [ ] searchView
    * [ ] ...
  * [ ] gitView
    * [ ] ...
  * [ ] settingView
    * [ ] ...
* [x] editor
  * [ ] ...

## Core Code
* [ ] 🚴‍♂️implement MVVM framework
* [x] workbench
  * [x] actionBar
    * [x] ...
  * [x] actionView
    * [ ] refresh
    * [x] able to switch
    * [x] resizeable
      * [ ] complete resize.ts
    * [x] node functionality
        * [x] expand
        * [x] collapse
        * [ ] right click functionalities
          * [ ] ...
        * [ ] ...
    * [x] able to open a dir
      * [ ] ...
  * [x] editor
    * [x] ...
  * [x] titleBar
    * [x] toolBar
      * [ ] ...
    * [x] tabBar
      * [ ] tabBar will scroll to the new tab position
      * [ ] ...
    * [x] windowBar
      * [x] basic functionality
      * [ ] 




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
      * [x] max-btn
        * [x] max-btn switch to restoreBtn
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
  * [x] register
  * [x] clean index.html
    * [x] add element programmatically
* [x] ⭐Others
  * [x] wiki
    * [ ] author preface (Chinese version)
  * [x] new folders
    * [x] doc
    * [ ] test
    * [ ] script
    * [x] src/code/browser
  * [x] install typescript
    * [x] refactor all javascript codes
      * [x] config.ts && main.module.ts
  * [x] vscode source code
    * [x] workbench.ts
    * [x] lifecycle.ts
    * [ ] editorAutosave.ts
    * [ ] instantiationService (dependency injection)
      * [ ] src/vs/platform/instantiation/common/instantiation.ts
      * [ ] createDecorator<>()
    * [x] absolute path
  * [x] code big refactoring
    * [ ] rewrite comments
    * [ ] rewrite foldertree.ts
    * [ ] implement MVVM (Model-View-Modelview)
      * [ ] model <----> viewmodel <--data binding--> view
      * [ ] achieve data binding
    * [x] services
      * [ ] complete src/base/node/file.ts
        * [ ] folder.ts
        * [ ] markdown.ts
        * [ ] tabBar.ts
        * [ ] toolBar.ts
    * [ ] dispose pattern
    * [ ] base/browser/ui
      * [ ] resize.ts
      * [ ] scrollbar.ts
    * ~~Workbench extends Component~~
  * [x] error handling
    * [ ] local log system
  * [x] code comments
  * ~~implement MVC (modle / view / controller) - https://stackoverflow.com/questions/16736483/best-way-to-organize-jquery-javascript-code-2013~~
  * [x] preload.js
  * [ ] remove using document.getElementById() instead using JQuery (maybe? check performance)
    * [x] error: winMian is not found
  * ~~reduce frequency of using document.getElementById()~~
    * still use document.getelementbyid() instead of jquery because it is faster
  * [x] using classes
  * [X] Settings (Config)
    * [ ] UI config
  * [ ] get used of 'github issue'

## 🐛bugs
- [x] (2021.8.5) fix: supports all languages for code syntax highlight
- [x] (2021.8.5) fix: chinese character display error 
- [ ] fix: code highlight symbol render error
- [ ] fix: markdown toolbar auto collapses
