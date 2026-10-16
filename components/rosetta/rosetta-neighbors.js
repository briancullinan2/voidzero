// @ts-check

/** @type {Worker & import('./rosetta-types.d').RosettaWorker} */
const workerSelf = /** @type {any} */ (self);


/** @type {Record<string, import('./rosetta-types.d').RosettaNeighbors>} */
export const ROSETTA_NEIGHBORHOOD_ASSOCIATIONS = {
	// =====================================================================
	// 1. SYSTEM BASE COMPILATION & PRECOMPILER PIPELINES (6.10)
	// =====================================================================
	"match.intercept.directive.precompiler.import": (t, s) =>
	{
		if(!t.tokenSymbol?.toLowerCase().includes('directive') && !t.tokenRule?.toLowerCase().includes('preproc') && !t.ruleHistory?.some(r => r.toLowerCase().includes('directive'))) return null;
		let tag = "keyword.control.import.directive";
		const match = t.text?.match(/(?:#include|import|require)\s*["<]([^">]+)[">]/);
		if(match?.[1])
		{
			const cleanTarget = match[1].trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
			const win = typeof window !== 'undefined' ? window : null;
			return tag + `.target_${cleanTarget}` + ((!workerSelf.__missingHeaders || workerSelf.__missingHeaders.has(match[1].trim())) ? ".status_resolved" : ".status_missing.annotation_required");
		}
		return tag + ".err_malformed";
	},

	// =====================================================================
	// 2. EXPRESSIONS, FUNCTION INVOCATIONS, & BUILT-INS (6.5)
	// =====================================================================
	"is_function_call": (t, s) => (!t.tokenSymbol?.includes('Identifier') && t.tokenRule !== 'Identifier') ? null : (s?.[t.tokenIndex + 1]?.text === '(' || ['LeftParen'].includes(s?.[t.tokenIndex + 1]?.tokenSymbol ?? '') || t.ruleHistory?.some(r => ['postfixexpression', 'primaryexpression'].includes(r.toLowerCase()))) ? "function.support.function" : null,

	"is_member_access": (t, s) => (!t.tokenSymbol?.includes('Identifier')) ? null : (['.', '->'].includes(s?.[t.tokenIndex - 1]?.text) || t.ruleHistory?.some(r => r.toLowerCase().includes('postfixexpression') && ['.', '->'].includes(s?.[t.tokenIndex - 1]?.text))) ? "variable.other.member" : null,

	"is_pointer_indirection": (t, s) => (!['*', '^'].includes(t.text)) ? null : (s?.[t.tokenIndex + 1]?.tokenSymbol?.includes('Identifier') || ['const', 'volatile', 'restrict'].includes(s?.[t.tokenIndex + 1]?.text) || t.ruleHistory?.some(r => r.toLowerCase().includes('pointer'))) ? "keyword.operator.pointer" : null,

	"is_generic_selection": (t, s) => (t.text === '_Generic' || t.ruleHistory?.some(r => r.toLowerCase().includes('generic'))) ? "keyword.control.generic" : (s?.[t.tokenIndex - 1]?.text === ':' && s?.[t.tokenIndex - 3]?.text === '_Generic') ? "constant.library.generic_assoc" : null,

	"is_builtin_intrinsic": (t, s) => (t.text?.startsWith('__builtin_') || ['__func__', '__FUNCTION__', '__PRETTY_FUNCTION__'].includes(t.text)) ? "support.function.builtin" : null,

	// =====================================================================
	// 3. DECLARATIONS, DEFINITIONS, & SIGNATURE PINPOINTS (6.7)
	// =====================================================================
	"is_function_definition": (t, s) => (!t.tokenSymbol?.includes('Identifier')) ? null : (s?.[t.tokenIndex + 1]?.text === '(' && (t.ruleHistory?.some(r => ['directdeclarator', 'functiondefinition', 'declarator'].includes(r.toLowerCase())) || s?.slice(Math.max(0, t.tokenIndex - 4), t.tokenIndex).some(p => ['int', 'char', 'void', 'float', 'double', 'long', 'short', 'signed', 'unsigned'].includes(p.text?.toLowerCase()) || p.tokenSymbol?.includes('Type') || p.tokenSymbol?.includes('Storage')))) ? "function.entity.name.function" : null,

	"is_parameter_declaration": (t, s) => (!t.tokenSymbol?.includes('Identifier')) ? null : (t.ruleHistory?.some(r => ['parameter', 'declaration', 'argument'].includes(r.toLowerCase())) || (s?.slice(Math.max(0, t.tokenIndex - 10), t.tokenIndex).some(p => p.text === '(' || p.text === ',') && s?.slice(t.tokenIndex + 1, t.tokenIndex + 5).some(n => n.text === ')' || n.text === ','))) ? "variable.parameter" : null,

	"is_typedef_definition": (t, s) => (!t.tokenSymbol?.includes('Identifier')) ? null : (t.ruleHistory?.some(r => r.toLowerCase().includes('typedef')) || s?.slice(Math.max(0, t.tokenIndex - 8), t.tokenIndex).some(p => p.text === 'typedef')) ? "storage.type.typedef_alias" : null,

	"is_type_specifier_keyword": (t, s) => (['void', 'char', 'short', 'int', 'long', 'float', 'double', 'signed', 'unsigned', '_Complex', '__m128', '__m128d', '__m128i', '_Atomic'].includes(t.text) || t.ruleHistory?.some(r => ['typespecifier', 'typename', 'type'].includes(r.toLowerCase())) || t.tokenSymbol?.toLowerCase().includes('type')) ? "storage.type" : null,

	"is_storage_class_modifier": (t, s) => (['auto', 'constexpr', 'extern', 'register', 'static', 'typedef', 'const', 'volatile', 'restrict', 'inline', '_Noreturn'].includes(t.text) || t.ruleHistory?.some(r => ['storageclassspecifier', 'typequalifier', 'functionspecifier', 'storage', 'qualifier', 'modifier'].includes(r.toLowerCase())) || t.tokenSymbol?.toLowerCase().includes('storage') || t.tokenSymbol?.toLowerCase().includes('qualifier') || t.tokenSymbol?.toLowerCase().includes('modifier')) ? "storage.modifier" : null,

	// =====================================================================
	// 4. COMPOSITES, STRUCTURE DESIGNATORS, & ENUMS (6.7.2)
	// =====================================================================
	"is_composite_layout": (t, s) => (['struct', 'union', 'enum'].includes(t.text) || t.ruleHistory?.some(r => ['structorunionspecifier', 'enumspecifier'].includes(r.toLowerCase()))) ? "storage.type.composite" : null,

	"is_designated_initializer": (t, s) => (t.tokenSymbol?.includes('Identifier') && (t.ruleHistory?.some(r => r.toLowerCase().includes('designat')) || (s?.[t.tokenIndex - 1]?.text === '.' && s?.slice(Math.max(0, t.tokenIndex - 4), t.tokenIndex).some(p => p.text === '{' || p.text === ',')))) ? "variable.other.member.designator" : null,

	"is_enum_constant": (t, s) => (t.tokenSymbol?.includes('Identifier') && (t.ruleHistory?.some(r => r.toLowerCase().includes('enumerator')) || ((s?.[t.tokenIndex + 1]?.text === '=' || s?.[t.tokenIndex + 1]?.text === ',' || s?.[t.tokenIndex + 1]?.text === '}') && s?.slice(Math.max(0, t.tokenIndex - 15), t.tokenIndex).some(p => p.text === 'enum')))) ? "constant.library.enum" : null,

	// =====================================================================
	// 5. ATTRIBUTES, DIRECTIVES, & INLINE ASSEMBLERS (GCC / GNU / MSVC)
	// =====================================================================
	"is_attribute_annotation": (t, s) => (['__attribute__', '__declspec'].includes(t.text) || t.ruleHistory?.some(r => r.toLowerCase().includes('attribute')) || s?.[t.tokenIndex - 1]?.text === '[[' || s?.[t.tokenIndex - 2]?.text === '[[') ? "meta.tag.annotation" : null,

	"is_inline_assembly": (t, s) => (t.text?.toLowerCase() === 'asm' || ['__asm', '__asm__'].includes(t.text) || t.ruleHistory?.some(r => r.toLowerCase().includes('asm'))) ? "keyword.control.assembly" : (s?.slice(Math.max(0, t.tokenIndex - 5), t.tokenIndex).some(p => p.text?.toLowerCase() === 'asm')) ? "variable.other.assembly_payload" : null,

	"is_calling_convention": (t, s) => (['__cdecl', '__clrcall', '__stdcall', '__fastcall', '__thiscall', '__vectorcall'].includes(t.text) || t.ruleHistory?.some(r => r.toLowerCase().includes('vcspecificmodifer'))) ? "storage.modifier.calling_convention" : null,

	// =====================================================================
	// 6. STATEMENTS, CONTROL FLOW, & LABELS (6.8)
	// =====================================================================
	"is_control_statement": (t, s) => (['if', 'else', 'switch', 'while', 'do', 'for', 'goto', 'continue', 'break', 'return'].includes(t.text) || t.ruleHistory?.some(r => ['statement', 'selectionstatement', 'iterationstatement', 'jumpstatement'].includes(r.toLowerCase())) || t.tokenSymbol?.toLowerCase().includes('statement') || t.tokenSymbol?.toLowerCase().includes('control') || t.tokenSymbol?.toLowerCase().includes('loop') || t.tokenSymbol?.toLowerCase().includes('branch')) ? "keyword.control" : null,

	"is_case_default_label": (t, s) => (['case', 'default'].includes(t.text) || t.ruleHistory?.some(r => r.toLowerCase().includes('labeledstatement'))) ? "keyword.control.label" : null,

	"is_code_label_assertion": (t, s) => (t.tokenSymbol?.includes('Identifier') && s?.[t.tokenIndex + 1]?.text === ':' && !['case', 'default'].includes(s?.[t.tokenIndex - 1]?.text)) ? "entity.name.label" : (t.text === '__label__') ? "keyword.control.label_declaration" : null,

	// =====================================================================
	// 7. ENCLOSURES, STRUCTURAL PUNCTUATION & ANNOTATIONS
	// =====================================================================
	"is_structural_opening": (t, s) => (['{', '(', '['].includes(t.text)) ? "punctuation.enclosure.opening" : null,

	"is_structural_closing": (t, s) => (['}', ')', ']'].includes(t.text)) ? "punctuation.enclosure.closing" : null,

	"is_structural_separator": (t, s) => ([',', ';', '.'].includes(t.text)) ? "punctuation.separator" : null,

	"is_code_comment": (t, s) =>
	{
		const ruleLow = t.tokenRule ? t.tokenRule.toLowerCase() : "";
		const symLow = t.tokenSymbol ? t.tokenSymbol.toLowerCase() : "";

		if(t.text.includes('#include'))
		{
			return 'keyword.support.include';
		}

		// Explicitly exclude whitespace, newline rules, or space characters
		// from being accidentally blanketed under comment formatting hooks
		if(ruleLow.includes('whitespace') || ruleLow.includes('newline') || t.text === " " || t.text === "\t" || t.text.trim().length === 0)
		{
			return null;
		}

		// Apply comment tokens only if rule names explicitly target real comment definitions
		if(ruleLow.includes('comment') || symLow.includes('comment') || t.channel === 1)
		{
			return "comment";
		}

		return null;
	},

	"is_fallback_operator_literal": (t, s) => (t.tokenRule?.startsWith("'") && t.tokenRule?.length <= 5) ? "keyword.operator" : null,

	// =====================================================================
	// 8. MULTI-LANGUAGE JSON MAPPING HOOKS & LEAF LEAVES
	// =====================================================================
	"is_json_key": (t, s) => (t.ruleName === 'jsonKey' || t.ruleHistory?.some(r => r.toLowerCase().includes('jsonkey')) || (t.tokenSymbol?.toLowerCase().includes('string') && s?.[t.tokenIndex + 1]?.text === ':')) ? "variable.key" : null,

	"is_json_value": (t, s) => (t.ruleName === 'jsonValue' || t.ruleHistory?.some(r => r.toLowerCase().includes('jsonvalue')) || (s?.[t.tokenIndex - 1]?.text === ':' && !t.tokenSymbol?.includes('Identifier'))) ? "string.value" : null,

	"is_constant_numeric_literal": (t, s) => (['IntegerConstant', 'FloatingConstant', 'CharacterConstant', 'DigitSequence'].includes(t.tokenRule ?? '') || ['true', 'false', 'nullptr', 'NULL'].includes(t.text) || t.ruleHistory?.some(r => r.toLowerCase().includes('constant')) || t.tokenSymbol?.toLowerCase().includes('constant') || t.tokenSymbol?.toLowerCase().includes('numeric') || t.tokenSymbol?.toLowerCase().includes('digit')) ? "constant.numeric" : null,

	"is_catchall_variable_fallback": (t, s) => (t.tokenSymbol?.includes('Identifier') || t.tokenRule === 'Identifier' || t.ruleName === 'identifier') ? "variable.other" : null
};
