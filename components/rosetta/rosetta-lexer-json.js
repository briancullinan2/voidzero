


// @ts-check

/** @type {Record<string, string[]>} */

const ROSETTA_JSON_MAPPING = {
	// =====================================================================
	// 1. HIGHER-LEVEL PARSER EXPR/RULE CONTEXTS (Parser Rules -> C Rules)
	// =====================================================================
	"json": ["compilationUnit", "translationUnit"],
	"obj": ["compoundStatement"],                        // Scoped brace blocks '{ ... }'
	"pair": ["assignmentExpression", "initDeclarator"],  // 'Key: Value' maps to assignments or initializers
	"jsonKey": ["Identifier", "typedefName"],            // Structural naming identifiers
	"jsonValue": ["primaryExpression", "constant"],      // Base terminal values and literal atoms
	"arr": ["initializerList"],                          // Nested array values map to C literal array brackets

	// =====================================================================
	// 2. LEXER TERMINAL CORES (Lexer Rules -> C Lexer Keys / Token Names)
	// =====================================================================
	"STRING": ["StringLiteral", "CharacterConstant"],
	"NUMBER": ["IntegerConstant", "FloatingConstant", "DigitSequence"],
	"WS": ["Whitespace", "Newline"],

	// Literal value constants mapped directly down to static C primitives
	"true": ["True_"],
	"false": ["False_"],
	"null": ["Nulptr"],

	// Structural JSON dividers mapped to matching C punctuators
	"{": ["LeftBrace"],
	"}": ["RightBrace"],
	"[": ["LeftBracket"],
	"]": ["RightBracket"],
	":": ["Colon"],
	",": ["Comma"],

	// =====================================================================
	// 3. SUB-ELEMENT LEXICAL FRAGMENTS (Internal Layout Construction)
	// =====================================================================
	"ESC": ["EscapeSequence", "SimpleEscapeSequence"],
	"UNICODE": ["UniversalCharacterName", "HexQuad"],
	"HEX": ["HexadecimalDigit"],
	"SAFECODEPOINT": ["Nondigit", "Digit"],
	"INT": ["DecimalConstant", "OctalConstant"],
	"EXP": ["ExponentPart", "BinaryExponentPart"],
}
