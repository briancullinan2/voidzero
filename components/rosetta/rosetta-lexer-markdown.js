

// @ts-check

/** @type {Record<string, string[]>} */

const ROSETTA_CREOLE_MAPPING = {

	// =====================================================================
	// CREOLE PARSER & LEXER MAPPINGS (creole.g4 -> C AST Rules)
	// =====================================================================
	// --- Parser Rules ---
	"document": ["compilationUnit", "translationUnit"],
	"line": ["blockItem", "statement"],
	"markup": ["expression", "primaryExpression"],
	"text_": ["StringLiteral", "Identifier"],
	"bold": ["primaryExpression", "constant"],
	"italics": ["primaryExpression", "constant"],
	"href": ["postfixExpression", "functionCall"],
	"image": ["postfixExpression", "initializer"],
	"hline": ["statement", "Semi"],
	"listitem": ["initializerList", "blockItem"],
	"tableheader": ["structOrUnionSpecifier", "declaration"],
	"tablerow": ["initializerList", "compoundStatement"],
	"title": ["functionDefinition", "externalDeclaration"],
	"nowiki": ["StringLiteral", "asmStringLiteral"],

	// --- Lexer Tokens ---
	"HASH": ["Hash"],
	"LBRACKET": ["LeftBracket"],
	"RBRACKET": ["RightBracket"],
	"LBRACE": ["LeftBrace"],
	"RBRACE": ["RightBrace"],
	"CODE_BLOCK": ["asmStringLiteral", "StringLiteral"],
	"NOWIKI_CREOLE": ["StringLiteral"],
	"TEXT": ["Identifier", "StringLiteral"],
	"WS": ["Whitespace"],
	"CR": ["Newline"],
	"RSLASH": ["Div"],

	// --- Lexer Fragments ---
	"LANG_NAME": ["typedefName", "Identifier"],
	"LETTERS": ["Nondigit"],
	"DIGITS": ["Digit"],
	"SYMBOL": ["punctuation", "operator"],

	// --- Parser Rules ---
	"strikethrough": ["primaryExpression", "constant"],
	"inline_code": ["StringLiteral", "asmStringLiteral"],
	"url_autolink": ["StringLiteral", "Identifier"],
	"task_listitem": ["initializerList", "blockItem"],

	// --- Lexer Tokens ---
	"COLON": ["Colon"],
	"URL_LINK": ["StringLiteral"],
	"CODE_INLINE": ["StringLiteral"],
};
