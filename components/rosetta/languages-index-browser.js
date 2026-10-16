// languages-index-browser.js

// =====================================================================
// 1. CORE RUNTIME LIBRARY IMPORT
// =====================================================================
import antlr4 from 'antlr4';

// =====================================================================
// 2. PARSER & LEXER SPECIFIC IMPORTS (50-LANGUAGE PIPELINE)
// =====================================================================

// C / C++ Engine & System Architecture (4)
import c_CLexer from '../../../jupyter_ops/Resources/Parsers/c/CLexer.js';
import c_CParser from '../../../jupyter_ops/Resources/Parsers/c/CParser.js';
import cpp_CPP14Lexer from '../../../jupyter_ops/Resources/Parsers/cpp/CPP14Lexer.js';
import cpp_CPP14Parser from '../../../jupyter_ops/Resources/Parsers/cpp/CPP14Parser.js';

// Gameplay & Engine Scripting Systems (2)
import angelscript_Lexer from '../../../jupyter_ops/Resources/Parsers/angelscript/angelscriptLexer.js';
import angelscript_Parser from '../../../jupyter_ops/Resources/Parsers/angelscript/angelscriptParser.js';
import lua_LuaLexer from '../../../jupyter_ops/Resources/Parsers/lua/LuaLexer.js';
import lua_LuaParser from '../../../jupyter_ops/Resources/Parsers/lua/LuaParser.js';

// Lower-Level Targeting Matrix & Low-Level Hardware Architectures (7)
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


// Web System Engineering Layer & Text Specs (6)
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

// Server-Side Systems Architecture (4)
import php_PhpLexer from '../../../jupyter_ops/Resources/Parsers/php/PhpLexer.js';
import php_PhpParser from '../../../jupyter_ops/Resources/Parsers/php/PhpParser.js';
import csharp_CSharpLexer from '../../../jupyter_ops/Resources/Parsers/csharp/CSharpLexer.js';
import csharp_CSharpParser from '../../../jupyter_ops/Resources/Parsers/csharp/CSharpParser.js';
import golang_GoLexer from '../../../jupyter_ops/Resources/Parsers/golang/GoLexer.js';
import golang_GoParser from '../../../jupyter_ops/Resources/Parsers/golang/GoParser.js';
import rust_RustLexer from '../../../jupyter_ops/Resources/Parsers/rust/RustLexer.js';
import rust_RustParser from '../../../jupyter_ops/Resources/Parsers/rust/RustParser.js';

// Java Virtual Machine Trackers (3)
//import java_JavaLexer from '../../../jupyter_ops/Resources/Parsers/java/java/JavaLexer.js';
//import java_JavaParser from '../../../jupyter_ops/Resources/Parsers/java/java/JavaParser.js';
import java8_Java8Lexer from '../../../jupyter_ops/Resources/Parsers/java/java8/Java8Lexer.js';
import java8_Java8Parser from '../../../jupyter_ops/Resources/Parsers/java/java8/Java8Parser.js';
import java9_Java9Lexer from '../../../jupyter_ops/Resources/Parsers/java/java9/Java9Lexer.js';
import java9_Java9Parser from '../../../jupyter_ops/Resources/Parsers/java/java9/Java9Parser.js';

// Python Runtimes (2)
// Using standard Python3 grammars for foundational parsing stability
import python3_Python3Lexer from '../../../jupyter_ops/Resources/Parsers/python/python3/Python3Lexer.js';
import python3_Python3Parser from '../../../jupyter_ops/Resources/Parsers/python/python3/Python3Parser.js';
import python2js_Python2Lexer from '../../../jupyter_ops/Resources/Parsers/python/python2-js/Python2Lexer.js';
import python2js_Python2Parser from '../../../jupyter_ops/Resources/Parsers/python/python2-js/Python2Parser.js';

// Relational Databases & Dialect Layers (5)
import postgresql_PostgreSQLLexer from '../../../jupyter_ops/Resources/Parsers/sql/postgresql/PostgreSQLLexer.js';
import postgresql_PostgreSQLParser from '../../../jupyter_ops/Resources/Parsers/sql/postgresql/PostgreSQLParser.js';
import sqlite_SQLiteLexer from '../../../jupyter_ops/Resources/Parsers/sql/sqlite/SQLiteLexer.js';
import sqlite_SQLiteParser from '../../../jupyter_ops/Resources/Parsers/sql/sqlite/SQLiteParser.js';
import plsql_PlSqlLexer from '../../../jupyter_ops/Resources/Parsers/sql/plsql/PlSqlLexer.js';
import plsql_PlSqlParser from '../../../jupyter_ops/Resources/Parsers/sql/plsql/PlSqlParser.js';
import tsql_TSqlLexer from '../../../jupyter_ops/Resources/Parsers/sql/tsql/TSqlLexer.js';
import tsql_TSqlParser from '../../../jupyter_ops/Resources/Parsers/sql/tsql/TSqlParser.js';
import mysql_MySQLLexer from '../../../jupyter_ops/Resources/Parsers/sql/mysql/Oracle/MySQLLexer.js';
import mysql_MySQLParser from '../../../jupyter_ops/Resources/Parsers/sql/mysql/Oracle/MySQLParser.js';

// DevOps Infrastructure, Markup Languages & Structured Data (16)
import creole_CreoleLexer from '../../../jupyter_ops/Resources/Parsers/creole/creoleLexer.js';
import creole_CreoleParser from '../../../jupyter_ops/Resources/Parsers/creole/creoleParser.js';
import makefile_MakefileLexer from '../../../jupyter_ops/Resources/Parsers/make/MakefileLexer.js';
import makefile_MakefileParser from '../../../jupyter_ops/Resources/Parsers/make/MakefileParser.js';
import cmake_CMakeLexer from '../../../jupyter_ops/Resources/Parsers/cmake/CMakeLexer.js';
import cmake_CMakeParser from '../../../jupyter_ops/Resources/Parsers/cmake/CMakeParser.js';
import protobuf3_Protobuf3Lexer from '../../../jupyter_ops/Resources/Parsers/protobuf3/Protobuf3Lexer.js';
import protobuf3_Protobuf3Parser from '../../../jupyter_ops/Resources/Parsers/protobuf3/Protobuf3Parser.js';
import toml_tomlLexer from '../../../jupyter_ops/Resources/Parsers/toml/tomlLexer.js';
import toml_tomlParser from '../../../jupyter_ops/Resources/Parsers/toml/tomlParser.js';
import xml_XMLLexer from '../../../jupyter_ops/Resources/Parsers/xml/XMLLexer.js';
import xml_XMLParser from '../../../jupyter_ops/Resources/Parsers/xml/XMLParser.js';
import csv_CSVLexer from '../../../jupyter_ops/Resources/Parsers/csv/CSVLexer.js';
import csv_CSVParser from '../../../jupyter_ops/Resources/Parsers/csv/CSVParser.js';
import properties_propertiesLexer from '../../../jupyter_ops/Resources/Parsers/properties/propertiesLexer.js';
import properties_propertiesParser from '../../../jupyter_ops/Resources/Parsers/properties/propertiesParser.js';
import terraform_terraformLexer from '../../../jupyter_ops/Resources/Parsers/terraform/terraformLexer.js';
import terraform_terraformParser from '../../../jupyter_ops/Resources/Parsers/terraform/terraformParser.js';
//import yaml_YamlLexer from '../../../jupyter_ops/Resources/Parsers/yaml/YamlLexer.js';
//import yaml_YamlParser from '../../../jupyter_ops/Resources/Parsers/yaml/YamlParser.js';


// Quake Dedicated Asset Layouts (7 Modules Total)
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
// 3. CONSOLIDATE THE CORE REGISTRY OBJECT (MATCHES WORKER DYNAMIC RESOLUTION)
// =====================================================================
/** @type {({antlr4: typeof antlr4}) & Record<string, typeof antlr4.Parser | typeof antlr4.Lexer>} */
const AntlrRegistry = {
	antlr4: antlr4,

	// Explicit Lowercase Flat Index Matrix
	"c_lexer": c_CLexer, "c_parser": c_CParser,
	"cpp_lexer": cpp_CPP14Lexer, "cpp_parser": cpp_CPP14Parser,
	"angelscript_lexer": angelscript_Lexer, "angelscript_parser": angelscript_Parser,
	"lua_lexer": lua_LuaLexer, "lua_parser": lua_LuaParser,
	"wat_lexer": wat_WatLexer, "wat_parser": wat_WatParser,
	"asm_lexer": asmMASM_asmMASMLexer, "asm_parser": asmMASM_asmMASMParser,
	"asm6502_lexer": asm6502_asm6502Lexer, "asm6502_parser": asm6502_asm6502Parser,
	"asm8080_lexer": asm8080_asm8080Lexer, "asm8080_parser": asm8080_asm8080Parser,
	"asm8086_lexer": asm8086_asm8086Lexer, "asm8086_parser": asm8086_asm8086Parser,
	"asmz80_lexer": asmZ80_asmZ80Lexer, "asmz80_parser": asmZ80_asmZ80Parser,
	"pdp7_lexer": pdp7_pdp7Lexer, "pdp7_parser": pdp7_pdp7Parser,
	"creole_lexer": creole_CreoleLexer, "creole_parser": creole_CreoleParser,
	"makefile_lexer": makefile_MakefileLexer, "makefile_parser": makefile_MakefileParser,

	"javascript_lexer": javascript_JavaScriptLexer, "javascript_parser": javascript_JavaScriptParser,
	"typescript_lexer": typescript_TypeScriptLexer, "typescript_parser": typescript_TypeScriptParser,
	"html_lexer": html_HTMLLexer, "html_parser": html_HTMLParser,
	"css3_lexer": css3_css3Lexer, "css3_parser": css3_css3Parser,
	"json_lexer": json_JSONLexer, "json_parser": json_JSONParser,
	"graphql_lexer": graphql_GraphQLLexer, "graphql_parser": graphql_GraphQLParser,
	"php_lexer": php_PhpLexer, "php_parser": php_PhpParser,
	"csharp_lexer": csharp_CSharpLexer, "csharp_parser": csharp_CSharpParser,
	"golang_lexer": golang_GoLexer, "golang_parser": golang_GoParser,
	"rust_lexer": rust_RustLexer, "rust_parser": rust_RustParser,
	//"java_lexer": java_JavaLexer,                          "java_parser": java_JavaParser,
	"java8_lexer": java8_Java8Lexer, "java8_parser": java8_Java8Parser,
	"java9_lexer": java9_Java9Lexer, "java9_parser": java9_Java9Parser,
	"python3_lexer": python3_Python3Lexer, "python3_parser": python3_Python3Parser,
	"python2js_lexer": python2js_Python2Lexer, "python2js_parser": python2js_Python2Parser,
	"postgresql_lexer": postgresql_PostgreSQLLexer, "postgresql_parser": postgresql_PostgreSQLParser,
	"sqlite_lexer": sqlite_SQLiteLexer, "sqlite_parser": sqlite_SQLiteParser,
	"plsql_lexer": plsql_PlSqlLexer, "plsql_parser": plsql_PlSqlParser,
	"tsql_lexer": tsql_TSqlLexer, "tsql_parser": tsql_TSqlParser,
	"mysql_lexer": mysql_MySQLLexer, "mysql_parser": mysql_MySQLParser,
	"cmake_lexer": cmake_CMakeLexer, "cmake_parser": cmake_CMakeParser,
	"protobuf3_lexer": protobuf3_Protobuf3Lexer, "protobuf3_parser": protobuf3_Protobuf3Parser,
	"toml_lexer": toml_tomlLexer, "toml_parser": toml_tomlParser,
	"xml_lexer": xml_XMLLexer, "xml_parser": xml_XMLParser,
	"csv_lexer": csv_CSVLexer, "csv_parser": csv_CSVParser,
	"properties_lexer": properties_propertiesLexer, "properties_parser": properties_propertiesParser,
	"terraform_lexer": terraform_terraformLexer, "terraform_parser": terraform_terraformParser,
	//"yaml_lexer": yaml_YamlLexer,                          "yaml_parser": yaml_YamlParser

	"quakemap_lexer": quakemap_quakemapLexer, "quakemap_parser": quakemap_quakemapParser,
	"q3arena_lexer": quake3_Q3ArenaLexer, "q3arena_parser": quake3_Q3ArenaParser,
	"q3camera_lexer": quake3_Q3CameraLexer, "q3camera_parser": quake3_Q3CameraParser,
	"q3config_lexer": quake3_Q3ConfigLexer, "q3config_parser": quake3_Q3ConfigParser,
	"q3map_lexer": quake3_Q3MapLexer, "q3map_parser": quake3_Q3MapParser,
	"q3menu_lexer": quake3_Q3MenuLexer, "q3menu_parser": quake3_Q3MenuParser,
	"q3shader_lexer": quake3_Q3ShaderLexer, "q3shader_parser": quake3_Q3ShaderParser,
	"q3skin_lexer": quake3_Q3SkinLexer, "q3skin_parser": quake3_Q3SkinParser,
};

// Aliases for historical backwards-compatibility safety valves
AntlrRegistry['cpp_clexer'] = c_CLexer;
AntlrRegistry['cpp_cpp14lexer'] = cpp_CPP14Lexer;
AntlrRegistry['c_CParser'] = c_CParser;
AntlrRegistry['cpp_CLexer'] = c_CLexer;
AntlrRegistry['cpp_CPP14Lexer'] = cpp_CPP14Lexer;
AntlrRegistry['cpp_CPP14Parser'] = cpp_CPP14Parser;
// Quake 3 Structural Compatibility Safety Valves
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
	self.AntlrRegistry = AntlrRegistry;
	self.AntlrLanguages = AntlrRegistry;
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
	angelscript_Lexer as angelscript_angelscriptLexer, angelscript_Parser as angelscript_angelscriptParser,
	lua_LuaLexer, lua_LuaParser,
	wat_WatLexer, wat_WatParser,
	asmMASM_asmMASMLexer, asmMASM_asmMASMParser,
	asm6502_asm6502Lexer, asm6502_asm6502Parser,
	asm8080_asm8080Lexer, asm8080_asm8080Parser,
	asm8086_asm8086Lexer, asm8086_asm8086Parser,
	asmZ80_asmZ80Lexer, asmZ80_asmZ80Parser,
	pdp7_pdp7Lexer, pdp7_pdp7Parser,

	javascript_JavaScriptLexer, javascript_JavaScriptParser,
	typescript_TypeScriptLexer, typescript_TypeScriptParser,
	html_HTMLLexer, html_HTMLParser,
	css3_css3Lexer, css3_css3Parser,
	json_JSONLexer, json_JSONParser,
	graphql_GraphQLLexer, graphql_GraphQLParser,
	php_PhpLexer, php_PhpParser,
	csharp_CSharpLexer, csharp_CSharpParser,
	golang_GoLexer, golang_GoParser,
	rust_RustLexer, rust_RustParser,
	//java_JavaLexer, java_JavaParser,
	java8_Java8Lexer, java8_Java8Parser,
	java9_Java9Lexer, java9_Java9Parser,
	python3_Python3Lexer, python3_Python3Parser,
	python2js_Python2Lexer, python2js_Python2Parser,
	postgresql_PostgreSQLLexer, postgresql_PostgreSQLParser,
	sqlite_SQLiteLexer, sqlite_SQLiteParser,
	plsql_PlSqlLexer, plsql_PlSqlParser,
	tsql_TSqlLexer, tsql_TSqlParser,
	mysql_MySQLLexer, mysql_MySQLParser,
	cmake_CMakeLexer, cmake_CMakeParser,
	protobuf3_Protobuf3Lexer, protobuf3_Protobuf3Parser,
	toml_tomlLexer, toml_tomlParser,
	xml_XMLLexer, xml_XMLParser,
	csv_CSVLexer, csv_CSVParser,
	properties_propertiesLexer, properties_propertiesParser,
	terraform_terraformLexer, terraform_terraformParser,
	creole_CreoleLexer, creole_CreoleParser,
	makefile_MakefileLexer, makefile_MakefileParser,
	//yaml_YamlLexer, yaml_YamlParser

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

// import LangModule1 from '../../../jupyter_ops/Resources/Parsers/angelscript/angelscriptLexer.js';
// import LangModule2 from '../../../jupyter_ops/Resources/Parsers/angelscript/angelscriptListener.js';
// import LangModule3 from '../../../jupyter_ops/Resources/Parsers/angelscript/angelscriptParser.js';
// import LangModule4 from '../../../jupyter_ops/Resources/Parsers/unreal_angelscript/UnrealAngelscriptLexer.js';
// import LangModule5 from '../../../jupyter_ops/Resources/Parsers/unreal_angelscript/UnrealAngelscriptParser.js';
// import LangModule6 from '../../../jupyter_ops/Resources/Parsers/unreal_angelscript/UnrealAngelscriptParserListener.js';

// import LangModule10 from '../../../jupyter_ops/Resources/Parsers/cpp/CPP14Lexer.js';
// import LangModule11 from '../../../jupyter_ops/Resources/Parsers/cpp/CPP14Parser.js';
// import LangModule12 from '../../../jupyter_ops/Resources/Parsers/cpp/CPP14ParserListener.js';
// import LangModule13 from '../../../jupyter_ops/Resources/Parsers/lua/LuaLexer.js';
// import LangModule14 from '../../../jupyter_ops/Resources/Parsers/lua/LuaListener.js';
// import LangModule15 from '../../../jupyter_ops/Resources/Parsers/lua/LuaParser.js';
// import LangModule16 from '../../../jupyter_ops/Resources/Parsers/wat/WatLexer.js';
// import LangModule17 from '../../../jupyter_ops/Resources/Parsers/wat/WatParser.js';
// import LangModule18 from '../../../jupyter_ops/Resources/Parsers/wat/WatParserListener.js';

// // ASM Multi-Architecture Matrix
// import LangModule19 from '../../../jupyter_ops/Resources/Parsers/asm/asm6502/asm6502Lexer.js';
// import LangModule20 from '../../../jupyter_ops/Resources/Parsers/asm/asm6502/asm6502Listener.js';
// import LangModule21 from '../../../jupyter_ops/Resources/Parsers/asm/asm6502/asm6502Parser.js';
// import LangModule22 from '../../../jupyter_ops/Resources/Parsers/asm/asm8080/asm8080Lexer.js';
// import LangModule23 from '../../../jupyter_ops/Resources/Parsers/asm/asm8080/asm8080Listener.js';
// import LangModule24 from '../../../jupyter_ops/Resources/Parsers/asm/asm8080/asm8080Parser.js';
// import LangModule25 from '../../../jupyter_ops/Resources/Parsers/asm/asm8086/asm8086Lexer.js';
// import LangModule26 from '../../../jupyter_ops/Resources/Parsers/asm/asm8086/asm8086Listener.js';
// import LangModule27 from '../../../jupyter_ops/Resources/Parsers/asm/asm8086/asm8086Parser.js';
// import LangModule28 from '../../../jupyter_ops/Resources/Parsers/asm/asmMASM/asmMASMLexer.js';
// import LangModule29 from '../../../jupyter_ops/Resources/Parsers/asm/asmMASM/asmMASMListener.js';
// import LangModule30 from '../../../jupyter_ops/Resources/Parsers/asm/asmMASM/asmMASMParser.js';
// import LangModule31 from '../../../jupyter_ops/Resources/Parsers/asm/asmZ80/asmZ80Lexer.js';
// import LangModule32 from '../../../jupyter_ops/Resources/Parsers/asm/asmZ80/asmZ80Listener.js';
// import LangModule33 from '../../../jupyter_ops/Resources/Parsers/asm/asmZ80/asmZ80Parser.js';
// import LangModule34 from '../../../jupyter_ops/Resources/Parsers/asm/masm/MASMLexer.js';
// import LangModule35 from '../../../jupyter_ops/Resources/Parsers/asm/masm/MASMListener.js';
// import LangModule36 from '../../../jupyter_ops/Resources/Parsers/asm/masm/MASMParser.js';
// import LangModule37 from '../../../jupyter_ops/Resources/Parsers/asm/pdp7/pdp7Lexer.js';
// import LangModule38 from '../../../jupyter_ops/Resources/Parsers/asm/pdp7/pdp7Listener.js';
// import LangModule39 from '../../../jupyter_ops/Resources/Parsers/asm/pdp7/pdp7Parser.js';

// // Quake 3 Dedicated Pipeline Assets
// //import LangModule40 from '../../../jupyter_ops/Resources/Parsers/quake3/shader/Q3ShaderLexer.js';
// //import LangModule41 from '../../../jupyter_ops/Resources/Parsers/quake3/shader/Q3ShaderParser.js';
// import LangModule42 from '../../../jupyter_ops/Resources/Parsers/quakemap/quakemapLexer.js';
// import LangModule43 from '../../../jupyter_ops/Resources/Parsers/quakemap/quakemapListener.js';
// import LangModule44 from '../../../jupyter_ops/Resources/Parsers/quakemap/quakemapParser.js';

// // =====================================================================
// // MODERN WEB STACK CORE
// // =====================================================================
// import LangModule45 from '../../../jupyter_ops/Resources/Parsers/javascript/javascript/JavaScriptLexer.js';
// import LangModule46 from '../../../jupyter_ops/Resources/Parsers/javascript/javascript/JavaScriptParser.js';
// import LangModule47 from '../../../jupyter_ops/Resources/Parsers/javascript/javascript/JavaScriptParserListener.js';
// import LangModule48 from '../../../jupyter_ops/Resources/Parsers/javascript/jsx/JavaScriptLexer.js';
// import LangModule49 from '../../../jupyter_ops/Resources/Parsers/javascript/jsx/JavaScriptParser.js';
// import LangModule50 from '../../../jupyter_ops/Resources/Parsers/javascript/jsx/JavaScriptParserListener.js';
// import LangModule51 from '../../../jupyter_ops/Resources/Parsers/javascript/typescript/TypeScriptLexer.js';
// import LangModule52 from '../../../jupyter_ops/Resources/Parsers/javascript/typescript/TypeScriptParser.js';
// import LangModule53 from '../../../jupyter_ops/Resources/Parsers/javascript/typescript/TypeScriptParserListener.js';
// import LangModule54 from '../../../jupyter_ops/Resources/Parsers/html/HTMLLexer.js';
// import LangModule55 from '../../../jupyter_ops/Resources/Parsers/html/HTMLParser.js';
// import LangModule56 from '../../../jupyter_ops/Resources/Parsers/html/HTMLParserListener.js';
// import LangModule57 from '../../../jupyter_ops/Resources/Parsers/css3/css3Lexer.js';
// import LangModule58 from '../../../jupyter_ops/Resources/Parsers/css3/css3Listener.js';
// import LangModule59 from '../../../jupyter_ops/Resources/Parsers/css3/css3Parser.js';
// import LangModule60 from '../../../jupyter_ops/Resources/Parsers/json/JSONLexer.js';
// import LangModule61 from '../../../jupyter_ops/Resources/Parsers/json/JSONListener.js';
// import LangModule62 from '../../../jupyter_ops/Resources/Parsers/json/JSONParser.js';
// import LangModule63 from '../../../jupyter_ops/Resources/Parsers/webidl/WebIDLLexer.js';
// import LangModule64 from '../../../jupyter_ops/Resources/Parsers/webidl/WebIDLListener.js';
// import LangModule65 from '../../../jupyter_ops/Resources/Parsers/webidl/WebIDLParser.js';
// import LangModule66 from '../../../jupyter_ops/Resources/Parsers/graphql/GraphQLLexer.js';
// import LangModule67 from '../../../jupyter_ops/Resources/Parsers/graphql/GraphQLListener.js';
// import LangModule68 from '../../../jupyter_ops/Resources/Parsers/graphql/GraphQLParser.js';

// // Modular Web Context Meta-Exclusions Guard
// import LangModule69 from '../../../jupyter_ops/Resources/Parsers/javascript/ecmascript/JavaScript/ECMAScriptLexer.js';
// import LangModule70 from '../../../jupyter_ops/Resources/Parsers/javascript/ecmascript/JavaScript/ECMAScriptListener.js';
// import LangModule71 from '../../../jupyter_ops/Resources/Parsers/javascript/ecmascript/JavaScript/ECMAScriptParser.js';
// //import LangModule72 from '../../../jupyter_ops/Resources/Parsers/javascript/ecmascript/ECMAScriptLexer.js';
// //import LangModule73 from '../../../jupyter_ops/Resources/Parsers/javascript/ecmascript/ECMAScriptListener.js';
// //import LangModule74 from '../../../jupyter_ops/Resources/Parsers/javascript/ecmascript/ECMAScriptParser.js';

// // =====================================================================
// // HEAVY HEAVY SERVER-SIDE ARCHITECTURES
// // =====================================================================
// import LangModule75 from '../../../jupyter_ops/Resources/Parsers/php/PhpLexer.js';
// import LangModule76 from '../../../jupyter_ops/Resources/Parsers/php/PhpParser.js';
// import LangModule77 from '../../../jupyter_ops/Resources/Parsers/php/PhpParserListener.js';
// import LangModule78 from '../../../jupyter_ops/Resources/Parsers/csharp/CSharpLexer.js';
// import LangModule79 from '../../../jupyter_ops/Resources/Parsers/csharp/CSharpParser.js';
// import LangModule80 from '../../../jupyter_ops/Resources/Parsers/csharp/CSharpParserListener.js';
// import LangModule81 from '../../../jupyter_ops/Resources/Parsers/csharp/CSharpPreprocessorParser.js';
// //import LangModule82 from '../../../jupyter_ops/Resources/Parsers/csharp/Antlr4cs/CSharpPreprocessorParser.js';
// //import LangModule83 from '../../../jupyter_ops/Resources/Parsers/csharp/CSharp/CSharpPreprocessorParser.js';
// import LangModule84 from '../../../jupyter_ops/Resources/Parsers/golang/GoLexer.js';
// import LangModule85 from '../../../jupyter_ops/Resources/Parsers/golang/GoParser.js';
// import LangModule86 from '../../../jupyter_ops/Resources/Parsers/golang/GoParserListener.js';
// //import LangModule87 from '../../../jupyter_ops/Resources/Parsers/golang/Go/GoParser.js';
// //import LangModule88 from '../../../jupyter_ops/Resources/Parsers/golang/Go/GoParserListener.js';
// import LangModule89 from '../../../jupyter_ops/Resources/Parsers/rust/RustLexer.js';
// import LangModule90 from '../../../jupyter_ops/Resources/Parsers/rust/RustParser.js';
// import LangModule91 from '../../../jupyter_ops/Resources/Parsers/rust/RustParserListener.js';

// // Java Virtual Machine Trackers
// import LangModule92 from '../../../jupyter_ops/Resources/Parsers/java/java/JavaLexer.js';
// import LangModule93 from '../../../jupyter_ops/Resources/Parsers/java/java/JavaParser.js';
// import LangModule94 from '../../../jupyter_ops/Resources/Parsers/java/java8/Java8Lexer.js';
// import LangModule95 from '../../../jupyter_ops/Resources/Parsers/java/java8/Java8Parser.js';
// import LangModule96 from '../../../jupyter_ops/Resources/Parsers/java/java9/Java9Lexer.js';
// import LangModule97 from '../../../jupyter_ops/Resources/Parsers/java/java9/Java9Parser.js';
// //import LangModule98 from '../../../jupyter_ops/Resources/Parsers/java/java9/Cpp/Java9Lexer.js';

// // Python Execution Contexts
// import LangModule99 from '../../../jupyter_ops/Resources/Parsers/python/python2-js/Python2Lexer.js';
// import LangModule100 from '../../../jupyter_ops/Resources/Parsers/python/python2-js/Python2Listener.js';
// import LangModule101 from '../../../jupyter_ops/Resources/Parsers/python/python2-js/Python2Parser.js';
// import LangModule102 from '../../../jupyter_ops/Resources/Parsers/python/python3/Python3Lexer.js';
// import LangModule103 from '../../../jupyter_ops/Resources/Parsers/python/python3/Python3LexerBase.js';
// import LangModule104 from '../../../jupyter_ops/Resources/Parsers/python/python3/Python3Parser.js';
// import LangModule105 from '../../../jupyter_ops/Resources/Parsers/python/python3/Python3ParserListener.js';
// //import LangModule106 from '../../../jupyter_ops/Resources/Parsers/python/python/PythonLexer.js';
// //import LangModule107 from '../../../jupyter_ops/Resources/Parsers/python/python/PythonParser.js';
// //import LangModule108 from '../../../jupyter_ops/Resources/Parsers/python/python2/Python2Lexer.js';

// // =====================================================================
// // REGULAR EXPRESSION ENGINES
// // =====================================================================
// import LangModule109 from '../../../jupyter_ops/Resources/Parsers/pcre/PCRELexer.js';
// import LangModule110 from '../../../jupyter_ops/Resources/Parsers/pcre/PCREListener.js';
// import LangModule111 from '../../../jupyter_ops/Resources/Parsers/pcre/PCREParser.js';
// import LangModule112 from '../../../jupyter_ops/Resources/Parsers/xsd-regex/regexLexer.js';
// import LangModule113 from '../../../jupyter_ops/Resources/Parsers/xsd-regex/regexParser.js';
// import LangModule114 from '../../../jupyter_ops/Resources/Parsers/xsd-regex/regexParserListener.js';

// // =====================================================================
// // DEVOPS TOOLING, DATA LAYOUTS & RELATIONAL ENGINES
// // =====================================================================
// import LangModule115 from '../../../jupyter_ops/Resources/Parsers/cmake/CMakeLexer.js';
// import LangModule116 from '../../../jupyter_ops/Resources/Parsers/cmake/CMakeListener.js';
// import LangModule117 from '../../../jupyter_ops/Resources/Parsers/cmake/CMakeParser.js';
// import LangModule118 from '../../../jupyter_ops/Resources/Parsers/protobuf3/Protobuf3Lexer.js';
// import LangModule119 from '../../../jupyter_ops/Resources/Parsers/protobuf3/Protobuf3Listener.js';
// import LangModule120 from '../../../jupyter_ops/Resources/Parsers/protobuf3/Protobuf3Parser.js';
// import LangModule121 from '../../../jupyter_ops/Resources/Parsers/toml/tomlLexer.js';
// import LangModule122 from '../../../jupyter_ops/Resources/Parsers/toml/tomlListener.js';
// import LangModule123 from '../../../jupyter_ops/Resources/Parsers/toml/tomlParser.js';
// import LangModule124 from '../../../jupyter_ops/Resources/Parsers/xml/XMLLexer.js';
// import LangModule125 from '../../../jupyter_ops/Resources/Parsers/xml/XMLParser.js';
// import LangModule126 from '../../../jupyter_ops/Resources/Parsers/xml/XMLParserListener.js';
// import LangModule127 from '../../../jupyter_ops/Resources/Parsers/csv/CSVLexer.js';
// import LangModule128 from '../../../jupyter_ops/Resources/Parsers/csv/CSVListener.js';
// import LangModule129 from '../../../jupyter_ops/Resources/Parsers/csv/CSVParser.js';
// import LangModule130 from '../../../jupyter_ops/Resources/Parsers/properties/propertiesLexer.js';
// import LangModule131 from '../../../jupyter_ops/Resources/Parsers/properties/propertiesListener.js';
// import LangModule132 from '../../../jupyter_ops/Resources/Parsers/properties/propertiesParser.js';
// import LangModule133 from '../../../jupyter_ops/Resources/Parsers/terraform/terraformLexer.js';
// import LangModule134 from '../../../jupyter_ops/Resources/Parsers/terraform/terraformListener.js';
// import LangModule135 from '../../../jupyter_ops/Resources/Parsers/terraform/terraformParser.js';

// // Relational SQL Database Vectors
// import LangModule136 from '../../../jupyter_ops/Resources/Parsers/sql/postgresql/PostgreSQLLexer.js';
// import LangModule137 from '../../../jupyter_ops/Resources/Parsers/sql/postgresql/PostgreSQLParser.js';
// import LangModule138 from '../../../jupyter_ops/Resources/Parsers/sql/postgresql/PostgreSQLParserListener.js';
// import LangModule139 from '../../../jupyter_ops/Resources/Parsers/sql/sqlite/SQLiteLexer.js';
// import LangModule140 from '../../../jupyter_ops/Resources/Parsers/sql/sqlite/SQLiteParser.js';
// import LangModule141 from '../../../jupyter_ops/Resources/Parsers/sql/sqlite/SQLiteParserListener.js';
// import LangModule142 from '../../../jupyter_ops/Resources/Parsers/sql/plsql/PlSqlLexer.js';
// import LangModule143 from '../../../jupyter_ops/Resources/Parsers/sql/plsql/PlSqlParserListener.js';
// //import LangModule144 from '../../../jupyter_ops/Resources/Parsers/sql/plsql/PlSqlParser.js';
// import LangModule145 from '../../../jupyter_ops/Resources/Parsers/sql/tsql/TSqlLexer.js';
// import LangModule146 from '../../../jupyter_ops/Resources/Parsers/sql/tsql/TSqlParserListener.js';
// //import LangModule147 from '../../../jupyter_ops/Resources/Parsers/sql/tsql/TSqlParser.js';


// // =====================================================================
// // UNIFIED DIST MODULE RE-EXPORT LAYER
// // =====================================================================
// export { antlr4 };
// export { LangModule1 as angelscript_angelscriptLexer };
// export { LangModule2 as angelscript_angelscriptListener };
// export { LangModule3 as angelscript_angelscriptParser };
// export { LangModule4 as unreal_angelscript_UnrealAngelscriptLexer };
// export { LangModule5 as unreal_angelscript_UnrealAngelscriptParser };
// export { LangModule6 as unreal_angelscript_UnrealAngelscriptParserListener };
// export { LangModule10 as cpp_CPP14Lexer };
// export { LangModule11 as cpp_CPP14Parser };
// export { LangModule12 as cpp_CPP14ParserListener };
// export { LangModule13 as lua_LuaLexer };
// export { LangModule14 as lua_LuaListener };
// export { LangModule15 as lua_LuaParser };
// export { LangModule16 as wat_WatLexer };
// export { LangModule17 as wat_WatParser };
// export { LangModule18 as wat_WatParserListener };

// export { LangModule19 as asm6502_asm6502Lexer };
// export { LangModule20 as asm6502_asm6502Listener };
// export { LangModule21 as asm6502_asm6502Parser };
// export { LangModule22 as asm8080_asm8080Lexer };
// export { LangModule23 as asm8080_asm8080Listener };
// export { LangModule24 as asm8080_asm8080Parser };
// export { LangModule25 as asm8086_asm8086Lexer };
// export { LangModule26 as asm8086_asm8086Listener };
// export { LangModule27 as asm8086_asm8086Parser };
// export { LangModule28 as asmMASM_asmMASMLexer };
// export { LangModule29 as asmMASM_asmMASMListener };
// export { LangModule30 as asmMASM_asmMASMParser };
// export { LangModule31 as asmZ80_asmZ80Lexer };
// export { LangModule32 as asmZ80_asmZ80Listener };
// export { LangModule33 as asmZ80_asmZ80Parser };
// export { LangModule34 as masm_MASMLexer };
// export { LangModule35 as masm_MASMListener };
// export { LangModule36 as masm_MASMParser };
// export { LangModule37 as pdp7_pdp7Lexer };
// export { LangModule38 as pdp7_pdp7Listener };
// export { LangModule39 as pdp7_pdp7Parser };

// //export { LangModule40 as quake3_Q3ShaderLexer };
// //export { LangModule41 as quake3_Q3ShaderParser };
// export { LangModule42 as quakemap_quakemapLexer };
// export { LangModule43 as quakemap_quakemapListener };
// export { LangModule44 as quakemap_quakemapParser };

// export { LangModule45 as javascript_JavaScriptLexer };
// export { LangModule46 as javascript_JavaScriptParser };
// export { LangModule47 as javascript_JavaScriptParserListener };
// export { LangModule48 as jsx_JavaScriptLexer };
// export { LangModule49 as jsx_JavaScriptParser };
// export { LangModule50 as jsx_JavaScriptParserListener };
// export { LangModule51 as typescript_TypeScriptLexer };
// export { LangModule52 as typescript_TypeScriptParser };
// export { LangModule53 as typescript_TypeScriptParserListener };
// export { LangModule54 as html_HTMLLexer };
// export { LangModule55 as html_HTMLParser };
// export { LangModule56 as html_HTMLParserListener };
// export { LangModule57 as css3_css3Lexer };
// export { LangModule58 as css3_css3Listener };
// export { LangModule59 as css3_css3Parser };
// export { LangModule60 as json_JSONLexer };
// export { LangModule61 as json_JSONListener };
// export { LangModule62 as json_JSONParser };
// export { LangModule63 as webidl_WebIDLLexer };
// export { LangModule64 as webidl_WebIDLListener };
// export { LangModule65 as webidl_WebIDLParser };
// export { LangModule66 as graphql_GraphQLLexer };
// export { LangModule67 as graphql_GraphQLListener };
// export { LangModule68 as graphql_GraphQLParser };

// export { LangModule69 as JavaScript_ECMAScriptLexer };
// export { LangModule70 as JavaScript_ECMAScriptListener };
// export { LangModule71 as JavaScript_ECMAScriptParser };

// export { LangModule75 as php_PhpLexer };
// export { LangModule76 as php_PhpParser };
// export { LangModule77 as php_PhpParserListener };
// export { LangModule78 as csharp_CSharpLexer };
// export { LangModule79 as csharp_CSharpParser };
// export { LangModule80 as csharp_CSharpParserListener };
// export { LangModule81 as csharp_CSharpPreprocessorParser };
// //export { LangModule82 as Antlr4cs_CSharpPreprocessorParser };
// //export { LangModule83 as CSharp_CSharpPreprocessorParser };
// export { LangModule84 as golang_GoLexer };
// export { LangModule85 as golang_GoParser };
// export { LangModule86 as golang_GoParserListener };
// export { LangModule89 as rust_RustLexer };
// export { LangModule90 as rust_RustParser };
// export { LangModule91 as rust_RustParserListener };

// export { LangModule92 as java_JavaLexer };
// export { LangModule93 as java_JavaParser };
// export { LangModule94 as java8_Java8Lexer };
// export { LangModule95 as java8_Java8Parser };
// export { LangModule96 as java9_Java9Lexer };
// export { LangModule97 as java9_Java9Parser };

// export { LangModule99 as python2js_Python2Lexer };
// export { LangModule100 as python2js_Python2Listener };
// export { LangModule101 as python2js_Python2Parser };
// export { LangModule102 as python3_Python3Lexer };
// export { LangModule103 as python3_Python3LexerBase };
// export { LangModule104 as python3_Python3Parser };
// export { LangModule105 as python3_Python3ParserListener };

// export { LangModule109 as pcre_PCRELexer };
// export { LangModule110 as pcre_PCREListener };
// export { LangModule111 as pcre_PCREParser };
// export { LangModule112 as xsdregex_regexLexer };
// export { LangModule113 as xsdregex_regexParser };
// export { LangModule114 as xsdregex_regexParserListener };

// export { LangModule115 as cmake_CMakeLexer };
// export { LangModule116 as cmake_CMakeListener };
// export { LangModule117 as cmake_CMakeParser };
// export { LangModule118 as protobuf3_Protobuf3Lexer };
// export { LangModule119 as protobuf3_Protobuf3Listener };
// export { LangModule120 as protobuf3_Protobuf3Parser };
// export { LangModule121 as toml_tomlLexer };
// export { LangModule122 as toml_tomlListener };
// export { LangModule123 as toml_tomlParser };
// export { LangModule124 as xml_XMLLexer };
// export { LangModule125 as xml_XMLParser };
// export { LangModule126 as xml_XMLParserListener };
// export { LangModule127 as csv_CSVLexer };
// export { LangModule128 as csv_CSVListener };
// export { LangModule129 as csv_CSVParser };
// export { LangModule130 as properties_propertiesLexer };
// export { LangModule131 as properties_propertiesListener };
// export { LangModule132 as properties_propertiesParser };
// export { LangModule133 as terraform_terraformLexer };
// export { LangModule134 as terraform_terraformListener };
// export { LangModule135 as terraform_terraformParser };

// export { LangModule136 as postgresql_PostgreSQLLexer };
// export { LangModule137 as postgresql_PostgreSQLParser };
// export { LangModule138 as postgresql_PostgreSQLParserListener };
// export { LangModule139 as sqlite_SQLiteLexer };
// export { LangModule140 as sqlite_SQLiteParser };
// export { LangModule141 as sqlite_SQLiteParserListener };
// export { LangModule142 as plsql_PlSqlLexer };
// export { LangModule143 as plsql_PlSqlParserListener };
// export { LangModule145 as tsql_TSqlLexer };
// export { LangModule146 as tsql_TSqlParserListener };
//export { LangModule147 as bash_BashLexer };
//export { LangModule148 as powershell_PowerShellLexer };
