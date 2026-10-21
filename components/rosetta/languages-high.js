// languages-category4-enterprise.js

// =====================================================================
// 1. CORE RUNTIME LIBRARY IMPORT
// =====================================================================
import antlr4 from 'antlr4';

/** @type {Worker & import('./rosetta-types.d').RosettaWorker} */
const workerSelf = /** @type {any} */ (self);

// =====================================================================
// 2. PARSER & LEXER IMPORTS: CATEGORY 4 (ENTERPRISE & MANAGED)
// =====================================================================

import php_PhpLexer from '../../../jupyter_ops/Resources/Parsers/php/PhpLexer.js';
import php_PhpParser from '../../../jupyter_ops/Resources/Parsers/php/PhpParser.js';
import csharp_CSharpLexer from '../../../jupyter_ops/Resources/Parsers/csharp/CSharpLexer.js';
import csharp_CSharpParser from '../../../jupyter_ops/Resources/Parsers/csharp/CSharpParser.js';
import golang_GoLexer from '../../../jupyter_ops/Resources/Parsers/golang/GoLexer.js';
import golang_GoParser from '../../../jupyter_ops/Resources/Parsers/golang/GoParser.js';
import rust_RustLexer from '../../../jupyter_ops/Resources/Parsers/rust/RustLexer.js';
import rust_RustParser from '../../../jupyter_ops/Resources/Parsers/rust/RustParser.js';

import java8_Java8Lexer from '../../../jupyter_ops/Resources/Parsers/java/java8/Java8Lexer.js';
import java8_Java8Parser from '../../../jupyter_ops/Resources/Parsers/java/java8/Java8Parser.js';
import java9_Java9Lexer from '../../../jupyter_ops/Resources/Parsers/java/java9/Java9Lexer.js';
import java9_Java9Parser from '../../../jupyter_ops/Resources/Parsers/java/java9/Java9Parser.js';
import scala3_Scala3Lexer from '../../../jupyter_ops/Resources/Parsers/scala/scala3/Scala3Lexer.js';
import scala3_Scala3Parser from '../../../jupyter_ops/Resources/Parsers/scala/scala3/Scala3Parser.js';
import kotlin_KotlinLexer from '../../../jupyter_ops/Resources/Parsers/kotlin/kotlin/KotlinLexer.js';
import kotlin_KotlinParser from '../../../jupyter_ops/Resources/Parsers/kotlin/kotlin/KotlinParser.js';
import swift_SwiftLexer from '../../../jupyter_ops/Resources/Parsers/swift/swift5/Swift5Lexer.js'; // if present or general standard
import swift_SwiftParser from '../../../jupyter_ops/Resources/Parsers/swift/swift5/Swift5Parser.js';

// =====================================================================
// 3. CONSOLIDATE CATEGORY 4 REGISTRY OBJECT
// =====================================================================
/** @type {({antlr4?: typeof antlr4}) & Record<string, typeof antlr4.Parser | typeof antlr4.Lexer>} */
const AntlrRegistry = {
	"php_lexer": php_PhpLexer, "php_parser": php_PhpParser,
	"csharp_lexer": csharp_CSharpLexer, "csharp_parser": csharp_CSharpParser,
	"golang_lexer": golang_GoLexer, "golang_parser": golang_GoParser,
	"rust_lexer": rust_RustLexer, "rust_parser": rust_RustParser,
	"java8_lexer": java8_Java8Lexer, "java8_parser": java8_Java8Parser,
	"java9_lexer": java9_Java9Lexer, "java9_parser": java9_Java9Parser,
	"scala3_lexer": scala3_Scala3Lexer, "scala3_parser": scala3_Scala3Parser,
	"kotlin_lexer": kotlin_KotlinLexer, "kotlin_parser": kotlin_KotlinParser,
	"swift_lexer": swift_SwiftLexer, "swift_parser": swift_SwiftParser
};

AntlrRegistry.antlr4 = antlr4;

AntlrRegistry['csharp_CSharpParser'] = csharp_CSharpParser;
AntlrRegistry['golang_GoParser'] = golang_GoParser;
AntlrRegistry['rust_RustParser'] = rust_RustParser;

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
	php_PhpLexer, php_PhpParser,
	csharp_CSharpLexer, csharp_CSharpParser,
	golang_GoLexer, golang_GoParser,
	rust_RustLexer, rust_RustParser,
	java8_Java8Lexer, java8_Java8Parser,
	java9_Java9Lexer, java9_Java9Parser,
	scala3_Scala3Lexer, scala3_Scala3Parser,
	kotlin_KotlinLexer, kotlin_KotlinParser,
	swift_SwiftLexer, swift_SwiftParser,
};

export default AntlrRegistry;
