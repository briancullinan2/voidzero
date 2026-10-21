// languages-category6-quake.js

// =====================================================================
// 1. CORE RUNTIME LIBRARY IMPORT
// =====================================================================
import antlr4 from 'antlr4';

/** @type {Worker & import('./rosetta-types.d').RosettaWorker} */
const workerSelf = /** @type {any} */ (self);

// =====================================================================
// 2. PARSER & LEXER IMPORTS: CATEGORY 6 (QUAKE & ENGINE ASSETS)
// =====================================================================

import quakemap_quakemapLexer from '../../../jupyter_ops/Resources/Parsers/quakemap/quakemapLexer.js';
import quakemap_quakemapParser from '../../../jupyter_ops/Resources/Parsers/quakemap/quakemapParser.js';
import quake3_Q3ArenaLexer from '../../../jupyter_ops/Resources/Parsers/quake3/arena/Q3ArenaLexer.js';
import quake3_Q3ArenaParser from '../../../jupyter_ops/Resources/Parsers/quake3/arena/Q3ArenaParser.js';
import quake3_Q3CameraLexer from '../../../jupyter_ops/Resources/Parsers/quake3/camera/Q3CameraLexer.js';
import quake3_Q3CameraParser from '../../../jupyter_ops/Resources/Parsers/quake3/camera/Q3CameraParser.js';
import quake3_Q3ConfigLexer from '../../../jupyter_ops/Resources/Parsers/quake3/config/Q3ConfigLexer.js';
import quake3_Q3ConfigParser from '../../../jupyter_ops/Resources/Parsers/quake3/config/Q3ConfigParser.js';
import quake3_Q3MapLexer from '../../../jupyter_ops/Resources/Parsers/quake3/map/Q3MapLexer.js';
import quake3_Q3MapParser from '../../../jupyter_ops/Resources/Parsers/quake3/map/Q3MapParser.js';
import quake3_Q3MenuLexer from '../../../jupyter_ops/Resources/Parsers/quake3/menu/Q3MenuLexer.js';
import quake3_Q3MenuParser from '../../../jupyter_ops/Resources/Parsers/quake3/menu/Q3MenuParser.js';
import quake3_Q3ShaderLexer from '../../../jupyter_ops/Resources/Parsers/quake3/shader/Q3ShaderLexer.js';
import quake3_Q3ShaderParser from '../../../jupyter_ops/Resources/Parsers/quake3/shader/Q3ShaderParser.js';
import quake3_Q3SkinLexer from '../../../jupyter_ops/Resources/Parsers/quake3/skin/Q3SkinLexer.js';
import quake3_Q3SkinParser from '../../../jupyter_ops/Resources/Parsers/quake3/skin/Q3SkinParser.js';

// =====================================================================
// 3. CONSOLIDATE CATEGORY 6 REGISTRY OBJECT
// =====================================================================
/** @type {({antlr4?: typeof antlr4}) & Record<string, typeof antlr4.Parser | typeof antlr4.Lexer>} */
const AntlrRegistry = {
	"quakemap_lexer": quakemap_quakemapLexer, "quakemap_parser": quakemap_quakemapParser,
	"q3arena_lexer": quake3_Q3ArenaLexer, "q3arena_parser": quake3_Q3ArenaParser,
	"q3camera_lexer": quake3_Q3CameraLexer, "q3camera_parser": quake3_Q3CameraParser,
	"q3config_lexer": quake3_Q3ConfigLexer, "q3config_parser": quake3_Q3ConfigParser,
	"q3map_lexer": quake3_Q3MapLexer, "q3map_parser": quake3_Q3MapParser,
	"q3menu_lexer": quake3_Q3MenuLexer, "q3menu_parser": quake3_Q3MenuParser,
	"q3shader_lexer": quake3_Q3ShaderLexer, "q3shader_parser": quake3_Q3ShaderParser,
	"q3skin_lexer": quake3_Q3SkinLexer, "q3skin_parser": quake3_Q3SkinParser,
};

AntlrRegistry.antlr4 = antlr4;

// Quake 3 Structural Compatibility Safety Valves & Aliases
AntlrRegistry['quake3_Q3ArenaLexer'] = quake3_Q3ArenaLexer;
AntlrRegistry['quake3_Q3ArenaParser'] = quake3_Q3ArenaParser;
AntlrRegistry['quake3_Q3CameraLexer'] = quake3_Q3CameraLexer;
AntlrRegistry['quake3_Q3CameraParser'] = quake3_Q3CameraParser;
AntlrRegistry['quake3_Q3ConfigLexer'] = quake3_Q3ConfigLexer;
AntlrRegistry['quake3_Q3ConfigParser'] = quake3_Q3ConfigParser;
AntlrRegistry['quake3_Q3MapLexer'] = quake3_Q3MapLexer;
AntlrRegistry['quake3_Q3MapParser'] = quake3_Q3MapParser;
AntlrRegistry['quake3_Q3MenuLexer'] = quake3_Q3MenuLexer;
AntlrRegistry['quake3_Q3MenuParser'] = quake3_Q3MenuParser;
AntlrRegistry['quake3_Q3ShaderLexer'] = quake3_Q3ShaderLexer;
AntlrRegistry['quake3_Q3ShaderParser'] = quake3_Q3ShaderParser;
AntlrRegistry['quake3_Q3SkinLexer'] = quake3_Q3SkinLexer;
AntlrRegistry['quake3_Q3SkinParser'] = quake3_Q3SkinParser;

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

	quakemap_quakemapLexer, quakemap_quakemapParser,
	quake3_Q3ArenaLexer, quake3_Q3ArenaParser,
	quake3_Q3CameraLexer, quake3_Q3CameraParser,
	quake3_Q3ConfigLexer, quake3_Q3ConfigParser,
	quake3_Q3MapLexer, quake3_Q3MapParser,
	quake3_Q3MenuLexer, quake3_Q3MenuParser,
	quake3_Q3ShaderLexer, quake3_Q3ShaderParser,
	quake3_Q3SkinLexer, quake3_Q3SkinParser,
};

export default AntlrRegistry;
