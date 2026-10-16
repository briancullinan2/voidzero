
// @ts-check

import { _resolveTokenTypeName, getFoldRegions } from './rosetta-blocks';

/**
 * Copyright 2026 WebAssembly Community Group participants
 * Licensed under the Apache License, Version 2.0 (the "License");
 */


/** @type {MessagePort} */
let port;


/** @type {Worker & import('./rosetta-types.d').RosettaWorker} */
const workerSelf = /** @type {any} */ (self);

/**
 *
 * @param {string} sourceText
 * @param {string} languageKey
 * @returns {import('antlr4').Lexer | null}
 */
export function createLexerInstance(sourceText, languageKey)
{
	if(!languageKey) return null;

	// 1. Force the lookup key to be fully normalized lowercase
	const cleanKey = languageKey.toLowerCase().trim();
	const lookupKey = `${cleanKey}_lexer`;

	let LexerCtor = workerSelf.AntlrRegistry[lookupKey];

	// Sane localized compiler overrides map
	if(!LexerCtor)
	{
		if(cleanKey === 'python') LexerCtor = workerSelf.AntlrRegistry['python3_lexer'];
	}

	if(!LexerCtor)
	{
		console.error(`[Worker] Normalized target look-up key '${lookupKey}' not found in registry matrix.`);
		return null;
	}

	const antlr = workerSelf.AntlrRegistry.antlr4;
	let chars;
	try
	{
		chars = (antlr.CharStreams && typeof antlr.CharStreams.fromString === 'function')
			? antlr.CharStreams.fromString(sourceText)
			: new antlr.InputStream(sourceText);

		if('normalizeInputStream' in LexerCtor && typeof LexerCtor.normalizeInputStream === 'function')
		{
			chars = LexerCtor.normalizeInputStream(chars);
		} else if(LexerCtor.prototype && Object.getPrototypeOf(LexerCtor.prototype).constructor.normalizeInputStream)
		{
			chars = Object.getPrototypeOf(LexerCtor.prototype).constructor.normalizeInputStream(chars);
		}


		// 1. Instantiate the stream pipeline completely natively
		//const chars = new AntlrRegistry.antlr4.InputStream(codeString);
		const lexer = new LexerCtor(chars);
		//const tokens = new AntlrRegistry.antlr4.CommonTokenStream(lexer);

		// ─── THE SIDE-EFFECT FREE FIXED INTERCEPT LOOP ───
		// Force-fill the stream buffer array natively so we can work with real instances
		//tokens.fill();
		/*
		// Walk the flat array cache and memoize text explicitly
		if (tokens.tokens && Array.isArray(tokens.tokens)) {
			for (let i = 0; i < tokens.tokens.length; i++) {
				const t = tokens.tokens[i];

				// Skip mutations if ANTLR already hard-baked an EOF or special token string value
				if (t._text !== null && t._text !== undefined) continue;

				try {
					// Hard-bind the sliced string directly to avoid the lazy-evaluation getter bugs
					t.text = codeString.substring(t.start, t.stop + 1);
				} catch (e) {
					t.text = "";
				}
			}
		}
		*/

		if(lexer instanceof workerSelf.AntlrRegistry.antlr4.Lexer)
		{
			return lexer;
		}
	} catch(e)
	{
		console.error(`[Worker] Failed to spin up ANTLR string stream for look-up '${lookupKey}':`, e);
	}
	return null;
}


/**
 *
 * @param {string} sourceText
 * @param {string} languageKey
 * @param {number} targetLine
 * @returns
 */
function getTokensForLine(sourceText, languageKey, targetLine)
{
	const lexer = createLexerInstance(sourceText, languageKey);
	if(!lexer) return [];

	const lineTokens = [];
	let token = lexer.nextToken();
	const eof = workerSelf.AntlrRegistry.antlr4.Token.EOF;

	while(token.type !== eof)
	{
		if(token.line > targetLine) break;
		if(token.line === targetLine)
		{
			lineTokens.push({
				text: token.text,
				type: _resolveTokenTypeName(lexer, token.type),
				start: token.start,
				stop: token.stop,
				column: token.column,
				channel: token.channel
			});
		}
		token = lexer.nextToken();
	}
	return lineTokens;
}


const onAnyMessage =
	/** @param {MessageEvent | {data: any}} event */
	async event =>
	{
		const { id, data, responseId } = event.data;
		if(!id) return;
		let output = null;

		try
		{
			switch(id)
			{
				case 'constructor':
					port = event.data.data;
					port.onmessage = onAnyMessage;

					workerSelf.language = {
						lineToken:
							/**
							 *
							 * @param {string} text
							 * @param {string} language
							 * @param {number} line
							 * @returns
							 */
							async (text, language, line) => await onAnyMessage({
								data: { id: 'lineToken', text, language, line }
							}),
					};
					return;

				case 'lineToken':
					output = getTokensForLine(data.text, data.language, data.line);
					break;

				case 'folds':
					output = getFoldRegions(data.text, data.language);
					break;

				default:
					output = { status: 'unhandled_command' };
					break;
			}
		} catch(/** @type {any} */ e)
		{
			output = { error: e.toString(), stack: e.stack };
		} finally
		{
			if(port && id !== 'constructor')
			{
				port.postMessage({ id: 'runAsync', responseId, data: output });
			}
		}
	};

self.addEventListener('message', onAnyMessage);
