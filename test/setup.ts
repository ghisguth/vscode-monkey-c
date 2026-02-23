const Module = require("module");
const originalRequire = Module.prototype.require;

Module.prototype.require = function (request: string) {
	if (request === "vscode") {
		return {
			languages: { registerDocumentFormattingEditProvider: () => {} },
			workspace: {
				getWorkspaceFolder: () => null,
				getConfiguration: () => ({
					get: (key: string, defaultValue: any) => defaultValue,
				}),
			},
			window: { showErrorMessage: () => {} },
			Range: class {
				constructor(
					public start: any,
					public end: any,
				) {}
			},
			Position: class {
				constructor(
					public line: number,
					public character: number,
				) {}
			},
			TextEdit: {
				replace: (range: any, text: string) => ({ range, text }),
			},
		};
	}
	return originalRequire.apply(this, arguments);
};
