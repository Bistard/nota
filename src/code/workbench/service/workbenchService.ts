import { Component } from "src/code/workbench/browser/component";

export interface IWorkbenchService {

    registerComponent(component: Component): void;

}