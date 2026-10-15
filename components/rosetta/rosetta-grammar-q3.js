
// @ts-check

/** @type {Record<string, string>} */
const GRAMMAR_Q3_MATRIX = {


	// =====================================================================
	// 1. COMPILATION UNIT ROOTS & GLOBAL TRANSLATION ENGINES
	// =====================================================================
	"arenaFile": "ast.root.compilation_unit.entry.quake3_arena",
	"cameraFile": "ast.root.compilation_unit.entry.quake3_camera",
	"configFile": "ast.root.compilation_unit.entry.quake3_config",
	"mapFile": "ast.root.compilation_unit.entry.quake3_map",
	"menuFile": "ast.root.compilation_unit.entry.quake3_menu",
	"shaderFile": "ast.root.compilation_unit.entry.quake3_shader",
	"skinFile": "ast.root.compilation_unit.entry.quake3_skin",
	"includeDirective": "ast.declaration.external_scope.preprocessor_include",

	// =====================================================================
	// 2. SCOPING CONTEXTS, LOCAL STRUCTURES & CODE ENCLOSURES
	// =====================================================================
	"arenaBlock": "ast.scope.data_block.local_enclosure.arena_metadata",
	"cameraBlock": "ast.scope.code_block.local_enclosure.camera_path",
	"blockBody": "collection.statements_or_declarations.sequence.camera_payload",
	"elementStatement": "statement.scoped.block_element.wrapper.camera_node",
	"nestedBlock": "ast.scope.data_block.recursive_nested.sub_layout",
	"entityBlock": "ast.scope.data_block.local_enclosure.map_entity",
	"entityContent": "statement.scoped.block_element.wrapper.entity_node",
	"brushBlock": "ast.scope.data_block.local_enclosure.geometric_brush",
	"globalScopeWrapper": "ast.scope.translation_unit.global.menu_layout",
	"definitionBody": "collection.statements_or_declarations.sequence.menu_payload",
	"blockDeclaration": "ast.scope.data_block.local_enclosure.ui_component",
	"blockContentBody": "collection.statements_or_declarations.sequence.ui_properties",
	"eventBlockStatement": "ast.scope.code_block.local_enclosure.interactive_action_script",
	"actionScriptBody": "collection.statements_or_declarations.sequence.script_commands",
	"shader": "ast.scope.data_block.local_enclosure.material_pass",
	"blockBody_shader": "collection.statements_or_declarations.sequence.shader_directives",
	"blockStatement": "statement.scoped.block_element.wrapper.shader_node",
	"conditionalBlock": "statement.control.conditional.branching_if",
	"conditionalElif": "statement.control.conditional.branching_elif",
	"conditionalElse": "statement.control.conditional.branching_else",
	"stageBlock": "ast.scope.data_block.local_enclosure.material_stage_rendering_pass",
	"stageBody": "collection.statements_or_declarations.sequence.stage_directives",

	// =====================================================================
	// 3. MUTATIONS, DATA SYNC & VARIABLE ASSIGNMENTS
	// =====================================================================
	"propertyStatement": "statement.declaration.variable_or_type.property_assignment",
	"assignmentExpression": "expression.mutation.assignment.cvar_value_sync",
	"bindExpression": "expression.mutation.assignment.input_key_mapping",
	"epair": "declaration.field.entity_metadata.string_pairing",
	"faceDefinition": "collection.initializers.geometric_plane_matrix.alignment_metrics",
	"planeDef": "collection.initializers.vector_array.3d_coordinates",
	"skinLine": "declaration.field.mesh_surface.texture_shader_binding",

	// =====================================================================
	// 4. EXECUTIVE STATEMENTS, OPERATIONS & CONDITIONALS
	// =====================================================================
	"commandExpression": "statement.executable.console_command_invocation",
	"actionCommandStatement": "statement.executable.script_action_invocation",
	"conditionalExpression": "expression.logical.short_circuit.conditional_rules",
	"expressionTerm": "expression.logical.comparison.evaluator",
	"stageStatement": "statement.executable.stage_rendering_command",
	"globalDirectiveStatement": "statement.executable.global_material_directive",
	"surfaceParmStatement": "statement.declaration.surface_flags_allocation",
	"deformStatement": "statement.executable.vertex_deformation_command",
	"tcModStatement": "statement.executable.texture_coordinate_modifier_command",
	"bypassedExtensionStatement": "statement.executable.ignored_vendor_tool_extension",
	"implicitMappingStatement": "statement.declaration.implicit_structural_block_mapping",

	// =====================================================================
	// 5. ATOMIC LITERAL DATA LEAVES & TERMINALS
	// =====================================================================
	"shaderName": "type.user_defined.alias_reference.shader_identity",
	"targetCvar": "symbol.identifier.reference_or_declaration.cvar_name",
	"bindKey": "symbol.identifier.hardware_input.key_identity",
	"arenaKeyword": "type.descriptor.primitive_or_composite.arena_field",
	"argument": "value.mutation.initializer.parameter_payload",
	"value": "literal.numeric_or_string.evaluation.leaf",
	"commentLine": "preprocessor.documentation.comment_node.hidden",

};
