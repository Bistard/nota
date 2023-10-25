<!-- <p align="center"><img src="static/logo-small.png" width="100" height="100"></p> -->
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

Wisp is a next-gen Markdown note-taking desktop application designed for both education and professional development. It leverages generative AI for enriched note creation, organization, and suggestions.

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

- **Core Features**: 
  - _AI-Driven Features_: Automated note categorization, organization, and summarization using generative AI and prompt engineering.
  - _Cloud Serevices_:  We offer cloud services for note synchronization and backup functionalities.
  
- **Accessibility**: 
  - _Markdown WYSIWYG_: we are aiming to build our own markdown WYSIWYG rendering (more performant).
  - _Effortless Organization & Search_: Smooth sorting tools and enhanced search functionalities.
  - _User-Friendly Interface_: A clean and simple UI that helps users achieve their tasks seamlessly.
  - _Easy Data Transferring_: Emphasis on transparency, with user data managed via "Markdown". Your data remains exclusively yours.

- **Extensions**:
  - _Customization_: Third-party developers can easily create and publish their extensions/plugins through our provided community.

## 👁‍🗨Screenshots
> * The current (2022.11.05) UI design is far away from GOOD.
> 
> * Since we haven't come up with a perfect UI design for *Nota*, we are still working on the foundation (backend) of the applications. That is why the screenshot has not been updated for a while.
> * If you are good at software UI design, you are welcome to contact with me!

![screenshot](./doc/images/2022.11.5.png)

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
* 🧐We post our monthly roadmap to the github discussion section which you may check what are we doing everyday.

## 📦Architecture
> * First of all, by reading the goodness of vscode source code, *Nota* decided not to use any existing frameworks, instead we are basically building everything from the scratch. If you read the source code of *Nota* carefully, you may find that there are some similarities compared to vscode.
> * Secondly, there are lots of functionalities that are separated into tons of microservices which are managed by our own DI system (Dependency Injection) to achieve the idea of IoC (Inversion of Control).
> * Thirdly, some places are built by the idea of MVVM (Model-View-ViewModel), one of them is how we display our tree-like structure.
> * There should be more to be disscussed, but I guess I will stop from here and do some code now.
