


// @ts-check

/** @type {Record<string, string[]>} */

export const ROSETTA_Q3_MAPPING = {

	// =====================================================================
	// 1. HIGHER-LEVEL PARSER TRANSLATION UNITS & GLOBAL FILE ROOTS
	// =====================================================================
	"arenaFile": ["translationUnit"],
	"cameraFile": ["translationUnit"],
	"configFile": ["translationUnit"],
	"mapFile": ["translationUnit"],
	"menuFile": ["translationUnit"],
	"shaderFile": ["translationUnit"],
	"skinFile": ["translationUnit"],

	// =====================================================================
	// 2. SCOPES, DATA STRUCTS, LOCAL COMPONENT BLOCKS & BODY BODIES
	// =====================================================================
	"arenaBlock": ["compoundStatement"],             // Structural data block wrapped in '{ ... }'
	"cameraBlock": ["compoundStatement"],            // Nested configuration block wrapped in '{ ... }'
	"blockBody": ["blockItemList"],                  // Internal list sequence within braces
	"elementStatement": ["blockItem"],                // Individual statement node inside a local frame
	"nestedBlock": ["compoundStatement"],            // Recursive sub-blocks mapping to local scopes
	"entityBlock": ["compoundStatement"],            // Worldspawn or entity brush scope boundaries
	"entityContent": ["blockItem"],                  // Metadata key-values or geometric solids
	"brushBlock": ["compoundStatement"],             // Convex solid layout wrapping face metrics
	"globalScopeWrapper": ["compoundStatement"],      // Main layout brace enclosure for menu assets
	"definitionBody": ["blockItemList"],            // Outer sequence tracking for layouts
	"blockDeclaration": ["compoundStatement"],       // Specific window element boundaries
	"blockContentBody": ["blockItemList"],          // Layout components child sequence
	"eventBlockStatement": ["compoundStatement"],    // Live action script triggers wrapping sub-commands
	"actionScriptBody": ["blockItemList"],           // String command sequence running inside a UI trigger
	"shader": ["compoundStatement"],                 // Base shader block container
	"blockBody_shader": ["blockItemList"],          // Core pass parameters and stage rules
	"blockStatement": ["blockItem"],                 // Structural modifier statement inside material frames
	"stageBlock": ["compoundStatement"],             // CSS-like hardware rendering stage block
	"stageBody": ["blockItemList"],                 // Render pass functions chain list

	// =====================================================================
	// 3. MUTATIONS, STATE ASSIGNMENTS & DATA INITIALIZERS
	// =====================================================================
	"propertyStatement": ["assignmentExpression", "initDeclarator"], // Attributes binding directly to scalar values
	"assignmentExpression": ["assignmentExpression"],  // Engine variable mutations mapping to direct mutations
	"bindExpression": ["assignmentExpression"],        // User hotkey mappings binding targets to states
	"epair": ["initDeclarator"],                       // String-to-string dictionary definitions
	"faceDefinition": ["initializerList"],             // 3 Plane equations plus matrix configurations
	"planeDef": ["initializerList"],                   // 3D positional vector arrays wrapping numeric constants
	"skinLine": ["initDeclarator"],                    // Binary mesh string flags mapping to rendering destinations

	// =====================================================================
	// 4. SUBROUTINES, CALLS & CONTROL FLOW EVALUATIONS
	// =====================================================================
	"commandExpression": ["expressionStatement"],      // Standalone execution commands mapping to statements
	"actionCommandStatement": ["expressionStatement"], // Executable functions running inside interactive loops
	"globalDirectiveStatement": ["expressionStatement"], // Structural engine configurations running globally
	"surfaceParmStatement": ["declaration"],            // Content/physics property flag assignments
	"deformStatement": ["expressionStatement"],        // Algorithmic vertex displacement calls
	"tcModStatement": ["expressionStatement"],          // Real-time matrix manipulation transformations
	"bypassedExtensionStatement": ["expressionStatement"], // Legacy tool settings skipped via single statement tracks
	"implicitMappingStatement": ["declaration"],       // Hardcoded texture asset file assignments
	"conditionalBlock": ["selectionStatement"],        // Preprocessor or material control flow branching
	"conditionalElif": ["selectionStatement"],         // Preprocessor sub-branching chains
	"conditionalElse": ["selectionStatement"],         // Preprocessor fallback branch bounds
	"conditionalExpression": ["logicalOrExpression", "logicalAndExpression"], // Multi-operator condition chains
	"expressionTerm": ["relationalExpression", "equalityExpression"],         // Binary evaluation operators
	"stageStatement": ["expressionStatement"],         // Rendering instructions passed directly to graphics pipes

	// =====================================================================
	// 5. NAMING IDENTIFIERS, ARGUMENTS & TERM LEAVES
	// =====================================================================
	"shaderName": ["typedefName", "Identifier"],       // Global semantic identifier tracking keys
	"targetCvar": ["Identifier"],                      // Storage location pointers for state sync loops
	"bindKey": ["primaryExpression", "constant"],      // Raw input codes mapping to execution constants
	"arenaKeyword": ["typedefName", "Identifier"],     // Predefined metadata dictionary properties
	"argument": ["primaryExpression", "constant"],     // Variadic input strings or scalar arguments
	"value": ["primaryExpression", "constant"],        // Base atomic types and terminal literals
	"commentLine": ["comment"],                        // Bypassed inline layout notes or remarks

	// =====================================================================
	// 6. LEXER TO TERMINAL C GRAMMAR EQUIVALENTS
	// =====================================================================
	"BLOCK_TYPE": ["typedefName", "Identifier"],       // Block structures lookups
	"PROPERTY_KEYWORD": ["typedefName", "Identifier"],  // Field property types
	"EVENT_KEYWORD": ["typedefName", "Identifier"],     // Event mapping handles
	"ACTION_COMMAND": ["Identifier"],                  // Call targets
	"GLOBAL_DIRECTIVE": ["Identifier"],                // Configuration handles
	"SURFACE_PARM_KEYWORD": ["Identifier"],            // Flags indicators
	"DEFORM_VERTEXES_KEYWORD": ["Identifier"],         // Functional keys
	"TC_MOD_KEYWORD": ["Identifier"],                  // Function names
	"IMPLICIT_MAPPING_KEYWORD": ["Identifier"],        // Asset keys
	"STAGE_DIRECTIVE": ["Identifier"],                 // Pipeline operations
	"TOOL_EXTENSION": ["Identifier"],                  // Custom attributes
	"SURFACE_PARM_VALUE": ["constant"],                // Bitmask flags constants
	"DEFORM_MODIFIER": ["constant"],                   // Functional modifiers
	"TC_MOD_MODIFIER": ["constant"],                   // Matrix calculation indicators
	"WAVE_FUNCTION": ["constant"],                     // Algorithmic math functions
	"ENUM_MODIFIER": ["constant"],                     // Predefined states constants
	"GL_CONSTANT": ["constant"],                       // Pipeline blend options
	"KNOWN_CVAR": ["Identifier"],                      // Engine variable tracking slots
	"PREPROCESSOR_DIRECTIVE": ["Directive"],           // Macro statements
	"IDENTIFIER": ["Identifier"],                      // Generic tokens
	"PATH": ["StringLiteral"],                         // Specialized file descriptors
	"NUMBER": ["constant"],                            // Primitive scalars
	"STRING_LITERAL": ["StringLiteral"],               // Escaped strings arrays
	"LOGICAL_OP": ["AndAnd", "OrOr"],                  // Logic evaluation signs
	"LINE_COMMENT_SL": ["LineComment"],                // Comments
	"LINE_COMMENT_BS": ["LineComment"],                // Escape string remarks
	"BLOCK_COMMENT": ["BlockComment"],                 // Text documents
	"WS": ["Whitespace"],                               // Discarded fields


};
