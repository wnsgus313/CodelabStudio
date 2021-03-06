import * as vscode from "vscode";
import { getChatWebviewContent } from "./view";

// Create and show panel
export function chatOpenPanel(url:string, info:any) {
    const panel = vscode.window.createWebviewPanel(
        'chatroom',
        'Chat Room',
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true,
            enableCommandUris: true,
            enableFindWidget: true,
        }
    );

    const token = info.get('token');

    // And set its HTML content
    panel.webview.html = getChatWebviewContent(url, token);    
}