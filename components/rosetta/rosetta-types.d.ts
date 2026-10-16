import type antlr4 from 'antlr4';
import type { Lexer, Parser, ParserRuleContext, Token, CommonTokenStream } from 'antlr4';
import type { Ace } from 'ace-builds';

export interface ImplementedBackend extends AntlrWorkerBackend implements Mirror
{
	// [key: '']: any;
	languageKey?: string;
	activeFileId: string;
	setTimeout(ms: number): void;
	sender: Mirror;
	emit(name: string, data: any): void;
	doc?: Ace;
	// doc: {
	// 	getValue(): string;
	// 	setValue(value: string): void;
	// };
	deferredUpdate: {
		schedule(): void;
	};
}



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
	AntlrRegistry: { antlr4?: typeof antlr4; } & Record<string, typeof antlr4.Parser | typeof antlr4.Lexer>;
	AntlrLanguages: { antlr4?: typeof antlr4; } & Record<string, typeof antlr4.Parser | typeof antlr4.Lexer>;
	language: {
		lineToken(text, language, line): Promise<void>;
	};
	activeFileId?: string;
	antlr4: typeof antlr4;
	runParserPipeline(sourceText, languageKey, annotations, emitter): void;
	extractCurrentBlock(codeStr, lineNumber, langId);
	antlrProcessor?: ImplementedBackend;
	executeGetFoldRegionsCommand(msg: { args: any[]; }, sender: ImplementedBackend);
	doc?: Ace;
	languageKey?: string;
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

	tokenIndex?: number;
	line?: number;
	column?: number;
	channel?: number;
	text?: string;
	value?: string;
	type?: number;
	start?: number | { line: number, column: number; };
	stop?: number | { line: number, column: number; };

	typeInt?: number | null;
	textType?: string;
	spellCheckable?: boolean;
	rosettaScope?: string;
	tokenType?: string;
	tokenMode?: string;
	tokenNames?: string[];
	tokenSymbol?: string;
	tokenRule?: string;
	symbolIndex?: number;
	symbolicName?: string;
	literalName?: string;
	literalText?: string;
	ruleName?: string;
	ruleHistory?: string[];
	contextNode?: ParserRuleContext;
	tokenChannel?: number;
	lexerSymbolicName?: string;
	lexerLiteralName?: string;

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
	text?: string;
	ruleName?: string;
	startLine: number;
	endLine: number;
	startIndex: number;
	endIndex: number;
}

export interface Mirror
{
	constructor(sender: any);
	sender: any;
	doc: {
		getValue(): string;
		setValue(value: string): void;
	};
	setTimeout(timeout: number): void;
	onUpdate(): void;
	on(): void;
	callback(data: any, id: string): void;
	emit(name: string, data: any): void;
	call<E, P>(E: any, P: any): E & P;
}

declare module "ace/worker/mirror" {
	Mirror;
}


export interface ErrorResult
{
	line: number;
	column: number;
	message: string;
}


export interface FoldRegion
{
	startRow: number;
	endRow: number;
	type: 'comment' | 'preprocessor' | 'brace';
}


export interface AntlrVocab
{
	getSymbolicNames(type: number): string[];
	getSymbolicName(type: number): string;
	getLiteralName(type: number): string;
}


export interface ImplementedLexer extends Lexer
{
	static vocabulary?: AntlrVocab;
	vocabulary?: AntlrVocab;
	symbolicNames?: Record<number, string>;
	literalNames?: Record<number, string>;
	modeNames?: Record<number, string>;
	_mode?: number;
}

export interface ImplementedParser extends Parser
{
	static vocabulary?: AntlrVocab;
	vocabulary?: AntlrVocab;
	ruleNames: Record<number, string>;
	// [key: string]: Function;
}


export interface ImplementedContext extends ParserRuleContext
{
	ruleIndex: number;
	line: number;
}


export interface ImplementedStream extends CommonTokenStream
{
	getTokens(start?: number, stop?: number): Token[];
}
