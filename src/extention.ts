import { spawn } from "child_process";
import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
	vscode.languages.registerDocumentFormattingEditProvider("monkeyc", {
		provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
			var child = spawn(
				`${vscode.extensions.getExtension("ghisguth.monkey-c")!.extensionPath}/LLVM/bin/clang-format.exe`,
				[document.fileName, "-i", "--style=file", "--fallback-style=google"]
			);
			return [];
		}
	});
}
