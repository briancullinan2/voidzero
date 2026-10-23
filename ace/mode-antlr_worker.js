
// @ts-check



/** @type {Worker & import('../components/rosetta/rosetta-types.d').RosettaWorker & import('../components/editor/widget.d').EditorWindow} */
const workerSelf = /** @type {any} */ (self);


/**
 * @this {import('../components/rosetta/rosetta-types.d').ImplementedClient} _this2
 * @param {string} fileId
 * @param {Array<Array<{ type: string, value: string; }>>} tokenLines
 */
function bridgeApplyCustomWorkerHighlights(fileId, tokenLines)
{
	if(!workerSelf.activeSessions?.[fileId]?.$editor || !tokenLines) return;

	workerSelf.activeSessions[fileId].bgTokenizer.lines = tokenLines;
	workerSelf.activeSessions[fileId].bgTokenizer.fireUpdateEvent(0, tokenLines.length - 1);
}

/**
 * @this {import('../components/rosetta/rosetta-types.d').ImplementedClient} _this2
 * @param {*} response
 */
function onBridgeHighlight(response)
{
	const { totalLines, antlrTokensByLine, fileId } = response.data;

	// 1. Tell Ace's background tokenizer to stop fighting your data
	if(workerSelf.activeSessions?.[fileId]?.bgTokenizer)
	{
		// Clear Ace's default internal cache lines
		workerSelf.activeSessions[fileId].bgTokenizer.lines = workerSelf.activeSessions[fileId].bgTokenizer.lines || [];

		// 2. Overwrite Ace's token cache arrays with your precise ANTLR tokens
		for(let row = 0; row < totalLines; row++)
		{
			if(antlrTokensByLine[row])
			{
				// Format expected by Ace: [{ type: "keyword.antlr", value: "void" }, ...]
				workerSelf.activeSessions[fileId].bgTokenizer.lines[row] = antlrTokensByLine[row];
			}
		}

		// 3. Force Ace to redraw the viewport using your newly injected arrays
		workerSelf.activeSessions[fileId]._emit("tokenizerUpdate", { first: 0, last: totalLines - 1 });
	}
}

/**
 *
 * @param {import('../components/editor/widget.d').AceSession} session
 * @param {*} e
 */
function onWorkerAnnotate(session, e)
{
	let compilerDiagnostics = workerSelf.ace?.require("ace/ext/compiler_diagnostics");
	if(compilerDiagnostics && compilerDiagnostics.getBridge)
	{
		let bridge = compilerDiagnostics.getBridge();
		bridge.setWorkerAnnotations(e.data);
	} else
	{
		session.setAnnotations(e.data);
	}
}

/**
 * Cleanup handler when a workspace edit session is dismantled
 */
/**
 *
 * @param {import('../components/rosetta/rosetta-types.d').ImplementedClient} _this2
 * @param {import('../components/editor/widget.d').AceSession} session
 */
function onWorkerTerminate(_this2, session)
{
	session.clearAnnotations();
	if(_this2.activeMarkerIds)
	{
		for(let m = 0; m < _this2.activeMarkerIds?.length; m++)
		{
			session.removeMarker(_this2.activeMarkerIds[m]);
		}
	}
	_this2.activeMarkerIds = [];
}


/**
 * Explicit setter proxy forwarding environment states downstream to the background thread
 * @param {Worker} _worker
 * @param {string} langKey
 * @param {string} fileId
 */
function setLanguageTarget(_worker, langKey, fileId)
{
	if(_worker)
	{
		_worker.postMessage({
			command: "setLanguageContext",
			args: [langKey, fileId]
		});
	}
}


/** @type {import('../components/rosetta/rosetta-types').AceWorkerClient | undefined} */
let WorkerClient;


/**
 * @this {import('../components/rosetta/rosetta-types').ImplementedClient}
 * @param {import('../components/editor/widget.d').AceSession} session
 */
function AntlrWorker(session)
{
	if(!workerSelf.activeSessions)
	{
		workerSelf.activeSessions = {};
	}
	if(session.workspaceFileId)
	{
		workerSelf.activeSessions[session.workspaceFileId] = session;
	}

	const that = this;
	let baseOrigin = window.location.origin;
	let targetUrl = baseOrigin + "/ace/worker-antlr.js";

	WorkerClient?.call(this, ["ace"], "ace/mode/antlr_worker_actions", "AntlrWorker", targetUrl);

	// --- CRITICAL FIX 1: Prevent Ace from terminating this single background worker ---
	this.terminate = function ()
	{
		// No-op! Intercept Ace's automatic session.stopWorker() / worker.terminate()
	};

	// Explicit method to really kill it if the entire web app unmounts
	this.forceTerminate = function ()
	{
		if(this.$worker)
		{
			this.$worker.terminate();
			/** @type {Worker | null} */
			this.$worker = null;
		}
	};

	this.setLanguageTarget = function (fileId)
	{
		if(this.$worker)
		{
			this.$worker.postMessage({
				command: "setLanguageContext",
				args: [fileId, baseOrigin]
			});
		}
	};

	if(this.$worker)
	{
		this.$worker.postMessage({
			command: "importScripts",
			args: [
				baseOrigin + "/ace/worker-base.js",
				baseOrigin + '/components/rosetta/languages-game.bundle.js',
				baseOrigin + '/components/rosetta/languages-high.bundle.js',
				baseOrigin + '/components/rosetta/languages-low.bundle.js',
				baseOrigin + '/components/rosetta/languages-meta.bundle.js',
				baseOrigin + '/components/rosetta/languages-ops.bundle.js',
				baseOrigin + '/components/rosetta/languages-query.bundle.js',
				baseOrigin + '/components/rosetta/languages-web.bundle.js',
				baseOrigin + '/components/rosetta/languages-special.bundle.js',
				baseOrigin + "/components/workers/local.js",
				baseOrigin + "/components/workers/github.js",
				baseOrigin + "/components/rosetta/rosetta.bundle.js"
			]
		});
	}

	// Forward messages ONLY to the active session
	this.on?.("supportedLanguages", function (response)
	{
		workerSelf.languages = /** @type {any} */ (response.data);
	});

	this.on?.("highlight", function (response)
	{
		if(workerSelf.activeSessions && typeof handleWorkerStreamHighlight === 'function')
		{
			const { fileId } = response.data;
			handleWorkerStreamHighlight(workerSelf.activeSessions[fileId], response.data);
		}
	});

	this.on?.("blockRange", function (response)
	{
		if(workerSelf.activeSessions && typeof handleWorkerBlockHighlight === 'function')
		{
			const { fileId } = response.data;
			handleWorkerBlockHighlight(workerSelf.activeSessions[fileId], response.data);
		}
	});

	this.on?.("annotate", function (response)
	{
		if(workerSelf.activeSessions)
		{
			const { fileId } = response.data;
			if(workerSelf.activeSessions[fileId] && typeof handleWorkerAnnotate === 'function')
			{
				workerSelf.activeSessions[fileId].setAnnotations(response.data);
				handleWorkerAnnotate(workerSelf.activeSessions[fileId], response.data);
			}
		}
	});

	this.on?.("foldRegionsCalculated", function (response)
	{
		const { fileId } = response.data;
		if(workerSelf.activeSessions && workerSelf.activeSessions[fileId] && typeof handleWorkerFoldRegions === 'function')
		{
			handleWorkerFoldRegions(workerSelf.activeSessions[fileId], response.data);
		}
	});

	this.attachToDocument?.(session.getDocument());

}


/** @type {import('../components/rosetta/rosetta-types.d').ImplementedClient | null} */
let sharedWorkerInstance = null;


workerSelf.ace?.define("ace/mode/antlr_worker", [
	"require",
	"exports",
	"module",
	"ace/lib/oop",
	"ace/mode/text",
	"ace/worker/worker_client",
	"ace/mode/text_highlight_rules"
],
	/**
	 *
	 * @param {(r: string) => void} require
	 * @param {any} exports
	 * @param {any} module
	 */
	function (require, exports, module)
	{
		"use strict";

		let oop = workerSelf.ace?.require("ace/lib/oop");
		let TextMode = workerSelf.ace?.require("ace/mode/text").Mode;
		WorkerClient = workerSelf.ace?.require("ace/worker/worker_client").WorkerClient;
		let TextHighlightRules = workerSelf.ace?.require("ace/mode/text_highlight_rules").TextHighlightRules;

		oop.inherits(AntlrWorker, WorkerClient);

		/** @param {import('../components/editor/widget.d').AceSession} newSession */
		function switchActiveSession(newSession)
		{
			if(!newSession) return;

			// If the shared worker was terminated or not created yet, recreate it
			if(!sharedWorkerInstance || !sharedWorkerInstance.$worker)
			{
				sharedWorkerInstance = new AntlrWorker(newSession);
			}

			if(!sharedWorkerInstance)
			{
				return;
			}

			// --- CRITICAL FIX 2: Re-bind document listener on the worker ---
			// if(sharedWorkerInstance.activeSession !== newSession)
			{
				// if(sharedWorkerInstance.activeSession)
				{
					//sharedWorkerInstance.detachFromDocument();
				}

				sharedWorkerInstance.attachToDocument?.(newSession.getDocument());
			}

			// const activeSession = workerSelf.activeSessions?.[newSession.workspaceFileId ?? ''];
			const modeId = (newSession?.getMode()
				&& /** @type {any} */ (newSession?.getMode()).$id)
				|| newSession?.$modeId
				|| "";
			const languageKey = modeId.split("/").pop() || "c";
			const fileId = newSession?.workspaceFileId
				?? (newSession?.getDocument()
					&& /** @type {any} */ (newSession?.getDocument()).$fileId)
				?? "temp_buffer." + languageKey;

			newSession.workspaceFileId ??= fileId;

			if(newSession.workspaceFileId && workerSelf.activeSessions)
			{
				workerSelf.activeSessions[newSession.workspaceFileId] = newSession;
			}

			// Notify worker about the new file context
			sharedWorkerInstance.setLanguageTarget?.(fileId);
		}

		let Mode = function ()
		{
			this.HighlightRules = TextHighlightRules;
		};
		oop.inherits(Mode, TextMode);

		(function ()
		{
			/** @param {import('../components/editor/widget.d').AceSession} session */
			this.createWorker = function (session)
			{
				if(!session) return null;

				// Hand off control to the switchActiveSession manager
				switchActiveSession(session);

				return sharedWorkerInstance;
			};

			this.$id = "ace/mode/antlr";
		}).call(Mode.prototype);

		exports.Mode = Mode;
		exports.switchActiveSession = switchActiveSession;
	});



/**
 * Core Gutter Plugin: Man-in-the-middle handler that overrides Ace's
 * internal template string generators to force VS Code style chevrons.
 * @param {import('../components/editor/widget.d').AceSession} session
 * @param {import('../components/rosetta/rosetta-types').BlockRegionsResult} data
 * @returns
 */
function handleWorkerFoldRegions(session, data)
{
	const blocks = data.blocks || [];
	session.antlrDiscoveredFoldBlocks = blocks;

	const renderer = session.$editor.renderer;
	if(!renderer || ! /** @type {any} */ (renderer).$gutterLayer) return;

	// ─── 1. FORCE THE IN-MEMORY ARRAY SYSTEM TO SHIFT STATES ───
	session.foldWidgets = [];
	for(let i = 0; i < session.getLength(); i++)
	{
		const humanRow = i + 1;
		const hasBlockStart = blocks.some(b => b.startLine === humanRow);
		session.foldWidgets[i] = hasBlockStart ? "start" : "";
	}

	// ─── 2. PLUG NATIVE RANGE OVERRIDES FOR CLICK INTERACTIONS ───
	session.getFoldWidget =
		/** @param {number} row */
		function (row)
		{
			return session.foldWidgets[row] || "";
		};

	session.getFoldWidgetRange =
		/** @param {number} row */
		function (row)
		{
			const humanRow = row + 1;
			const aceRange = workerSelf.ace?.require("ace/range").Range;

			// Specificity sort: prioritize the narrowest nested inner rule on multi-block lines
			const targetBlock = (session.antlrDiscoveredFoldBlocks || [])
				.filter(b => b.startLine === humanRow)
				.sort((a, b) => (a.endLine - a.startLine) - (b.endLine - b.startLine))[0];

			if(targetBlock)
			{
				const lineText = session.getLine(row);
				const startColumn = lineText.search(/\S/) !== -1 ? lineText.search(/\S/) : 0;
				return new aceRange(row, startColumn, targetBlock.endLine - 1, session.getLine(targetBlock.endLine - 1).length);
			}
			return null;
		};

}




/**
 *
 * @param {import('../components/editor/widget.d').AceSession} session
 * @param {import('../components/rosetta/rosetta-types.d').HilightResult} responseData
 * @returns
 */
function handleWorkerStreamHighlight(session, responseData)
{
	if(!responseData || !responseData.tokenLinesChunk) return;

	const { tokenLinesChunk, annotationsChunk, startLine, endLine } = responseData;
	const bgTokenizer = session.bgTokenizer;

	// Convert 1-based editor bounds to 0-indexed internal array rows
	const startRow = startLine - 1;
	const endRow = endLine - 1;

	// --- LINEAR BOUNDARY OVERLAY LOOP ---
	// Iterate strictly through the modified block range to prevent skipping slots
	for(let rowIndex = startRow; rowIndex <= endRow; rowIndex++)
	{
		const lineTokens = tokenLinesChunk[rowIndex];

		if(Array.isArray(lineTokens))
		{
			// Ace breaks completely if an array is empty [].
			// If it's a blank line, give it a baseline plain text token type definition.
			if(lineTokens.length === 0)
			{
				bgTokenizer.lines[rowIndex] = [{ type: "text", value: "" }];
			} else
			{
				bgTokenizer.lines[rowIndex] = lineTokens;
			}

			// Invalidate the row's state layout frame explicitly
			bgTokenizer.states[rowIndex] = "start";
			//bgTokenizer.fireUpdateEvent(rowIndex, rowIndex);
		}
		// If lineTokens is completely undefined for this index, we leave Ace's
		// existing background tokenizer cache completely untouched!
	}
	bgTokenizer.fireUpdateEvent(startRow, endRow);

	// 2. Stitch Annotations safely
	if(Array.isArray(annotationsChunk))
	{
		const currentAnnotations = session.getAnnotations() || [];
		const preservedAnnotations = currentAnnotations.filter(ann =>
			ann.row < startRow || ann.row > endRow
		);
		session.setAnnotations([...preservedAnnotations, ...annotationsChunk]);
	}
}




/**
 * Handles incoming background worker annotations
 * @param {import('../components/editor/widget.d').AceSession} session
 * @param {import('../components/rosetta/rosetta-types').ParserEvent[]} e
 */
function handleWorkerAnnotate(session, e)
{
	session.workerAnnotations = e || [];
	workerSelf.compilerDiagnostics?.getBridge().refreshActiveEditorView(session);
}


/** @type {string | null} */
let lastRenderedBoundsKey = "";


/**
 *
 * @param {import('../components/editor/widget.d').AceSession} session
 * @param {({startLine: number, endLine: number})} responseData
 * @returns
 */
function handleWorkerBlockHighlight(session, responseData)
{

	const AceRange = workerSelf.ace?.require("ace/range").Range;

	// If response is invalid or missing numeric boundaries, clear existing marker and reset
	if(
		!responseData ||
		typeof responseData.startLine !== "number" ||
		typeof responseData.endLine !== "number"
	)
	{
		if(workerSelf.currentBlockMarkerId !== null && session)
		{
			session.removeMarker(workerSelf.currentBlockMarkerId);
			workerSelf.currentBlockMarkerId = null;
		}
		lastRenderedBoundsKey = "";
		return;
	}

	const { startLine, endLine } = responseData;
	const boundsKey = `${startLine}:${endLine}`;

	// Target efficiency gate: exit early if line bounds have not changed
	if(boundsKey === lastRenderedBoundsKey)
	{
		return;
	}
	lastRenderedBoundsKey = boundsKey;

	// Clear old marker prior to rendering the new boundary
	if(workerSelf.currentBlockMarkerId !== null)
	{
		session.removeMarker(workerSelf.currentBlockMarkerId);
		workerSelf.currentBlockMarkerId = null;
	}

	// Convert 1-indexed input to Ace 0-indexed rows
	const startRow = Math.max(0, startLine - 1);
	const endRow = Math.max(0, endLine - 1);

	// Columns are set to 0 as "fullLine" expands across the full viewport width
	const highlightRange = new AceRange(startRow, 0, endRow, 0);

	workerSelf.currentBlockMarkerId = session.addMarker(
		highlightRange,
		"ace_active_block_scope_highlight",
		"fullLine"
	);
}

