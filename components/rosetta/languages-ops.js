// languages-category7-devops.js

// =====================================================================
// 1. CORE RUNTIME LIBRARY IMPORT
// =====================================================================
import antlr4 from 'antlr4';

/** @type {Worker & import('./rosetta-types.d').RosettaWorker} */
const workerSelf = /** @type {any} */ (self);

// =====================================================================
// 2. PARSER & LEXER IMPORTS: CATEGORY 7 (DEVOPS & CONFIG)
// =====================================================================

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
import properties_propertiesLexer from '../../../jupyter_ops/Resources/Parsers/properties/PropertiesLexer.js';
import properties_propertiesParser from '../../../jupyter_ops/Resources/Parsers/properties/PropertiesParser.js';
import terraform_terraformLexer from '../../../jupyter_ops/Resources/Parsers/terraform/terraformLexer.js';
import terraform_terraformParser from '../../../jupyter_ops/Resources/Parsers/terraform/terraformParser.js';

// =====================================================================
// 3. CONSOLIDATE CATEGORY 7 REGISTRY OBJECT
// =====================================================================
/** @type {({antlr4?: typeof antlr4}) & Record<string, typeof antlr4.Parser | typeof antlr4.Lexer>} */
const AntlrRegistry = {
	"makefile_lexer": makefile_MakefileLexer, "makefile_parser": makefile_MakefileParser,
	"cmake_lexer": cmake_CMakeLexer, "cmake_parser": cmake_CMakeParser,
	"protobuf3_lexer": protobuf3_Protobuf3Lexer, "protobuf3_parser": protobuf3_Protobuf3Parser,
	"toml_lexer": toml_tomlLexer, "toml_parser": toml_tomlParser,
	"xml_lexer": xml_XMLLexer, "xml_parser": xml_XMLParser,
	"csv_lexer": csv_CSVLexer, "csv_parser": csv_CSVParser,
	"properties_lexer": properties_propertiesLexer, "properties_parser": properties_propertiesParser,
	"terraform_lexer": terraform_terraformLexer, "terraform_parser": terraform_terraformParser,
};

AntlrRegistry.antlr4 = antlr4;

AntlrRegistry['makefile_MakefileParser'] = makefile_MakefileParser;
AntlrRegistry['cmake_CMakeParser'] = cmake_CMakeParser;
AntlrRegistry['protobuf3_Protobuf3Parser'] = protobuf3_Protobuf3Parser;
AntlrRegistry['toml_tomlParser'] = toml_tomlParser;
AntlrRegistry['xml_XMLParser'] = xml_XMLParser;

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
	makefile_MakefileLexer, makefile_MakefileParser,
	cmake_CMakeLexer, cmake_CMakeParser,
	protobuf3_Protobuf3Lexer, protobuf3_Protobuf3Parser,
	toml_tomlLexer, toml_tomlParser,
	xml_XMLLexer, xml_XMLParser,
	csv_CSVLexer, csv_CSVParser,
	properties_propertiesLexer, properties_propertiesParser,
	terraform_terraformLexer, terraform_terraformParser,
};

export default AntlrRegistry;
