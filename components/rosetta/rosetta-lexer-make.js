

// @ts-check

/** @type {Record<string, string[]>} */

const ROSETTA_CMAKE_MAPPING = {
	// =====================================================================
	// 1. HIGHER-LEVEL PARSER EXPR/RULE CONTEXTS (Parser Rules -> C Rules)
	// =====================================================================
	"file_": ["compilationUnit", "translationUnit"],             // Whole file root containing sequence blocks
	"command_invocation": ["postfixExpression", "statement"],    // CMake macro/command execution binds to expression/statements
	"single_argument": ["argumentExpressionList", "primaryExpression"], // Standard functional inputs
	"compound_argument": ["argumentExpressionList", "expression"], // Nested argument groups layout like expression subsets
	"Identifier": ["Identifier", "directDeclarator"],            // Built-in commands or variables behave like identifiers

	// =====================================================================
	// 2. LEXER TERMINAL CORES (Lexer Rules -> C Lexer Keys / Token Names)
	// =====================================================================
	"Quoted_argument": ["StringLiteral"],                       // Double-quoted textual data payloads
	"Unquoted_argument": ["primaryExpression", "Identifier"],   // Loose raw barewords fallback to general primary atoms
	"Bracket_argument": ["StringLiteral", "asmStringLiteral"],  // Multi-line block literals track like literal string arrays
	"Line_comment": ["Comment", "Whitespace"],                  // Trailing `# ...` comments
	"Bracket_comment": ["Comment"],                             // Block `#[==[ ... ]==]` structural comments
	"Newline": ["Whitespace", "Newline"],                       // Line termination breaks
	"Space": ["Whitespace"],                                    // Horizontal alignment spans

	// Structural punctuators mapped directly down to native C delimiters
	"(": ["LeftParen"],                                         // Opens macro signature parameters
	")": ["RightParen"],                                        // Closes macro signature parameters
	"[": ["LeftBracket"],                                       // Raw multi-line container start boundaries
	"]": ["RightBracket"],                                      // Raw multi-line container close boundaries

	// =====================================================================
	// 3. SUB-ELEMENT LEXICAL FRAGMENTS (Internal Layout Construction)
	// =====================================================================
	"Escape_sequence": ["EscapeSequence", "SimpleEscapeSequence"], // Standard runtime parameter overrides
	"Escape_identity": ["EscapeSequence"],                       // Slash-escaped structural character passes (`\*`)
	"Escape_encoded": ["SimpleEscapeSequence"],                 // Encoded system control sequences (`\n`, `\r`, `\t`)
	"Escape_semicolon": ["EscapeSequence"],                     // Explicit inline token separators (`\;`)
	"Quoted_cont": ["EscapeSequence"],                          // Escaped line-continuations inside active strings
	"Bracket_arg_nested": ["StringLiteral"],                     // Internal recursive contents of raw block structures

};



/** @type {Record<string, string[]>} */

const ROSETTA_MAKE_MAPPING = {
	// =====================================================================
	// MAKEFILE PARSER SYMBOL MAPPINGS (MakefileParser.g4 -> C AST Rules)
	// =====================================================================
	"makefile": ["translationUnit"],
	"item": ["blockItem"],
	"rule_": ["declaration", "labeledStatement"],
	"double_colon": ["Colon", "Colon"],
	"targets": ["initDeclaratorList"],
	"target": ["directDeclarator", "typedefName"],
	"prerequisites": ["parameterTypeList"],
	"normal_prerequisites": ["parameterTypeList"],
	"order_only_prerequisites": ["parameterTypeList"],
	"prerequisite": ["parameterDeclaration", "Identifier"],
	"recipe": ["compoundStatement", "expressionStatement"],
	"recipe_command": ["expressionStatement"],
	"variable_assignment": ["initDeclarator", "assignmentExpression"],
	"define_directive": ["functionDefinition", "compoundStatement"],
	"define_body": ["blockItemList"],
	"value": ["initializer", "assignmentExpression"],
	"standalone_function": ["expressionStatement"],
	"variable_ref": ["primaryExpression", "Identifier"],
	"function_call": ["postfixExpression", "functionCall"],
	"builtin_function": ["Identifier", "typedefName"],
	"function_args": ["argumentExpressionList"],
	"arg": ["assignmentExpression", "primaryExpression"],
	"include_directive": ["externalDeclaration", "Directive"],
	"conditional": ["selectionStatement"],
	"conditional_header": ["selectionStatement"],
	"conditional_else": ["selectionStatement"],
	"conditional_endif": ["selectionStatement"],
	"export_directive": ["declaration", "externalDeclaration"],
	"override_directive": ["declaration"],
	"undefine_directive": ["statement"],
	"error_directive": ["statement", "Directive"],
	"vpath_directive": ["declaration"],

};
