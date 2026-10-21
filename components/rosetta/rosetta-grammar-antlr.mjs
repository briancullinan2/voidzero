// @ts-check

/** @type {Record<string, string>} */;
export const GRAMMAR_ANTLR_MATRIX = {

	// =====================================================================
	// 1. GRAMMAR ROOT & DECLARATION SPECIFIERS
	// =====================================================================
	"grammarSpec": "ast.root.compilation_unit.antlr_grammar_specification",
	"grammarDecl": "statement.declaration.grammar_header.declaration_root",
	"grammarType": "type.modifier.grammar_classification.lexer_parser_or_combined",

	// =====================================================================
	// 2. PREQUELS, OPTIONS, DELEGATES, TOKENS, CHANNELS & ACTIONS
	// =====================================================================
	"prequelConstruct": "statement.prequel.configuration_construct.wrapper",
	"optionsSpec": "statement.configuration.options_block.scope",
	"option": "statement.configuration.option_assignment.key_value_pair",
	"optionValue": "expression.literal.option_configuration_value.node",
	"delegateGrammars": "collection.grammar_imports.delegation_clause.sequence",
	"delegateGrammar": "statement.declaration.delegate_grammar_reference.item",
	"tokensSpec": "collection.tokens_declaration.explicit_token_list.scope",
	"channelsSpec": "collection.channels_declaration.custom_channel_list.scope",
	"idList": "collection.identifiers.comma_separated_sequence.list",
	"action_": "statement.action.embedded_target_code.injection",
	"actionScopeName": "symbol.identifier.action_target_scope.key",
	"actionBlock": "block.code.target_language_implementation.enclosure",
	"argActionBlock": "block.code.argument_definition.parameters_enclosure",

	// =====================================================================
	// 3. PARSER RULES, MODIFIERS, BLOCKS, ALTERNATIVES & EXCEPTIONS
	// =====================================================================
	"modeSpec": "statement.lexical_state.mode_declaration.scope",
	"rules": "collection.grammar_rules.sequence.root_container",
	"ruleSpec": "statement.declaration.rule_specification.parser_or_lexer_node",
	"parserRuleSpec": "statement.declaration.parser_rule.grammar_production_definition",
	"exceptionGroup": "statement.scope.exception_handling.try_catch_finally_cluster",
	"exceptionHandler": "statement.control.exception.catch_clause_handler",
	"finallyClause": "statement.control.exception.finally_cleanup_block",
	"rulePrequel": "statement.prequel.rule_level_configuration.wrapper",
	"ruleReturns": "statement.declaration.rule_return_values.specification",
	"throwsSpec": "statement.declaration.thrown_exceptions.signature",
	"localsSpec": "statement.declaration.local_rule_variables.storage",
	"ruleAction": "statement.action.rule_inline_action.injection",
	"ruleModifiers": "collection.modifiers.rule_access_flags.sequence",
	"ruleModifier": "modifier.access.public_private_protected_fragment.keyword",
	"ruleBlock": "statement.scope.rule_body.production_enclosure",
	"ruleAltList": "collection.alternatives.rule_production_branches.sequence",
	"labeledAlt": "statement.declaration.labeled_alternative.production_branch",

	// =====================================================================
	// 4. LEXER RULES, BLOCKS, ELEMENTS & COMMANDS
	// =====================================================================
	"lexerRuleSpec": "statement.declaration.lexer_rule.token_production_definition",
	"lexerRuleBlock": "statement.scope.lexer_rule_body.production_enclosure",
	"lexerAltList": "collection.alternatives.lexer_production_branches.sequence",
	"lexerAlt": "statement.declaration.lexer_alternative.branch_wrapper",
	"lexerElements": "collection.lexer_elements.sequence.wrapper",
	"lexerElement": "statement.declaration.lexer_element.atom_or_block",
	"lexerBlock": "statement.scope.lexer_nested_block.enclosure",
	"lexerCommands": "collection.lexer_commands.post_processing_directive.sequence",
	"lexerCommand": "statement.directive.lexer_command_instruction.item",
	"lexerCommandName": "symbol.identifier.lexer_command_action.name",
	"lexerCommandExpr": "expression.literal.lexer_command_parameter.value",

	// =====================================================================
	// 5. GRAMMAR ELEMENTS, EXPRESSIONS, EBNF & ATOMS
	// =====================================================================
	"altList": "collection.alternatives.production_branches.sequence",
	"alternative": "statement.declaration.production_alternative.branch",
	"element": "statement.declaration.grammar_element.component",
	"predicateOptions": "collection.predicate_options.metadata.sequence",
	"predicateOption": "statement.configuration.predicate_option_pair.item",
	"labeledElement": "statement.declaration.labeled_grammar_element.binding",
	"ebnf": "expression.operator.extended_backus_naur_form.wrapper",
	"blockSuffix": "expression.operator.block_suffix_modifier.node",
	"ebnfSuffix": "expression.operator.repetition_quantifier.optional_star_plus",
	"lexerAtom": "expression.literal.lexer_atom_matching_target.node",
	"atom": "expression.literal.parser_atom_reference.node",
	"wildcard": "expression.operator.wildcard_dot_matching.node",
	"notSet": "expression.operator.inverted_element_set.negation",
	"blockSet": "expression.operator.grouped_element_set.enclosure",
	"setElement": "expression.literal.set_member_element.item",
	"block": "statement.scope.parenthesized_grammar_block.enclosure",

	// =====================================================================
	// 6. IDENTIFIERS & TERMINAL DEFINITIONS
	// =====================================================================
	"ruleref": "symbol.identifier.parser_rule_reference.node",
	"characterRange": "expression.literal.character_range_pattern.interval",
	"terminalDef": "symbol.identifier.terminal_token_definition.literal",
	"elementOptions": "collection.element_options.metadata_attributes.sequence",
	"elementOption": "statement.configuration.element_option_assignment.item",
	"identifier": "symbol.identifier.rule_or_token_name.reference",
	"qualifiedIdentifier": "symbol.identifier.namespaced_dotted_path.reference"


};
