
// @ts-check

import { _resolveTokenTypeName } from './rosetta-blocks.mjs';
import { toRosettaToken } from './rosetta.mjs';
import { createLexerInstance } from './worker-language.mjs';


/** @type {Worker & import('./rosetta-types.d').RosettaWorker} */
const workerSelf = /** @type {any} */ (self);

if(typeof window === 'undefined')
{
	const window = {

	};
	workerSelf.window = window;
}



// Add these to your Diagnostic Bridge configuration
const DIAGNOSTIC_PARSERS = [
	{
		name: "clang_lcc",
		// Matches: code/game/g_main.c:25: error: missing semi-colon
		pattern: /^([^:\n]+):(\d+):\s*(error|warning):\s*(.+)$/i,

		/**
		 * @param {RegExpMatchArray} match
		 * @param {import('./rosetta-types.d').DiagnosticBridge} bridge
		 * @returns {import('./rosetta-types.d').DiagnosticsParser}
		 */
		resolve: function (match, bridge)
		{
			return {
				filePath: match[1].trim(),
				row: parseInt(match[2], 10) - 1,
				type: match[3].toLowerCase() === 'error' ? 'error' : 'warning',
				text: match[4].trim()
			};
		}
	},
	{
		name: "quake_shader_parser",
		// Matches: WARNING: expecting '{', found 'INVALID' instead in shader 'textures/gothic/floor'
		// Or: WARNING: unknown general shader parameter 'bad_keyword' in 'scripts/sfx.shader'
		pattern: /WARNING:\s*([^'\n]+)'\s*instead\s*in\s*shader\s*'([^']+)'|WARNING:\s*unknown\s*general\s*shader\s*parameter\s*'([^']+)'\s*in\s*'([^']+)'/i,
		/**
		 * @param {RegExpMatchArray} match
		 * @param {import('./rosetta-types.d').DiagnosticBridge} bridge
		 * @returns {import('./rosetta-types.d').DiagnosticsParser}
		 */
		resolve: function (match, bridge)
		{
			// Check which capture group hit based on the Printf outputs in ParseShader
			let infoText = match[1] ? `Expecting '{', found '${match[1]}'` : `Unknown general shader parameter '${match[3]}'`;
			let shaderOrFile = match[2] || match[4];

			// Shaders are named by texture path, but we map them to their script definition file
			let filePath = shaderOrFile.endsWith('.shader') ? shaderOrFile : bridge.lookupShaderFile(shaderOrFile);

			return {
				filePath: filePath,
				row: bridge.findLineInFile(filePath, match[2] || match[3]) || 0, // Fallback locator strategy
				type: "warning",
				text: infoText
			};
		}
	},
	{
		name: "quake_asset_missing",
		// Matches: Couldn't find image file for shader gfx/2d/sunflare
		// Or: WARNING: models/mapobjects/energy.tga not present, using .jpg instead
		pattern: /(?:Couldn't find image file for shader|WARNING:)\s*([^\s\n]+)(?:\s*not present)?/i,
		/**
		 * @param {RegExpMatchArray} match
		 * @param {import('./rosetta-types.d').DiagnosticBridge} bridge
		 * @returns {import('./rosetta-types.d').DiagnosticsParser}
		 */
		resolve: function (match, bridge)
		{
			let assetPath = match[1];
			// Identify which shader is crying about the missing asset texture dependency
			let filePath = bridge.findShaderByAssetDependency(assetPath);

			return {
				filePath: filePath,
				row: bridge.findLineInFile(filePath, assetPath) || 0,
				type: "error",
				text: `Missing Asset Dependency: Could not resolve binary path for [${assetPath}]`
			};
		}
	},
	{
		name: "quake_skin_failure",
		// Matches: Torso skin load failure: models/players/doom/upper_red.skin
		pattern: /(Leg|Torso|Head)\s*skin\s*load\s*failure:\s*([^\s\n]+)/i,
		/**
		 * @param {RegExpMatchArray} match
		 * @param {import('./rosetta-types.d').DiagnosticBridge} bridge
		 * @returns {import('./rosetta-types.d').DiagnosticsParser}
		 */
		resolve: function (match, bridge)
		{
			let component = match[1];
			let skinFile = match[2];
			return {
				filePath: skinFile,
				row: 0, // Skin files are often single line registrations, highlight header
				type: "error",
				text: `${component} model segment mapping failed to bind cleanly.`
			};
		}
	}
];




/**
 * Pure transformation callback formatting incoming ANTLR syntax errors
 * @param {string[]} lines
 * @param {import('./rosetta-types.d').ParserEvent[]} annotations
 * @param {*} syntaxError
 */
function processSyntaxError(lines, annotations, syntaxError)
{
	const zeroIndexedRow = syntaxError.line - 1;
	const activeLineText = lines[zeroIndexedRow] || "";
	const cleanLine = activeLineText.replace(/\t/g, '    ');

	const leadingSpaces = ' '.repeat(Math.max(0, syntaxError.column));
	const caretMarker = `${leadingSpaces}^~~~~`;

	const clangDiagnosticText = [
		`stdin.c:${syntaxError.line}:${syntaxError.column + 1}: error: ${syntaxError.message}`,
		cleanLine.trimEnd(),
		caretMarker
	].join('\n');

	annotations.push({
		row: zeroIndexedRow,
		column: syntaxError.column,
		text: clangDiagnosticText,
		type: "error"
	});
}


/**
 *
 * @param {string[]} lines
 * @param {import('./rosetta-types.d').ImplementedStream} tokenStream
 * @param {string} languageKey
 * @param {import('./rosetta-types.d').ParserEvent[]} annotations
 * @param {import('./rosetta-types.d').ImplementedLexer} lexer
 * @param {import('./rosetta-types.d').ImplementedBackend} emitter
 * @param {string} fileId
 * @returns {([Map<number, string>, import('./rosetta-types.d').ImplementedParser | null, any] | undefined)}
 */
function _extractSemanticOverrides(lines, tokenStream, languageKey, annotations, lexer, emitter, fileId)
{
	const semanticOverrides = new Map();
	if(!languageKey) return [semanticOverrides, null, null];

	const cleanKey = languageKey.toLowerCase().trim();
	const lookupKey = `${cleanKey}_parser`;
	/** @type {typeof import('antlr4').Parser} */
	let ParserCtor = /** @type {any} */ (workerSelf.AntlrRegistry[lookupKey]);
	if(!ParserCtor) return [semanticOverrides, null, null];

	/** @type {import('./rosetta-types.d').ImplementedParser} */
	const parser = /** @type {any} */ (new ParserCtor(tokenStream));
	parser.removeErrorListeners();

	if(parser._interp && workerSelf.AntlrRegistry.antlr4?.PredictionMode)
	{
		parser._interp.predictionMode = workerSelf.AntlrRegistry.antlr4.PredictionMode.LL;
	}

	// --- STEP 1: WIRE UP SYNTAX ERROR LISTENERS FOR THE UX ---
	parser.addErrorListener({
		syntaxError: (recognizer, offendingSymbol, line, column, msg) =>
		{

			// Pass the active lines array context and aggregate directly
			// 'lines' must be available in scope or passed into
			if(typeof processSyntaxError === 'function' && typeof lines !== 'undefined')
			{
				processSyntaxError(lines, annotations, { line, column, message: msg });
			} else
			{
				// Inline fallback if line parsing contexts are dropped
				annotations.push({
					row: line - 1,
					column: column,
					text: msg,
					type: "error"
				});
			}

			if(typeof offendingSymbol === 'object' && typeof offendingSymbol.start === 'number')
			{
				const errorScope = "text.syntax_error.err_notfound.annotation_required";
				semanticOverrides.set(offendingSymbol.start, errorScope);
			}
		}
	});


	// --- STEP 2: CUSTOM ERROR STRATEGY FOR SOFT ERROR ABSORPTION ---
	/** @type {import('antlr4').ErrorStrategy | undefined} */
	let customStrategyInstance = workerSelf.AntlrRegistry.antlr4
		? new workerSelf.AntlrRegistry.antlr4.error.BailErrorStrategy
		: undefined;

	if(!workerSelf.AntlrRegistry.antlr4)
	{
		return;
	}

	// Use modern ES6 class syntax to inherit safely from native class constructors
	class SoftErrorRecoveryStrategy extends workerSelf.AntlrRegistry.antlr4.error.DefaultErrorStrategy
	{
		constructor()
		{
			super();
		}

		// Override to handle minor structural deviations quietly
		/**
		 *
		 * @param {import('antlr4').Parser} recognizer
		 * @param {import('antlr4').RecognitionException} e
		 */
		reportNoViableAlternative(recognizer, e)
		{
			// Quietly absorb soft alternatives during structural pass
		}

		// Override to absorb inline token insertion errors silently
		/**
		 *
		 * @param {import('antlr4').Parser} recognizer
		 * @param {import('antlr4').RecognitionException} e
		 */
		reportUnwantedToken(recognizer, e)
		{
			// Soft error: keep UX feedback clean by overriding default logging
		}
	}

	customStrategyInstance = new SoftErrorRecoveryStrategy();

	if(customStrategyInstance)
	{
		parser._errHandler = customStrategyInstance;
	}



	let tree = null;
	try
	{
		const targetRules = parser.ruleNames ?? (/** @type {any} */ (parser.constructor).ruleNames);
		if(targetRules && targetRules[0]
			&& targetRules[0] in parser)
		{
			const handler = /** @type {any} */ (parser)[targetRules[0]];
			console.log(`[Worker] Dynamic execution target acquired: parser.${targetRules[0]}()`);
			if(typeof handler === 'function')
			{
				tree = handler.bind(parser)();
			}
		}
	} catch(err)
	{
		console.warn("[Worker] Structural parse crash:", err);
	}

	if(tree)
	{
		const transmittedLines = new Set();
		/**
		 *
		 * @param {import('antlr4').Token} token
		 * @param {Record<number, import('./rosetta-types.d').AntlrToken[]>} chunkObj
		 * @returns
		 */
		const processTokenIntoChunk = (token, chunkObj) =>
		{
			let tokenText = token.text || "";
			if(tokenText.endsWith('\r')) tokenText = tokenText.slice(0, -1);
			if(tokenText === "") return;

			const tokenRow = token.line - 1;
			if(!chunkObj[tokenRow])
			{
				chunkObj[tokenRow] = [];
			}

			// 1. Check for deep AST walker context overrides first
			let classification = semanticOverrides.get(token.start);

			// 2. RESTORED FALLBACK: Drop into toRosettaToken exactly like your old code did
			if(!classification)
			{
				const rawTypeName = _resolveTokenTypeName
					? _resolveTokenTypeName(lexer, token.type)
					: (/** @type {any} */ (lexer.constructor).symbolicNames[token.type] || "text");

				classification = toRosettaToken(
					token.text,
					rawTypeName,
					lexer,
					parser,
					token,
					tokenStream,
					// rawTypeName
				);

				// Sanitize edge-case token names leaking directly from native grammars
				//const lowerClass = classification ? classification.toLowerCase() : "text";
				//if (lowerClass.includes("comment")) {
				//    classification = "comment.line";
				//} else if (lowerClass.includes("include") || lowerClass.includes("define") || lowerClass.includes("preprocessor")) {
				//    debugger
				//    classification = "meta.preprocessor";
				//}
			}

			if(tokenText.includes('\n'))
			{
				const pieces = tokenText.split('\n');
				pieces.forEach((piece, offset) =>
				{
					const targetRow = tokenRow + offset;
					if(piece.endsWith('\r')) piece = piece.slice(0, -1);
					if(piece === "" && offset === pieces.length - 1) return;

					if(!chunkObj[targetRow]) chunkObj[targetRow] = [];
					chunkObj[targetRow].push({ type: classification, value: piece });
				});
			} else
			{
				chunkObj[tokenRow].push({ type: classification, value: tokenText });
			}
		};

		// High-level structural arrays used for chunk block aggregation
		let activeBlockTokenLines = [];
		let activeBlockAnnotations = [];

		/** @type {import('antlr4').ParseTreeListener} */
		const configurationListener = {
			/** @param {import('./rosetta-types.d').ImplementedContext} ctx */
			enterEveryRule: function (ctx)
			{
				debugger;
				const ruleName = parser.ruleNames[ctx.ruleIndex];
				console.log(`Rule: ${ruleName} | Invoking State: ${ctx.invokingState}`);
			},

			visitTerminal: function (node)
			{
				/** @type {import('./rosetta-types.d').AntlrToken} */
				const token = node.symbol;
				/** @type {import('./rosetta-types.d').ImplementedContext | undefined} */
				const ctx = /** @type {any} */ (node.parentCtx);

				// 1. RE-ESTABLISH THE INHERITANCE TRACE FOR TO-ROSETTA-TOKEN
				const ruleHistory = [];
				/** @type {import('./rosetta-types.d').ImplementedContext | undefined} */
				let currentCtx = /** @type {any} */ (ctx);
				while(currentCtx)
				{
					if(currentCtx.ruleIndex !== undefined && parser.ruleNames[currentCtx.ruleIndex])
					{
						ruleHistory.push(parser.ruleNames[currentCtx.ruleIndex]);
					}
					currentCtx = /** @type {any} */ (currentCtx.parentCtx);
				}

				const ruleName = ctx ? parser.ruleNames[ctx.ruleIndex] : 'text';
				const tokenText = token.text;
				const tokenTypeString = token.type
					? lexer.symbolicNames?.[token.type]
					?? /** @type {any} */ (lexer.constructor).symbolicNames[token.type]
					: "text";


				// Attach payload metadata anchors so toRosettaToken works perfectly
				token.ruleHistory = ruleHistory;
				token.contextNode = ctx;

				console.log(`Token: "${tokenText}" | Direct Rule: ${ruleName} | Line: ${token.line} | Inherited Trace Array:`, ruleHistory);
				// 2. COMPUTE THE ACCURATE SCOPE OVERRIDE VALUE
				if(token.text?.includes('#include'))
				{
					debugger;
				}
				const generalScope = toRosettaToken(tokenTypeString, ruleName, lexer, parser, token, tokenStream);
				semanticOverrides.set(token.start, generalScope);

				processStructuralFlags(annotations, token);
			},

			/** @param { import('./rosetta-types.d').ImplementedContext } ctx */
			exitEveryRule: function (ctx)
			{
				const ruleName = parser.ruleNames[ctx.ruleIndex];

				if(ruleName === 'functionBody' || ruleName === 'compoundStatement' || ruleName === 'block')
				{
					const startToken = ctx.start;
					const stopToken = ctx.stop;

					if(startToken && stopToken)
					{
						let startIdx = startToken.tokenIndex;
						while(startIdx > 0)
						{
							const prevToken = tokenStream.get(startIdx - 1);
							if(!prevToken || prevToken.line < startToken.line)
							{
								break;
							}
							startIdx--;
						}

						const blockAnnotations = annotations.filter(ann =>
							ann.row >= (startToken.line - 1) && ann.row <= (stopToken.line - 1)
						);

						/** @type {Record<number, import('./rosetta-types.d').AntlrToken[]>} */
						const slicedTokenLines = {};

						/** @type {import('antlr4').Token[]} */
						const allBlockTokens = tokenStream.getTokens(startIdx, stopToken.tokenIndex);

						allBlockTokens.forEach(token =>
						{
							processTokenIntoChunk(token, slicedTokenLines);
							transmittedLines.add(token.line - 1);
						});

						// emitter.emit("highlight", {
						// 	fileId: workerSelf.activeFileId,
						// 	startLine: startToken.line,
						// 	endLine: stopToken.line,
						// 	tokenLinesChunk: slicedTokenLines,
						// 	annotationsChunk: blockAnnotations
						// });
					}
				}
			},

			visitErrorNode:
				/** @param { import('antlr4').ErrorNode } node */
				function (node) { }
		};

		const walker = new workerSelf.AntlrRegistry.antlr4.tree.ParseTreeWalker();
		walker.walk(configurationListener, tree);

		// ─── FINAL BASELINE SWEEP ───
		// Catch globals, includes, and remaining filespace that sit outside function blocks
		/** @type {Record<number, import('antlr4').Token[]>} */
		const globalTokenLinesChunk = {};

		// Use all tokens from the stream natively
		/** @type {import('antlr4').Token[]} */
		let allTokens = [];
		if('getTokens' in tokenStream && typeof tokenStream.getTokens === 'function')
		{
			allTokens = tokenStream.getTokens(0);
		}
		if(!allTokens || allTokens.length === 0)
		{
			allTokens = tokenStream.tokens.slice(0) || [];
		}

		allTokens.forEach(token =>
		{
			if(!token
				|| workerSelf.AntlrRegistry.antlr4
				&& token.type === workerSelf.AntlrRegistry.antlr4.Token.EOF) return;

			const tokenRow = token.line - 1;

			// Only capture if this line wasn't already updated by an inner block chunk pass
			if(!transmittedLines.has(tokenRow))
			{

				// This call natively reads from your fully completed semanticOverrides Map!
				processTokenIntoChunk(token, globalTokenLinesChunk);
			}
		});


		// If there's any out-of-scope metadata found, push it over in one clean deployment strike
		if(Object.keys(globalTokenLinesChunk).length > 0)
		{
			emitter.emit("highlight", {
				fileSha: workerSelf.activeFileSha,
				fileId: fileId ?? workerSelf.activeFileId,
				startLine: 1,
				endLine: lines.length,
				tokenLinesChunk: globalTokenLinesChunk,
				annotationsChunk: annotations.filter(ann => !transmittedLines.has(ann.row))
			});
			return [semanticOverrides, parser, globalTokenLinesChunk];
		}
	}

	return [semanticOverrides, parser, null];
}


/**
 * Functional collector scanning for lingering tasks or preprocessor channels
 * @param {import('./rosetta-types.d').ParserEvent[]} annotations
 * @param {import('./rosetta-types.d').AntlrToken} token
 */
function processStructuralFlags(annotations, token)
{
	if(token.textType === 'comment'
		&& (token.text?.toLowerCase().includes('todo')
			|| token.text?.toLowerCase().includes('fix'))
	)
	{
		annotations.push({
			row: (token.line ?? 1) - 1,
			column: token.column ?? 0,
			text: "Unresolved task: " + token.text.trim(),
			type: "info"
		});
	}
	if(token.channel && token.channel > 1)
	{
		annotations.push({
			row: (token.line ?? 1) - 1,
			column: token.column ?? 0,
			text: "Isolated preprocessor block [" + token.type + "]",
			type: "warning"
		});
	}
}


/**
 *
 * @param {string} sourceText
 * @param {string} languageKey
 * @param {*} onResolveInclude
 * @param {*} onErrorFound
 * @returns
 */
export function _safePreprocess(sourceText, languageKey, onResolveInclude, onErrorFound)
{
	try
	{
		return preprocessSourceText(sourceText, languageKey, onResolveInclude, onErrorFound);
	} catch(e)
	{
		console.error("[Preprocessor Crisis] Virtual assembly layer collapsed:", e);
		return sourceText;
	}
}



/**
 *
 * @param {string} sourceText
 * @param {string} languageKey
 * @param {*} onResolveInclude
 * @param {((err: import('./rosetta-types.d').ErrorResult) => void)} onErrorFound
 * @param {Set<string>} visitedFiles
 * @returns
 */
function preprocessSourceText(sourceText, languageKey, onResolveInclude, onErrorFound, visitedFiles = new Set())
{
	if(typeof onResolveInclude !== 'function') return sourceText;

	const lexer = createLexerInstance(sourceText, languageKey);
	if(!lexer) return sourceText;

	let expandedText = "";
	let token = lexer.nextToken();

	while(workerSelf.AntlrRegistry.antlr4
		&& token.type !== workerSelf.AntlrRegistry.antlr4.Token.EOF)
	{
		const rawTypeName = _resolveTokenTypeName(lexer, token.type);




		// TODO: resolve header types
		if(rawTypeName === 'Directive' || token.text.trim().startsWith('#include'))
		{
			const includeMatch = token.text.match(/#include\s*["<]([^">]+)[">]/);
			if(includeMatch && includeMatch[1])
			{
				const targetFileName = includeMatch[1].trim();

				if(!visitedFiles.has(targetFileName))
				{
					visitedFiles.add(targetFileName);
					try
					{
						const headerContents = onResolveInclude(targetFileName);
						if(headerContents)
						{
							const fullyExpandedHeader = preprocessSourceText(headerContents, languageKey, onResolveInclude, onErrorFound, visitedFiles);
							expandedText += `\n/* --- Start Unified Include: ${targetFileName} --- */\n`;
							expandedText += fullyExpandedHeader;
							expandedText += `\n/* --- End Unified Include: ${targetFileName} --- */\n`;
						}
					} catch(err)
					{
						// Track missing dependencies in a global context register for the token mapper to read
						workerSelf.__missingHeaders = workerSelf.__missingHeaders || new Set();
						workerSelf.__missingHeaders.add(targetFileName);
						expandedText += `\n/* Missing Header Dependency: ${targetFileName} */\n`;
						const errorResult = {
							line: typeof token.start === 'object' && 'line' in token.start
								? /** @type {any} */ (token.start).line
								: token.line,
							column: typeof token.start === 'object'
								? /** @type {any} */ (token.start).column
								: token.column,
							message: /** @type {Error} */ (err).message
						};
						onErrorFound(errorResult);
					}
				}
			} else
			{
				expandedText += token.text;
			}
		} else
		{
			expandedText += token.text;
		}
		token = lexer.nextToken();
	}
	return expandedText;
}


/**
 * Single-pass compilation token provider.
 * Spins up a single lexer/parser pipeline, executes the semantic override tree walk,
 * and handles inline annotations directly.
 */
/**
 *
 * @param {string} sourceText
 * @param {string} languageKey
 * @param {import('./rosetta-types.d').ParserEvent[]} annotations
 * @param {import('./rosetta-types.d').ImplementedBackend} emitter
 * @param {string} fileId
 * @returns {any}
 */
export function runParserPipeline(sourceText, languageKey, annotations, emitter, fileId)
{
	// 1. Safe preprocessing phase pass
	const lines = sourceText.split('\n');
	const unifiedSourceBuffer = _safePreprocess(sourceText, languageKey, null,
		/** @param {import('./rosetta-types.d').ErrorResult} err */
		(err) =>
		{
			annotations.push({ row: err.line - 1, column: err.column, text: err.message, type: "error" });
		});

	// 2. Spin up ONE single Lexer instance
	const pipelineLexer = createLexerInstance(unifiedSourceBuffer, languageKey);
	if(!pipelineLexer) return null;

	// 3. Spin up ONE single standard token stream
	/** @type {import('./rosetta-types.d').ImplementedStream | undefined} */
	const tokenStream = workerSelf.AntlrRegistry.antlr4
		? /** @type {any} */ (new workerSelf.AntlrRegistry.antlr4.CommonTokenStream(pipelineLexer))
		: undefined;
	if(!tokenStream) return null;

	// 4. Run the deep semantic scanner walker
	// This directly kicks off chunked streaming passes via your 'exitEveryRule' gates
	const [semanticOverrides, parser, globalTokenLinesChunk] = _extractSemanticOverrides(
		lines,
		tokenStream,
		languageKey,
		annotations,
		pipelineLexer, // Pass the active lexer for type resolution mapping
		emitter,
		fileId
	) ?? [];

	return globalTokenLinesChunk;
}

workerSelf.runParserPipeline = runParserPipeline;

