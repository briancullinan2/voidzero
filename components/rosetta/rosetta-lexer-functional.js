

// @ts-check

/** @type {Record<string, string>} */

const LEXER_FUNCTIONAL_CLASSIFIER_MATRIX = {

	// =====================================================================
	// 1. COMPILER INTRINSICS, EXTENSIONS & CALLING CONVENTIONS
	// =====================================================================
	"Attribute": "compiler_extension.gcc.attribute.annotation",
	"KW__builtin_offsetof": "compiler_intrinsic.macro.offsetof",
	"KW__builtin_va_arg": "compiler_intrinsic.macro.variable_arguments",
	"KW__builtin_choose_expr": "compiler_intrinsic.evaluation.static_conditional",
	"KW__builtin_types_compatible_p": "compiler_intrinsic.evaluation.type_checking",
	"KW__builtin_tgmath": "compiler_intrinsic.mathematics.type_generic",
	"KW__builtin_complex": "compiler_intrinsic.algebraic.complex_numbers",
	"KW__cdecl": "calling_convention.x86.cdecl.modifier",
	"KW__clrcall": "calling_convention.managed.clrcall.modifier",
	"KW__declspec": "compiler_extension.msvc.storage_class.declspec",
	"KW__extension__": "compiler_extension.gcc.silence_warnings.meta",
	"KW__fastcall": "calling_convention.x86.fastcall.modifier",
	"KW__m128": "datatype.vector.simd.128bit_float",
	"KW__m128d": "datatype.vector.simd.128bit_double",
	"KW__m128i": "datatype.vector.simd.128bit_integer",
	"KW__stdcall": "calling_convention.x86.stdcall.modifier",
	"KW__thiscall": "calling_convention.x86.thiscall.modifier",
	"KW__vectorcall": "calling_convention.simd.vectorcall.modifier",
	"KW__real__": "operator.complex_numbers.real_part.extractor",
	"KW__imag__": "operator.complex_numbers.imag_part.extractor",
	"KW__func__": "literal.string.local_function_name.predefined",
	"KW__FUNCTION__": "literal.string.local_function_name.macro",
	"KW__PRETTY_FUNCTION__": "literal.string.decorated_function_name.macro",

	// =====================================================================
	// 2. MEMORY LAYOUT, ALIGNMENT, BOUNDS & STORAGE COMMANDS
	// =====================================================================
	"Alignas": "keyword.modifier.memory_layout.alignment_specifier",
	"Alignof": "keyword.operator.memory_layout.alignment_query",
	"Maxof": "keyword.operator.numerical_limits.maximum_bound",
	"Minof": "keyword.operator.numerical_limits.minimum_bound",
	"Countof": "keyword.operator.array_bounds.element_capacity",
	"Sizeof": "keyword.operator.memory_allocation.byte_size",
	"Auto": "keyword.modifier.storage_class.automatic_lifetime",
	"Extern": "keyword.modifier.storage_class.external_linkage",
	"Register": "keyword.modifier.storage_class.hardware_register",
	"Static": "keyword.modifier.storage_class.static_linkage",
	"Typedef": "keyword.declaration.type_alias.root",
	"ThreadLocal": "keyword.modifier.storage_class.thread_local_lifetime",

	// =====================================================================
	// 3. HARD SPECIFIER PRIMITIVES & TYPE QUALIFIERS
	// =====================================================================
	"Bool": "datatype.primitive.boolean",
	"Char": "datatype.primitive.character",
	"Double": "datatype.primitive.floating_point.double_precision",
	"Float": "datatype.primitive.floating_point.single_precision",
	"Int": "datatype.primitive.integer.basic",
	"Long": "datatype.primitive.integer.extended_precision",
	"Short": "datatype.primitive.integer.reduced_precision",
	"Signed": "datatype.modifier.sign.explicit_signed",
	"Unsigned": "datatype.modifier.sign.explicit_unsigned",
	"Void": "datatype.primitive.empty_placeholder",
	"Atomic": "datatype.qualifier.concurrency.atomic_thread_fence",
	"BitInt": "datatype.primitive.integer.arbitrary_width_precise",
	"Complex": "datatype.modifier.algebraic.complex_floating_point",
	"Decimal128": "datatype.primitive.floating_point.ieee_decimal128",
	"Decimal32": "datatype.primitive.floating_point.ieee_decimal32",
	"Decimal64": "datatype.primitive.floating_point.ieee_decimal64",
	"Imaginary": "datatype.modifier.algebraic.imaginary_floating_point",
	"Const": "datatype.qualifier.mutability.read_only",
	"Constexpr": "datatype.qualifier.mutability.compile_time_constant",
	"Restrict": "datatype.qualifier.pointer_aliasing.optimization_hint",
	"Volatile_1": "datatype.qualifier.memory_visibility.volatile_access",
	"Volatile_2": "datatype.qualifier.memory_visibility.volatile_access_alias",

	// =====================================================================
	// 4. COMPLEX ARCHITECTURAL TYPE STRUCTURES
	// =====================================================================
	"Enum": "datatype.composite.enumeration.keyword",
	"Struct": "datatype.composite.structure_layout.keyword",
	"Union": "datatype.composite.overlapping_union_layout.keyword",
	"Typeof": "datatype.query.dynamic_typeof.keyword",
	"Typeof_unqual": "datatype.query.dynamic_typeof_unqualified.keyword",

	// =====================================================================
	// 5. CONTROL FLOW, ITERATION & BRANCHING KEYWORDS
	// =====================================================================
	"Break": "keyword.control.flow.loop_or_switch_break",
	"Continue": "keyword.control.flow.loop_iteration_continue",
	"Do": "keyword.control.flow.loop_do_while_entry",
	"Else": "keyword.control.flow.conditional_else_branch",
	"For": "keyword.control.flow.loop_for_counter_entry",
	"Goto": "keyword.control.flow.arbitrary_jump_goto",
	"If": "keyword.control.flow.conditional_if_entry",
	"Return": "keyword.control.flow.subroutine_exit_return",
	"Switch": "keyword.control.flow.multi_branch_switch_entry",
	"While": "keyword.control.flow.loop_while_conditional_entry",
	"Case": "keyword.control.branch.switch_case_label",
	"Default": "keyword.control.branch.switch_default_label",
	"Generic": "keyword.control.branch.compile_time_generic_switch",

	// =====================================================================
	// 6. FUNCTION BEHAVIORS, ANNOTATIONS & INLINE ASSEMBLERS
	// =====================================================================
	"Inline": "keyword.modifier.function_linkage.inline_hint",
	"Noreturn": "keyword.modifier.function_behavior.noreturn_attribute",
	"Asm_1": "keyword.assembly.inline_block.standard",
	"Asm_2": "keyword.assembly.inline_block.msvc_variant",
	"Asm_3": "keyword.assembly.inline_block.gcc_variant",
	"Deprecated": "keyword.annotation.compiler_diagnostic.deprecated_target",
	"Label": "keyword.declaration.gcc.local_label_assertion",
	"Static_assert": "keyword.assertion.compile_time.static_assert_c11",
	"StaticAssert": "keyword.assertion.compile_time.static_assert_alias",

	// =====================================================================
	// 7. STATE CONSTANTS & LITERAL DATA LEAVES
	// =====================================================================
	"True_": "literal.boolean.constant_true",
	"False_": "literal.boolean.constant_false",
	"Nulptr": "literal.pointer.null_reference_constant",
	"Identifier": "symbol.identifier.reference_or_declaration.name",
	"DigitSequence": "token.sub_component.raw_digits_sequence",
	"IntegerConstant": "literal.numeric.integer.value",
	"FloatingConstant": "literal.numeric.floating_point.value",
	"CharacterConstant": "literal.character.encoded_byte.value",
	"StringLiteral": "literal.string.escaped_array.value",

	// =====================================================================
	// 8. STRUCTURAL ENCLOSURES, DELIMITERS & TERMINATORS
	// =====================================================================
	"LeftParen": "punctuation.enclosure.grouping.opening_parenthesis",
	"RightParen": "punctuation.enclosure.grouping.closing_parenthesis",
	"LeftBracket": "punctuation.enclosure.array_index.opening_bracket",
	"RightBracket": "punctuation.enclosure.array_index.closing_bracket",
	"LeftBrace": "punctuation.enclosure.scope_block.opening_brace",
	"RightBrace": "punctuation.enclosure.scope_block.closing_brace",
	"Semi": "punctuation.terminator.statement_semicolon",
	"Comma": "punctuation.separator.expression_list_comma",
	"Colon": "punctuation.separator.label_or_ternary_colon",

	// =====================================================================
	// 9. MATHEMATICAL, BITWISE & LOGICAL OPERATORS
	// =====================================================================
	"Less": "operator.logical.comparison.less_than",
	"LessEqual": "operator.logical.comparison.less_than_or_equal",
	"Greater": "operator.logical.comparison.greater_than",
	"GreaterEqual": "operator.logical.comparison.greater_than_or_equal",
	"Equal": "operator.logical.comparison.identity_equality",
	"NotEqual": "operator.logical.comparison.identity_inequality",
	"AndAnd": "operator.logical.short_circuit.conjunction",
	"OrOr": "operator.logical.short_circuit.disjunction",
	"Not": "operator.logical.boolean_negation",
	"Plus": "operator.algebraic.mathematical.addition_or_unary_plus",
	"PlusPlus": "operator.mutation.increment.pre_or_post",
	"Minus": "operator.algebraic.mathematical.subtraction_or_unary_minus",
	"MinusMinus": "operator.mutation.decrement.pre_or_post",
	"Star": "operator.algebraic.mathematical.multiplication_or_pointer_indirection",
	"Div": "operator.algebraic.mathematical.division",
	"Mod": "operator.algebraic.mathematical.modulus_remainder",
	"LeftShift": "operator.bitwise.shift.left",
	"RightShift": "operator.bitwise.shift.right",
	"And": "operator.bitwise.conjunction_or_address_of",
	"Or": "operator.bitwise.inclusive_disjunction",
	"Caret": "operator.bitwise.exclusive_disjunction_xor",
	"Tilde": "operator.bitwise.one_complement_inversion",
	"Question": "operator.conditional.ternary.query",

	// =====================================================================
	// 10. MUTATION VARIABLES & COMPOUND ASSIGNMENTS
	// =====================================================================
	"Assign": "operator.mutation.assignment.direct",
	"StarAssign": "operator.mutation.assignment.compound_multiplication",
	"DivAssign": "operator.mutation.assignment.compound_division",
	"ModAssign": "operator.mutation.assignment.compound_modulus",
	"PlusAssign": "operator.mutation.assignment.compound_addition",
	"MinusAssign": "operator.mutation.assignment.compound_subtraction",
	"LeftShiftAssign": "operator.mutation.assignment.compound_left_shift",
	"RightShiftAssign": "operator.mutation.assignment.compound_right_shift",
	"AndAssign": "operator.mutation.assignment.compound_bitwise_and",
	"XorAssign": "operator.mutation.assignment.compound_bitwise_xor",
	"OrAssign": "operator.mutation.assignment.compound_bitwise_or",

	// =====================================================================
	// 11. TRAVERSAL COMPONENT POINTERS & FIELDS
	// =====================================================================
	"Arrow": "operator.member_access.pointer_dereference_arrow",
	"Dot": "operator.member_access.direct_structure_dot",
	"Ellipsis": "punctuation.signature.variadic_parameter_ellipsis",

	// =====================================================================
	// 12. PREPROCESSOR STREAMS & COMPILER META PIPELINES
	// =====================================================================
	"MultiLineMacro": "preprocessor.stream.gcc_multiline_macro.hidden",
	"LineDirective": "preprocessor.stream.line_control_directive.isolated_channel",
	"Directive": "preprocessor.stream.generic_compiler_directive.hidden",
	"Whitespace": "preprocessor.layout.whitespace.hidden",
	"Newline": "preprocessor.layout.line_break.hidden",
	"BlockComment": "preprocessor.documentation.multi_line_comment.hidden",
	"LineComment": "preprocessor.documentation.single_line_comment.hidden"
};
