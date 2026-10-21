// @ts-check

/** @type {Record<string, string[]>} */;
export const ROSETTA_ANTLR_MAPPING = {
	// =====================================================================
	// 1. COMMENTS & DOCUMENTATION TOKENS
	// =====================================================================
	"DOC_COMMENT": ["MultiLineComment", "Comment"],
	"BLOCK_COMMENT": ["MultiLineComment", "Comment"],
	"LINE_COMMENT": ["SingleLineComment", "Comment"],

	// =====================================================================
	// 2. NUMERIC & STRING LITERALS
	// =====================================================================
	"INT": ["IntegerConstant", "DecimalConstant"],
	"STRING_LITERAL": ["StringLiteral", "CharacterConstant"],
	"UNTERMINATED_STRING_LITERAL": ["StringLiteral", "UnterminatedStringLiteral"],

	// =====================================================================
	// 3. ARGUMENTS & ACTIONS (EMBEDDED CODE BLOCKS)
	// =====================================================================
	"BEGIN_ARGUMENT": ["LeftBracket", "InitializerListStart"],
	"ACTION": ["CompoundStatement", "CodeBlock"],
	"NESTED_ACTION": ["CompoundStatement", "EmbeddedBlock"],

	// =====================================================================
	// 4. ANTLR KEYWORDS MAPPED TO C EQUIVALENTS
	// =====================================================================
	"OPTIONS": ["typedefName", "Identifier"],
	"TOKENS": ["typedefName", "Identifier"],
	"CHANNELS": ["typedefName", "Identifier"],
	"IMPORT": ["IncludeDirective", "ImportKeyword"],
	"FRAGMENT": ["StaticKeyword", "InlineKeyword"],
	"LEXER": ["typedefName", "Identifier"],
	"PARSER": ["typedefName", "Identifier"],
	"GRAMMAR": ["typedefName", "Identifier"],
	"PROTECTED": ["PrivateKeyword", "Modifier"],
	"PUBLIC": ["PublicKeyword", "Modifier"],
	"PRIVATE": ["PrivateKeyword", "Modifier"],
	"RETURNS": ["typedefName", "Identifier"],
	"LOCALS": ["DeclarationSpecifiers", "Identifier"],
	"THROWS": ["ExceptionSpecification", "Identifier"],
	"CATCH": ["CatchKeyword", "TryBlock"],
	"FINALLY": ["FinallyKeyword", "CleanupBlock"],
	"MODE": ["SwitchKeyword", "CaseKeyword"],

	// =====================================================================
	// 5. PUNCTUATION & OPERATORS MAPPED TO C TOKENS
	// =====================================================================
	"COLON": ["Colon"],
	"COLONCOLON": ["ColonColon", "ScopeResolution"],
	"COMMA": ["Comma"],
	"SEMI": ["Semicolon"],
	"LPAREN": ["LeftParen"],
	"RPAREN": ["RightParen"],
	"RBRACE": ["RightBrace"],
	"RARROW": ["Arrow", "MinusGreater"],
	"LT": ["Less"],
	"GT": ["Greater"],
	"ASSIGN": ["Assign"],
	"QUESTION": ["Question"],
	"STAR": ["Star", "Multiply"],
	"PLUS_ASSIGN": ["AddAssign"],
	"PLUS": ["Plus", "Add"],
	"OR": ["Or", "BitwiseOr", "LogicalOr"],
	"DOLLAR": ["Dollar", "Identifier"],
	"RANGE": ["Ellipsis", "Range"],
	"DOT": ["Dot"],
	"AT": ["At", "Attribute"],
	"POUND": ["Hash", "Preprocessor"],
	"NOT": ["Not", "BitwiseNot", "LogicalNot"],

	// =====================================================================
	// 6. IDENTIFIERS & WHITESPACE
	// =====================================================================
	"ID": ["Identifier", "typedefName"],
	"WS": ["Whitespace", "Newline"],

	// =====================================================================
	// 7. LEXER MODES (ARGUMENT & CHAR SET MODES)
	// =====================================================================
	"NESTED_ARGUMENT": ["LeftBracket", "InitializerListStart"],
	"ARGUMENT_ESCAPE": ["EscapeSequence", "SimpleEscapeSequence"],
	"ARGUMENT_STRING_LITERAL": ["StringLiteral", "CharacterConstant"],
	"ARGUMENT_CHAR_LITERAL": ["StringLiteral", "CharacterConstant"],
	"END_ARGUMENT": ["RightBracket", "InitializerListEnd"],
	"UNTERMINATED_ARGUMENT": ["EofToken", "ErrorToken"],
	"ARGUMENT_CONTENT": ["CharacterToken", "AnyCharacter"],
	"LEXER_CHAR_SET_BODY": ["CharacterSetBody", "StringLiteral"],
	"LEXER_CHAR_SET": ["RightBracket", "CharacterSetEnd"],
	"UNTERMINATED_CHAR_SET": ["EofToken", "ErrorToken"],

	// =====================================================================
	// 8. LEXER FRAGMENTS (ESC, UNICODE, QUOTES, & CHARACTER CLASSES)
	// =====================================================================
	"ESC_SEQUENCE": ["EscapeSequence", "SimpleEscapeSequence"],
	"HexDigit": ["HexadecimalDigit", "DigitSequence"],
	"UnicodeESC": ["UniversalCharacterName", "HexQuad"],
	"DoubleQuoteLiteral": ["StringLiteral", "CharacterConstant"],
	"TripleQuoteLiteral": ["StringLiteral", "RawStringLiteral"],
	"BacktickQuoteLiteral": ["StringLiteral", "Identifier"],
	"NameChar": ["IdentifierCharacter", "Alphanumeric"],
	"NameStartChar": ["IdentifierStartCharacter", "Nondigit"],


	// =====================================================================
	// 1. GRAMMAR ROOT & DECLARATION SPECIFIERS
	// =====================================================================
	"grammarSpec": ["translationUnit", "compilationUnit"],
	"grammarDecl": ["declaration", "functionDefinition"],
	"grammarType": ["storageClassSpecifier", "typeSpecifier"],

	// =====================================================================
	// 2. PREQUELS, OPTIONS, DELEGATES, TOKENS, CHANNELS & ACTIONS
	// =====================================================================
	"prequelConstruct": ["externalDeclaration", "declaration"],
	"optionsSpec": ["declarationSpecifiers", "structOrUnionSpecifier"],
	"option": ["initDeclarator", "assignmentExpression"],
	"optionValue": ["constant", "primaryExpression"],
	"delegateGrammars": ["includeDirective", "externalDeclaration"],
	"delegateGrammar": ["headerName", "identifier"],
	"tokensSpec": ["declarationList", "structDeclarationList"],
	"channelsSpec": ["declarationList"],
	"idList": ["initDeclaratorList", "identifierList"],
	"action_": ["functionDefinition", "declaration"],
	"actionScopeName": ["identifier", "typedefName"],
	"actionBlock": ["compoundStatement", "blockItemList"],
	"argActionBlock": ["parameterTypeList", "parameterList"],

	// =====================================================================
	// 3. PARSER RULES, MODIFIERS, BLOCKS, ALTERNATIVES & EXCEPTIONS
	// =====================================================================
	"modeSpec": ["compoundStatement", "translationUnit"],
	"rules": ["translationUnit", "externalDeclarationList"],
	"ruleSpec": ["functionDefinition", "externalDeclaration"],
	"parserRuleSpec": ["functionDefinition"],
	"exceptionGroup": ["compoundStatement"],
	"exceptionHandler": ["labeledStatement"],
	"finallyClause": ["compoundStatement"],
	"rulePrequel": ["declarationSpecifiers"],
	"ruleReturns": ["typeSpecifier", "declarationSpecifiers"],
	"throwsSpec": ["typeQualifierList"],
	"localsSpec": ["declarationList"],
	"ruleAction": ["compoundStatement"],
	"ruleModifiers": ["storageClassSpecifierList"],
	"ruleModifier": ["storageClassSpecifier", "typeQualifier"],
	"ruleBlock": ["compoundStatement", "blockItemList"],
	"ruleAltList": ["selectionStatement", "conditionalExpression"],
	"labeledAlt": ["labeledStatement", "conditionalExpression"],

	// =====================================================================
	// 4. LEXER RULES, BLOCKS, ELEMENTS & COMMANDS
	// =====================================================================
	"lexerRuleSpec": ["functionDefinition", "declaration"],
	"lexerRuleBlock": ["compoundStatement"],
	"lexerAltList": ["selectionStatement"],
	"lexerAlt": ["conditionalExpression"],
	"lexerElements": ["initializerList"],
	"lexerElement": ["assignmentExpression"],
	"lexerBlock": ["primaryExpression"],
	"lexerCommands": ["expressionList"],
	"lexerCommand": ["postfixExpression"],
	"lexerCommandName": ["identifier"],
	"lexerCommandExpr": ["constant", "identifier"],

	// =====================================================================
	// 5. GRAMMAR ELEMENTS, EXPRESSIONS, EBNF & ATOMS
	// =====================================================================
	"altList": ["conditionalExpression", "assignmentExpression"],
	"alternative": ["assignmentExpression"],
	"element": ["unaryExpression", "postfixExpression"],
	"predicateOptions": ["initializerList"],
	"predicateOption": ["initDeclarator"],
	"labeledElement": ["initDeclarator", "assignmentExpression"],
	"ebnf": ["iterationStatement", "selectionStatement"],
	"blockSuffix": ["postfixExpression"],
	"ebnfSuffix": ["unaryOperator"],
	"lexerAtom": ["primaryExpression"],
	"atom": ["primaryExpression"],
	"wildcard": ["assignmentExpression"],
	"notSet": ["unaryExpression"],
	"blockSet": ["primaryExpression"],
	"setElement": ["constant", "identifier"],
	"block": ["compoundStatement"],

	// =====================================================================
	// 6. IDENTIFIERS & TERMINAL DEFINITIONS
	// =====================================================================
	"ruleref": ["postfixExpression", "identifier"],
	"characterRange": ["constant"],
	"terminalDef": ["identifier", "constant"],
	"elementOptions": ["attributeSpecifier"],
	"elementOption": ["initDeclarator"],
	"identifier": ["Identifier", "typedefName"],
	"qualifiedIdentifier": ["postfixExpression", "identifier"]


};
