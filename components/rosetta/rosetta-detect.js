
// @ts-check

/** @type {Worker & import('./rosetta.d').RosettaWorker} */
const workerSelf = /** @type {any} */ (self);

// =====================================================================
// TEXT & SYNTAX-LEVEL DETERMINATIONS WATERFALL REGISTRY
// =====================================================================
/** @type { import('./rosetta.d').TextDetector[] } */
const TEXT_LANGUAGE_DETECTOR_WATERFALL = [
	// ─── 1. BINARY & VIRTUAL MACHINE CORE SIGNATURES ───
	{ id: "wat", match: (s, b) => s.trim().startsWith('(module') || s.includes('(func ') || s.includes('(import "env"') },
	{ id: "wasm", match: (s, b) => b?.[0] === 0x00 && b?.[1] === 0x61 && b?.[2] === 0x73 && b?.[3] === 0x6D },
	{ id: "qvm", match: (s, b) => b?.[0] === 0x44 && b?.[1] === 0x14 && b?.[2] === 0x72 && b?.[3] === 0x12 },
	{ id: "bsp", match: (s, b) => b?.[0] === 0x49 && b?.[1] === 0x42 && b?.[2] === 0x53 && b?.[3] === 0x50 }, // "IBSP"
	{ id: "md3", match: (s, b) => b?.[0] === 0x49 && b?.[1] === 0x44 && b?.[2] === 0x50 && b?.[3] === 0x33 }, // "IDP3"

	// ─── ADDITIONS FOR TEXT_LANGUAGE_DETECTOR_WATERFALL ───
	// Quake 3 Character & Weapon Skin Descriptors (.skin files mapping mesh nodes to shader paths)
	{ id: "q3skin", match: (s, b) => s.includes(',') && s.split('\n').some(l => l.includes(',') && !l.trim().startsWith('//') && l.split(',')[0].match(/^(models|tag_|u_|l_|h_)/i)) },

	// Quake 3 Arena Meta Definitions (.arena files containing map data blocks for menus)
	{ id: "q3arena", match: (s, b) => s.includes('{') && s.includes('}') && s.toLowerCase().includes('map') && s.toLowerCase().includes('bots') && s.toLowerCase().includes('type') },
	{ id: "q3shader", match: (s, b) => (s.includes('textures/') || s.includes('q3map_')) && s.includes('{') && s.includes('map ') && s.includes('blendFunc') },
	{ id: "q3config", match: (s, b) => s.includes('seta ') && (s.includes('cg_') || s.includes('cl_') || s.includes('r_')) },
	{ id: "q3menu", match: (s, b) => s.includes('menuDef') && s.includes('itemDef') && s.includes('rect ') },
	{ id: "markdown", match: (s, b) => s.startsWith('# ') || s.includes('\n## ') || (s.includes('[') && s.includes('](')) },
	{ id: "yaml", match: (s, b) => s.includes(': ') && s.includes('\n- ') && !s.includes('{') && !s.includes(';') },
	{ id: "dockerfile", match: (s, b) => s.startsWith('FROM ') || s.includes('\nRUN ') || s.includes('\nENV ') || s.includes('\nEXPOSE ') },
	{ id: "makefile", match: (s, b) => s.includes(':\n\t') || s.startsWith('CC =') || s.startsWith('CFLAGS =') },

	// ─── MAP HIGH-FIDELITY ENGINE HIGH-FIDELITY SIGNATURES ───

	// Quake 3 / Return to Castle Wolfenstein / Elite Force (brushDef3 / patchDef2 variants)
	{ id: "q3map", match: (s, b) => s.includes('"classname"') && (s.includes('brushDef') || s.includes('patchDef') || s.includes('meshDef')) },

	// Quake 1 / Quake 2 / Hexen 2 / Half-Life (Standard 3-point plane coordinate definitions)
	{ id: "quakemap", match: (s, b) => s.includes('"classname"') && !s.includes('brushDef') && /\(\s*[-?\d.]+\s+[-?\d.]+\s+[-?\d.]+\s*\)\s*\(\s*[-?\d.]+\s+[-?\d.]+\s+[-?\d.]+\s*\)/.test(s) },

	// Daemon Engine / Unvanquished (Advanced layer data + brush primitives)
	{ id: "daemonmap", match: (s, b) => s.includes('"classname"') && s.includes('primitive') && s.includes('layer') },

	// Source Engine / Half-Life 2 (Valve Map Format structural trees)
	{ id: "vmfmap", match: (s, b) => s.includes('versioninfo') && s.includes('viewsettings') && s.includes('world') && s.includes('solid') },

	// Call of Duty (CoD 1/2/4 target map architectures)
	{ id: "codmap", match: (s, b) => s.includes('"classname"') && s.includes('// brush') && !s.includes('brushDef') },


	// ─── 2. TEXT STRUCTURAL & DOMAIN SPECIFIC LAYOUTS ───
	{ id: "json", match: (s, b) => s.trim().startsWith('{') && s.includes('":') && (s.includes('",') || s.includes('"\n') || s.trim().endsWith('}')) },
	{ id: "html", match: (s, b) => /<!doctype\s+html|<\/html>|<body|<script/i.test(s) },
	{ id: "xml", match: (s, b) => s.trim().startsWith('<?xml') || (s.includes('</') && /<[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+/i.test(s)) },
	{ id: "graphql", match: (s, b) => s.includes('query ') || s.includes('mutation ') || s.includes('type ') && s.includes(' {') && !s.includes(';') },
	{ id: "css3", match: (s, b) => s.includes('{') && s.includes('}') && s.includes(':') && s.includes(';') && !s.includes('function ') && !s.includes('let ') },
	{ id: "csv", match: (s, b) => s.split('\n').slice(0, 3).every(l => l.split(',').length > 2 && !l.includes('{') && !l.includes(';')) },
	{ id: "toml", match: (s, b) => s.includes('[') && s.includes(']') && s.includes('=') && !s.includes('{') && !s.includes(';') && !s.includes('function') },
	{ id: "properties", match: (s, b) => s.split('\n').every(l => !l.trim() || l.trim().startsWith('#') || l.trim().startsWith('!') || l.includes('=')) && s.includes('=') && !s.includes('{') },

	// ─── 3. DEVOPS, ANNOTATIONS & SYSTEM SCHEMAS ───
	{ id: "terraform", match: (s, b) => s.includes('resource "') || s.includes('variable "') || s.includes('provider "') || s.includes('output "') },
	{ id: "protobuf3", match: (s, b) => s.includes('syntax = "proto3"') || s.includes('message ') && s.includes(' = ') && s.includes(';') },
	{ id: "cmake", match: (s, b) => s.includes('cmake_minimum_required') || s.includes('project(') || s.includes('add_executable(') },
	{ id: "webidl", match: (s, b) => s.includes('interface ') && s.includes('attribute ') && s.includes(';') },

	// ─── 4. RELATIONAL DATABASES & DIALECTS (SQL) ───
	{ id: "plsql", match: (s, b) => /create\s+or\s+replace\s+(?:procedure|function|package|trigger)/i.test(s) || s.toLowerCase().includes('begin') && s.toLowerCase().includes('exception') },
	{ id: "tsql", match: (s, b) => s.toLowerCase().includes('declare @') || s.toLowerCase().includes('exec ') || s.toLowerCase().includes('with nocount') },
	{ id: "postgresql", match: (s, b) => s.toLowerCase().includes('$$ language plpgsql') || s.toLowerCase().includes('returns trigger as') },
	{ id: "sqlite", match: (s, b) => s.toLowerCase().includes('autoincrement') || s.toLowerCase().includes('create table if not exists') },

	// ─── 5. LOW-LEVEL ASSEMBLERS (ASM MATRIX) ───
	{ id: "masm", match: (s, b) => s.toLowerCase().includes('.model ') || s.toLowerCase().includes('.code') || s.toLowerCase().includes('proc near') || s.toLowerCase().includes('endp') },
	{ id: "asm6502", match: (s, b) => s.toLowerCase().includes('lda #') || s.toLowerCase().includes('sta $') || s.toLowerCase().includes('jmp $') },
	{ id: "asm8080", match: (s, b) => s.toLowerCase().includes('mvi a,') || s.toLowerCase().includes('lxi h,') || s.toLowerCase().includes('cpi ') },
	{ id: "asm8086", match: (s, b) => s.toLowerCase().includes('mov ax,') || s.toLowerCase().includes('int 21h') || s.toLowerCase().includes('segment') },
	{ id: "asmz80", match: (s, b) => s.toLowerCase().includes('ld a,') || s.toLowerCase().includes('ld hl,') || s.toLowerCase().includes('djnz ') },
	{ id: "pdp7", match: (s, b) => s.toLowerCase().includes('lac ') || s.toLowerCase().includes('dac ') || s.toLowerCase().includes('dzm ') },

	// ─── 6. AUTOMATED SHELLS, REGEX & SPECIAL RUNTIMES ───
	{ id: "powershell", match: (s, b) => s.toLowerCase().includes('write-output') || s.toLowerCase().includes('get-process') || s.includes('$global:') || s.includes('param(') },
	{ id: "bash", match: (s, b) => s.startsWith('#!') && (s.includes('bin/bash') || s.includes('bin/sh')) || s.includes('export ') && s.includes('local ') },
	{ id: "pcre", match: (s, b) => s.startsWith('/') && s.endsWith('/') && (s.includes('\\d') || s.includes('\\w') || s.includes('(?:') || s.includes('(?=')) },
	{ id: "xsdregex", match: (s, b) => s.includes('\\p{Is') || s.includes('[\\c]') },

	// ─── 7. HEAVY SCRIPTING & SCRIPT-BASED ENGINES ───
	{ id: "python3", match: (s, b) => s.includes('def ') && s.includes(':') && (s.includes('import ') || s.includes('print(')) && !s.includes('{') && !s.includes(';') },
	{ id: "python2", match: (s, b) => s.includes('def ') && s.includes(':') && /print\s+["'].*["']/i.test(s) && !s.includes('{') },
	{ id: "php", match: (s, b) => s.includes('<?php') || s.includes('?>') || s.includes('$_GET') || s.includes('$_POST') || s.includes('echo ') && s.includes(';') },
	{ id: "lua", match: (s, b) => s.includes('local ') && s.includes('function(') || s.includes('end') && s.includes('local ') || s.includes('require(') && s.includes('local') },

	// ─── 8. FRONT-END SCRIPTING LAYERS (JS/TS) ───
	{ id: "jsx", match: (s, b) => s.includes('import ') && s.includes('from ') && s.includes('return (') && s.includes('</') },
	{ id: "typescript", match: (s, b) => s.includes('import ') && s.includes('from ') && (s.includes('interface ') || s.includes('type ') || s.includes('as ') || s.includes('private ') || s.includes(': string') || s.includes(': number') || s.includes(': any')) },
	{ id: "javascript", match: (s, b) => s.includes('const ') || s.includes('let ') || s.includes('var ') || s.includes('function ') || s.includes('import ') && s.includes('from ') || s.includes('require(') },

	// ─── 9. TYPED ARCHITECTURAL COMPILER SYSTEMS (JAVA & RUST) ───
	{ id: "rust", match: (s, b) => s.includes('fn main()') || s.includes('pub struct ') || s.includes('impl ') || s.includes('use std::') || s.includes('let mut ') || s.includes('fn ') && s.includes('->') },
	{ id: "java9", match: (s, b) => s.includes('module ') && s.includes('requires ') && s.includes('exports ') },
	{ id: "java8", match: (s, b) => s.includes('public class ') && s.includes('public static void main') || s.includes('import java.') },
	{ id: "java", match: (s, b) => s.includes('public class ') && s.includes('System.out.print') },

	// ─── 10. UNREAL / GAME PLAY SCENE MANAGEMENT ───
	{ id: "unreal_angelscript", match: (s, b) => s.includes('UPROPERTY(') || s.includes('UFUNCTION(') || s.includes('class A') && s.includes(' : AActor') },
	{ id: "angelscript", match: (s, b) => s.includes('class ') && s.includes('void ') && s.includes('::') && !s.includes('#include') && !s.includes('using namespace') },

	// ─── 11. HARD NATIVE LOW-LEVEL COMPILERS (C++ vs C DETERMINATION) ───
	{ id: "csharp", match: (s, b) => s.includes('using System;') || s.includes('namespace ') && s.includes('public class ') && s.includes('{') && s.includes('get;') && s.includes('set;') },
	{ id: "cpp", match: (s, b) => s.includes('#include <iostream>') || s.includes('std::cout') || s.includes('using namespace std;') || s.includes('::') && s.includes('class ') || s.includes('public:') || s.includes('template<typename') },

	// Explicit Fallthrough to Base C if none of the modern object enhancements matched
	{ id: "c", match: (s, b) => s.includes('#include') || s.includes('printf(') || s.includes('struct ') || s.includes('int main(') || s.includes('NULL') || s.includes('extern ') }
];

workerSelf.TEXT_LANGUAGE_DETECTOR_WATERFALL = TEXT_LANGUAGE_DETECTOR_WATERFALL;

// =====================================================================
// 1. TOP-LEVEL GLOBAL MICRO-UTILITY FUNCTIONS
// =====================================================================
/** @type {Record<string, string>} */
const EXTENSION_TO_PARSER_ID = {
	'abap': 'abap',
	'abc': 'abc',
	'ada': 'ada',
	'adb': 'ada',
	'ahk': 'autohotkey',
	'apex': 'apex',
	'applescript': 'applescript',
	'as': 'angelscript',
	'asm': 'asm',
	'bat': 'batchfile',
	'bash': 'sh',
	'c': 'c',
	'cbl': 'cobol',
	'cc': 'cpp',
	'cfc': 'coldfusion',
	'cfm': 'coldfusion',
	'cfg': 'q3config',
	'cjs': 'javascript',
	'cl': 'lisp',
	'clj': 'clojure',
	'cljs': 'clojure',
	'cls': 'apex',
	'cmakelists.txt': 'cmake',
	'cmake': 'cmake',
	'cmd': 'batchfile',
	'cob': 'cobol',
	'coffee': 'coffee',
	'conf': 'apache_conf',
	'cpp': 'cpp',
	'cs': 'csharp',
	'css': 'css3',
	'csx': 'csharp',
	'cxx': 'cpp',
	'd': 'd',
	'dart': 'dart',
	'diff': 'diff',
	'dockerfile': 'dockerfile',
	'dot': 'dot',
	'e': 'eiffel',
	'edn': 'clojure',
	'ejs': 'ejs',
	'erl': 'erlang',
	'ex': 'elixir',
	'exs': 'elixir',
	'f': 'fortran',
	'f90': 'fortran',
	'f95': 'fortran',
	'for': 'fortran',
	'forth': 'forth',
	'frag': 'glsl',
	'fs': 'fsharp',
	'fsi': 'fsharp',
	'fsx': 'fsharp',
	'fth': 'forth',
	'ftl': 'freemarker',
	'gcode': 'gcode',
	'gitignore': 'ini',
	'glsl': 'glsl',
	'vlsl': 'glsl',
	'hlsl': 'glsl',
	'go': 'golang',
	'gql': 'graphql',
	'graphql': 'graphql',
	'groovy': 'groovy',
	'gsh': 'groovy',
	'gvy': 'groovy',
	'gy': 'groovy',
	'h': 'c',
	'haml': 'haml',
	'handlebars': 'handlebars',
	'hbs': 'handlebars',
	'hh': 'cpp',
	'hjson': 'hjson',
	'hpp': 'cpp',
	'hrl': 'erlang',
	'hs': 'haskell',
	'htm': 'html',
	'html': 'html',
	'htaccess': 'apache_conf',
	'hxx': 'cpp',
	'i': 'c',
	'ini': 'ini',
	'ino': 'c',
	'io': 'io',
	'java': 'java',
	'jade': 'pug',
	'jl': 'julia',
	'js': 'javascript',
	'json': 'json',
	'jsm': 'javascript',
	'jsp': 'jsp',
	'jsx': 'jsx',
	'kt': 'kotlin',
	'kts': 'kotlin',
	'less': 'less',
	'liquid': 'liquid',
	'lisp': 'lisp',
	'log': 'text',
	'ls': 'livescript',
	'lsp': 'lisp',
	'ltx': 'latex',
	'lua': 'lua',
	'm': 'matlab',
	'makefile': 'makefile',
	'make': 'makefile',
	'markdown': 'creole',
	'md': 'creole',
	'mel': 'mel',
	'mjs': 'javascript',
	'mk': 'makefile',
	'ml': 'ocaml',
	'mli': 'ocaml',
	'mm': 'objectivec',
	'mysql': 'mysql',
	'nginx': 'nginx',
	'nim': 'nim',
	'nix': 'nix',
	'nsh': 'nsis',
	'nsi': 'nsis',
	'pas': 'pascal',
	'patch': 'diff',
	'perl': 'perl',
	'pgsql': 'postgresql',
	'php': 'php',
	'phtml': 'php',
	'pig': 'pig',
	'pl': 'perl',
	'plsql': 'plsql',
	'pm': 'perl',
	'pp': 'pascal',
	'powershell': 'powershell',
	'prefs': 'ini',
	'properties': 'properties',
	'props': 'properties',
	'proto': 'protobuf3',
	'ps1': 'powershell',
	'psm1': 'powershell',
	'pug': 'pug',
	'puppet': 'puppet',
	'py': 'python3',
	'pyw': 'python3',
	'q': 'q',
	'r': 'r',
	'rb': 'ruby',
	'rdoc': 'rdoc',
	'rhtml': 'ruby',
	'rprofile': 'r',
	'rs': 'rust',
	's': 'asm',
	'sass': 'sass',
	'sbt': 'scala',
	'scad': 'scad',
	'scala': 'scala',
	'scheme': 'scheme',
	'scm': 'scheme',
	'scss': 'scss',
	'sh': 'sh',
	'sieve': 'sieve',
	'slim': 'slim',
	'smali': 'smali',
	'smarty': 'smarty',
	'sql': 'sql',
	'ss': 'scheme',
	'styl': 'stylus',
	'svg': 'svg',
	'swift': 'swift',
	'tcl': 'tcl',
	'tex': 'latex',
	'toml': 'toml',
	'tpl': 'smarty',
	'ts': 'typescript',
	'tsx': 'tsx',
	'twig': 'twig',
	'txt': 'text',
	'wasm': 'wat',
	'qvm': 'wat',
	'v': 'verilog',
	'vala': 'vala',
	'vapi': 'vala',
	'vbe': 'vbscript',
	'vbs': 'vbscript',
	'vert': 'glsl',
	'vh': 'verilog',
	'vhd': 'vhdl',
	'vhdl': 'vhdl',
	'vue': 'vue',
	'xhtml': 'html',
	'xml': 'xml',
	'xsd': 'xml',
	'xsl': 'xml',
	'yaml': 'yaml',
	'yml': 'yaml',
	'zig': 'zig',
	'zsh': 'sh',


	'cam': 'q3camera',
	'shader': 'q3shader',
	'shaderx': 'q3shader',
	'map': 'q3map', // Or 'quakemap' if targeting your legacy BSP parser
	'arena': 'q3arena',
	'menu': 'q3menu',
	'skin': 'q3skin',
};


workerSelf.EXTENSION_TO_PARSER_ID = EXTENSION_TO_PARSER_ID;

/**
 *
 * @param {string} fileText
 * @param {Buffer} fileBuffer
 * @returns
 */
function autodetectLanguage(fileText, fileBuffer)
{
	const textContent = fileText || "";
	const cleanBuffer = fileBuffer || (typeof Uint8Array !== 'undefined' ? new Uint8Array(0) : []);

	// Sequentially execute the array matches; returns the first absolute hit or defaults to text
	const matchedLanguageNode = TEXT_LANGUAGE_DETECTOR_WATERFALL.find(lang => lang.match(textContent, cleanBuffer));

	const resolvedLanguageId = matchedLanguageNode ? matchedLanguageNode.id : "text";
	console.log(`[AUTODETECT SUCCESS] File classified cleanly as: ${resolvedLanguageId}`);

	return resolvedLanguageId;
}

workerSelf.autodetectLanguage = autodetectLanguage;

