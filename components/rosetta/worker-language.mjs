
// @ts-check

import { load } from 'js-yaml';
import { _resolveTokenTypeName, getFoldRegions } from './rosetta-blocks.mjs';

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
	if(!languageKey || !workerSelf.AntlrRegistry.antlr4) return null;

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

	let chars;
	try
	{
		chars = (workerSelf.AntlrRegistry.antlr4.CharStreams
			&& typeof workerSelf.AntlrRegistry.antlr4.CharStreams.fromString === 'function')
			? workerSelf.AntlrRegistry.antlr4.CharStreams.fromString(sourceText)
			: new workerSelf.AntlrRegistry.antlr4.InputStream(sourceText);

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

	while(token.type !== workerSelf.AntlrRegistry.antlr4?.Token.EOF)
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


/** @returns {Promise<import('../code/widget-languages').LanguageRuntime[] | undefined>} */
export async function loadLanguages()
{
	const data = await workerSelf.cacheFile?.(
		workerSelf.DB_STORE_NAME ?? 'FILE_DATA',
		'briancullinan2',
		'voidzero',
		'components/rosetta/languages.yml')
		?? await (await fetch(workerSelf.location.origin + '/components/rosetta/languages.yml'))?.arrayBuffer();
	if(!data)
	{
		return;
	}

	/** @type {Record<string, import('../code/widget-languages').LanguageRuntime>} */
	const languages = /** @type {any} */ (data instanceof ArrayBuffer
		|| data instanceof Uint8Array
		? load(new TextDecoder().decode(data))
		: data instanceof FileSystemFileHandle
			? load(new TextDecoder().decode(await (await data.getFile()).arrayBuffer()))
			: {});


	return Object.keys(languages ?? {}).map(k =>
	{
		if(languages[k].ace_mode === 'text')
		{
			languages[k].aceMissing = true;
		} else if(languages[k].ace_mode)
		{
			// if(!this.modes?.[languages[k].ace_mode])
			// {
			// 	languages[k].aceMissing = true;
			// }
			// languages[k].ace_mode = this.modes?.[languages[k].ace_mode]
			// 	? languages[k].ace_mode : undefined;
		}
		languages[k].id = k;
		languages[k].label = k;
		return languages[k];
	});
}

workerSelf.loadLanguages = loadLanguages;
