

// @ts-check

import { ROSETTA_RULE_MATRIX } from './rosetta-rules';
import { ROSETTA_LEXER_MATRIX } from './rosetta-lexer-c';
import { GRAMMAR_CLASSIFIER_MATRIX } from './rosetta-grammars';
import { ROSETTA_NEIGHBORHOOD_ASSOCIATIONS } from "./rosetta-neighbors";
import { ROSETTA_JAVASCRIPT_MAPPING } from './rosetta-lexer-js';
import { ROSETTA_JSON_MAPPING } from './rosetta-lexer-json';
import { ROSETTA_MAKE_MAPPING, ROSETTA_CMAKE_MAPPING } from './rosetta-lexer-make';
import { ROSETTA_CREOLE_MAPPING } from './rosetta-lexer-markdown';
import { ROSETTA_Q3_MAPPING } from './rosetta-lexer-q3';

/** @type {Record<string, string[]>} */
const ROSETTA_CROSS_LANGUAGE_MAPPING = {
	...ROSETTA_JAVASCRIPT_MAPPING,
	...ROSETTA_JSON_MAPPING,
	...ROSETTA_MAKE_MAPPING,
	...ROSETTA_CMAKE_MAPPING,
	...ROSETTA_CREOLE_MAPPING,
	...ROSETTA_Q3_MAPPING,
};

// Compiled straight from your CSS tokens to prioritize class positions natively
const ACE_COLORED_CLASSES = [
	"keyword",
	"meta",
	"constant",
	"invalid",
	"support",
	"storage",
	"string",
	"comment",
	"heading",
	"variable",
	"function" // Explicitly included to guarantee rendering dominance
];

/** @type {Worker & import('./rosetta-types.d').RosettaWorker} */
const workerSelf = /** @type {any} */ (self);

/**
 *
 * @param {string | undefined | null} ruleName
 * @param {string | undefined | null} lexerSymbolicName
 * @returns
 */
function toRosettaNonRecursive(ruleName, lexerSymbolicName)
{
	/** @type {string[]} */
	const parts = [];
	if(ruleName && ROSETTA_RULE_MATRIX[ruleName])
	{
		ROSETTA_RULE_MATRIX[ruleName].split('.').forEach(p => parts.push(p));
	}
	if(lexerSymbolicName && ROSETTA_LEXER_MATRIX[lexerSymbolicName])
	{
		ROSETTA_LEXER_MATRIX[lexerSymbolicName].split('.').forEach(p => parts.push(p));
	}
	return parts.length > 0 ? parts.join('.') : "text";
}


/**
 *
 * @param {string[]} array
 * @param {string} tag
 * @returns
 */
function structuralPartsAccumulatorPush(array, tag)
{
	if(!tag) return;
	tag.split('.').forEach(atom =>
	{
		if(atom && !array.includes(atom))
		{
			array.push(atom);
		}
	});
}




/**
 *
 * @param {string} symbolicName
 * @param {string} ruleName
 * @param {import('antlr4').Lexer & import('./rosetta-types.d').ImplementedLexer} lexer
 * @param {import('antlr4').Parser} parser
 * @param {import('./rosetta-types.d').AntlrToken} ctxOrToken
 * @param {import('antlr4').CommonTokenStream} tokenStream
 * @returns
 */
export function toRosettaToken(symbolicName, ruleName, lexer, parser, ctxOrToken, tokenStream)
{
	// 1. Setup localized token parsing payload state natively
	/** @type {import('./rosetta-types.d').AntlrToken} */
	const state = {
		symbolicName: symbolicName || "", ruleName: ruleName || "",
		typeInt: null, literalText: "", tokenChannel: 0,
		lexerSymbolicName: "", lexerLiteralName: "",
		tokenIndex: 0, ruleHistory: [], line: ctxOrToken.line,
		channel: ctxOrToken.channel, column: ctxOrToken.column,
		text: ctxOrToken.text, type: ctxOrToken.type,
		start: ctxOrToken.start, stop: ctxOrToken.stop
	};

	if(ctxOrToken)
	{
		state.symbolicName = ctxOrToken.symbolicName || ctxOrToken.tokenSymbol || ctxOrToken.tokenRule || state.symbolicName;
		state.ruleName = ctxOrToken.ruleName || state.ruleName;
		state.typeInt = typeof ctxOrToken.tokenType === 'number' ? ctxOrToken.tokenType :
			(typeof ctxOrToken.type === 'number' ? ctxOrToken.type : null);
		state.literalText = ctxOrToken.text || "";
		state.tokenChannel = typeof ctxOrToken.channel === 'number' ? ctxOrToken.channel : 0;
		state.tokenIndex = typeof ctxOrToken.tokenIndex === 'number' ? ctxOrToken.tokenIndex : 0;
		state.ruleHistory = ctxOrToken.ruleHistory || [];
	}

	const vocab = lexer?.vocabulary ?? /** @type {any} */ (lexer?.constructor)?.vocabulary;
	if(vocab && state.typeInt)
	{
		state.lexerSymbolicName = vocab.getSymbolicName(state.typeInt) || "";
		state.lexerLiteralName = vocab.getLiteralName(state.typeInt) || "";
	}
	state.symbolicName ||= state.lexerSymbolicName;

	// We split our targets to keep specific leaf-tokens separated from wide parent wrappers
	/** @type {string[]} */
	const leafTokens = [];
	/** @type {string[]} */
	const contextTokens = [];

	// ─── STEP 1: COLLECT LEAF-LEVEL TARGETS (MOST DETAILED) ───
	// Run direct token/lexer name matches first before evaluating general rules
	if(state.symbolicName && GRAMMAR_CLASSIFIER_MATRIX[state.symbolicName])
	{
		GRAMMAR_CLASSIFIER_MATRIX[state.symbolicName].split('.').forEach(p => structuralPartsAccumulatorPush(leafTokens, p));
	}

	// ─── STEP 2: COLLECT DIRECT RULE & CROSS MAPPINGS ───
	const coreBaseClass = toRosettaNonRecursive(state.ruleName, state.lexerSymbolicName);
	if(coreBaseClass && coreBaseClass !== "text")
	{
		coreBaseClass.split('.').forEach(p => structuralPartsAccumulatorPush(leafTokens, p));
	}

	if(state.ruleName && GRAMMAR_CLASSIFIER_MATRIX[state.ruleName])
	{
		GRAMMAR_CLASSIFIER_MATRIX[state.ruleName].split('.').forEach(p => structuralPartsAccumulatorPush(leafTokens, p));
	}

	if(state.ruleName && ROSETTA_CROSS_LANGUAGE_MAPPING[state.ruleName])
	{
		ROSETTA_CROSS_LANGUAGE_MAPPING[state.ruleName].forEach(crossCKey =>
		{
			structuralPartsAccumulatorPush(leafTokens, crossCKey.toLowerCase());
			const nonRecCross = toRosettaNonRecursive(crossCKey, null);
			if(nonRecCross !== "text")
			{
				nonRecCross.split('.').forEach(p => structuralPartsAccumulatorPush(leafTokens, p));
			}
		});
	}

	// ─── STEP 3: COLLECT ANCESTOR / PARENT CONTEXTS (LEAST DETAILED) ───
	if(state.ruleHistory && state.ruleHistory.length > 0)
	{
		state.ruleHistory.forEach(ancestorRule =>
		{
			if(ancestorRule === state.ruleName) return;

			structuralPartsAccumulatorPush(contextTokens, `ctx_${ancestorRule.toLowerCase()}`);

			if(GRAMMAR_CLASSIFIER_MATRIX[ancestorRule])
			{
				GRAMMAR_CLASSIFIER_MATRIX[ancestorRule].split('.').forEach(p =>
					structuralPartsAccumulatorPush(contextTokens, `meta_${p}`)
				);
			}
		});
	}

	// Neighborhood associations evaluation
	const activeStreamTokens = tokenStream?.tokens || tokenStream || [];
	if(state.tokenIndex !== null && activeStreamTokens.length > 0)
	{
		const evaluationPayload = {
			tokenIndex: state.tokenIndex, tokenSymbol: state.symbolicName,
			tokenRule: state.lexerSymbolicName, ruleName: state.ruleName,
			text: state.literalText ?? '', channel: state.tokenChannel ?? 0,
			ruleHistory: state.ruleHistory, line: ctxOrToken.line,
			column: ctxOrToken.column, type: ctxOrToken.type, start: ctxOrToken.start,
			stop: ctxOrToken.stop,
		};

		for(const associationKey in ROSETTA_NEIGHBORHOOD_ASSOCIATIONS)
		{
			const matchResult = ROSETTA_NEIGHBORHOOD_ASSOCIATIONS[associationKey](evaluationPayload, activeStreamTokens);
			if(matchResult)
			{
				matchResult.split('.').forEach(
					/** @param {string} p */
					p => structuralPartsAccumulatorPush(contextTokens, p));
			}
		}
	}

	// ─── STEP 4: MERGE WITH STRICT DOMINANCE PRESERVATION ───
	// Combine arrays: Detailed Leaf Tokens ALWAYS go first, general context follow behind
	let combinedParts = [...leafTokens, ...contextTokens];
	let finalTokens = combinedParts.filter((item, idx) => combinedParts.indexOf(item) === idx);

	if(finalTokens.length > 1 && finalTokens.includes("text"))
	{
		finalTokens = finalTokens.filter(t => t !== "text");
	}

	// Contextual sanity filters
	if(finalTokens.includes("key") || finalTokens.includes("jsonkey") || state.ruleName === 'jsonKey')
	{
		finalTokens = finalTokens.filter(t => ![
			"keyword", "meta", "storage", "type", "operator",
			"character", "language", "numeric", "unit", "constant",
			"parameter", "invalid", "deprecated", "fold", "entity",
			"name", "function", "variable", "class", "heading",
			"string", "tag", "attribute-name", "regexp", "comment",
			"assignmentexpression", "compoundstatement", "text"
		].includes(t.toLowerCase()));
		if(!finalTokens.includes("variable")) finalTokens.unshift("variable");
	} else if(state.ruleName === 'jsonValue' && finalTokens.includes("string"))
	{
		finalTokens = finalTokens.filter(t => !["constant", "numeric", "operator", "keyword"].includes(t.toLowerCase()));
		if(!finalTokens.includes("string")) finalTokens.unshift("string");
	}

	// ─── STEP 5: PRECISE INTENSITY SORTING ───
	// 5. Enforce Theme Dominance Layer Order Sorting (Exclusive First-Match Variant)
	let dominanceLocked = false;
	for(let i = ACE_COLORED_CLASSES.length - 1; i >= 0; i--)
	{
		const targetClass = ACE_COLORED_CLASSES[i];
		if(finalTokens.includes(targetClass))
		{
			const classIndex = finalTokens.indexOf(targetClass);
			finalTokens.splice(classIndex, 1);

			if(!dominanceLocked)
			{
				finalTokens.unshift(targetClass);
				// If it's a hard color rule, lock it so weaker fallbacks don't unshift on top of it
				if(["function", "keyword", "string", "constant"].includes(targetClass))
				{
					dominanceLocked = true;
				}
			} else
			{
				// Weaker structural elements get appended behind the king-token instead
				finalTokens.push(targetClass);
			}
		}
	}

	// Append debugger metadata fields onto output trace blocks
	if(state.lexerSymbolicName) finalTokens.push(`lex_${state.lexerSymbolicName.toLowerCase()}`);
	if(state.ruleName) finalTokens.push(`rule_${state.ruleName.toLowerCase()}`);
	if(state.tokenChannel !== 0) finalTokens.push(`chan_${state.tokenChannel}`);
	if(state.typeInt !== null) finalTokens.push(`idx_${state.typeInt}`);

	return finalTokens.join('.');
}




/**
 * Builds the comprehensive token payload combined with verified grammar metadata
 * @param {import('./rosetta-types.d').AntlrToken} token
 * @param {string} rawTypeName
 * @param {string} classification
 * @param {string} lowerType
 * @param {import('./rosetta-types.d').ImplementedLexer} lexer
 * @param {import('./rosetta-types.d').ImplementedParser} parser
 * @param {import('./rosetta-types.d').ImplementedContext} ctx
 * @returns
 */
function _buildTokenPayload(token, rawTypeName, classification, lowerType, lexer, parser, ctx)
{
	const isComment = lowerType.includes('comment') || token.channel === 1;
	const isString = lowerType.includes('string') || lowerType.includes('literal') || classification.startsWith('string');

	const tokenType = token.type;
	const ruleIndex = ctx ? ctx.ruleIndex : null;

	// Extract vocabulary managers natively from the runtime engine instances
	const lexerVocab = lexer?.vocabulary ?? /** @type {any} */ (lexer?.constructor)?.vocabulary;
	const parserVocab = parser?.vocabulary ?? /** @type {any} */ (parser?.constructor)?.vocabulary;

	// Resolve the clean, authentic symbolic rule names via the vocabulary contracts
	const trueLexerRuleName = lexerVocab ? lexerVocab.getSymbolicName(tokenType) : "Text";

	return {
		text: token.text,
		type: rawTypeName,
		textType: isComment ? 'comment' : (isString ? 'string' : 'code'),
		spellCheckable: isComment || isString,
		line: token.line,
		column: token.column,
		start: token.start,
		stop: token.stop,
		channel: token.channel,
		rosettaScope: classification,

		// =====================================================================
		// UNIFIED COMPATIBILITY MATRIX DATA (FIXED ANTLR RUNTIME ALIGNMENT)
		// =====================================================================
		tokenIndex: typeof token.tokenIndex === 'number' ? token.tokenIndex : null, // ◄ Physical index in file stream
		tokenType: tokenType,                                                       // ◄ The ANTLR numerical ID (e.g., 134)
		tokenMode: lexer && lexer._mode && lexer.modeNames
			? lexer.modeNames[lexer._mode] ?? 'default'
			: lexer._mode && 'modeNames' in lexer.constructor
				? /** @type {any} */ (lexer.constructor).modeNames[lexer._mode]
				: "default",

		// Vocabulary lookups resolve names correctly by absolute vocabulary contract bounds
		tokenNames: lexerVocab ? lexerVocab.getLiteralName(tokenType) : null,
		tokenSymbol: lexerVocab ? lexerVocab.getSymbolicName(tokenType) : null,
		tokenRule: trueLexerRuleName,

		symbolIndex: ruleIndex,
		symbolicName: (parserVocab && ruleIndex !== null) ? parserVocab.getSymbolicName(ruleIndex) : null,
		literalName: (parserVocab && ruleIndex !== null) ? parserVocab.getLiteralName(ruleIndex) : null,
		ruleName: (parser && ruleIndex !== null && parser.ruleNames) ? parser.ruleNames[ruleIndex] : null
	};
}


