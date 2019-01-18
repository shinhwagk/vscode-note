import * as path from 'path';

import * as vscode from 'vscode';

import { VSNDatabase, VSNNote } from '../database';
import { ToWebView as twv } from './message';

const assetsFile = (extPath: string) => (name: string) => {
    const file = path.join(extPath, 'out', name);
    return vscode.Uri.file(file)
        .with({
            scheme: 'vscode-resource'
        })
        .toString();
};

function getWebviewContent(extPath: string) {
    const wFile = assetsFile(extPath);
    return `<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cat Coding</title>
        <script src="${wFile('react.production.min.js')}" crossorigin></script>
        <script src="${wFile('react-dom.production.min.js')}" crossorigin></script>
	</head>
    <body>
        <div id="root"></div>
        <script src="${wFile('main.wv.js')}"></script>
	</body>
	</html>`;
}

class VSNWebviewPanel {
    public panel: vscode.WebviewPanel | undefined = undefined;
    private state: boolean = false;
    private trayCnt: number = 0;
    private extPath: string;
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.extPath = context.extensionPath;
        this.context = context;
    }

    public initIfNeed() {
        if (!this.state) {
            this.init();
        }
    }

    public updateWebviewContent(domain: twv.VSNWVDomain): void {
        if (this.trayCnt >= 50) {
            vscode.window.showErrorMessage('webview update failse 50 times.');
            return;
        }
        if (!this.state) {
            setTimeout(() => this.updateWebviewContent(domain), 100);
            this.trayCnt += 1;
            return;
        }
        if (this.panel) {
            this.panel!.webview.postMessage(domain);
        }
    }

    private init() {
        this.createPanel();
        this.panel.onDidDispose(
            () => {
                this.panel = undefined;
                this.state = false;
                console.log('vsnote webview closed.');
            },
            null,
            this.context.subscriptions
        );
        this.panel.webview.onDidReceiveMessage(
            message => {
                if (message) {
                    this.state = true;
                }
            },
            undefined,
            this.context.subscriptions
        );
        this.panel.webview.html = getWebviewContent(this.extPath);
    }

    private createPanel() {
        this.panel = vscode.window.createWebviewPanel('catCoding', 'vscode-note', vscode.ViewColumn.One, {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.file(path.join(this.extPath, 'out'))]
        });
    }
}

export function VSNWebviewExplorer(context: vscode.ExtensionContext, db: VSNDatabase) {
    const vsnPanel = new VSNWebviewPanel(context);
    context.subscriptions.push(
        vscode.commands.registerCommand('updateOrCreateWebview', (dpath: string) => {
            vsnPanel.initIfNeed();
            const notes: VSNNote[] = db.selectNotes(dpath);
            const vsnDomain = fusionNotes(path.basename(dpath), notes);
            vsnPanel.updateWebviewContent(vsnDomain);
        })
    );
    return vsnPanel;
}

function fusionNotes(name: string, ns: VSNNote[]): twv.VSNWVDomain {
    const categorys: twv.VSNWVCategory[] = [];
    function testCategoryExist(name: string): boolean {
        return categorys.filter(c => c.name === name).length >= 1 ? true : false;
    }
    for (const n of ns) {
        if (!testCategoryExist(n.meta.category)) {
            categorys.push({ name: n.meta.category, notes: [] });
        }
        categorys.filter(c => c.name === n.meta.category)[0].notes.push({ id: n.id, contents: n.contents });
    }
    return { name, categorys };
}
