// languages-category7-regex.js

// =====================================================================
// 1. CORE RUNTIME LIBRARY IMPORT
// =====================================================================
import antlr4 from 'antlr4';

/** @type {Worker & import('./rosetta-types.d').RosettaWorker} */
const workerSelf = /** @type {any} */ (self);

// =====================================================================
// 2. PARSER & LEXER IMPORTS: CATEGORY 7 (REGEX & FORMAL SPECS)
// =====================================================================

import creole_CreoleLexer from '../../../jupyter_ops/Resources/Parsers/creole/creoleLexer.js';
import creole_CreoleParser from '../../../jupyter_ops/Resources/Parsers/creole/creoleParser.js';
import pcre_PCRELexer from '../../../jupyter_ops/Resources/Parsers/pcre/PCRELexer.js';
import pcre_PCREParser from '../../../jupyter_ops/Resources/Parsers/pcre/PCREParser.js';
import xsdregex_regexLexer from '../../../jupyter_ops/Resources/Parsers/xsd-regex/regexLexer.js';
import xsdregex_regexParser from '../../../jupyter_ops/Resources/Parsers/xsd-regex/regexParser.js';
import webidl_WebIDLLexer from '../../../jupyter_ops/Resources/Parsers/webidl/WebIDLLexer.js';
import webidl_WebIDLParser from '../../../jupyter_ops/Resources/Parsers/webidl/WebIDLParser.js';
import antlr4v4_ANTLRv4Lexer from '../../../jupyter_ops/Resources/Parsers/antlr/antlr4/ANTLRv4Lexer.js';
import antlr4v4_ANTLRv4Parser from '../../../jupyter_ops/Resources/Parsers/antlr/antlr4/ANTLRv4Parser.js';

// =====================================================================
// 3. CONSOLIDATE CATEGORY 7 REGISTRY OBJECT
// =====================================================================
/** @type {({antlr4?: typeof antlr4}) & Record<string, typeof antlr4.Parser | typeof antlr4.Lexer>} */
const AntlrRegistry = {
	"pcre_lexer": pcre_PCRELexer, "pcre_parser": pcre_PCREParser,
	"xsdregex_lexer": xsdregex_regexLexer, "xsdregex_parser": xsdregex_regexParser,
	"webidl_lexer": webidl_WebIDLLexer, "webidl_parser": webidl_WebIDLParser,
	"antlr_lexer": antlr4v4_ANTLRv4Lexer, "antlr_parser": antlr4v4_ANTLRv4Parser,
	"creole_lexer": creole_CreoleLexer, "creole_parser": creole_CreoleParser,
};

AntlrRegistry.antlr4 = antlr4;

// Safety Valves & Backward Compatibility Aliases
AntlrRegistry['creole_CreoleParser'] = creole_CreoleParser;
AntlrRegistry['pcre_PCREParser'] = pcre_PCREParser;
AntlrRegistry['xsdregex_regexParser'] = xsdregex_regexParser;
AntlrRegistry['webidl_WebIDLParser'] = webidl_WebIDLParser;

// =====================================================================
// 4. BIND IMMEDIATELY TO THE WEB WORKER EXECUTION CONTEXT
// =====================================================================
if(typeof self !== 'undefined')
{
	workerSelf.AntlrRegistry = Object.assign(workerSelf.AntlrRegistry || {}, AntlrRegistry);
	workerSelf.AntlrLanguages = workerSelf.AntlrRegistry;
}

// =====================================================================
// 5. EXPORT HOOK MATRIX
// =====================================================================
export
{
	antlr4,
	AntlrRegistry,

	pcre_PCRELexer, pcre_PCREParser,
	xsdregex_regexLexer, xsdregex_regexParser,
	webidl_WebIDLLexer, webidl_WebIDLParser,
};

export default AntlrRegistry;
