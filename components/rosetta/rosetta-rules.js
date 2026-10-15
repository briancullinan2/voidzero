
// @ts-check


// these are the baseline classifiers, i chose C as a base because there's lots of
// symbol types, its well defined, so anything i translate to it, will also come out
// colorful

/** @type {Record<string, string>} */
export const ROSETTA_RULE_MATRIX = {
	// =====================================================================
	// 1. SYSTEM BASE COMPILATION & TRANSLATION ROOTS (Clean Fallthroughs)
	// =====================================================================
	"compilationUnit": "text",
	"translationUnit": "text",
	"externalDeclaration": "text",

	// =====================================================================
	// 2. HARD STORAGE TYPES & MODIFIERS (.ace_storage / .ace_type)
	// =====================================================================
	"typeSpecifier": "storage.type",               // void, char, int, long, float, double
	"typedefName": "storage.type",                 // User custom-defined definitions
	"typeofSpecifier": "storage.type",
	"typeofSpecifierArgument": "storage.type",
	"atomicTypeSpecifier": "storage.type",
	"enumSpecifier": "storage.type",
	"enumTypeSpecifier": "storage.type",
	"structOrUnionSpecifier": "storage.type",
	"structOrUnion": "storage.type",
	"vcSpecificModifer": "storage.type",           // __cdecl, __stdcall, __fastcall
	"typeName": "storage.type",

	"storageClassSpecifier": "storage",            // static, register, auto, extern, typedef
	"typeQualifier": "storage",                    // const, volatile, restrict, _Atomic
	"typeQualifierList": "storage",
	"alignmentSpecifier": "storage",               // Alignas
	"functionSpecifier": "storage",                // inline, _Noreturn
	"volatile_": "storage",

	// =====================================================================
	// 3. FUNCTION LABELS & SIGNATURES (.ace_function)
	// =====================================================================
	"functionDefinition": "function",              // Function body entry
	"directDeclarator": "function",                // Pinpoints signature declaration targets
	"methodDeclaration": "function",
	"declarator": "function",                      // Catch-all fallthrough for function name resolution

	// High-decoration Specifier-to-Type Promotions
	"declarationSpecifiers": "storage.type",       // Paints entire type declaration blocks early
	"declarationSpecifier": "storage.type",
	"specifierQualifierList": "storage.type",
	"typeSpecifierQualifier": "storage.type",

	// Abstract Declarator structures (resolving to types inside cast blocks)
	"abstractDeclarator": "storage.type",
	"directAbstractDeclarator": "storage.type",
	"gccDeclaratorExtension": "storage",
	"initDeclaratorList": "text",
	"initDeclarator": "text",
	"pointer": "keyword.operator",                 // Forces asterisks (*) to paint as operators
	"functionBody": "text",
	"declarationList": "text",

	// =====================================================================
	// 4. CORE CONTROL FLOW STATEMENTS (.ace_keyword .ace_control)
	// =====================================================================
	"selectionStatement": "keyword.control",       // if, else, switch
	"iterationStatement": "keyword.control",       // while, do, for
	"jumpStatement": "keyword.control",            // goto, continue, break, return
	"labeledStatement": "keyword.control",         // case, default
	"staticAssertDeclaration": "keyword.control",  // _Static_assert
	"genericSelection": "keyword.control",         // _Generic

	// Fallback structural statement scopes
	"statement": "text",
	"compoundStatement": "text",
	"blockItemList": "text",
	"blockItem": "text",
	"expressionStatement": "text",
	"forCondition": "keyword.control",             // Highlights loop logic roots
	"forDeclaration": "text",
	"forExpression": "text",

	// =====================================================================
	// 5. VALUE CONSTANTS & LITERALS (.ace_constant .ace_numeric / .ace_library)
	// =====================================================================
	"constant": "constant.numeric",
	"predefinedConstant": "constant.buildin",      // true, false, nullptr -> ace_constant ace_buildin
	"enumerationConstant": "constant.library",     // Enums map directly to library green styles
	"enumerator": "constant.library",
	"enumeratorList": "text",
	"initializer": "constant.numeric",             // Enforces right-hand assignment value glows
	"initializerList": "text",

	// =====================================================================
	// 6. EXPRESSIONS & OPERATOR WRAPPERS (.ace_keyword .ace_operator)
	// =====================================================================
	"expression": "text",
	"assignmentExpression": "keyword.operator",    // Captures compound operational zones safely
	"conditionalExpression": "keyword.operator",
	"constantExpression": "constant.numeric",
	"logicalOrExpression": "keyword.operator",
	"logicalAndExpression": "keyword.operator",
	"inclusiveOrExpression": "keyword.operator",
	"exclusiveOrExpression": "keyword.operator",
	"andExpression": "keyword.operator",
	"equalityExpression": "keyword.operator",
	"relationalExpression": "keyword.operator",
	"shiftExpression": "keyword.operator",
	"additiveExpression": "keyword.operator",
	"multiplicativeExpression": "keyword.operator",
	"castExpression": "storage.type",              // Treats variable type coercion blocks explicitly
	"unaryExpression": "keyword.operator",
	"postfixExpression": "text",
	"primaryExpression": "text",
	"exprList": "text",
	"argumentExpressionList": "variable",          // Maps function inputs directly to eclipse purple variable
	"genericAssocList": "text",
	"genericAssociation": "text",

	// =====================================================================
	// 7. PARAMETERS & SIGNATURE ARGUMENTS (.ace_variable)
	// =====================================================================
	"parameterTypeList": "text",
	"parameterList": "variable",                   // Colors function argument inputs in signature definitions
	"parameterDeclaration": "variable",            // Pinpoints standalone typed configuration params
	"identifierList": "variable",                  // Forces fallbacks straight to recognizable variables

	// =====================================================================
	// 8. ATTRIBUTES & DIRECTIVES (.ace_tag / .ace_meta)
	// =====================================================================
	"attributeDeclaration": "meta.tag",
	"attributeSpecifierSequence": "meta.tag",
	"attributeSpecifier": "meta.tag",              // [[attributes]]
	"attributeList": "meta.tag",
	"attribute": "meta.tag",
	"attributeToken": "meta.tag",
	"attributeArgumentClause": "meta.tag",
	"balancedTokenSequence": "text",
	"balancedToken": "text",

	// =====================================================================
	// 9. GNU PARSER EXTENSIONS & ASSEMBLER INLINES (.ace_tag / .ace_keyword)
	// =====================================================================
	"gnuArrayDesignator": "meta.tag",
	"gnuAttribute": "meta.tag",                    // __attribute__
	"gnuAttributeList": "meta.tag",
	"gnuAttributes": "meta.tag",
	"gnuSingleAttribute": "meta.tag",
	"asmStringLiteral": "string",
	"asmStatement": "keyword",                     // asm, __asm__ blocks
	"asmDefinition": "keyword",
	"asm_": "keyword",
	"asmQualifier": "keyword.control",
	"asmQualifierList": "keyword.control",
	"designation": "meta.tag",
	"designatorList": "meta.tag",
	"designator": "meta.tag",
	"gnuIdentifier": "variable",
	"asmArgument": "variable",
	"asmOperand": "variable",
	"asmOperands": "text",
	"asmClobbers": "text",
	"toplevelAsmArgument": "text",
	"simpleAsmExpr": "text",


	// =====================================================================
	// 10. JAVASCRIPT OBJECT NOTATION (JSON) GRAMMAR MAPPING CORRELATION
	// =====================================================================
	"json": "text",                                // Base payload root -> ace_text
	"obj": "compoundStatement",                    // '{...}' acts like brace scopes -> ace_text (Structural wrapper)
	"pair": "assignmentExpression",                // "key": value tracks like operations -> ace_keyword ace_operator
	"arr": "initializerList",                      // [...] mirrors literal matrices -> ace_text
	"value": "primaryExpression",                  // Evaluates to structural data atoms -> ace_text
	"STRING": "string",                            // Encapsulated text data -> ace_string
	"NUMBER": "constant.numeric",                   // Signed decimal/exponential points -> ace_constant ace_numeric
	"jsonKey": "variable",
	"jsonValue": "string",
	"ws": "text",                                  // Maps 'WS' tokens directly to native ace_text
	"type_text": "text",
};

