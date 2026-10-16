
// @ts-check

/** @type {Worker & import('../components/rosetta/rosetta-types.d').RosettaWorker} */
const workerSelf = /** @type {any} */ (self);


/**
 * Updates the structural targets and re-schedules the parser timeline
 * @this {import('../components/rosetta/rosetta-types').ImplementedBackend}
 * @param {string} fileId
 */
function setLanguageContext(fileId)
{
	const ext = fileId.split('.').pop()?.toLowerCase() ?? fileId.toLowerCase();
	const filenameAsType = fileId.split('/').pop()?.toLowerCase() ?? fileId.toLowerCase();
	const modeKey = ((!workerSelf.EXTENSION_TO_PARSER_ID[ext] || ext === 'txt') && workerSelf.EXTENSION_TO_PARSER_ID[filenameAsType]) ? filenameAsType : ext;
	this.languageKey = workerSelf.EXTENSION_TO_PARSER_ID[modeKey];
	if(!this.languageKey)
	{
		const textContent = this.doc.getValue();

		const matchedLanguageNode = workerSelf.TEXT_LANGUAGE_DETECTOR_WATERFALL.find(lang => lang.match(textContent, new TextEncoder().encode(textContent)));

	}
	this.activeFileId = fileId;
	this.deferredUpdate.schedule(); // Native trigger to fire onUpdate()
}


/**
 *
 * @this {import('../components/rosetta/rosetta-types').ImplementedBackend}
 * @returns
 */
async function onUpdate()
{
	if(!this.doc) return;

	const fullText = this.doc.getValue();

	/** @type {import('../components/rosetta/rosetta-types.d').ParserEvent[]} */
	let annotations = [];

	try
	{
		// Kick off the unified single-pass compiler pipeline
		workerSelf.runParserPipeline(fullText, this.languageKey, annotations, this.sender);
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
export function AntlrWorkerBackend(sender)
{
	/** @type {import('../components/rosetta/rosetta-types.d').Mirror} */
	const Mirror = ace.require("ace/worker/mirror").Mirror;
	Mirror.call(this, sender);

	this.setTimeout(200);
	this.languageKey = "c";
	this.activeFileId = "";
}

function setupInheritance()
{
	/** @type {import('../components/rosetta/rosetta-types.d').Mirror} */
	const Mirror = ace.require("ace/worker/mirror").Mirror;
	const oop = ace.require("ace/lib/oop");
	oop.inherits(AntlrWorkerBackend, Mirror);
	AntlrWorkerBackend.prototype.setLanguageContext = setLanguageContext;
	AntlrWorkerBackend.prototype.onUpdate = onUpdate;
}




self.addEventListener('message', function (e)
{
	const msg = e.data;
	if(!msg) return;

	// Use a localized variable for routing so we don't mutate the raw event object
	// that Ace's worker-base.js expects to read further down the chain.
	const commandName = msg.command ?? msg.event;

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
			const blockMeta = workerSelf.extractCurrentBlock(codeString, cursorRow, runningLangId);

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
			on: function () { },
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
		return;
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



