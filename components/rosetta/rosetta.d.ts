import type antlr4 from 'antlr4';

export interface RosettaWorker
{
	window: Window | any;
	mime: typeof mime;
	TEXT_LANGUAGE_DETECTOR_WATERFALL: TextDetector[];
	EXTENSION_TO_PARSER_ID: Record<string, string>;
	autodetectLanguage(fileText: string, fileBuffer: Buffer);
	BINARY_DETECTOR: Record<string, BinaryDetector>;
	detectBinaryType(sourceBuffer: Buffer | Uint8Array): string;
	__missingHeaders: Set<string>;
	AntlrRegistry: Record<string, antlr4.Parser | antlr4.Lexer>;
}


export interface DiagnosticBridge
{
	findLineInFile(filePath: string, token: string): number;
	findShaderByAssetDependency(assetPath: string): string;
	lookupShaderFile(shaderName: string): string;
}


export interface DisassemblyOptions
{
	globalOffset?: number;
	viewportStart?: number | null;
	viewportLength?: number | null;
	syscallMap?: Record<number, string>;
	forceMode?: string;
	codeStart?: number;
	codeLength?: number;
	dataStart?: number;
	dataLength?: number;
}

export interface DisassemblyOpcodes
{
	name: string;
	argLen: number;
	type: string;
}


export interface DisassemblyHeader
{
	magic: number;
	instructionCount: number;
	codeOffset: number;
	codeLength: number;
	dataOffset: number;
	dataLength: number;
	litLength: number;
	bssLength: number;
	jtrgLength?: number;
}

export interface FontGlyph
{
	index: number;
	char: string;
	height: number;
	top: number;
	bottom: number;
	pitch: number;
	xSkip: number;
	imageWidth: number;
	imageHeight: number;
	s: number;
	t: number;
	s2: number;
	t2: number;
	glyphHandle: number;
	shaderName: string;
}

export interface Q3Font
{
	glyphs: FontGlyph[];
	glyphScale: number;
	name: string;
}

export interface DiagnosticsParser
{
	filePath: string;
	row: number;
	type: string;
	text: string;
}

export interface TextDetector
{
	id: string;
	match: (s: string, b: Buffer | Uint8Array) => any;
}

export interface BinaryDetector
{
	description: string,
	match: (b: Uint8Array) => boolean;
}

export type FileClassDetector = (bytes: Uint8Array, path: string) => boolean;


export interface BlockDetector
{
	open: RegExp;
	close: string | RegExp;
	isKeywordClose: boolean;
}

export interface AntlrToken
{
	text: string;
	type: string;
	typeInt: number | null;
	textType: string;
	spellCheckable: boolean;
	line: number;
	column: number;
	start: number;
	stop: number;
	channel: number;
	rosettaScope: string;
	tokenIndex: number | null;
	tokenType: string;
	tokenMode: string;
	tokenNames: string[];
	tokenSymbol: string;
	tokenRule: string;
	symbolIndex: number;
	symbolicName: string;
	literalName: string;
	literalText: string;
	ruleName: string;
	ruleHistory: string[];
	tokenChannel: number;
	lexerSymbolicName: string;
	lexerLiteralName: string;
}


export type RosettaNeighbors = (t: AntlrToken, s: AntlrToken[]) => string | null | undefined;


export interface ParserEvent
{
	row: number,
	column: number,
	text: string,
	type: "error" | string;
}

export interface BlockResult
{
	ruleName: string,
	startLine: number,
	endLine: number,
	startIndex: number,
	endIndex: number;
}
