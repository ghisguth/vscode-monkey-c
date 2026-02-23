import { spawn } from "child_process";
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
var clang = require("clang-format");

export function findClangFormatFile(startDir: string): boolean {
	if (!startDir) return false;

	let currentDir = path.normalize(startDir);

	// Iterative approach to avoid stack overflow
	while (true) {
		if (
			fs.existsSync(path.join(currentDir, ".clang-format")) ||
			fs.existsSync(path.join(currentDir, "_clang-format"))
		) {
			return true;
		}

		const parent = path.dirname(currentDir);
		if (parent === currentDir || currentDir === path.parse(currentDir).root) {
			break;
		}
		currentDir = parent;
	}

	return false;
}

export function formatMonkeyC(
	text: string,
	insertSpaces: boolean,
	tabSize: number,
	columnLimit: number,
	assumedFileName: string,
	hasClangFormat: boolean,
): Promise<string> {
	return new Promise((resolve, reject) => {
		try {
			const exe = clang.getNativeBinary();
			let stdout = "";
			let stderr = "";

			// Determine if we should use tabs or spaces, and how many
			const useTab = insertSpaces ? "Never" : "Always";

			// If a .clang-format file exists, use it. Otherwise, use VS Code editor settings as fallback.
			const styleArg = hasClangFormat
				? "--style=file"
				: `--style={BasedOnStyle: Google, IndentWidth: ${tabSize}, TabWidth: ${tabSize}, UseTab: ${useTab}, ColumnLimit: ${columnLimit}, KeepEmptyLinesAtTheStartOfBlocks: true, AlignTrailingComments: false, SpacesInContainerLiterals: false, AllowShortFunctionsOnASingleLine: All, AllowShortBlocksOnASingleLine: false, AllowShortIfStatementsOnASingleLine: false, AllowShortEnumsOnASingleLine: false, SpacesBeforeTrailingComments: 1, SpaceBeforeCpp11BracedList: false, BinPackArguments: true, BinPackParameters: true, PenaltyExcessCharacter: 1000000, PenaltyBreakBeforeFirstCallParameter: 1000000, PenaltyBreakAssignment: 1000000, PenaltyBreakComment: 1000000, PenaltyBreakString: 1000000, PenaltyBreakTemplateDeclaration: 1000000, PenaltyReturnTypeOnItsOwnLine: 1000000}`;

			const isAbsolute = path.isAbsolute(assumedFileName);
			const cwd = isAbsolute ? path.dirname(assumedFileName) : undefined;
			const fileName = isAbsolute ? assumedFileName : "test.mc";

			const child = spawn(exe, [`--assume-filename=${fileName}.cs`, styleArg], {
				cwd: cwd,
			});

			child.stdout.on("data", (chunk) => (stdout += chunk));
			child.stderr.on("data", (chunk) => (stderr += chunk));

			child.on("close", (code) => {
				if (code !== 0) {
					reject(new Error(`clang-format failed: ${stderr}`));
				} else {
					// Post-process clang-format output to restore Monkey C specific syntax
					let formattedText = stdout;

					// 1. Restore inheritance
					formattedText = formattedText.replace(/\bclass\s+([a-zA-Z0-9_]+)\s*:\s*/g, "class $1 extends ");

					// 2. Restore annotations
					formattedText = formattedText.replace(/\[__ATTR_([a-zA-Z0-9_]+)\]/g, "(:$1)");

					// 3. Restore symbols
					formattedText = formattedText.replace(/__SYM_([a-zA-Z_][a-zA-Z0-9_]*)/g, ":$1");

					// 4. Restore empty lines before closing braces
					formattedText = formattedText.replace(/\n\s*\/\/__BLANK_LINE__/g, "");

					// 5. Fix spacing for complex types and logical operators
					formattedText = formattedText.replace(/\b(as|or|and)\s*\[/g, "$1 [");

					// 6. Fix dictionary spacing in function calls (match samples)
					formattedText = formattedText.replace(/\(\s+\{\s+:/g, "({ :");
					formattedText = formattedText.replace(/\s+\}\s+\)/g, " })");

					resolve(formattedText);
				}
			});

			child.on("error", (err) => {
				reject(err);
			});

			// Pre-process input text to disguise Monkey C specific syntax as valid C#
			let pre = text;

			// 1. Workaround for clang-format removing empty lines before closing braces
			pre = pre.replace(/\n(\s*\n)(\s*\})/g, "\n$1//__BLANK_LINE__\n$2");

			// 2. Annotations (e.g., `(:glance)`) -> `[__ATTR_glance]`
			pre = pre.replace(/^(\s*)\(\s*:\s*([a-zA-Z0-9_]+)\s*\)/gm, "$1[__ATTR_$2]");

			// 3. Symbols (e.g., `:color`) -> `__SYM_color`
			// We use a whitelist of prefixes to distinguish symbols from ternary colons.
			pre = pre.replace(
				/((?:[(\[\{=,]|=>|==|!=|<|>|<=|>=|\+|\-|\*|\/|\bcase|\bhas|\breturn)\s*):\s*(?!__SYM_)([a-zA-Z_][a-zA-Z0-9_]*)\b/g,
				"$1__SYM_$2",
			);
			pre = pre.replace(/(\?\s*):\s*(?!__SYM_)([a-zA-Z_][a-zA-Z0-9_]*)\b/g, (match, prefix, sym) => {
				if (sym === "true" || sym === "false" || sym === "null") {
					return match;
				}
				return prefix + "__SYM_" + sym;
			});
			pre = pre.replace(/((?::)\s*):\s*(?!__SYM_)([a-zA-Z_][a-zA-Z0-9_]*)\b/g, "$1__SYM_$2");

			// 4. Inheritance (e.g., `class A extends B`) -> `class A : B`
			pre = pre.replace(/\bclass\s+([a-zA-Z0-9_]+)\s+extends\b/g, "class $1 :");

			child.stdin.write(pre);
			child.stdin.end();
		} catch (e: any) {
			reject(e);
		}
	});
}

export function activate(context: vscode.ExtensionContext) {
	vscode.languages.registerDocumentFormattingEditProvider("monkeyc", {
		provideDocumentFormattingEdits(
			document: vscode.TextDocument,
			options: vscode.FormattingOptions,
		): Promise<vscode.TextEdit[]> {
			let hasClangFormat = false;

			// Only search for .clang-format if the document is actually on disk
			if (document.uri.scheme === "file") {
				const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
				const searchDir = workspaceFolder ? workspaceFolder.uri.fsPath : path.dirname(document.uri.fsPath);
				hasClangFormat = findClangFormatFile(searchDir);
			}

			const editorConfig = vscode.workspace.getConfiguration("editor", document.uri);
			const rulers = editorConfig.get<number[]>("rulers", []);
			let columnLimit = 120;
			if (rulers && rulers.length > 0) {
				columnLimit = rulers[0];
			} else {
				const wrapColumn = editorConfig.get<number>("wordWrapColumn", 120);
				columnLimit = wrapColumn === 80 ? 120 : wrapColumn;
			}

			return formatMonkeyC(
				document.getText(),
				options.insertSpaces,
				options.tabSize,
				columnLimit,
				document.uri.fsPath,
				hasClangFormat,
			)
				.then((formattedText) => {
					const fullRange = new vscode.Range(
						document.positionAt(0),
						document.positionAt(document.getText().length),
					);
					return [vscode.TextEdit.replace(fullRange, formattedText)];
				})
				.catch((err) => {
					console.error(err);
					vscode.window.showErrorMessage(`Formatting failed: ${err.message}`);
					return [];
				});
		},
	});
}
