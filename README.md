# Monkey C for Visual Studio Code

Provides Visual Studio Code language support for the Garmin Connect IQ [Monkey C language](https://developer.garmin.com/connect-iq/monkey-c/).

## Features

- **Syntax Highlighting**: Comprehensive syntax highlighting for Monkey C, including support for modern `MonkeyTypes`, access modifiers, and type casting keywords.
- **Code Formatting**: Experimental basic code formatting capabilities leveraging `clang-format`.

## Installation

To install the extension, search for "Monkey C" within the Visual Studio Code Extensions view (`Ctrl+Shift+X` or `Cmd+Shift+X`) and click Install.

## Development and Testing

### Grammar Testing

To run the automated TextMate grammar evaluation tests using Mocha:

```bash
npm run test
```

To manually verify the test playground file within the Extension Development Host:

```bash
code --extensionDevelopmentPath=$(pwd) ./test/HighlightTest.mc
```

## Known Issues

- This extension provides basic syntax highlighting and formatting. However, it is not under active development for new features, and not all Monkey C language features and edge cases are fully supported.

## Release Notes

Detailed release notes and version history are available in the [CHANGELOG.md](CHANGELOG.md) file.
