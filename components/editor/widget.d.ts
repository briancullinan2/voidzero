
import type { Ace } from "ace-builds";
import type { AceEditorWidget } from "./widget";
import type { BlockResult, ParserEvent } from "../rosetta/rosetta-types";

export interface AceSession extends Ace.EditSession
{
	workspaceFileId?: string;
	$worker?: Worker;
	$editor: Ace.Editor;
	antlrDiscoveredFoldBlocks?: BlockResult[];
	workerAnnotations: ParserEvent[];
	_emit: (type: string, data: any) => void;
	$modeId: string;
}

export type AceEditor = typeof Ace & {
	edit(el: string | HTMLElement, options?: any): any;
	createEditSession(text: string | Ace.Document, mode?: any): AceSession;
	Range: new (startRow: number, startColumn: number, endRow: number, endColumn: number) => Ace.Range;
	config: {
		setModuleUrl: (name: string, subst: string) => string;
		loadModule: (module: [string, string], callback: () => void) => void;
		set: (key: string, value: string) => void;
	};
	require: (modules: string[] | string, callback?: (moduleExports: any) => void) => any;
	define: (
		name: string,
		deps: string[],
		loaded: (require: (module: string) => any,
			exports: any,
			module: any) => void) => void;
};

export interface EditorWindow
{
	tempCount?: number;
	compilerDiagnostics?: {
		log: (msg: string) => void;
		clear: () => void;
		getBridge: () => {
			refreshActiveEditorView: (session: AceSession) => void;
		};
	};
	ace?: AceEditor;
	currentBlockMarkerId: number | null;
	diagnosticsBridge?: any;
	AceEditorWidget?: typeof AceEditorWidget;
	previousHashLineNumber?: number | null;
	renderingHashCommand: boolean;
}
