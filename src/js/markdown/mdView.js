const { ipcRenderer } = require("electron")

const markdown = document.getElementById('md')

class MarkDownViewModule {
    constructor() {
        this.toolBar = null
        this.vditor = this.createMarkdownEditor(this.initToolBarConfig())
        this.setListeners()
    }

    setListeners() {
        
    }

    initToolBarConfig() {
        let toolBar = [
                'emoji',
                'headings',
                'bold',
                'italic',
                'strike',
                'link',
                '|',
                'list',
                'ordered-list',
                'check',
                'outdent',
                'indent',
                '|',
                'quote',
                'line',
                'code',
                'inline-code',
                'insert-before',
                'insert-after',
                '|',
                'upload',
                'record',
                'table',
                '|',
                'undo',
                'redo',
                '|',
                'edit-mode',
                'content-theme',
                'code-theme',
                'export',
                {
                    name: 'more',
                    toolbar: [
                        'fullscreen',
                        'both',
                        'preview',
                        'info',
                        'help',
                    ],
                }
            ]
        return toolBar
    }

    createMarkdownEditor(toolbar) {
        let vditor =
            new Vditor(markdown, {
                toolbar,
                toolbarConfig: {
                    hide: false,
                    pin: false,
                },
                mode: 'ir',
                height: 'auto',
                width: 'auto',
                outline: {
                    enable: false,
                    position: 'right',
                },
                cache: {
                    enable: false, // BUG: occurs when false
                    id: 'vditor'
                },
                comment: {
                    enable: false,
                },
                debugger: true,
                typewriterMode: true,
                preview: {
                    mode: 'both',
                    maxWidth: 800,
                    hljs: {
                        enable: true,
                        style: 'github',
                        lineNumber: true,
                    },
                    markdown: {
                        toc: true,
                        mark: true,
                        footnotes: true,
                        autoSpace: true,
                    },
                    math: {
                        engine: 'KaTeX',
                    },
                },
                counter: {
                    enable: true,
                    type: 'text',
                },
                hint: {
                    emojiPath: 'https://cdn.jsdelivr.net/npm/vditor@1.8.3/dist/images/emoji',
                    emojiTail: '<a href="https://ld246.com/settings/function" target="_blank">设置常用表情</a>',
                    emoji: {
                        '+1': '👍',
                        '-1': '👎',
                        'heart': '❤️',
                        'cold_sweat': '😰'
                    },
                    parse: true,
                    extend: [
                        {
                            key: '@',
                            hint: (key) => {
                                console.log(key)
                                if ('vanessa'.indexOf(key.toLocaleLowerCase()) > -1) {
                                    return [
                                        {
                                            value: '@Vanessa',
                                            html: '<img src="https://avatars0.githubusercontent.com/u/970828?s=60&v=4"/> Vanessa',
                                        }]
                                }
                                return []
                            },
                        },
                        {
                            key: '#',
                            hint: (key) => {
                                console.log(key)
                                if ('vditor'.indexOf(key.toLocaleLowerCase()) > -1) {
                                    return [
                                        {
                                            value: '#Vditor',
                                            html: '<span style="color: #999">#Vditor</span> ♏ 一款浏览器端的 Markdown 编辑器，支持所见即所得（富文本）、即时渲染（类似 Typora）和分屏预览模式。',
                                        }]
                                }
                                return []
                            },
                        }],
                },
                tab: '\t',
                icon: 'material',
                upload: {
                    accept: 'image/*,.mp3, .wav, .rar',
                    token: 'test',
                    url: '/api/upload/editor',
                    linkToImgUrl: '/api/upload/fetch',
                    filename(name) {
                        return name.replace(/[^(a-zA-Z0-9\u4e00-\u9fa5\.)]/g, '').
                            replace(/[\?\\/:|<>\*\[\]\(\)\$%\{\}@~]/g, '').
                            replace('/\\s/g', '')
                    },
                },
            })
        return vditor
    }

}

let markDownModule = new MarkDownViewModule()
window.vditor = markDownModule.vditor
    
window.onload = function () {
    let toolBar = document.getElementsByClassName('vditor-toolbar')[0]
    markdown.removeChild(toolBar)
}



module.exports = { MarkDownViewModule }
