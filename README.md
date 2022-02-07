# 📕MarkdownNote (Developing - 开发中)
An open-sourced note-taking desktop application / markdown editor that provides WYSIWYG and noteTaking-like user experience.

基于markdown管理的笔记软件. (如果你对该项目感兴趣，非常欢迎联系我😀~ 目前开发周期还很长).

## 💖features
* [x] supports markdown WYSIWYG
> Currently we are using `milkdown` as our markdown WYSIWYG rendering framework. After the most of the functionalities are done, we are aiming to build our own markdown WYSIWYG rendering (more performant).
* [ ] great note-taking-like user experience
> For new users, people are able to create different notebooks, and manage their notes (markdown files) by dragging and moving pages easily.
> For users who already has tons of raw markdown files, application can automatically resolve directories and builds the corresponding notebook structures.
* [ ] side-way outline display
> Not just like Typora or marktext, you need to click the sidebar to see the outline of the current markdown file, our application is able to render the outline on the sideway directly for convenience purposes.
* [x] performant scrolling rendering
> For any scrolling components, things will only be rendered within the viewport. In our cases, directory displaying and markdown WYSIWYG rendering (in our future version) this technology will be used.
* [ ] supports git extension
> Our application will support git (similar to vscode) as default.
* [ ] supports themes
> We will provide a few default themes. In addition, users may customize their own themes using plugins.

## 👁‍🗨Screen shots (2022.1.16)
![screenshot](./doc/images/2022.1.16.png)

## 🚪portal
- [📚wiki](https://github.com/Bistard/MarkdownNote/wiki)
- [🚕Milestone](https://github.com/Bistard/MarkdownNote/wiki/Milestone)

## 🏃 Get Started (still in developing)
How to run the application from the source code:
```
git clone https://github.com/Bistard/MarkdownNote.git
cd MarkdownNote
npm install
npm start
```