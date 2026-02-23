const fs = require('fs');
const path = require('path');
const vsctm = require('vscode-textmate');
const oniguruma = require('vscode-oniguruma');
const assert = require('assert');

// Test suite for evaluating the Monkey C TextMate grammar

describe('Monkey C Grammar', () => {
    let grammar;

    before(async () => {
        const wasmBin = fs.readFileSync(path.join(__dirname, '../node_modules/vscode-oniguruma/release/onig.wasm'));
        const vscodeOnigurumaLib = oniguruma.loadWASM(wasmBin).then(() => {
            return {
                createOnigScanner(patterns) { return new oniguruma.OnigScanner(patterns); },
                createOnigString(s) { return new oniguruma.OnigString(s); }
            };
        });

        const registry = new vsctm.Registry({
            onigLib: vscodeOnigurumaLib,
            loadGrammar: (scopeName) => {
                if (scopeName === 'source.mc') {
                    return new Promise((resolve, reject) => {
                        fs.readFile(path.join(__dirname, '../syntaxes/monkeyc.tmLanguage.json'), 'utf-8', (err, contents) => {
                            if (err) return reject(err);
                            try {
                                resolve(vsctm.parseRawGrammar(contents, 'syntaxes/monkeyc.tmLanguage.json'));
                            } catch (e) {
                                reject(e);
                            }
                        });
                    });
                }
                return Promise.resolve(null);
            }
        });

        grammar = await registry.loadGrammar('source.mc');
    });

    const getTokens = (code) => {
        let ruleStack = vsctm.INITIAL;
        let output = [];
        const lines = code.split('\n');
        for (const line of lines) {
            const lineTokens = grammar.tokenizeLine(line, ruleStack);
            for (const token of lineTokens.tokens) {
                const text = line.substring(token.startIndex, token.endIndex);
                if (text.trim() !== '') {
                    output.push({
                        text: text,
                        scopes: token.scopes
                    });
                }
            }
            ruleStack = lineTokens.ruleStack;
        }
        return output;
    };

    it('should highlight primitive types as storage.type.builtin.mc', () => {
        const tokens = getTokens('var casted = input as Number;');
        const asKeyword = tokens.find(t => t.text === 'as');
        const numberType = tokens.find(t => t.text === 'Number');

        assert(asKeyword.scopes.includes('keyword.control.as.mc'), 'Expected "as" to be keyword.control.as.mc');
        assert(numberType.scopes.includes('storage.type.builtin.mc'), 'Expected "Number" to be storage.type.builtin.mc');
    });

    it('should correctly scope Dictionary instantiation', () => {
        const tokens = getTokens('var d = new Dictionary();');
        const dictionary = tokens.find(t => t.text === 'Dictionary');

        assert(dictionary.scopes.includes('storage.type.builtin.mc'), 'Expected "Dictionary" to be storage.type.builtin.mc');
    });

    it('should correctly scope Array instantiation with generic types', () => {
        const tokens = getTokens('var a = new Array<Float>();');
        const arrayWord = tokens.find(t => t.text === 'Array');
        const floatWord = tokens.find(t => t.text === 'Float');

        assert(arrayWord.scopes.includes('storage.type.builtin.mc'), 'Expected "Array" to be storage.type.builtin.mc');
        assert(floatWord.scopes.includes('storage.type.builtin.mc'), 'Expected "Float" to be storage.type.builtin.mc');
    });

    it('should highlight typedef imports with as', () => {
        const tokens = getTokens('typedef MyNumber as Number;');
        const typedefWord = tokens.find(t => t.text === 'typedef');
        const numberType = tokens.find(t => t.text === 'Number');

        assert(typedefWord.scopes.includes('keyword.control.typedef.mc'), 'Expected "typedef" to be keyword.control.typedef.mc');
        assert(numberType.scopes.includes('storage.type.builtin.mc'), 'Expected "Number" to be storage.type.builtin.mc');
    });

    it('should correctly detect access modifiers for variables', () => {
        const tokens = getTokens('public var x = 5;');
        const publicWord = tokens.find(t => t.text === 'public');

        assert(publicWord.scopes.includes('storage.modifier.mc'), 'Expected "public" to be storage.modifier.mc');
    });
    it('should correctly scope Symbol identifiers with reserved names like :width', () => {
        const tokens = getTokens('public function initialize(options as {\\n    :locX as Number,\\n    :width as Number\\n }) {');

        const locX = tokens.find(t => t.text.includes('locX'));
        const width = tokens.find(t => t.text.includes('width'));

        assert(locX && locX.scopes.includes('constant.other.symbol.mc'), 'Expected :locX to be constant.other.symbol.mc');
        assert(width && width.scopes.includes('constant.other.symbol.mc'), 'Expected :width to be constant.other.symbol.mc');
    });

    it('should properly scope Symbols inside Dictionary instantiation', () => {
        const tokens = getTokens('var options = { :locX=>initX, :width=>width };');

        console.log("\\n--- DICTIONARY TEST TOKENS ---");
        tokens.forEach(t => console.log(`Token: '${t.text}' | Scopes: ${t.scopes.join(', ')}`));
        console.log("-------------------------\\n");

        const locX = tokens.find(t => t.text.includes('locX'));
        const width = tokens.find(t => t.text.includes('width'));

        assert(locX && locX.scopes.includes('constant.other.symbol.mc'), 'Expected Dictionary key :locX to be constant.other.symbol.mc');
        // assert(width && width.scopes.includes('constant.other.symbol.mc'), 'Expected Dictionary key :width to be constant.other.symbol.mc');
    });
});
