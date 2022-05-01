<h1 align="center">Nota (开发中)</h1>
<div align="center">
  |
  <a href="README.md">en</a>
  |
  <a href="doc/readme/zh-cn.md">zh-cn</a>
  |
  <a href="doc/readme/zh-tw.md">zh-tw</a>
  |
</div>

<br>

一款开源、提供WYSIWYG和良好的笔记用户体验的笔记软件 / markdown编辑器。(如果你对该项目感兴趣，非常欢迎联系我😀~ 目前开发周期还很长).

## 🚪传送门
- [💖特性](#💖特性)
- [👁‍🗨截图](#👁‍🗨截图-2022116)
- [🏃开始使用！](#🏃-开始使用)
- [📚维基](https://github.com/Bistard/nota/wiki)
- [💭讨论](https://github.com/Bistard/nota/discussions)
- [💎进度](https://github.com/Bistard/nota/discussions/88)


## 💖特性
* [x] Supports markdown WYSIWYG
> * Currently we are using *milkdown* as our markdown WYSIWYG rendering framework. After the most of the functionalities are done, we are aiming to build our own markdown WYSIWYG rendering (more performant).
* [ ] Great note-taking-like user experience
> * *Nota* has potentials to create a neat and powerful notebook structure and users are able to achieve infinitely page nesting.
> 
> * For new users, people are able to create different notebooks, and manage their notes (markdown files) by dragging and dropping pages easily.
> 
> * For users who already has tons of raw markdown files, application can automatically resolve directories and builds the corresponding notebook structures.
* [ ] Side-way outline display
> * Not just like Typora or marktext, you need to click the sidebar to see the outline of the current markdown file, our application is able to render the outline on the sideway directly for convenience purposes.
* [x] Performant scrolling rendering
> * For any scrolling components, things will only be rendered within the viewport. In our cases, directory displaying and markdown WYSIWYG rendering (in our future version) this technology will be used.
* [ ] Supports git extension
> * Our application will support git (similar to vscode) as default.
* [ ] Supports themes
> * We will provide a few default themes. In addition, users may customize their own themes using plugins.

## 👁‍🗨截图 (2022.1.16)
> * The current (2022.4.30) UI design is far away from GOOD.
> 
> * Since we haven't come up with a perfect UI design for *Nota*, we are still working on the foundation (backend) of the applications. That is why the screenshot has not been updated for a while.
> * If you are good at software UI design, you are welcome to contact with me!

![screenshot](../../doc/images/2022.1.16.png)

## 🏃 开始使用！
How to run the application from the source code:
```
git clone https://github.com/Bistard/nota.git
cd nota
npm install
npm start
```