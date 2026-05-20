import * as vscode from 'vscode';
import * as yaml from 'js-yaml';

interface YamlNode {
	[key: string]: string | YamlNode;
}

const SENTINEL = '__yamlpath_sentinel__';

export function activate(context: vscode.ExtensionContext) {

	function dfs(obj: YamlNode, path: string[], searchStr: string): string[] | undefined {
		let testPath: string[];
		for(const key in obj) {
			testPath = JSON.parse(JSON.stringify(path));
			testPath.push(key);
			if(obj[key] === searchStr) {
				return testPath;
			} else if(typeof obj[key] === 'object') {
				const dfsResult = dfs(obj[key] as YamlNode, testPath, searchStr);
				if(dfsResult !== undefined) {
					return dfsResult;
				}
			}
		}
	}

	let disposable = vscode.commands.registerCommand('extension.jnyamlpath.copy', () => {
		const textEditor = vscode.window.activeTextEditor;
		if(textEditor !== undefined) {
			const selectedLine = textEditor.selection.active.line;
			const selection = new vscode.Selection(0, 0, selectedLine, textEditor.document.lineAt(selectedLine).range.end.character);
			const yamlString = textEditor.document.getText(selection);
			const yamlLines = yamlString.split(/\r?\n/);
			const lastLine = yamlLines[yamlLines.length - 1];
			const propertyData = lastLine.split(':', 1);
			propertyData[1] = `'${SENTINEL}'`;
			yamlLines[yamlLines.length - 1] = propertyData.join(': ');
			const yamlData = yaml.safeLoad(yamlLines.join("\n"));

			const objPath = dfs(yamlData, [], SENTINEL);
			let resultObject = {};
			if(objPath !== undefined) {
				for(const key of objPath.reverse()) {
					resultObject = {
						[key]: resultObject
					};
				}
				const result = yaml.safeDump(resultObject);
				vscode.env.clipboard.writeText(result);
				vscode.window.showInformationMessage(`YAML path copied to clipboard`);
			} else {
				vscode.window.showWarningMessage(`Could not determine YAML path for the selected line`);
			}
		}
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
