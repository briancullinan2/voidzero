

// @ts-check





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



function toRosettaNonRecursive(ruleName, lexerSymbolicName)
{
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





function toRosettaToken(symbolicName, ruleName, lexer, parser, ctxOrToken, tokenStream)
{
	// 1. Setup localized token parsing payload state natively
	const state = {
		symbolicName: symbolicName || "", ruleName: ruleName || "",
		typeInt: null, literalText: "", tokenChannel: 0,
		lexerSymbolicName: "", lexerLiteralName: "",
		tokenIndex: null, ruleHistory: []
	};

	if(ctxOrToken)
	{
		state.symbolicName = ctxOrToken.symbolicName || ctxOrToken.tokenSymbol || ctxOrToken.tokenRule || state.symbolicName;
		state.ruleName = ctxOrToken.ruleName || state.ruleName;
		state.typeInt = typeof ctxOrToken.tokenType === 'number' ? ctxOrToken.tokenType :
			(typeof ctxOrToken.type === 'number' ? ctxOrToken.type : null);
		state.literalText = ctxOrToken.text || "";
		state.tokenChannel = typeof ctxOrToken.channel === 'number' ? ctxOrToken.channel : 0;
		state.tokenIndex = typeof ctxOrToken.tokenIndex === 'number' ? ctxOrToken.tokenIndex : null;
		state.ruleHistory = ctxOrToken.ruleHistory || [];
	}

	const vocab = lexer?.vocabulary || lexer?.constructor?.vocabulary;
	if(vocab && state.typeInt !== null)
	{
		state.lexerSymbolicName = vocab.getSymbolicName(state.typeInt) || "";
		state.lexerLiteralName = vocab.getLiteralName(state.typeInt) || "";
	}
	state.symbolicName ||= state.lexerSymbolicName;

	// We split our targets to keep specific leaf-tokens separated from wide parent wrappers
	const leafTokens = [];
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
			text: state.literalText, channel: state.tokenChannel, ruleHistory: state.ruleHistory
		};

		for(const associationKey in ROSETTA_NEIGHBORHOOD_ASSOCIATIONS)
		{
			const matchResult = ROSETTA_NEIGHBORHOOD_ASSOCIATIONS[associationKey](evaluationPayload, activeStreamTokens);
			if(matchResult)
			{
				matchResult.split('.').forEach(p => structuralPartsAccumulatorPush(contextTokens, p));
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





function _resolveTokenTypeName(lexer, tokenType)
{
	const Ctor = lexer.constructor;
	const symbolicNames = Ctor.symbolicNames || lexer.symbolicNames;
	const literalNames = Ctor.literalNames || lexer.literalNames;

	if(symbolicNames && symbolicNames[tokenType]) return symbolicNames[tokenType];
	if(literalNames && literalNames[tokenType]) return literalNames[tokenType];
	return `type_${tokenType}`;
}


/**
 * Builds the comprehensive token payload combined with verified grammar metadata
 */
function _buildTokenPayload(token, rawTypeName, classification, lowerType, lexer, parser, ctx)
{
	const isComment = lowerType.includes('comment') || token.channel === 1;
	const isString = lowerType.includes('string') || lowerType.includes('literal') || classification.startsWith('string');

	const tokenType = token.type;
	const ruleIndex = ctx ? ctx.ruleIndex : null;

	// Extract vocabulary managers natively from the runtime engine instances
	const lexerVocab = lexer?.vocabulary || lexer?.constructor?.vocabulary;
	const parserVocab = parser?.vocabulary || parser?.constructor?.vocabulary;

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
		tokenMode: lexer && lexer.constructor?.modeNames ? lexer.constructor.modeNames[lexer._mode] : "default",

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





// A minimal lookahead map of tokens that CANNOT start a expression line
// without a preceding semicolon safely in place.
// TODO: make C do this on save
const UNSAFE_LINE_STARTERS = ['[', '(', '`', '/', '+', '-'];

function processJavaScriptASI(tokenStream)
{
	const tokens = tokenStream.getTokens();
	const modifiedTokens = [];
	const asiErrors = []; // Collect discovered bugs here for your UX

	for(let i = 0; i < tokens.length; i++)
	{
		const currentToken = tokens[i];
		const nextToken = tokens[i + 1];

		modifiedTokens.push(currentToken);

		// Check if we are crossing a line break between two valid tokens
		if(nextToken && currentToken.line < nextToken.line)
		{

			// BUG DETECTION 1: The Restricted Production Rule (return, break, continue, throw)
			if(['return', 'break', 'continue', 'throw'].includes(currentToken.text))
			{
				asiErrors.push({
					line: currentToken.line,
					column: currentToken.column,
					message: `Critical ASI Warning: Inline split after '${currentToken.text}'. Semicolon automatically inserted here, making subsequent code unreachable.`
				});

				// Synthesize a real semicolon token for your Pass-2 parser
				modifiedTokens.push({ type: PreprocessorLexer.SEMICOLON, text: ";" });
				continue;
			}

			// BUG DETECTION 2: The Unsafe Continuation Danger Zone
			if(UNSAFE_LINE_STARTERS.includes(nextToken.text))
			{
				// If the current line does NOT end with an explicit semicolon,
				// and the next line starts with an unsafe character, it's a critical hazard.
				if(currentToken.text !== ';' && currentToken.text !== '}')
				{
					asiErrors.push({
						line: nextToken.line,
						column: nextToken.column,
						message: `Potential Code Breaking Bug: Missing semicolon before leading '${nextToken.text}'. JS engine will attempt to parse this as a continuation of the previous line.`
					});
				}
			}

			// STANDARD ASI INSIGHT: Tagging normal missing semis for AST alignment
			if(requiresImplicitSemicolon(currentToken, nextToken))
			{
				modifiedTokens.push({
					type: PreprocessorLexer.SEMICOLON,
					text: ";",
					isVirtual: true // Flagged so you can recognize it down the line
				});
			}
		}
	}

	// Expose detected bugs out to your UX panel or worker messenger
	if(asiErrors.length > 0)
	{
		self.postMessage({ type: "asiDiagnosticsDiscovered", errors: asiErrors });
	}

	return new antlr4.CommonTokenStream(new VirtualTokenSource(modifiedTokens));
}

function requiresImplicitSemicolon(current, next)
{
	// Avoid double semicolons or inserting after structural blocks
	if([';', '{', '}'].includes(current.text) || ['}'].includes(next.text)) return false;

	// Core check: If the upcoming token cannot natively chain off the current token
	// (e.g., an identifier followed by another identifier on a new line)
	return (current.type === PreprocessorLexer.IDENTIFIER && next.type === PreprocessorLexer.IDENTIFIER);
}

