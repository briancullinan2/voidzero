
// @ts-check



/** @type {Worker & import('./rosetta.d').RosettaWorker} */
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
		 * @param {import('./rosetta.d').DiagnosticBridge} bridge
		 * @returns {import('./rosetta.d').DiagnosticsParser}
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
		 * @param {import('./rosetta.d').DiagnosticBridge} bridge
		 * @returns {import('./rosetta.d').DiagnosticsParser}
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
		 * @param {import('./rosetta.d').DiagnosticBridge} bridge
		 * @returns {import('./rosetta.d').DiagnosticsParser}
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
		 * @param {import('./rosetta.d').DiagnosticBridge} bridge
		 * @returns {import('./rosetta.d').DiagnosticsParser}
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
 * @param {import('./rosetta.d').ParserEvent[]} annotations
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
 * @param {import('antlr4').CommonTokenStream} tokenStream
 * @param {string} languageKey
 * @param {import('./rosetta.d').ParserEvent[]} annotations
 * @param {import('antlr4').Lexer} lexer
 * @param {*} emitter
 * @returns
 */
function _extractSemanticOverrides(lines, tokenStream, languageKey, annotations, lexer, emitter)
{
	const semanticOverrides = new Map();
	if(!languageKey) return [semanticOverrides, null];

	const cleanKey = languageKey.toLowerCase().trim();
	const lookupKey = `${cleanKey}_parser`;
	let ParserCtor = workerSelf.AntlrRegistry[lookupKey];
	if(!ParserCtor) return [semanticOverrides, null];

	const parser = new ParserCtor(tokenStream);
	parser.removeErrorListeners();

	if(parser._interp && workerSelf.AntlrRegistry.antlr4?.PredictionMode)
	{
		parser._interp.predictionMode = workerSelf.AntlrRegistry.antlr4.PredictionMode.LL;
	}

	// --- STEP 1: WIRE UP SYNTAX ERROR LISTENERS FOR THE UX ---
	parser.addErrorListener({
		reportAmbiguity: function (recognizer, dfa, startIndex, stopIndex, exact, ambigAlts, configs)
		{
			// Absorb deep SLL prediction branching conflicts silently
		},
		reportContextSensitivity: function (recognizer, dfa, startIndex, stopIndex, prediction, configs)
		{
			// Absorb fallback optimization logs smoothly
		},
		reportAttemptingFullContext: function (recognizer, dfa, startIndex, stopIndex, conflictingAlts, configs)
		{
			// CRITICAL PROXIMATE GAP FIX: Satisfies the engine when dropping into deep LL validation
		},
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
	const BaseStrategy = workerSelf.AntlrRegistry.antlr4?.DefaultErrorStrategy ?? {};

	let customStrategyInstance;

	if(BaseStrategy)
	{
		// Use modern ES6 class syntax to inherit safely from native class constructors
		class SoftErrorRecoveryStrategy extends BaseStrategy
		{
			constructor()
			{
				super();
			}

			// Override to handle minor structural deviations quietly
			reportNoViableAlternative(recognizer, e)
			{
				// Quietly absorb soft alternatives during structural pass
			}

			// Override to absorb inline token insertion errors silently
			reportUnwantedToken(recognizer, e)
			{
				// Soft error: keep UX feedback clean by overriding default logging
			}
		}

		customStrategyInstance = new SoftErrorRecoveryStrategy();
	} else
	{
		// Safe fallback if the registry isn't fully structured
		const BailStrategy = workerSelf.AntlrRegistry.antlr4?.BailErrorStrategy;
		customStrategyInstance = BailStrategy ? new BailStrategy() : null;
	}

	if(customStrategyInstance)
	{
		parser._errHandler = customStrategyInstance;
	}



	let tree = null;
	try
	{
		const targetRules = parser.ruleNames || (parser.constructor && parser.constructor.ruleNames);
		if(targetRules && targetRules[0] && typeof parser[targetRules[0]] === 'function')
		{
			const rootRuleName = targetRules[0]; // Resolves straight to "json" or "compilationUnit"
			console.log(`[Worker] Dynamic execution target acquired: parser.${rootRuleName}()`);
			tree = parser[rootRuleName]();
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
		 * @param {Record<number, import('./rosetta.d').AntlrToken[]>} chunkObj
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
				const rawTypeName = _resolveTokenTypeName ? _resolveTokenTypeName(lexer, token.type) : (lexer.constructor.symbolicNames[token.type] || "text");

				classification = toRosettaToken(
					rawTypeName,
					token.tokenRule,
					lexer,
					parser,
					token,
					tokenStream,
					rawTypeName
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

		const configurationListener = {
			enterEveryRule: function (ctx)
			{
				const ruleName = parser.ruleNames[ctx.ruleIndex];
				console.log(`Rule: ${ruleName} | Invoking State: ${ctx.invokingState}`);
			},

			visitTerminal: function (node)
			{
				const token = node.symbol;
				const ctx = node.parentCtx;

				// 1. RE-ESTABLISH THE INHERITANCE TRACE FOR TO-ROSETTA-TOKEN
				const ruleHistory = [];
				let currentCtx = ctx;
				while(currentCtx)
				{
					if(currentCtx.ruleIndex !== undefined && parser.ruleNames[currentCtx.ruleIndex])
					{
						ruleHistory.push(parser.ruleNames[currentCtx.ruleIndex]);
					}
					currentCtx = currentCtx.parentCtx;
				}

				const ruleName = parser.ruleNames[ctx.ruleIndex];
				const tokenText = token.text;
				const tokenTypeString = lexer.constructor.symbolicNames[token.type] || "text";

				// Attach payload metadata anchors so toRosettaToken works perfectly
				token.ruleHistory = ruleHistory;
				token.contextNode = ctx;

				console.log(`Token: "${tokenText}" | Direct Rule: ${ruleName} | Line: ${token.line} | Inherited Trace Array:`, ruleHistory);
				// 2. COMPUTE THE ACCURATE SCOPE OVERRIDE VALUE
				if(token.text.includes('#include'))
				{
					debugger;
				}
				const generalScope = toRosettaToken(tokenTypeString, ruleName, lexer, parser, token, tokenStream);
				semanticOverrides.set(token.start, generalScope);

				processStructuralFlags(annotations, token);
			},

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

						const slicedTokenLines = {};
						const allBlockTokens = tokenStream.getTokens(startIdx, stopToken.tokenIndex);

						allBlockTokens.forEach(token =>
						{
							processTokenIntoChunk(token, slicedTokenLines);
							transmittedLines.add(token.line - 1);
						});

						emitter.emit("highlight", {
							fileId: this.activeFileId,
							startLine: startToken.line,
							endLine: stopToken.line,
							tokenLinesChunk: slicedTokenLines,
							annotationsChunk: blockAnnotations
						});
					}
				}
			},

			visitErrorNode: function (node) { }
		};

		const walker = new workerSelf.AntlrRegistry.antlr4.ParseTreeWalker();
		walker.walk(configurationListener, tree);

		// ─── FINAL BASELINE SWEEP ───
		// Catch globals, includes, and remaining filespace that sit outside function blocks
		const globalTokenLinesChunk = {};

		// Use all tokens from the stream natively
		let allTokens = [];
		if(typeof tokenStream.getTokens === 'function') allTokens = tokenStream.getTokens();
		if(!allTokens || allTokens.length === 0) allTokens = tokenStream.tokens || [];

		allTokens.forEach(token =>
		{
			if(!token || token.type === workerSelf.AntlrRegistry.antlr4.Token.EOF) return;

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
				fileId: this.activeFileId,
				startLine: 1,
				endLine: lines.length,
				tokenLinesChunk: globalTokenLinesChunk,
				annotationsChunk: annotations.filter(ann => !transmittedLines.has(ann.row))
			});
		}
	}

	return [semanticOverrides, parser];
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
 * @param {import('./rosetta.d').ParserEvent[]} annotations
 * @param {*} emitter
 * @returns
 */
function runParserPipeline(sourceText, languageKey, annotations, emitter)
{
	const antlr = workerSelf.AntlrRegistry.antlr4;

	// 1. Safe preprocessing phase pass
	const lines = sourceText.split('\n');
	const unifiedSourceBuffer = _safePreprocess(sourceText, languageKey, null,
		/** @param {Error} err */
		(err) =>
		{
			annotations.push({ row: err.line - 1, column: err.column, text: err.message, type: "error" });
		});

	// 2. Spin up ONE single Lexer instance
	const pipelineLexer = createLexerInstance(unifiedSourceBuffer, languageKey);
	if(!pipelineLexer) return null;

	// 3. Spin up ONE single standard token stream
	const tokenStream = new antlr.CommonTokenStream(pipelineLexer);

	// 4. Run the deep semantic scanner walker
	// This directly kicks off chunked streaming passes via your 'exitEveryRule' gates
	const [semanticOverrides, parser] = _extractSemanticOverrides(
		lines,
		tokenStream,
		languageKey,
		annotations,
		pipelineLexer, // Pass the active lexer for type resolution mapping
		emitter
	);

	return parser;
}


