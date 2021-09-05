## SEPTEMBER - 2021
### 9.5 changeLog
rename: file.ts to io.ts

---

### 9.4 changeLog

#7. fix: 重命名`notebookManger.ts`为`notebookManager.ts`.

#6. `workbench.ts`: 将NotebookManager注册进了Dependency Injection，新接口`INoteBookManagerService`:

![image](https://user-images.githubusercontent.com/38385498/132118991-e71c7efb-d0c2-4c84-bb92-c9df0b8a08a2.png)

#5. `component.ts`中，IComponent接口现在开放了`contentArea: HTMLElement | undefined`和`readonly componentMap: Map<string, Component>`.

#4. improve: `actionBarContextMenu.ts`减少了document.getElementById()的使用次数

#3. fix: ComponentService相关API的argument从Component改为IComponent
```ts
export interface IComponentService {
    register(component: IComponent, force?: boolean): void;
    unregister(component: IComponent | string): void;
    get(id: string): IComponent | null;
    printAll(): void;
}
```

#2. IActionBarService添加了一个新的暴露接口：`getButton(id: string): IButton | null;`

#1. 之前interface IWidget是个空的接口， 现在添加了3个新的properties， 2个为可选.
```ts
export interface IWidget {
    id?: string;
    element: HTMLElement;
    imgElement?: HTMLImageElement;
}
```

