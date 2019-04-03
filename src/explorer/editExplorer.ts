import { TreeItem, TreeDataProvider, EventEmitter, Event, Uri, ProviderResult } from 'vscode';
import * as path from 'path';
import { ext } from '../extensionVariables';

export class EditExplorerProvider implements TreeDataProvider<TreeItem> {
    private _onDidChangeTreeData: EventEmitter<TreeItem> = new EventEmitter<TreeItem>();
    public readonly onDidChangeTreeData: Event<TreeItem> = this._onDidChangeTreeData.event;

    public refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    public getTreeItem(element: TreeItem): TreeItem {
        element.command = {
            command: 'editExplorer.openFileResource',
            arguments: [element.resourceUri!],
            title: path.basename(element.resourceUri!.path)[0]
        };
        return element;
    }

    public getChildren(element?: TreeItem): ProviderResult<TreeItem[]> {
        if (element) return [];
        return getNoteContentFiles(ext.activeNote.id);
    }
}

function getNoteContentFiles(nId: string): TreeItem[] {
    const firstNote = new TreeItem(Uri.file(ext.dbFS.getNoteContentFile(nId, '1')), 0);

    const editNotes = ext.dbFS
        .getNoteContentFiles(nId)
        .filter((f: string) => ext.dbFS.getNoteContentFile(nId, '1') !== f)
        .map((f: string) => {
            const item = new TreeItem(Uri.file(f), 0);
            item.contextValue = 'editNoteNode';
            return item;
        });

    return [firstNote].concat(editNotes);
}
