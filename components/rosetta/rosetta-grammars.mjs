

// @ts-check

import { GRAMMAR_JAVASCRIPT_MATRIX } from './rosetta-grammars-js.mjs';
import { GRAMMAR_Q3_MATRIX } from './rosetta-grammar-q3.mjs';

/** @type {Record<string, string>} */

export const GRAMMAR_CLASSIFIER_MATRIX = {

	// =====================================================================
	// 1. COMPILATION UNIT ROOTS & GLOBAL TRANSLATION ENGINES
	// =====================================================================
	"compilationUnit": "ast.root.compilation_unit.entry",
	"translationUnit": "ast.scope.translation_unit.global",
	"externalDeclaration": "ast.declaration.external_scope.wrapper",

	// =====================================================================
	// 2. DATA CONSTANTS, LITERALS & ENUMERATIVE LEAVES
	// =====================================================================
	"constant": "literal.numeric_or_char.evaluation.leaf",
	"predefinedConstant": "literal.boolean_or_null.state.leaf",
	"enumerationConstant": "symbol.identifier.enum_member.reference",
	"enumerator": "declaration.enum_member.allocation",
	"enumeratorList": "collection.enum_members.sequence",

	// =====================================================================
	// 3. EXPRESSION TREES, OPERATORS, & EVALUATION LOOPS
	// =====================================================================
	"primaryExpression": "expression.terminal.atom.evaluator",
	"exprList": "collection.expressions.arguments.sequence",
	"genericSelection": "expression.conditional.static_compile_time.switch",
	"genericAssocList": "collection.generic_associations.sequence",
	"genericAssociation": "expression.branch.generic_match.case",
	"postfixExpression": "expression.evaluator.postfix.root",
	"argumentExpressionList": "collection.expressions.function_call_inputs.sequence",
	"unaryExpression": "expression.evaluator.unary.root",
	"castExpression": "expression.coercion.type_cast.root",
	"multiplicativeExpression": "expression.algebraic.mathematical.multiplication_level",
	"additiveExpression": "expression.algebraic.mathematical.addition_level",
	"shiftExpression": "expression.bitwise.shift.operations",
	"relationalExpression": "expression.logical.comparison.relational",
	"equalityExpression": "expression.logical.comparison.equality",
	"andExpression": "expression.bitwise.conjunction.and",
	"exclusiveOrExpression": "expression.bitwise.disjunction.xor",
	"inclusiveOrExpression": "expression.bitwise.disjunction.or",
	"logicalAndExpression": "expression.logical.short_circuit.conjunction",
	"logicalOrExpression": "expression.logical.short_circuit.disjunction",
	"conditionalExpression": "expression.conditional.ternary.evaluation",
	"assignmentExpression": "expression.mutation.assignment.evaluator",
	"expression": "expression.sequence.comma_delimited.root",
	"constantExpression": "expression.static.compile_time.evaluator",

	// =====================================================================
	// 4. STORAGE SPECS, DECLARATION SPECIFIERS & MODIFIERS
	// =====================================================================
	"declaration": "statement.declaration.variable_or_type.root",
	"declarationSpecifiers": "collection.type_and_storage_modifiers.sequence",
	"declarationSpecifier": "modifier.storage_or_type.qualifier.wrapper",
	"initDeclaratorList": "collection.variable_initializers.sequence",
	"initDeclarator": "declaration.variable.instance_allocator",
	"storageClassSpecifier": "modifier.linkage_and_scope.storage_class",
	"typeSpecifier": "type.descriptor.primitive_or_composite.identity",
	"typeQualifier": "modifier.mutability_and_visibility.qualifier",
	"functionSpecifier": "modifier.function_behavior.optimization_hint",
	"alignmentSpecifier": "modifier.memory_layout.alignment_boundary",
	"typeQualifierList": "collection.type_qualifiers.sequence",

	// =====================================================================
	// 5. COMPOSITE STRUCTURES, UNIONS & MEMORY FIELDS
	// =====================================================================
	"structOrUnionSpecifier": "type.composite.struct_or_union.declaration",
	"structOrUnion": "type.composite.layout_mode.keyword",
	"memberDeclarationList": "collection.field_declarations.struct_or_union.sequence",
	"memberDeclaration": "declaration.field.struct_or_union.allocator",
	"specifierQualifierList": "collection.field_type_specifiers.sequence",
	"typeSpecifierQualifier": "modifier.field.type_or_qualifier.wrapper",
	"memberDeclaratorList": "collection.field_declarators.sequence",
	"memberDeclarator": "declaration.field_instance.allocator",
	"enumSpecifier": "type.composite.enumeration.declaration",
	"enumTypeSpecifier": "type.composite.enum_underlying_type.wrapper",
	"atomicTypeSpecifier": "type.modifier.atomic_concurrency.wrapper",
	"typeofSpecifier": "type.dynamic.typeof_evaluation.query",
	"typeofSpecifierArgument": "type.dynamic.typeof_target.operand",

	// =====================================================================
	// 6. DECLARATORS, SIGNATURE PINPOINTS & POINTER LAYOUTS
	// =====================================================================
	"declarator": "signature.declarator.root",
	"directDeclarator": "signature.direct_declarator.identifier_or_nest",
	"pointer": "signature.pointer.indirection_layers",
	"parameterTypeList": "signature.parameter_types.prototype_descriptor",
	"parameterList": "collection.parameters.prototype_sequence",
	"parameterDeclaration": "declaration.parameter.signature_argument",
	"typeName": "type.descriptor.declaration.identity",
	"abstractDeclarator": "signature.abstract_declarator.anonymous_root",
	"directAbstractDeclarator": "signature.abstract_declarator.anonymous_nested",
	"typedefName": "type.user_defined.alias_reference",
	"initializer": "value.mutation.initializer.assignment_payload",
	"initializerList": "collection.initializers.array_or_struct.sequence",
	"designation": "value.mapping.designated_initializer.prefix",
	"designatorList": "collection.designators.sequence",
	"designator": "value.mapping.field_or_index.selector",

	// =====================================================================
	// 7. ASSERTIONS, ATTRIBUTES & COMPILE-TIME ANNOTATIONS
	// =====================================================================
	"staticAssertDeclaration": "assertion.compile_time.static_assert",
	"attributeDeclaration": "annotation.compiler.attribute_specifier_statement",
	"attributeSpecifierSequence": "collection.annotations.attributes.sequence",
	"attributeSpecifier": "annotation.compiler.attribute_wrapper",
	"attributeList": "collection.individual_attributes.sequence",
	"attribute": "annotation.compiler.attribute_node",
	"attributeToken": "annotation.compiler.attribute_identity_key",
	"attributeArgumentClause": "annotation.compiler.attribute_payload.arguments",
	"balancedTokenSequence": "collection.balanced_tokens.sequence",
	"balancedToken": "structural.balanced_token.enclosure_or_leaf",

	// =====================================================================
	// 8. FLOW CONTROL, BRANCHING, & SCOPED STATEMENTS
	// =====================================================================
	"statement": "statement.executable.root_wrapper",
	"labeledStatement": "statement.control.jump_target.label_or_case",
	"compoundStatement": "statement.scope.code_block.local_enclosure",
	"blockItemList": "collection.statements_or_declarations.sequence",
	"blockItem": "statement.scoped.block_element.wrapper",
	"expressionStatement": "statement.executable.expression_evaluation",
	"selectionStatement": "statement.control.conditional.branching_if_or_switch",
	"iterationStatement": "statement.control.loop.iteration_while_do_for",
	"forCondition": "statement.control.loop_header.bounds_evaluation",
	"forDeclaration": "declaration.loop_local.variable_allocator",
	"forExpression": "expression.loop_iteration.mutation_step",
	"jumpStatement": "statement.control.flow_break.jump_commands",

	// =====================================================================
	// 9. FUNCTION DEFINITIONS & BODY ENCLOSURES
	// =====================================================================
	"functionDefinition": "declaration.function.implementation.root",
	"declarationList": "collection.legacy_k_and_r.declarations.sequence",
	"functionBody": "statement.scope.function_body.enclosure",
	"identifierList": "collection.identifiers.parameter_names.sequence",

	// =====================================================================
	// 10. GNU COMPILER EXTENSIONS & INLINE ASSEMBLER (GCC)
	// =====================================================================
	"gnuArrayDesignator": "value.mapping.gcc.array_range_designator",
	"gnuIdentifier": "symbol.identifier.gcc.macro_or_label_reference",
	"asmArgument": "assembly.inline.argument_mapping.payload",
	"asmClobbers": "collection.assembly.register_clobber_targets",
	"asmDefinition": "assembly.inline.expression.definition",
	"asm_": "assembly.inline.execution.keyword_variants",
	"toplevelAsmArgument": "assembly.inline.global_scope.payload",
	"asmOperand": "assembly.inline.register_operand.binding",
	"asmOperands": "collection.assembly.operands_sequence",
	"asmQualifier": "assembly.inline.modifier.execution_mode",
	"volatile_": "modifier.volatile_execution.keyword_variants",
	"asmQualifierList": "collection.assembly.qualifiers.sequence",
	"asmStatement": "statement.assembly.inline_code_block",
	"asmStringLiteral": "literal.string.assembly.instruction_text",
	"gccDeclaratorExtension": "signature.modifier.gcc.declarator_extension",
	"gnuAttribute": "annotation.compiler.gcc.attribute_node",
	"gnuAttributeList": "collection.gcc.attributes.sequence",
	"gnuAttributes": "collection.gcc.attributes.multi_sequence",
	"gnuSingleAttribute": "annotation.compiler.gcc.attribute_leaf_token",
	"simpleAsmExpr": "assembly.inline.basic_expression",

	// =====================================================================
	// 11. VISUAL C++ EXTENSIONS (MSVC Linkage calling conventions)
	// =====================================================================
	"vcSpecificModifer": "modifier.calling_convention.msvc.interop_linkage",


	...GRAMMAR_JAVASCRIPT_MATRIX,
	...GRAMMAR_Q3_MATRIX,
};

