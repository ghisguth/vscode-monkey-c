import "./setup";
import * as assert from "assert";
import { formatMonkeyC } from "../src/extension";

function normalize(str: string) {
	return str.trim().replace(/\r\n/g, "\n");
}

async function testCase(input: string, expected: string, columnLimit = 80) {
	const result = await formatMonkeyC(input, true, 4, columnLimit, "test.mc", false);
	assert.strictEqual(normalize(result), normalize(expected));
}

describe("Monkey C Formatting", () => {
	it("should format with 4 spaces", async () => {
		await testCase("class A { var x; }", "class A {\n    var x;\n}");
	});

	it("should format with 2 spaces", async () => {
		const result = await formatMonkeyC("class A { var x; }", true, 2, 80, "test.mc", false);
		assert.strictEqual(normalize(result), normalize("class A {\n  var x;\n}"));
	});

	it("should format with tabs", async () => {
		const result = await formatMonkeyC("class A { var x; }", false, 4, 80, "test.mc", false);
		assert.strictEqual(normalize(result), normalize("class A {\n\tvar x;\n}"));
	});

	it("should preserve Symbol spacing", async () => {
		await testCase("var x = :color;", "var x = :color;");
	});

	it("should preserve Dictionary spacing with Symbols", async () => {
		await testCase("var d = { :key => 1 };", "var d = { :key => 1 };");
	});

	it("should preserve function call spacing with Symbols", async () => {
		await testCase("foo(:bar);", "foo(:bar);");
	});

	it("should preserve ternary operator spacing with Symbols", async () => {
		await testCase("var y = x == :sym ? :trueSym : :falseSym;", "var y = x == :sym ? :trueSym : :falseSym;");
	});

	it("should format correctly access modifiers", async () => {
		await testCase(
			"class A { public var x; private function y() {} }",
			"class A {\n    public var x;\n    private function y() {}\n}",
		);
	});

	it("should fix bad indentation in classes and methods", async () => {
		await testCase(
			"class A {\npublic function initialize() {\nvar x=1;\n}\n}",
			"class A {\n    public function initialize() { var x = 1; }\n}",
		);
	});

	it("should fix spacing around operators", async () => {
		await testCase("var x=1+2*3;", "var x = 1 + 2 * 3;");
	});

	it("should format multiple statements on a single line into multiple lines", async () => {
		await testCase("var x = 1; var y = 2; System.println(x);", "var x = 1;\nvar y = 2;\nSystem.println(x);");
	});

	it("should format arrays and dictionaries correctly", async () => {
		await testCase(
			"var arr=[1,2,3]; var dict={:a=>1,:b=>2};",
			"var arr = [1, 2, 3];\nvar dict = { :a => 1, :b => 2 };",
		);
	});

	it("should fix redundant spaces in Symbol parameters (Issue #6)", async () => {
		await testCase("mColor = params.get(   :   color);", "mColor = params.get(:color);");
	});

	it("should correctly format dictionary assignment without splitting arrow operator (Issue #5)", async () => {
		await testCase(
			'var entry = {"key" => "foo", "value" => "bar"};',
			'var entry = { "key" => "foo", "value" => "bar" };',
		);
	});

	it("should not treat ternary operator colon as a symbol", async () => {
		await testCase("var x = condition ? true : false;", "var x = condition ? true : false;");
	});

	it("should correctly format member access with $.", async () => {
		await testCase("var x = $.Rez.Drawables.bear;", "var x = $.Rez.Drawables.bear;");
	});

	it("should correctly format type casting with as", async () => {
		await testCase("var x = obj as BitmapResource;", "var x = obj as BitmapResource;");
	});

	it("should correctly format complex return types with as and or", async () => {
		await testCase(
			"public function f() as [Views] or [Views, InputDelegates] {}",
			"public function f() as [Views] or [Views, InputDelegates] {}",
		);
	});

	it("should correctly format dictionary parameter spacing", async () => {
		await testCase('Menu2.initialize({:title=>"Settings"});', 'Menu2.initialize({ :title => "Settings" });');
	});

	it("should not split classes with annotations to newlines", async () => {
		await testCase("(:glance)\nclass MyClass extends Ui.View {}", "(:glance)\nclass MyClass extends Ui.View {}");
	});

	it("should not split switch cases with symbols to newlines", async () => {
		await testCase(
			"switch(x) {\n    case :two:\n        break;\n}",
			"switch (x) {\n    case :two:\n        break;\n}",
		);
	});

	it("should join long lines if they fit within the column limit", async () => {
		const input =
			"        Gfx.drawLine(0, 2 * height / ACTION_COUNT, width,\n                     2 * height / ACTION_COUNT, 0, 2 * height / ACTION_COUNT);";
		const expected =
			"Gfx.drawLine(0, 2 * height / ACTION_COUNT, width, 2 * height / ACTION_COUNT, 0, 2 * height / ACTION_COUNT);";

		const result = await formatMonkeyC(input, true, 4, 120, "test.mc", false);
		assert.strictEqual(normalize(result), normalize(expected));
	});

	it("should correctly format anonymous enums", async () => {
		const input = "enum { VAL1, VAL2 = 5, VAL3 }";
		const expected = "enum {\n    VAL1,\n    VAL2 = 5,\n    VAL3\n}";
		await testCase(input, expected);
	});

	it("should correctly format named enums", async () => {
		const input = "enum Named { A, B }";
		const expected = "enum Named {\n    A,\n    B\n}";
		await testCase(input, expected);
	});

	it("should correctly format public and private enums", async () => {
		const input = "public enum P { X } private enum V { Y }";
		const expected = "public enum P {\n    X\n}\nprivate enum V {\n    Y\n}";
		await testCase(input, expected);
	});
});
