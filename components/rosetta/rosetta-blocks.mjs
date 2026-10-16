// @ts-check

import { createLexerInstance } from './worker-language.mjs';


/** @type {Worker & import('./rosetta-types.d').RosettaWorker} */
const workerSelf = /** @type {any} */ (self);

/** @type {Record<string, import('./rosetta-types.d').BlockDetector>} */
const ROSETTA_BLOCK_ASSOCIATIONS = {
	// ─── C-STYLE LANGUAGES: BRACE MATCHING WITH TYPE HEADERS ───
	c: {
		open: /^[ \t]*(?:static\s+|inline\s+|extern\s+)?(?:[\w\d_*]+[ \t]+)+[\w\d_*]+\s*\([^)]*\)/gm,
		close: "{}",
		isKeywordClose: false
	},
	cpp: {
		open: /^[ \t]*(?:template\s*<[^>]*>\s*)?(?:class|struct|namespace|(?:(?:inline\s+|static\s+|virtual\s+)?[\w\d_:<>]+\s+)+[\w\d_*~]+)\s*(?:\([^)]*\))?\s*(?::\s*[\w\d_:<>, ]+)?/gm,
		close: "{}",
		isKeywordClose: false
	},
	csharp: {
		open: /^[ \t]*(?:public|private|protected|internal|static|async|virtual|override|partial\s+)*(?:class|struct|interface|namespace|enum|(?:[\w\d_:<>]+\s+)+[\w\d_]+)\s*(?:\([^)]*\))?/gm,
		close: "{}",
		isKeywordClose: false
	},
	java: {
		// Removed trailing (?=\{) and added trailing optional type signatures
		open: /^[ \t]*(?:public|private|protected|static|final|native|synchronized|abstract\s+)*(?:class|interface|enum|(?:[\w\d_:<>]+\s+)+[\w\d_]+)\s*\([^)]*\)\s*(?:throws\s+[\w\d_, ]+)?/gm,
		close: "{}",
		isKeywordClose: false
	},
	angelscript: {
		// Strip trailing (?=\{) lookahead
		open: /^[ \t]*(?:class|interface|shared|abstract|(?:(?:private|protected|inline)?\s*[\w\d_*@<>]+\s+)+[\w\d_*]+)\s*\([^)]*\)/gm,
		close: "{}",
		isKeywordClose: false
	},
	php: {
		// Strip trailing (?=\{) lookahead
		open: /^[ \t]*(?:public|private|protected|static|final\s+)*function\s+[\w\d_]+\s*\([^)]*\)/gm,
		close: "{}",
		isKeywordClose: false
	},
	protobuf3: {
		// Strip trailing (?=\{) lookahead
		open: /^[ \t]*(?:message|service|enum)\s+[\w\d_]+/gm,
		close: "{}",
		isKeywordClose: false
	},


	// ─── WEB ENGINEERING & SCRIPTS ───
	html: {
		open: /<([a-zA-Z1-6]+)(?:\s+[^>]*)*>/gm,
		close: "xml", // Forces an explicit tag name stack tracker
		isKeywordClose: false
	},
	xml: {
		open: /<([a-zA-Z0-9_.:-]+)(?:\s+[^>]*)*>/gm,
		close: "xml",
		isKeywordClose: false
	},
	javascript: {
		// Re-aligned the class/object method rule block to not rely on an immediate inline '{'
		open: /^[ \t]*(?:async\s+)?function\s*[\w\d_*]*\s*\([^)]*\)|^[ \t]*(?:const|let|var)\s+[\w\d_]+\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|^[ \t]*(?:public|private|static|async\s+)?[\w\d_]+\s*\([^)]*\)/gm,
		close: "{}",
		isKeywordClose: false
	},
	typescript: {
		// Cleaned up method declarations so return interfaces don't require inline '{' anchors
		open: /^[ \t]*(?:export\s+)?(?:async\s+)?function\s*[\w\d_*]*\s*\([^)]*\)|^[ \t]*(?:interface|type|class|namespace)\s+[\w\d_]+|^[ \t]*(?:public|private|protected|static|readonly|async\s+)*[\w\d_]+\s*\([^)]*\)\s*[:\w\d_<>|?]*\s*/gm,
		close: "{}",
		isKeywordClose: false
	},
	css3: {
		// Completely stripped (?=\{) so nesting rules work smoothly even if braces drop or track multi-selectors
		open: /^[ \t]*[.#\w\d_:\s,>+~[\]*=-]+/gm,
		close: "{}",
		isKeywordClose: false
	},
	json: {
		// Stripped the inline execution requirement for the object container opening brace
		open: /"[\w\d_]+"\s*:\s*|\[/gm,
		close: "{}",
		isKeywordClose: false
	},
	// ─── KEYWORD-BOUNDED SCRIPTING LAYERS ───
	lua: {
		open: /^[ \t]*(?:local\s+)?function\s+[\w\d_.]+\s*\([^)]*\)|^[ \t]*while\s+.*do\b|^[ \t]*for\s+.*do\b|^[ \t]*if\s+.*then\b/gm,
		close: /\b(end)\b/i,
		isKeywordClose: true
	},
	python3: {
		open: /^[ \t]*(?:def|class)\s+[\w\d_]+\s*(?:\([^)]*\))?\s*:/gm,
		close: "indent", // Python closes when indentation levels decrease
		isKeywordClose: false
	},
	python2: {
		open: /^[ \t]*(?:def|class)\s+[\w\d_]+\s*(?:\([^)]*\))?\s*:/gm,
		close: "indent",
		isKeywordClose: false
	},
	rust: {
		open: /^[ \t]*(?:pub\s*(?:\([^)]*\))?\s*)?(?:unsafe\s+)?(?:async\s+)?(?:fn|struct|enum|impl|trait|mod)\b[^\{]*/gm,
		close: "{}",
		isKeywordClose: false
	},
	golang: {
		open: /^[ \t]*func\s*(?:\([^)]*\))?\s*[\w\d_]*\s*\([^)]*\)[^\{]*/gm,
		close: "{}",
		isKeywordClose: false
	},

	// ─── UTILITIES & DATA CONFIGURATIONS ───
	terraform: {
		open: /^[ \t]*(?:resource|variable|provider|output|module|locals)\s+[^\{]*/gm,
		close: "{}",
		isKeywordClose: false
	},
	cmake: {
		open: /\b(function|macro|foreach|while|if)\s*\(/gim,
		close: /\b(endfunction|endmacro|endforeach|endwhile|endif)\s*\(/gim,
		isKeywordClose: true
	},
	powershell: {
		open: /^[ \t]*function\s+[\w\d_-]+\s*(?=\{|\(|[ \t\n]|$)/gim,
		close: "{}",
		isKeywordClose: false
	},
	bash: {
		// Modified to allow variable declarations and loops to transition lines before matching blocks take off
		open: /^[ \t]*function\s+[\w\d_-]+|[\w\d_-]+\s*\(\s*\)|^\s*\b(if|for|while|case)\b/gm,
		close: /\b(fi|done|esac|\})\b/gm,
		isKeywordClose: true
	},
	sql: {
		// Added multi-whitespace support (\s+) inside "create or replace" checks to capture broken lines cleanly
		open: /\b(create\s+(?:or\s+replace\s+)?(?:procedure|function|package|trigger)|begin)\b/gim,
		close: /\b(end)\b/gim,
		isKeywordClose: true
	},
	wat: {
		open: /\((module|func|type|import|export|table|memory|global)\b/gm,
		close: "()",
		isKeywordClose: false
	},
	quakemap: {
		open: /^[ \t]*\(\s*[-0-9.]+\s+[-0-9.]+\s+[-0-9.]+\s*\)/gm, // Brushes open on face declarations
		close: "{}",
		isKeywordClose: false
	}
};

// Mirror baseline aliases natively
ROSETTA_BLOCK_ASSOCIATIONS['plsql'] = ROSETTA_BLOCK_ASSOCIATIONS['sql'];
ROSETTA_BLOCK_ASSOCIATIONS['tsql'] = ROSETTA_BLOCK_ASSOCIATIONS['sql'];
ROSETTA_BLOCK_ASSOCIATIONS['postgresql'] = ROSETTA_BLOCK_ASSOCIATIONS['sql'];
ROSETTA_BLOCK_ASSOCIATIONS['sqlite'] = ROSETTA_BLOCK_ASSOCIATIONS['sql'];


/**
 *
 * @param {string} codeStr
 * @param {number} lineNumber
 * @param {string} langId
 * @returns {import('./rosetta-types.d').BlockResult}
 */
function extractCurrentBlock(codeStr, lineNumber, langId)
{
	const lines = codeStr.split('\n');
	const totalLines = lines.length;

	const rules = ROSETTA_BLOCK_ASSOCIATIONS[langId] || { open: null, close: "{}", isKeywordClose: false };
	if(!rules.open)
	{
		return { text: codeStr, startLine: 1, endLine: totalLines, startIndex: 0, endIndex: codeStr.length };
	}

	/** @type {number[]} */
	const lineOffsets = [];
	let currentOffset = 0;
	lines.forEach(line =>
	{
		lineOffsets.push(currentOffset);
		currentOffset += line.length + 1;
	});

	const cursorLineIndex = Math.min(Math.max(1, lineNumber), totalLines) - 1;
	let foundHeaderIdx = -1;
	let matchOffset = -1;

	// 1. SCAN UPWARD: Locate closest active header line
	for(let l = cursorLineIndex; l >= 0; l--)
	{
		rules.open.lastIndex = 0;
		const lineText = lines[l];

		if(lineText.trim().startsWith("/") || lineText.trim().startsWith("*")) continue;

		const match = rules.open.exec(lineText);
		if(match)
		{
			foundHeaderIdx = l;
			matchOffset = lineOffsets[l] + match.index;
			break;
		}
	}

	if(foundHeaderIdx === -1)
	{
		return { text: codeStr, startLine: 1, endLine: totalLines, startIndex: 0, endIndex: codeStr.length };
	}

	// 2. SCAN DOWNWARD: Balance with defensive limits
	let depth = 0;
	let endLineIdx = foundHeaderIdx;
	let endCharOffset = matchOffset;
	let blockStarted = false;

	// HARD CEILING SAFETY THRESHOLD: Avoid swallowing trailing broken scopes
	const MAX_BLOCK_LINE_HEIGHT = 500;

	rowLoop: for(let l = foundHeaderIdx; l < totalLines; l++)
	{
		const text = lines[l];
		endLineIdx = l;

		// ─── THE CEILING GUARD CRACKDOWN ───
		// If the balance loop has tracked deeper than 500 lines without finding an exit,
		// it signals a broken block tracking state. Terminate immediately.
		if((l - foundHeaderIdx) > MAX_BLOCK_LINE_HEIGHT)
		{
			console.warn(`[Selector Ceiling Triggered] Terminated out-of-bounds scan at line ${l + 1}.`);
			endLineIdx = Math.min(foundHeaderIdx + 40, totalLines - 1); // Truncate safely
			endCharOffset = lineOffsets[endLineIdx] + lines[endLineIdx].length;
			break rowLoop;
		}

		if(rules.close === "indent")
		{
			const currentIndent = text.search(/\S/);
			const headerIndent = lines[foundHeaderIdx].search(/\S/);
			if(blockStarted && currentIndent !== -1 && currentIndent <= headerIndent)
			{
				endLineIdx = Math.max(foundHeaderIdx, l - 1);
				endCharOffset = lineOffsets[endLineIdx] + lines[endLineIdx].length;
				break rowLoop;
			}
			if(currentIndent !== -1 && l > foundHeaderIdx) blockStarted = true;
			endCharOffset = lineOffsets[l] + text.length;
			continue;
		}

		if(!rules.isKeywordClose && typeof rules.close === 'string')
		{
			const openChar = rules.close[0] || '{';
			const closeChar = rules.close[1] || '}';

			for(let c = 0; c < text.length; c++)
			{
				const char = text[c];
				if(char === openChar)
				{
					depth++;
					blockStarted = true;
				} else if(char === closeChar)
				{
					depth--;
				}

				if(blockStarted && depth <= 0)
				{
					endCharOffset = lineOffsets[l] + c + 1;
					break rowLoop;
				}
			}
		} else if(rules.close instanceof RegExp)
		{
			rules.open.lastIndex = 0;
			if(rules.open.test(text)) { depth++; blockStarted = true; }

			rules.close.lastIndex = 0;
			if(rules.close.test(text)) { depth--; }

			if(blockStarted && depth <= 0)
			{
				endCharOffset = lineOffsets[l] + text.length;
				break rowLoop;
			}
		}

		endCharOffset = lineOffsets[l] + text.length;
	}

	return {
		text: codeStr.slice(matchOffset, endCharOffset),
		startLine: foundHeaderIdx + 1,
		endLine: endLineIdx + 1,
		startIndex: matchOffset,
		endIndex: endCharOffset
	};
}


workerSelf.extractCurrentBlock = extractCurrentBlock;



/**
 * Agnostic ANTLR Visitor that dynamically captures multi-line code blocks
 * across any grammar based on universal rule structural names.
 */
class AntlrBlockCollectorVisitor
{

	/** @param {import('./rosetta-types.d').ImplementedParser} parser */
	constructor(parser)
	{
		this.parser = parser;
		/** @type {import('./rosetta-types.d').BlockResult[]} */
		this.blocks = [];

		// Explicit list of known block-defining rule signatures across your 40 languages
		this.blockRuleIdentifiers = new Set([
			"functionbody", "methoddeclaration", // ◄ ADD THESE BACK!
			"compoundstatement", "blockitemlist", "block",
			"obj", "arr", "initializerlist", "memberdeclarationlist",
			"asmdatapayload", "assembly_payload"
		]);
	}

	/**
	 * Entry execution hook to scan the generated AST
	 * @param {import('antlr4').ParseTree} tree
	 */
	collect(tree)
	{
		if(!tree) return this.blocks;
		this.visit(tree);
		return this.blocks;
	}

	/**
	 * Recursive structural tree walker node pass
	 * @param {import('./rosetta-types.d').ImplementedContext | import('antlr4').ParseTree} ctx
	 */
	visit(ctx)
	{
		if(!ctx) return;

		if('ruleIndex' in ctx && ctx.ruleIndex !== undefined)
		{
			const rawRuleName = this.parser.ruleNames[ctx.ruleIndex];
			const lowerRuleName = rawRuleName ? rawRuleName.toLowerCase() : "";

			// If the current node represents a multi-line structural container boundary
			if(this.blockRuleIdentifiers.has(lowerRuleName) && ctx.start && ctx.stop)
			{
				const startToken = ctx.start;
				const endToken = ctx.stop;

				const startLine = startToken.line ?? ctx.line;
				const endLine = endToken.line;

				// Only log and harvest blocks that span across multiple line rows
				if(startLine < endLine)
				{
					this.blocks.push({
						ruleName: rawRuleName,
						startLine: startLine,
						endLine: endLine,
						startIndex: startToken.start,
						endIndex: endToken.stop + 1
					});
				}
			}
		}

		// Deep-walk through all child tree node branches sequentially
		if('children' in ctx && ctx.children && ctx.children.length > 0)
		{
			for(let i = 0; i < ctx.children.length; i++)
			{
				this.visit(ctx.children[i]);
			}
		}
	}
}


/**
 *
 * @param {string} sourceText
 * @param {string} languageKey
 * @returns
 */
export function getFoldRegions(sourceText, languageKey)
{
	/** @type {import('antlr4').Lexer | null} */
	const lexer = createLexerInstance(sourceText, languageKey);
	if(!lexer) return [];

	/** @type {import('./rosetta-types.d').FoldRegion[]} */
	const folds = [];
	const braceStack = [];
	const preprocessorStack = [];
	let token = lexer.nextToken();

	while(token.type !== workerSelf.AntlrRegistry.antlr4?.Token.EOF)
	{
		const typeName = _resolveTokenTypeName(lexer, token.type);
		const row = token.line - 1;

		if(typeName === 'OpenCurlyBracket' || token.text === '{')
		{
			braceStack.push(row);
		} else if(typeName === 'CloseCurlyBracket' || token.text === '}')
		{
			if(braceStack.length > 0)
			{
				const startRow = braceStack.pop() ?? 0;
				if(row > startRow) folds.push({ startRow, endRow: row, type: 'brace' });
			}
		}

		if(token.text.startsWith('#if') || token.text.startsWith('#ifdef'))
		{
			preprocessorStack.push(row);
		} else if(token.text.startsWith('#endif'))
		{
			if(preprocessorStack.length > 0)
			{
				const startRow = preprocessorStack.pop() ?? 0;
				if(row > startRow) folds.push({ startRow, endRow: row, type: 'preprocessor' });
			}
		}

		if(token.channel === 1 || ['BlockComment', 'MULTI_LINE_COMMENT'].includes(typeName))
		{
			const textLines = token.text.split('\n');
			if(textLines.length > 1)
			{
				folds.push({ startRow: row, endRow: row + textLines.length - 1, type: 'comment' });
			}
		}
		token = lexer.nextToken();
	}
	return folds;
}




/**
 *
 * @param {import('./rosetta-types.d').ImplementedLexer} lexer
 * @param {number} tokenType
 * @returns {string}
 */
export function _resolveTokenTypeName(lexer, tokenType)
{
	/** @type {import('./rosetta-types.d').ImplementedLexer} */
	const Ctor = /** @type {any} */ (lexer.constructor);
	const symbolicNames = Ctor.symbolicNames ?? lexer.symbolicNames;
	const literalNames = Ctor.literalNames ?? lexer.literalNames;

	if(symbolicNames && symbolicNames[tokenType]) return symbolicNames[tokenType];
	if(literalNames && literalNames[tokenType]) return literalNames[tokenType];
	return `type_${tokenType}`;
}



export const silentDiagnosticObserver = {
	/**
	 *
	 * @param {import('antlr4').Recognizer<import('antlr4').Token>} recognizer
	 * @param {import('antlr4').Token} offendingSymbol
	 * @param {number} line
	 * @param {number} column
	 * @param {string} msg
	 * @param {import('antlr4').RecognitionException} e
	 */
	syntaxError: function (recognizer, offendingSymbol, line, column, msg, e)
	{
		// Quietly absorb syntax markers during visual fold processing runs
	},
	/**
	 *
	 * @param {import('antlr4').Recognizer<import('antlr4').Token>} recognizer
	 * @param {*} dfa
	 * @param {number} startIndex
	 * @param {number} stopIndex
	 * @param {*} exact
	 * @param {*} ambigAlts
	 * @param {*} configs
	 */
	reportAmbiguity: function (recognizer, dfa, startIndex, stopIndex, exact, ambigAlts, configs)
	{
		// Absorb deep SLL prediction branching conflicts silently
	},

	/**
	 *
	 * @param {import('antlr4').Recognizer<import('antlr4').Token>} recognizer
	 * @param {*} dfa
	 * @param {number} startIndex
	 * @param {number} stopIndex
	 * @param {*} conflictingAlts
	 * @param {*} configs
	 */
	reportAttemptingFullContext: function (recognizer, dfa, startIndex, stopIndex, conflictingAlts, configs)
	{
		// CRITICAL PROXIMATE GAP FIX: Satisfies the engine when dropping into deep LL validation
	},

	/**
	 *
	 * @param {import('antlr4').Recognizer<import('antlr4').Token>} recognizer
	 * @param {*} dfa
	 * @param {number} startIndex
	 * @param {number} stopIndex
	 * @param {*} prediction
	 * @param {*} configs
	 */
	reportContextSensitivity: function (recognizer, dfa, startIndex, stopIndex, prediction, configs)
	{
		// Absorb fallback optimization logs smoothly
	}
};



/**
 *
 * @param {({args: any[]})} msg
 * @param {import('./rosetta-types.d').ImplementedBackend} sender
 * @returns
 */
export function executeGetFoldRegionsCommand(msg, sender)
{
	// 1. RECOVER WORKER CONTEXT HOOKS
	const activeDoc = workerSelf.antlrProcessor?.doc ?? workerSelf.doc;
	if(!activeDoc || !workerSelf.AntlrRegistry.antlr4)
	{
		console.warn("[Worker Fold] Execution failed: Active document stream buffer is missing.");
		return;
	}

	const codeString = activeDoc.getValue();
	const languageKey = workerSelf.antlrProcessor?.languageKey ?? workerSelf.languageKey ?? "c";

	// Resolve core ANTLR library context reference out of the worker global space
	if(!workerSelf.AntlrRegistry.antlr4 && !workerSelf.antlr4)
	{
		console.error("[Worker Fold] Critical Error: ANTLR runtime core library context lost.");
		return;
	}

	// 2. PARSER CONSTRUCTION PIPELINE
	const cleanKey = languageKey.toLowerCase().trim();
	const lexerLookupKey = `${cleanKey}_lexer`;
	const parserLookupKey = `${cleanKey}_parser`;

	let LexerCtor = workerSelf.AntlrRegistry[lexerLookupKey];
	let ParserCtor = workerSelf.AntlrRegistry[parserLookupKey];

	if(!LexerCtor || !ParserCtor)
	{
		console.warn(`[Worker Fold] No valid ANTLR grammars registered for language key: ${languageKey}`);
		return;
	}

	// Spin up lightweight input char-stream frameworks natively
	//const chars = new antlrCore.InputStream(codeString);
	const lexer = createLexerInstance(codeString, languageKey);
	if(!lexer)
	{
		console.error('Lexer not created: ' + languageKey);
		return;
	}

	/** @type { import('antlr4').TokenStream & import('antlr4').CharStream } */
	const tokens = /** @type {any} */ (new workerSelf.AntlrRegistry.antlr4.CommonTokenStream(lexer));

	/** @type {import('./rosetta-types.d').ImplementedParser} */
	const parser =  /** @type {any} */ (new ParserCtor(tokens));

	// Mute console errors during layout-only block parsing runs
	parser.removeErrorListeners();

	// Attach the clean listener shell to the parser
	parser.addErrorListener(silentDiagnosticObserver);

	//parser._interp.predictionMode = AntlrRegistry.antlr4.atn.PredictionMode.SLL;
	const BailStrategy = workerSelf.AntlrRegistry.antlr4.BailErrorStrategy;
	const DefaultStrategy = workerSelf.AntlrRegistry.antlr4.DefaultErrorStrategy;

	// 2. Default to DefaultErrorStrategy so the parser attempts syntax recovery
	// rather than instantly throwing an uncatchable exception on minor token gaps
	if(DefaultStrategy)
	{
		parser._errHandler = new DefaultStrategy();
	} else if(BailStrategy)
	{
		parser._errHandler = new BailStrategy();
	}

	// 3. GENERATE AST SYNTAX TREE SKELETON
	let tree = null;
	try
	{
		const targetRules = parser.ruleNames
			?? (parser.constructor && /** @type {any} */ (parser.constructor).ruleNames);
		if(targetRules && targetRules[0]
			&& targetRules[0] in parser)
		{
			const ruleHandler = /** @type {any} */ (parser)[targetRules[0]];
			const rootRuleName = targetRules[0]; // Matches base rules like "compilationUnit" or "json"
			if(typeof ruleHandler === 'function')
			{
				tree = ruleHandler();
			}
		}
	} catch(parseFallbackError)
	{
		// If Bail Strategy tripped under SLL, drop back to LL mode quickly for deep checking
		try
		{
			tokens.reset();
			parser._interp.predictionMode = workerSelf.AntlrRegistry.antlr4.PredictionMode.LL;
			parser._errHandler = new workerSelf.AntlrRegistry.antlr4.DefaultErrorStrategy();
			const rootRuleName = parser.ruleNames[0];
			const ruleHandler = /** @type {any} */ (parser)[rootRuleName];
			if(typeof ruleHandler === 'function')
			{
				tree = ruleHandler();
			}
		} catch(treeCrash)
		{
			console.error("[Worker Fold] Syntax compilation completely blocked context generation: ", treeCrash);
			return;
		}
	}



	// 4. RUN AGNOSTIC BLOCK HARVEST VISITOR
	if(tree)
	{
		const discoveredBlocks = discoverFoldRegions(parser, tree);
		sender.emit("foldRegionsCalculated", {
			fileId: workerSelf.activeFileId || msg.args?.[0] || "active_buffer",
			blocks: discoveredBlocks
		});
	}
}


workerSelf.executeGetFoldRegionsCommand = executeGetFoldRegionsCommand;


/**
 * @param {import('./rosetta-types.d').ImplementedParser} parser
 * @param {import('antlr4').ParseTree} tree
 * @returns {import('./rosetta-types.d').BlockResult[]}
 */
export function discoverFoldRegions(parser, tree)
{
	try
	{
		const blockVisitor = new AntlrBlockCollectorVisitor(parser);
		const rawBlocks = blockVisitor.collect(tree);
		const checkDoc = workerSelf.antlrProcessor?.doc ?? workerSelf.doc;

		if(!checkDoc)
		{
			return [];
		}

		/** @type {import('./rosetta-types.d').BlockResult[]} */
		const discoveredBlocks = [];

		// Total line count helper to check bounds safely
		const totalLines = checkDoc.getLength();

		// Step 2: Filter out blocks that don't meet basic size criteria
		// Rule: Must be at least 5 lines long (inclusive bounds check)
		const candidates = rawBlocks.filter(b => (b.endLine - b.startLine + 1) >= 5);

		// Step 3: Run filtering & line adjustments
		for(let i = 0; i < candidates.length; i++)
		{
			const b = candidates[i];

			// 1-based to 0-based conversion for Ace Document line indexing
			const startLineIdx = b.startLine - 1;
			const endLineIdx = b.endLine - 1;

			// Skip safely if the positions are out of file boundaries
			if(startLineIdx < 0 || endLineIdx >= totalLines) continue;

			// Step 4: Handle standard JS deep nesting threshold
			// Filter elements in the original list that are strictly inside this block
			const internalBlocks = rawBlocks.filter(other =>
				other !== b &&
				other.startLine >= b.startLine &&
				other.endLine <= b.endLine
			);

			// Skip block if it contains more than 4 nested functional blocks
			if(internalBlocks.length > 100)
			{

				continue;
			}

			// Step 5: Double-stack elimination (De-duplication of identical/near-identical ranges)
			// Check if we already processed a broader structural rule handling this exact code range
			const isDuplicate = discoveredBlocks.some(existing =>
				Math.abs(existing.startLine - b.startLine) <= 1 &&
				Math.abs(existing.endLine - b.endLine) <= 1
			);
			if(isDuplicate) continue;

			// Step 6: Visual Bracket Layout Adjustment
			const headerLineText = checkDoc.getLine(startLineIdx) || "";
			let finalStartLine = b.startLine;
			let finalEndLine = b.endLine;

			// If the starting line contains an opening curly bracket '{',
			// adjust the fold downward by 1 line so the function signature line remains visible
			if(headerLineText.includes('{'))
			{
				finalStartLine = b.startLine + 1;
			}


			if(checkDoc.getLine(endLineIdx).includes('}')
				|| checkDoc.getLine(endLineIdx + 1).includes('}')
			)
			{
				finalEndLine = b.endLine - 1;
			}

			// Final sanity check: ensuring our modifications didn't shrink the fold to less than 2 lines
			if(b.endLine - finalStartLine >= 2)
			{
				discoveredBlocks.push({
					ruleName: b.ruleName,
					startLine: finalStartLine,
					endLine: finalEndLine,
					startIndex: b.startIndex,
					endIndex: b.endIndex
				});
			}
		}

		return discoveredBlocks;

	} catch(visitorError)
	{
		console.warn("[Worker Fold] AntlrBlockCollectorVisitor invocation error: ", visitorError);
		return [];
	}
}
