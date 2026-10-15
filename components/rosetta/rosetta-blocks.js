// @ts-check


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



function extractCurrentBlock(codeStr, lineNumber, langId)
{
	const lines = codeStr.split('\n');
	const totalLines = lines.length;

	const rules = ROSETTA_BLOCK_ASSOCIATIONS[langId] || { open: null, close: "{}", isKeywordClose: false };
	if(!rules.open)
	{
		return { text: codeStr, startLine: 1, endLine: totalLines, startIndex: 0, endIndex: codeStr.length };
	}

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

		if(!rules.isKeywordClose)
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
		} else
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



/**
 * Agnostic ANTLR Visitor that dynamically captures multi-line code blocks
 * across any grammar based on universal rule structural names.
 */
class AntlrBlockCollectorVisitor
{
	constructor(parser)
	{
		this.parser = parser;
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
	 */
	collect(tree)
	{
		if(!tree) return this.blocks;
		this.visit(tree);
		return this.blocks;
	}

	/**
	 * Recursive structural tree walker node pass
	 */
	visit(ctx)
	{
		if(!ctx) return;

		if(ctx.ruleIndex !== undefined)
		{
			const rawRuleName = this.parser.ruleNames[ctx.ruleIndex];
			const lowerRuleName = rawRuleName ? rawRuleName.toLowerCase() : "";

			// If the current node represents a multi-line structural container boundary
			if(this.blockRuleIdentifiers.has(lowerRuleName) && ctx.start && ctx.stop)
			{
				const startToken = ctx.start;
				const endToken = ctx.stop;

				const startLine = startToken.line;
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
		if(ctx.children && ctx.children.length > 0)
		{
			for(let i = 0; i < ctx.children.length; i++)
			{
				this.visit(ctx.children[i]);
			}
		}
	}
}
