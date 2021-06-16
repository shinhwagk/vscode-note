[![Marketplace Version](https://vsmarketplacebadge.apphb.com/version/shinhwagk.vscode-note.svg)](https://marketplace.visualstudio.com/items?itemName=shinhwagk.vscode-note)

# vscode-note

This extension provides a simple note-taking. Make notes closer to the vscode extensions.

## Features

- Fast and simple recording note
- Notes and vscode extensions together

## Concepts

- each **_domain_**(directory tree) node can be a **_notes_**.
- each **_notes_** consists of one or more **_category_**.
- each **_category_** consists of one or more **_note_**.
- each **_note_** consists of one or more **_short doc_**, **_doc_**(markdown/html), **_files_**(attachment)

## Modify notes data directory location -> vscode global settings.json
```json
{
  "vscode-note.dbpath": "D:\\OneDrive\\vscode-note-data", // default: ~/vscode-note
}
```
- strongly recommend use onedrive(similar products) to store/sync your notes data.

## Usages

1. [create domain and create category with note](#1-create-domain-and-create-category-with-note)
2. [create short documnt](#2-create-short-documnt)
3. [create document](#3-create-document)
4. [create files](#4-create-files)
5. [search notes](#5-search-notes)
6. [domain shortcut navigation](#6-domain-shortcut-navigation)

### 1 create domain and create category with note
![1](https://raw.githubusercontent.com/shinhwagk/vscode-note/master/images/1.gif)
### 2 create short document
![2](https://raw.githubusercontent.com/shinhwagk/vscode-note/master/images/2.gif)
### 3 create document
![3](https://raw.githubusercontent.com/shinhwagk/vscode-note/master/images/3.gif)
### 4 create files
![4](https://raw.githubusercontent.com/shinhwagk/vscode-note/master/images/4.gif)
### 5 search notes
![5](https://raw.githubusercontent.com/shinhwagk/vscode-note/master/images/search.gif)
### 6 domain shortcut navigation
![6](https://raw.githubusercontent.com/shinhwagk/vscode-note/master/images/6.jpg)
