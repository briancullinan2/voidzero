// languages-category5-systems.js

// =====================================================================
// 1. CORE RUNTIME LIBRARY IMPORT
// =====================================================================
import antlr4 from 'antlr4';

/** @type {Worker & import('./rosetta-types.d').RosettaWorker} */
const workerSelf = /** @type {any} */ (self);

// =====================================================================
// 2. PARSER & LEXER IMPORTS: CATEGORY 5 (SYSTEMS, ASM & COMPILED)
// =====================================================================

import c_CLexer from '../../../jupyter_ops/Resources/Parsers/c/CLexer.js';
import c_CParser from '../../../jupyter_ops/Resources/Parsers/c/CParser.js';
import cpp_CPP14Lexer from '../../../jupyter_ops/Resources/Parsers/cpp/CPP14Lexer.js';
import cpp_CPP14Parser from '../../../jupyter_ops/Resources/Parsers/cpp/CPP14Parser.js';

//import ada2012_AdaLexer from '../../../jupyter_ops/Resources/Parsers/ada/ada2012/AdaLexer.js';
//import ada2012_AdaParser from '../../../jupyter_ops/Resources/Parsers/ada/ada2012/AdaParser.js';
import fortran90_Fortran90Lexer from '../../../jupyter_ops/Resources/Parsers/fortran/fortran90/Fortran90Lexer.js';
import fortran90_Fortran90Parser from '../../../jupyter_ops/Resources/Parsers/fortran/fortran90/Fortran90Parser.js';

import wat_WatLexer from '../../../jupyter_ops/Resources/Parsers/wat/WatLexer.js';
import wat_WatParser from '../../../jupyter_ops/Resources/Parsers/wat/WatParser.js';
import asmMASM_asmMASMLexer from '../../../jupyter_ops/Resources/Parsers/asm/asmMASM/asmMASMLexer.js';
import asmMASM_asmMASMParser from '../../../jupyter_ops/Resources/Parsers/asm/asmMASM/asmMASMParser.js';
import asm6502_asm6502Lexer from '../../../jupyter_ops/Resources/Parsers/asm/asm6502/asm6502Lexer.js';
import asm6502_asm6502Parser from '../../../jupyter_ops/Resources/Parsers/asm/asm6502/asm6502Parser.js';
import asm8080_asm8080Lexer from '../../../jupyter_ops/Resources/Parsers/asm/asm8080/asm8080Lexer.js';
import asm8080_asm8080Parser from '../../../jupyter_ops/Resources/Parsers/asm/asm8080/asm8080Parser.js';
import asm8086_asm8086Lexer from '../../../jupyter_ops/Resources/Parsers/asm/asm8086/asm8086Lexer.js';
import asm8086_asm8086Parser from '../../../jupyter_ops/Resources/Parsers/asm/asm8086/asm8086Parser.js';
import asmZ80_asmZ80Lexer from '../../../jupyter_ops/Resources/Parsers/asm/asmZ80/asmZ80Lexer.js';
import asmZ80_asmZ80Parser from '../../../jupyter_ops/Resources/Parsers/asm/asmZ80/asmZ80Parser.js';
import pdp7_pdp7Lexer from '../../../jupyter_ops/Resources/Parsers/asm/pdp7/pdp7Lexer.js';
import pdp7_pdp7Parser from '../../../jupyter_ops/Resources/Parsers/asm/pdp7/pdp7Parser.js';

// =====================================================================
// 3. CONSOLIDATE CATEGORY 5 REGISTRY OBJECT
// =====================================================================
/** @type {({antlr4?: typeof antlr4}) & Record<string, typeof antlr4.Parser | typeof antlr4.Lexer>} */
const AntlrRegistry = {
	"c_lexer": c_CLexer, "c_parser": c_CParser,
	"cpp_lexer": cpp_CPP14Lexer, "cpp_parser": cpp_CPP14Parser,
	//"ada_lexer": ada2012_AdaLexer, "ada_parser": ada2012_AdaParser,
	"fortran_lexer": fortran90_Fortran90Lexer, "fortran_parser": fortran90_Fortran90Parser,
	"wat_lexer": wat_WatLexer, "wat_parser": wat_WatParser,
	"asm_lexer": asmMASM_asmMASMLexer, "asm_parser": asmMASM_asmMASMParser,
	"asm6502_lexer": asm6502_asm6502Lexer, "asm6502_parser": asm6502_asm6502Parser,
	"asm8080_lexer": asm8080_asm8080Lexer, "asm8080_parser": asm8080_asm8080Parser,
	"asm8086_lexer": asm8086_asm8086Lexer, "asm8086_parser": asm8086_asm8086Parser,
	"asmz80_lexer": asmZ80_asmZ80Lexer, "asmz80_parser": asmZ80_asmZ80Parser,
	"pdp7_lexer": pdp7_pdp7Lexer, "pdp7_parser": pdp7_pdp7Parser,
};

AntlrRegistry.antlr4 = antlr4;

AntlrRegistry['c_CParser'] = c_CParser;
AntlrRegistry['cpp_CPP14Parser'] = cpp_CPP14Parser;

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
	c_CLexer, c_CParser,
	cpp_CPP14Lexer, cpp_CPP14Parser,
	//ada2012_AdaLexer, ada2012_AdaParser,
	fortran90_Fortran90Lexer, fortran90_Fortran90Parser,
	wat_WatLexer, wat_WatParser,
	asmMASM_asmMASMLexer, asmMASM_asmMASMParser,
	asm6502_asm6502Lexer, asm6502_asm6502Parser,
	asm8080_asm8080Lexer, asm8080_asm8080Parser,
	asm8086_asm8086Lexer, asm8086_asm8086Parser,
	asmZ80_asmZ80Lexer, asmZ80_asmZ80Parser,
	pdp7_pdp7Lexer, pdp7_pdp7Parser,
};

export default AntlrRegistry;
