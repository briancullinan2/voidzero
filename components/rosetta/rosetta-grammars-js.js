
// @ts-check

/** @type {Record<string, string>} */

const GRAMMAR_JAVASCRIPT_MATRIX = {


	// =====================================================================
	// 1. COMPILATION UNIT ROOTS & GLOBAL TRANSLATION ENGINES
	// =====================================================================
	"program": "ast.root.compilation_unit.entry.javascript",
	"sourceElements": "collection.statements_or_declarations.sequence.global",
	"sourceElement": "statement.scoped.block_element.wrapper.global_node",

	// =====================================================================
	// 2. FLOW CONTROL, CONDITIONAL BRANCHING, & SCOPED STATEMENTS
	// =====================================================================
	"statement": "statement.executable.root_wrapper.javascript_node",
	"statementList": "collection.statements_or_declarations.sequence.local",
	"block": "statement.scope.code_block.local_enclosure.lexical_scope",
	"emptyStatement_": "statement.executable.null_operation_semicolon",
	"expressionStatement": "statement.executable.expression_evaluation",
	"ifStatement": "statement.control.conditional.branching_if_else",
	"iterationStatement": "statement.control.loop.iteration_while_do_for",
	"switchStatement": "statement.control.multi_branch.switch_entry",
	"caseBlock": "statement.scope.code_block.switch_enclosure",
	"caseClauses": "collection.statements.switch_cases.sequence",
	"caseClause": "statement.control.jump_target.case_conditional_label",
	"defaultClause": "statement.control.jump_target.switch_default_fallback",
	"labelledStatement": "statement.control.jump_target.user_defined_loop_label",
	"withStatement": "statement.scope.code_block.dynamic_lexical_injection",
	"tryStatement": "statement.scope.code_block.exception_try_enclosure",
	"catchProduction": "statement.scope.code_block.exception_catch_handler",
	"finallyProduction": "statement.scope.code_block.exception_finally_cleanup",
	"debuggerStatement": "statement.control.compiler_diagnostic.breakpoint_trap",
	"eos": "punctuation.terminator.statement_boundary",

	// =====================================================================
	// 3. CLASSES, DATA CONSTRUCTORS & FIELD ALLOCATIONS
	// =====================================================================
	"declaration": "statement.declaration.variable_or_type.root_wrapper",
	"variableStatement": "statement.declaration.variable_instantiation.root",
	"variableDeclarationList": "collection.variable_initializers.sequence.lexical",
	"singleVariableDeclaration": "declaration.variable.instance_allocator.single",
	"variableDeclaration": "declaration.variable.instance_allocator.item",
	"classDeclaration": "type.composite.structure_layout.class_declaration",
	"classTail": "collection.field_declarations.class_body.sequence",
	"classElement": "declaration.field_or_method.class_member.wrapper",
	"fieldDefinition": "declaration.field.class_property.instance_allocator",
	"classElementName": "symbol.identifier.class_member_name.key",
	"privateIdentifier": "symbol.identifier.encapsulated_private_field.hash_name",
	"propertyName": "symbol.identifier.object_property_name.key",
	"getter": "declaration.function.property_getter_accessor.implementation",
	"setter": "declaration.function.property_setter_accessor.implementation",

	// =====================================================================
	// 4. FUNCTION DEFINITIONS, FORMAL PROTOTYPES & LAMBDAS
	// =====================================================================
	"functionDeclaration": "declaration.function.implementation.root",
	"anonymousFunction": "declaration.function.expression_or_lambda.anonymous",
	"functionBody": "statement.scope.function_body.enclosure.local_frame",
	"formalParameterList": "signature.parameter_types.prototype_descriptor",
	"formalParameterArg": "declaration.parameter.signature_argument.standard",
	"lastFormalParameterArg": "declaration.parameter.signature_argument.variadic_rest",
	"arrowFunctionParameters": "signature.parameter_types.lambda_arguments",
	"arrowFunctionBody": "statement.scope.function_body.lambda_execution_payload",

	// =====================================================================
	// 5. EXPRESSION TREES, COMPOSITE OBJECTS & LOGICAL LOOPS
	// =====================================================================
	"expressionSequence": "expression.sequence.comma_delimited.root",
	"singleExpression": "expression.mutation.assignment.evaluator_tier",
	"arguments": "collection.expressions.function_call_inputs.sequence",
	"argument": "expression.branch.argument_mapping.payload",
	"propertyAssignment": "expression.mutation.assignment.object_literal_pairing",
	"arrayLiteral": "collection.initializers.array_literal_elements.sequence",
	"elementList": "collection.initializers.array_literal_stream.sequence",
	"arrayElement": "value.mutation.initializer.index_payload",
	"objectLiteral": "collection.initializers.object_literal_properties.sequence",
	"assignmentOperator": "operator.mutation.assignment.compound_modifier",

	// =====================================================================
	// 6. ASYNC DEPENDENCY MATRIX & ES6 MODULE EXPORTS
	// =====================================================================
	"importStatement": "statement.declaration.external_dependency.module_import",
	"importFromBlock": "statement.declaration.external_dependency.import_clause",
	"importModuleItems": "collection.destructured_bindings.module_imports.sequence",
	"importAliasName": "type.user_defined.alias_reference.import_mapping",
	"moduleExportName": "type.user_defined.alias_reference.export_binding_source",
	"importedBinding": "symbol.identifier.local_variable_alias.allocated_import",
	"importDefault": "symbol.identifier.default_variable_alias.allocated_import",
	"importNamespace": "symbol.identifier.glob_namespace_alias.allocated_import",
	"importFrom": "literal.string.dependency_file_path.target_uri",
	"aliasName": "type.user_defined.alias_reference.generic_mapping",
	"exportStatement": "statement.declaration.external_exposure.module_export",
	"exportFromBlock": "statement.declaration.external_exposure.pass_through_clause",
	"exportModuleItems": "collection.exposed_bindings.module_exports.sequence",
	"exportAliasName": "type.user_defined.alias_reference.export_mapping",

	// =====================================================================
	// 7. LITERAL DATA ATOMS & PRIMITIVE LEAVES
	// =====================================================================
	"literal": "literal.boolean_or_null.state.leaf",
	"numericLiteral": "literal.numeric.integer_or_float.evaluation.leaf",
	"bigintLiteral": "literal.numeric.arbitrary_precision_integer.leaf",
	"templateStringLiteral": "literal.string.interpolated_template.backtick_root",
	"templateStringAtom": "literal.string.template_sub_component.segment",
	"assignable": "symbol.identifier.mutation_target.lvalue_reference",
	"identifierName": "symbol.identifier.generic_name.marker",
	"identifier": "symbol.identifier.reference_or_declaration.name",
	"reservedWord": "keyword.system_reserved.token_identity",
	"keyword": "keyword.language_control.token_identity",
	"varModifier": "modifier.linkage_and_scope.variable_lifecycle_modifier",
	"let_": "modifier.linkage_and_scope.lexical_block_lifetime"

};
