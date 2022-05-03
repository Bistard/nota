<h1 align="center">Nota (In Developing)</h1>
<div align="center">
  |
  <a href="README.md">english</a>
  |
  <a href="doc/readme/zh-cn.md">简体</a>
  |
  <a href="doc/readme/zh-tw.md">繁体</a>
  |
</div>

<br>

An open-sourced note-taking desktop application / markdown editor that provides WYSIWYG and noteTaking-like user experience.

## 🚪Portals
- [🌎Why Me?](#🌎Why-Me?)
- [💖Features](#💖features)
- [👁‍🗨Screenshots](#👁‍🗨screenshots)
- [✅Get Started](#✅get-started)
- [💌Contributing](#💌contributing)
- [📦Architecture](#📦Architecture)

## 🌎Why Me?
> * *Nota* is a free and open-sourced project. Rich text based note-taking application is not really my thing, that is why I choose Markdown (plain text) as the only way to store our data. 
> * For users who do not know about Markdown, don't worry about it because *Nota* provides a great user experience that makes you can work just like the others.
> * You can access all your data freely at any time because it is stored in your local disk.
> * Since the data and *Nota* have no longer binding to each other, you may use any cloud services to store your data.
> * You don't need to worry about what happens to your data if *Nota* no longer being updated after 10 years. All you need to do is use another markdown editor to open your local data.
> * *Nota* supports all the basic writing functionalities from Markdown. If you require more advanced note-taking skills, go try the other rich text applications.

## 💖Features
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

## 👁‍🗨Screenshots
> * The current (2022.4.30) UI design is far away from GOOD.
> 
> * Since we haven't come up with a perfect UI design for *Nota*, we are still working on the foundation (backend) of the applications. That is why the screenshot has not been updated for a while.
> * If you are good at software UI design, you are welcome to contact with me!

![screenshot](./doc/images/2022.1.16.png)

## ✅Get Started
How to run the application from the source code:
```
git clone https://github.com/Bistard/nota.git
cd nota
npm install
npm start
```

## 💌Contributing
* 🥰Welcome to post any ideas or improvements in our github discussion section which can be found [here](https://github.com/Bistard/nota/discussions).
* 🤔Report bugs or request new features to [here](https://github.com/Bistard/nota/issues).
* 😆If you requires further discussions or wanna join us, you may [contact me in personal](https://github.com/Bistard).

## 📦Architecture
> * First of all, by reading the goodness of vscode source code, *Nota* decided not to use any existing frameworks, instead we are basically building everything from the scratch. If you read the source code of *Nota* carefully, you may find that there are some similarities compared to vscode.
> * Secondly, there are lots of functionalities that are separated into tons of microservices which are managed by our own DI system (Dependency Injection) to achieve the idea of IoC (Inversion of Control).
> * Thirdly, some places are built by the idea of MVVM (Model-View-ViewModel), one of them is how we display our tree-like structure.
> * There should be more to be disscussed, but I guess I will stop from here and do some code now.