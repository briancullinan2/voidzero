// languages-category6-databases.js

// =====================================================================
// 1. CORE RUNTIME LIBRARY IMPORT
// =====================================================================
import antlr4 from 'antlr4';

/** @type {Worker & import('./rosetta-types.d').RosettaWorker} */
const workerSelf = /** @type {any} */ (self);

// =====================================================================
// 2. PARSER & LEXER IMPORTS: CATEGORY 6 (DATABASES & SQL)
// =====================================================================

import postgresql_PostgreSQLLexer from '../../../jupyter_ops/Resources/Parsers/sql/postgresql/PostgreSQLLexer.js';
import postgresql_PostgreSQLParser from '../../../jupyter_ops/Resources/Parsers/sql/postgresql/PostgreSQLParser.js';
import sqlite_SQLiteLexer from '../../../jupyter_ops/Resources/Parsers/sql/sqlite/SQLiteLexer.js';
import sqlite_SQLiteParser from '../../../jupyter_ops/Resources/Parsers/sql/sqlite/SQLiteParser.js';
// import plsql_PlSqlLexer from '../../../jupyter_ops/Resources/Parsers/sql/plsql/PlSqlLexer.js';
// import plsql_PlSqlParser from '../../../jupyter_ops/Resources/Parsers/sql/plsql/PlSqlParser.js';
import tsql_TSqlLexer from '../../../jupyter_ops/Resources/Parsers/sql/tsql/TSqlLexer.js';
import tsql_TSqlParser from '../../../jupyter_ops/Resources/Parsers/sql/tsql/TSqlParser.js';
import mysql_MySQLLexer from '../../../jupyter_ops/Resources/Parsers/sql/mysql/Oracle/MySQLLexer.js';
import mysql_MySQLParser from '../../../jupyter_ops/Resources/Parsers/sql/mysql/Oracle/MySQLParser.js';
// import promql_PromQLLexer from '../../../jupyter_ops/Resources/Parsers/promql/PromQLLexer.js';
// import promql_PromQLParser from '../../../jupyter_ops/Resources/Parsers/promql/PromQLParser.js';

// =====================================================================
// 3. CONSOLIDATE CATEGORY 6 REGISTRY OBJECT
// =====================================================================
/** @type {({antlr4?: typeof antlr4}) & Record<string, typeof antlr4.Parser | typeof antlr4.Lexer>} */
const AntlrRegistry = {
	"postgresql_lexer": postgresql_PostgreSQLLexer, "postgresql_parser": postgresql_PostgreSQLParser,
	"sqlite_lexer": sqlite_SQLiteLexer, "sqlite_parser": sqlite_SQLiteParser,
	// "plsql_lexer": plsql_PlSqlLexer, "plsql_parser": plsql_PlSqlParser,
	"tsql_lexer": tsql_TSqlLexer, "tsql_parser": tsql_TSqlParser,
	"mysql_lexer": mysql_MySQLLexer, "mysql_parser": mysql_MySQLParser,
	// "promql_lexer": promql_PromQLLexer, "promql_parser": promql_PromQLParser,
};

AntlrRegistry.antlr4 = antlr4;

AntlrRegistry['postgresql_PostgreSQLParser'] = postgresql_PostgreSQLParser;
AntlrRegistry['sqlite_SQLiteParser'] = sqlite_SQLiteParser;
// AntlrRegistry['plsql_PlSqlParser'] = plsql_PlSqlParser;
// AntlrRegistry['tsql_TSqlParser'] = tsql_TSqlParser;
AntlrRegistry['mysql_MySQLParser'] = mysql_MySQLParser;

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
	postgresql_PostgreSQLLexer, postgresql_PostgreSQLParser,
	sqlite_SQLiteLexer, sqlite_SQLiteParser,
	// plsql_PlSqlLexer, plsql_PlSqlParser,
	tsql_TSqlLexer, tsql_TSqlParser,
	mysql_MySQLLexer, mysql_MySQLParser,
	// promql_PromQLLexer, promql_PromQLParser,
};

export default AntlrRegistry;
