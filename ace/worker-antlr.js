
// @ts-check

/** @type {import('../components/rosetta/rosetta-types.d').RosettaWorker} */
const workerSelf = /** @type {any} */ (self);
workerSelf.process = {
	env: {}
};

workerSelf.api = {

};
workerSelf.FS = {
	virtual: {}
};
workerSelf.dirs = {

};


/**
 * Updates the structural targets and re-schedules the parser timeline
 * @this {import('../components/rosetta/rosetta-types').ImplementedBackend}
 * @param {string} fileId
 * @param {string} baseOrigin
 */
async function setLanguageContext(fileId, baseOrigin)
{
	if(baseOrigin)
	{
		workerSelf.location = new URL(baseOrigin);
	}
	const ext = fileId.split('.').pop()?.toLowerCase() ?? fileId.toLowerCase();
	if(ext === 'antlr')
	{
		this.languageKey = undefined;
		return;
	}
	// TODO
	if(!workerSelf.languages)
	{
		workerSelf.languages = await workerSelf.loadLanguages?.() ?? [];
	}
	this.languageKey = await workerSelf.resolveLanguageContext(fileId, this.doc.getValue());
	workerSelf.activeFileId = fileId;
	this.deferredUpdate.schedule(); // Native trigger to fire onUpdate()
}



/**
 *
 * @param {Uint8Array | ArrayBuffer | string} content
 * @returns
 */
async function getGitShaBrowser(content)
{
	const encoder = new TextEncoder();
	let contentBytes;

	if(content instanceof Uint8Array)
	{
		contentBytes = content;
	} else if(content instanceof ArrayBuffer)
	{
		// Wrap the raw ArrayBuffer in a Uint8Array view so it has a .length property
		contentBytes = new Uint8Array(content);
	} else
	{
		contentBytes = encoder.encode(content);
	}

	// Create Git blob header using .byteLength for accuracy
	const header = `blob ${contentBytes.byteLength}\0`;
	const headerBytes = encoder.encode(header);

	// Combine using .byteLength to support all binary types safely
	const finalBytes = new Uint8Array(headerBytes.byteLength + contentBytes.byteLength);
	finalBytes.set(headerBytes);
	finalBytes.set(contentBytes, headerBytes.byteLength);

	// Generate SHA-1 hash
	const hashBuffer = await crypto.subtle.digest('SHA-1', finalBytes);

	// Convert ArrayBuffer to Hex string
	return Array.from(new Uint8Array(hashBuffer))
		.map(b => b.toString(16).padStart(2, '0'))
		.join('');
}


/** @type {Record<string, any>} */
const highlightRequests = {};

/**
 *
 * @this {import('../components/rosetta/rosetta-types').ImplementedBackend}
 * @returns
 */
async function onUpdate()
{
	if(!this.doc || !this.languageKey) return;

	const fullText = this.doc.getValue();
	const sha = await getGitShaBrowser(fullText);
	if(highlightRequests[sha])
	{
		this.sender.emit("highlight", {
			fileId: workerSelf.activeFileId,
			startLine: 1,
			endLine: fullText.split('\n').length,
			tokenLinesChunk: highlightRequests[sha],
		});
		return;
	}
	highlightRequests[sha] = true;

	/** @type {import('../components/rosetta/rosetta-types.d').ParserEvent[]} */
	let annotations = [];

	try
	{
		// TODO: debounce
		highlightRequests[sha] = workerSelf.runParserPipeline(fullText, this.languageKey, annotations, this.sender, workerSelf.activeFileId ?? '');
	} catch(pipelineCrash)
	{
		console.error("[ANTLR Pipeline Crash]:", pipelineCrash);
		annotations.push({
			row: 0,
			column: 0,
			text: "ANTLR Processing crash: " + /** @type {Error} */ (pipelineCrash).message,
			type: "error"
		});
	}

	// Send any remaining preprocessing or global syntax errors down to Ace
	this.sender.emit("annotate", annotations);
}


/**
 *
 * @this {import('../components/rosetta/rosetta-types').ImplementedBackend}
 * @param {any} sender
 */
function AntlrWorkerBackend(sender)
{
	/** @type {import('../components/rosetta/rosetta-types.d').Mirror} */
	const Mirror = workerSelf.ace?.require("ace/worker/mirror").Mirror;
	Mirror.call(this, sender);

	this.setTimeout(200);
	/** @type {string | undefined} */
	this.languageKey = "c";
	workerSelf.activeFileId = "";
}

function setupInheritance()
{
	/** @type {import('../components/rosetta/rosetta-types.d').Mirror} */
	const Mirror = workerSelf.ace?.require("ace/worker/mirror").Mirror;
	const oop = workerSelf.ace?.require("ace/lib/oop");
	oop.inherits(AntlrWorkerBackend, Mirror);
	AntlrWorkerBackend.prototype.setLanguageContext = setLanguageContext;
	AntlrWorkerBackend.prototype.onUpdate = onUpdate;
}




self.addEventListener('message', async function (e)
{
	const msg = e.data;
	if(!msg) return;

	// Use a localized variable for routing so we don't mutate the raw event object
	// that Ace's worker-base.js expects to read further down the chain.
	const commandName = msg.command ?? msg.event;
	/** @type {Record<string, Function>} */
	const eventListeners = {};

	// 1. FILTER HIGH-FIDELITY HOOKS
	if(commandName && ['customHighlightRoute', 'requestAST'].includes(commandName))
	{
		e.stopImmediatePropagation();
		return;
	}

	if(commandName === "calculateActiveBlockRange")
	{
		const cursorRow = msg.data.lineNumber; // 1-based lineNumber passed from front-end
		const codeString = workerSelf.antlrProcessor?.doc.getValue(); // Get running buffer from doc wrapper
		const runningLangId = workerSelf.antlrProcessor?.languageKey || "c";

		try
		{
			// Execute your streamlined look-around block algorithm
			const blockMeta = workerSelf.extractCurrentBlock(codeString ?? '', cursorRow, runningLangId);

			// Post the clean range boundaries right back up the thread channel
			workerSelf.antlrProcessor?.sender.emit("blockRange", {
				startLine: blockMeta.startLine,
				endLine: blockMeta.endLine
			});
		} catch(err)
		{
			console.error("[Worker Block Trace Error]: ", err);
		}
		e.stopImmediatePropagation();
		return;
	}

	if(commandName === 'getFoldRegions')
	{
		e.stopImmediatePropagation();
		if(workerSelf.antlrProcessor)
		{
			return workerSelf.executeGetFoldRegionsCommand(msg, workerSelf.antlrProcessor);
		} else
		{
			throw Error('workerSelf.antlrProcessor not setup');
		}
	}

	// 2. SOVEREIGN BOOTSTRAP INITIALIZATION
	if(commandName === "importScripts")
	{
		e.stopImmediatePropagation(); // Prevent Ace from trying to parse script imports

		// Let the worker thread download your dependencies cleanly
		self.importScripts(...msg.args);
		setupInheritance.apply(workerSelf.antlrProcessor);

		// Build a dedicated sender pipeline to post events straight back to our frontend instance
		const cleanSender = {
			/**
			 *
			 * @param {string} event
			 * @param {any} callback
			 */
			on: function (event, callback)
			{
				eventListeners[event] = callback;
			},
			/**
			 *
			 * @param {any} data
			 * @param {string} id
			 */
			callback: function (data, id)
			{
				self.postMessage({ type: "call", id: id, data: data });
			},
			/**
			 *
			 * @param {string} name
			 * @param {any} data
			 */
			emit: function (name, data)
			{
				self.postMessage({ type: "event", name: name, data: data });
			}
		};

		// Construct your independent workspace engine instance!
		workerSelf.antlrProcessor = /** @type {any} */ (new AntlrWorkerBackend(cleanSender));

		if(!workerSelf.languages)
		{
			workerSelf.languages = await workerSelf.loadLanguages?.();
		}
		if(workerSelf.languages)
		{
			self.postMessage({
				type: "event", name: 'supportedLanguages', data: workerSelf.languages.map(l =>
				{
					/** @type {typeof import('antlr4').Lexer | typeof import('antlr4').Parser | undefined} */
					let lexer = undefined;
					/** @type {typeof import('antlr4').Lexer | typeof import('antlr4').Parser | undefined} */
					let parser = undefined;
					if(l.ace_mode && (lexer = workerSelf.AntlrRegistry[l.ace_mode + '_lexer'])
						&& (parser = workerSelf.AntlrRegistry[l.ace_mode + '_parser']))
					{
						l.antlrSupport = true;
					}
					if(l.id && (lexer = workerSelf.AntlrRegistry[l.id.toLowerCase() + '_lexer'])
						&& (parser = workerSelf.AntlrRegistry[l.id.toLowerCase() + '_parser']))
					{
						l.antlrSupport = true;
					}
					if(l.antlrSupport && lexer && parser && typeof l.antlrPercent === 'undefined')
					{
						let count = 0;
						(/** @type {any} */(parser).ruleNames
							?? /** @type {any} */ (parser).constructor.ruleNames)?.forEach(
								/** @param {string} s */
								(s) =>
								{
									if(workerSelf.GRAMMAR_CLASSIFIER_MATRIX[s])
									{
										count++;
									}
									if(workerSelf.ROSETTA_CROSS_LANGUAGE_MAPPING[s])
									{
										count++;
									}
								});
						(/** @type {any} */(lexer).ruleNames
							?? /** @type {any} */ (lexer).constructor.ruleNames)?.forEach(
								/** @param {string} s */
								(s) =>
								{
									if(workerSelf.ROSETTA_CROSS_LANGUAGE_MAPPING[s])
									{
										count++;
									}
								});
						l.antlrCount = count;
						l.antlrTotal = ((/** @type {any} */(lexer).ruleNames
							?? /** @type {any} */ (lexer).constructor.ruleNames)?.length ?? 0)
							+ ((/** @type {any} */(parser).ruleNames
								?? /** @type {any} */ (parser).constructor.ruleNames)?.length ?? 0) * 2;
						l.antlrPercent = l.antlrCount / (l.antlrTotal ?? 1);
					}

					return l;
				})
			});
		}

		return;
	}

	if(commandName === "change") // && eventListeners["change"])
	{
		debugger;
		//eventListeners["change"](msg.data);
	}

	// 3. AUTONOMOUS TUNNELING GATES
	// If your frontend worker client posts an explicit execution directive,
	// intercept it and apply it straight to your processor context.
	if(workerSelf.antlrProcessor && commandName in workerSelf.antlrProcessor)
	{
		/** @type {((args: any[]) => void)} */
		const handler = /** @type {any} */ (workerSelf.antlrProcessor)[commandName];
		if(typeof handler === 'function')
		{
			handler.apply(workerSelf.antlrProcessor, msg.args);
		}
		e.stopImmediatePropagation();
		return;
	}

	/*
	// 4. ACE CHANGE HOOK INTEGRATION
	// Mirror the edits to your state tracker, but DO NOT call stopImmediatePropagation().
	// Ace's background engine relies on receiving this identical change event next.
	if (antlrProcessor && antlrProcessor.doc && commandName === "change") {
		// Rehydrate compressed delta structure back into the required standard format
		const rawPayload = msg.data && msg.data.data;
		if (Array.isArray(rawPayload) && rawPayload.length >= 2) {
			const startPos = rawPayload[0]; // {"row":6,"column":28}
			const secondParam = rawPayload[1]; // Can be {"row":6,"column":30} OR an Array of lines [";"]

			let cleanDelta;

			// 1. CHECK IF DELETION: If the second element has a 'row' property, it's an end position object
			if (secondParam && typeof secondParam === "object" && "row" in secondParam) {
				cleanDelta = {
					action: "remove",
					start: startPos,
					end: secondParam,
					// For a remove action, standard applyDeltas will slice out the text,
					// but providing an empty array prevents crashes if the tracker demands the lines key
					lines: []
				};
			}
			// 2. CHECK IF INSERTION: If the second element is an array of text lines
			else if (Array.isArray(secondParam)) {
				const endRow = startPos.row + secondParam.length - 1;
				const endColumn = (secondParam.length === 1)
					? startPos.column + secondParam[0].length
					: secondParam[secondParam.length - 1].length;

				cleanDelta = {
					action: "insert",
					start: startPos,
					end: { row: endRow, column: endColumn },
					lines: secondParam
				};
			}

			// 3. Apply the fixed delta to your tracker if valid
			if (cleanDelta) {
				antlrProcessor.doc.applyDeltas([cleanDelta]);
				antlrProcessor.deferredUpdate.schedule(); // Trigger lookahead parse
			}
		}
		// No stopImmediatePropagation() here! Let it pass straight through to Ace.
	}
	*/
}, true);



