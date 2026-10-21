// languages-category3-web.js

// =====================================================================
// 1. CORE RUNTIME LIBRARY IMPORT
// =====================================================================
import antlr4 from 'antlr4';

/** @type {Worker & import('./rosetta-types.d').RosettaWorker} */
const workerSelf = /** @type {any} */ (self);

// =====================================================================
// 2. PARSER & LEXER IMPORTS: CATEGORY 3 (WEB & SCRIPTING)
// =====================================================================

import javascript_JavaScriptLexer from '../../../jupyter_ops/Resources/Parsers/javascript/javascript/JavaScriptLexer.js';
import javascript_JavaScriptParser from '../../../jupyter_ops/Resources/Parsers/javascript/javascript/JavaScriptParser.js';
import typescript_TypeScriptLexer from '../../../jupyter_ops/Resources/Parsers/javascript/typescript/TypeScriptLexer.js';
import typescript_TypeScriptParser from '../../../jupyter_ops/Resources/Parsers/javascript/typescript/TypeScriptParser.js';
import html_HTMLLexer from '../../../jupyter_ops/Resources/Parsers/html/HTMLLexer.js';
import html_HTMLParser from '../../../jupyter_ops/Resources/Parsers/html/HTMLParser.js';
import css3_css3Lexer from '../../../jupyter_ops/Resources/Parsers/css3/css3Lexer.js';
import css3_css3Parser from '../../../jupyter_ops/Resources/Parsers/css3/css3Parser.js';
import json_JSONLexer from '../../../jupyter_ops/Resources/Parsers/json/JSONLexer.js';
import json_JSONParser from '../../../jupyter_ops/Resources/Parsers/json/JSONParser.js';
import graphql_GraphQLLexer from '../../../jupyter_ops/Resources/Parsers/graphql/GraphQLLexer.js';
import graphql_GraphQLParser from '../../../jupyter_ops/Resources/Parsers/graphql/GraphQLParser.js';

import python3_Python3Lexer from '../../../jupyter_ops/Resources/Parsers/python/python3/Python3Lexer.js';
import python3_Python3Parser from '../../../jupyter_ops/Resources/Parsers/python/python3/Python3Parser.js';
import python2js_Python2Lexer from '../../../jupyter_ops/Resources/Parsers/python/python2-js/Python2Lexer.js';
import python2js_Python2Parser from '../../../jupyter_ops/Resources/Parsers/python/python2-js/Python2Parser.js';
import bash_BashLexer from '../../../jupyter_ops/Resources/Parsers/bash/BashLexer.js';
import bash_BashParser from '../../../jupyter_ops/Resources/Parsers/bash/BashParser.js';

// =====================================================================
// 3. CONSOLIDATE CATEGORY 3 REGISTRY OBJECT
// =====================================================================
/** @type {({antlr4?: typeof antlr4}) & Record<string, typeof antlr4.Parser | typeof antlr4.Lexer>} */
const AntlrRegistry = {
	"javascript_lexer": javascript_JavaScriptLexer, "javascript_parser": javascript_JavaScriptParser,
	"typescript_lexer": typescript_TypeScriptLexer, "typescript_parser": typescript_TypeScriptParser,
	"html_lexer": html_HTMLLexer, "html_parser": html_HTMLParser,
	"css3_lexer": css3_css3Lexer, "css3_parser": css3_css3Parser,
	"json_lexer": json_JSONLexer, "json_parser": json_JSONParser,
	"graphql_lexer": graphql_GraphQLLexer, "graphql_parser": graphql_GraphQLParser,
	"python3_lexer": python3_Python3Lexer, "python3_parser": python3_Python3Parser,
	"python2js_lexer": python2js_Python2Lexer, "python2js_parser": python2js_Python2Parser,
	"bash_lexer": bash_BashLexer, "bash_parser": bash_BashParser,
};

AntlrRegistry.antlr4 = antlr4;

AntlrRegistry['javascript_JavaScriptParser'] = javascript_JavaScriptParser;
AntlrRegistry['typescript_TypeScriptParser'] = typescript_TypeScriptParser;
AntlrRegistry['python3_Python3Parser'] = python3_Python3Parser;
AntlrRegistry['bash_BashParser'] = bash_BashParser;

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
	javascript_JavaScriptLexer, javascript_JavaScriptParser,
	typescript_TypeScriptLexer, typescript_TypeScriptParser,
	html_HTMLLexer, html_HTMLParser,
	css3_css3Lexer, css3_css3Parser,
	json_JSONLexer, json_JSONParser,
	graphql_GraphQLLexer, graphql_GraphQLParser,
	python3_Python3Lexer, python3_Python3Parser,
	python2js_Python2Lexer, python2js_Python2Parser,
	bash_BashLexer, bash_BashParser,
};

export default AntlrRegistry;
