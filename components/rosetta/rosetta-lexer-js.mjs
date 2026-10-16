

// @ts-check

/** @type {Record<string, string[]>} */

export const ROSETTA_JAVASCRIPT_MAPPING = {
	// =====================================================================
	// 1. HIGHER-LEVEL TRANSLATION ROOTS & GLOBALS
	// =====================================================================
	"program": ["translationUnit"],
	"sourceElements": ["blockItemList"],
	"sourceElement": ["blockItem"],

	// =====================================================================
	// 2. FLOW CONTROL, MODULES & SCOPED CODELINE STATEMENTS
	// =====================================================================
	"statement": ["statement"],
	"statementList": ["blockItemList"],
	"block": ["compoundStatement"],                    // Local lexical scoping block '{ ... }'
	"emptyStatement_": ["emptyStatement_"],            // Bare terminal semicolon ';'
	"expressionStatement": ["expressionStatement"],
	"ifStatement": ["selectionStatement"],             // Standard if-else selection tree
	"iterationStatement": ["iterationStatement"],       // Loop constructs: while, do-while, loop conditions
	"switchStatement": ["selectionStatement"],          // Structural switch statement mapping
	"caseBlock": ["compoundStatement"],                // Bracketed switch block body
	"caseClauses": ["blockItemList"],                  // Chain of case execution lists
	"caseClause": ["labeledStatement"],                // Labeled case jump statement target
	"defaultClause": ["labeledStatement"],             // Fallback default switch statement target
	"labelledStatement": ["labeledStatement"],         // Explicit user-defined loop jump label
	"withStatement": ["compoundStatement"],            // Dynamic scope modification statement block
	"tryStatement": ["compoundStatement"],             // Structured exception handling enclosure block
	"catchProduction": ["compoundStatement"],          // Exception trap block matching C++ local scopes
	"finallyProduction": ["compoundStatement"],        // Post-execution cleanup block
	"debuggerStatement": ["expressionStatement"],      // Environment breakpoint hook mapping to raw expressions
	"eos": ["Semi"],                                   // End of statement token mapping to terminal punctuations

	// =====================================================================
	// 3. STORAGE ALLOCATORS, CLASSES & MEMBER DECLARATIONS
	// =====================================================================
	"declaration": ["declaration"],
	"variableStatement": ["declaration"],
	"variableDeclarationList": ["initDeclaratorList"], // Multi-variable declarations (let a, b, c)
	"singleVariableDeclaration": ["initDeclarator"],   // Singular variable allocation frame
	"variableDeclaration": ["initDeclarator"],         // Instantiated tracking item
	"classDeclaration": ["structOrUnionSpecifier"],    // ES6 class blocks mapping directly to structural types
	"classTail": ["memberDeclarationList"],            // Fields/methods grouping inside a wrapper
	"classElement": ["memberDeclaration"],             // Single component inside structure layout
	"fieldDefinition": ["memberDeclarator"],           // Primitive instance property allocation field
	"classElementName": ["memberDeclarator"],          // Field lookup tag descriptor
	"privateIdentifier": ["Identifier"],               // Encapsulated hash symbol parameter property names
	"propertyName": ["Identifier"],                    // Object key descriptor string references
	"getter": ["functionDefinition"],                  // Bound runtime retrieval subroutine methods
	"setter": ["functionDefinition"],                  // Bound runtime mutation subroutine methods

	// =====================================================================
	// 4. FUNCTION DEFINITIONS, SIGNATURES & ARROW EXPR LOOPS
	// =====================================================================
	"functionDeclaration": ["functionDefinition"],
	"anonymousFunction": ["functionDefinition"],       // Anonymous callbacks and inline allocations
	"functionBody": ["functionBody"],                  // Subroutine local block layout
	"formalParameterList": ["parameterTypeList"],      // Complete signature argument array wrapper
	"formalParameterArg": ["parameterDeclaration"],    // Standard input parameter instance
	"lastFormalParameterArg": ["parameterDeclaration"],// ES6 variadic splat inputs mapping to ellipses (...)
	"arrowFunctionParameters": ["parameterTypeList"],  // Arrow expression inline parameter allocations
	"arrowFunctionBody": ["functionBody"],             // Lambda arrow routine bodies mapping to function execution blocks

	// =====================================================================
	// 5. DATA EXPRESSIONS, COMPOSITE OBJECTS & OPERATIONS
	// =====================================================================
	"expressionSequence": ["expression"],              // Semicolon or comma-delimited expression list
	"singleExpression": ["assignmentExpression"],      // Core evaluation assignment tier
	"arguments": ["argumentExpressionList"],           // Subroutine invocation inputs list
	"argument": ["assignmentExpression"],              // Single parameter evaluated payload
	"propertyAssignment": ["assignmentExpression"],    // Key-value instance payload configurations
	"arrayLiteral": ["initializerList"],               // Bracketed collection structures matching array values
	"elementList": ["initializerList"],                // Internal elements stream sequence
	"arrayElement": ["initializer"],                   // Individual array index definition instance
	"objectLiteral": ["initializerList"],              // Inline structure initializations
	"assignmentOperator": ["assignmentOperator"],      // Compound mutations (*=, /=)

	// =====================================================================
	// 6. MODULE TRANSLATION MACROS & FILE EXPORTS
	// =====================================================================
	"importStatement": ["externalDeclaration"],        // External module linkings mapping to extern qualifiers
	"importFromBlock": ["externalDeclaration"],        // Context library references tracking
	"importModuleItems": ["collection"],               // Destructured structural module layouts list
	"importAliasName": ["typedefName"],                // Virtual type reference tracking alias names
	"moduleExportName": ["typedefName"],               // Public symbol assignment names
	"importedBinding": ["Identifier"],                 // Local symbol instance variables mapping to type names
	"importDefault": ["Identifier"],                  // Base generic import mapping handles
	"importNamespace": ["Identifier"],                 // Globbed star namespace mapping descriptors
	"importFrom": ["StringLiteral"],                   // Source dependency target tracking filepath literal strings
	"aliasName": ["typedefName"],                      // Mapping tag conversions
	"exportStatement": ["externalDeclaration"],        // Public external tracking definitions
	"exportFromBlock": ["externalDeclaration"],        // Pass-through dependency re-routing allocations
	"exportModuleItems": ["collection"],               // Export block items sequence listing
	"exportAliasName": ["typedefName"],                // Exported aliases descriptors

	// =====================================================================
	// 7. TERMINAL LITERAL DATA LEAVES & SPECS
	// =====================================================================
	"literal": ["constant", "predefinedConstant"],    // Atomic boolean or null state references
	"numericLiteral": ["constant"],                    // Numeric data representations
	"bigintLiteral": ["constant"],                    // High-precision math constants
	"templateStringLiteral": ["StringLiteral"],        // Backtick string layouts mapping to string constant arrays
	"templateStringAtom": ["StringLiteral"],           // Interp string sub-component literals
	"assignable": ["Identifier"],                      // Target identifier mutated write addresses
	"identifierName": ["Identifier"],                  // Extracted alpha-numeric string markers
	"identifier": ["Identifier"],                      // Reference lookups
	"reservedWord": ["keyword"],                      // Language system keywords matrix
	"keyword": ["keyword"],                            // Native reserved state statements
	"varModifier": ["storageClassSpecifier"],          // Variable lifecycle constraints (let, var, const)
	"let_": ["storageClassSpecifier"],                  // Block-scoped local memory class markers

};
