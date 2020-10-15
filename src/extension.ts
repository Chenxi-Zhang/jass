import * as vscode from 'vscode';
import { init, programs } from './provider/data-provider';

export function activate() {
    const a = programs();
    init();
    console.log("hello");
    
}

export function deactivate() {}
