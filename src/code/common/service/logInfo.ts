

export enum LogPathType {
    APP,
    NOTEBOOKMANAGER
};

export interface LogInfo {
    message: string;
    date: Date;
    path: LogPathType;    
};
