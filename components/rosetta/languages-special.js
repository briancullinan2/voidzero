// languages-category-cool-additions.js

// =====================================================================
// 1. CORE RUNTIME LIBRARY IMPORT
// =====================================================================
import antlr4 from 'antlr4';

/** @type {Worker & import('./rosetta-types.d').RosettaWorker} */
const workerSelf = /** @type {any} */ (self);

// =====================================================================
// 2. PARSER & LEXER IMPORTS: COOL & SPECIALIZED ADDITIONS
// =====================================================================

import haskell_HaskellLexer from '../../../jupyter_ops/Resources/Parsers/haskell/HaskellLexer.js';
import haskell_HaskellParser from '../../../jupyter_ops/Resources/Parsers/haskell/HaskellParser.js';
import lua_LuaLexer from '../../../jupyter_ops/Resources/Parsers/lua/LuaLexer.js';
import lua_LuaParser from '../../../jupyter_ops/Resources/Parsers/lua/LuaParser.js';
import elixir_ElixirLexer from '../../../jupyter_ops/Resources/Parsers/elixir/ElixirLexer.js';
import elixir_ElixirParser from '../../../jupyter_ops/Resources/Parsers/elixir/ElixirParser.js';
import solidity_SolidityLexer from '../../../jupyter_ops/Resources/Parsers/solidity/SolidityLexer.js';
import solidity_SolidityParser from '../../../jupyter_ops/Resources/Parsers/solidity/SolidityParser.js';
import lisp_LispLexer from '../../../jupyter_ops/Resources/Parsers/lisp/lispLexer.js';
import lisp_LispParser from '../../../jupyter_ops/Resources/Parsers/lisp/lispParser.js';
import prolog_prologLexer from '../../../jupyter_ops/Resources/Parsers/prolog/prologLexer.js';
import prolog_prologParser from '../../../jupyter_ops/Resources/Parsers/prolog/prologParser.js';

// =====================================================================
// 3. CONSOLIDATE REGISTRY OBJECT
// =====================================================================
/ @type {({antlr4?: typeof antlr4}) & Record<string, typeof antlr4.Parser | typeof antlr4.Lexer>} */;
const AntlrRegistry = {
	"haskell_lexer": haskell_HaskellLexer, "haskell_parser": haskell_HaskellParser,
	"lua_lexer": lua_LuaLexer, "lua_parser": lua_LuaParser,
	"elixir_lexer": elixir_ElixirLexer, "elixir_parser": elixir_ElixirParser,
	"solidity_lexer": solidity_SolidityLexer, "solidity_parser": solidity_SolidityParser,
	"lisp_lexer": lisp_LispLexer, "lisp_parser": lisp_LispParser,
	"prolog_lexer": prolog_prologLexer, "prolog_parser": prolog_prologParser,
};

AntlrRegistry.antlr4 = antlr4;

// AntlrRegistry['python3_Python3Parser'] = python3_Python3Parser;
AntlrRegistry['haskell_HaskellParser'] = haskell_HaskellParser;
AntlrRegistry['lua_LuaParser'] = lua_LuaParser;
AntlrRegistry['elixir_ElixirParser'] = elixir_ElixirParser;
AntlrRegistry['solidity_SolidityParser'] = solidity_SolidityParser;

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
	haskell_HaskellLexer, haskell_HaskellParser,
	lua_LuaLexer, lua_LuaParser,
	elixir_ElixirLexer, elixir_ElixirParser,
	solidity_SolidityLexer, solidity_SolidityParser,
	lisp_LispLexer, lisp_LispParser,
	prolog_prologLexer, prolog_prologParser
};

export default AntlrRegistry;
