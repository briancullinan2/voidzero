import { Widget } from '@lumino/widgets';
import type { IMainpanelOptions, WidgetExtensionsWindow } from '../bundle/widget-extensions';
import { Message } from '@lumino/messaging';
import { load } from 'js-yaml';
import type { LocalWindow } from '../bundle/local.d';
import type { GithubWindow } from '../bundle/github.d';
import JSZip from 'jszip';
import { marked } from 'marked';
import type { EditorWindow } from '../editor/widget.d';

const widgetSelf: EditorWindow & WidgetExtensionsWindow & LocalWindow & GithubWindow = self as unknown as any;


interface LanguageRuntime
{
	id: string;
	type?: 'programming' | 'data' | 'markup';
	color?: string;
	extensions?: string[];
	label: string;
	tm_scope?: string;
	ace_mode?: string;
	languageId?: number;
	version: string;
	iconClass?: string;
	installed: boolean;
	subtext?: string;
	description?: string;
}


export class LanguagesWidget extends widgetSelf.WithChangingWidget<LanguagesWidget, LanguageRuntime>
{
	protected override items: LanguageRuntime[] = [
		{
			id: 'typescript',
			label: 'TypeScript / Node.js Engine',
			version: 'v5.4.2-wasm',
			iconClass: 'bxl bx-typescript',
			installed: true,
			subtext: 'Depends on V8 worker runtimes, AST transpiler wrappers, IDB module caches, and Webpack compiler bindings.',
			description: 'Enables real-time client-side code transformation, type checking, custom AST template matching, and browser-based script execution.'
		},
		{
			id: 'python',
			label: 'Python WebAssembly (Pyodide)',
			version: 'v3.11.4',
			iconClass: 'bxl bx-python',
			installed: true,
			subtext: 'Depends on Emscripten virtual file system, NumPy/SciPy WASM builds, and pip package memory mounts.',
			description: 'Provides fully sandboxed Python script evaluation, data science notebook parsing, and script stepping straight inside browser Web Workers.'
		},
		{
			id: 'c_cpp',
			label: 'C / C++ WASI SDK',
			version: 'LLVM 18.1',
			iconClass: 'bxl bx-c-plus-plus',
			installed: false,
			subtext: 'Depends on Clang/LLVM toolchain, WASI system headers, sys_main.c emulation layers, and makefile build pipelines.',
			description: 'Compiles native high-performance game engines (like Quake 3 WASM ports), custom memory allocators, and binary parsers directly in-browser.'
		},
		{
			id: 'rust',
			label: 'Rust WASM Toolchain',
			version: '1.78.0-nightly',
			installed: false,
			subtext: 'Depends on rustc target wasm32-unknown-wasi, cargo package registry proxy, and memory safety verifiers.',
			description: 'Compiles memory-safe systems modules, high-speed AST traversal parsers, and multi-threaded Web Workers with strict type guarantees.'
		}
	];
	private _loading: Promise<void>;
	private _loadingDocs?: Promise<void>;
	private _loadingEuler?: Promise<void>;
	private langInstalls: Record<string, string> = {};
	private _fetchZip?: Promise<ArrayBuffer>;
	private _loadZip?: Promise<JSZip>;
	private codeSamples: Record<string, string> = {};
	private _highlighterCallback?: () => void;

	constructor(title?: string, options?: IMainpanelOptions<LanguagesWidget, LanguageRuntime[]>)
	{
		super(title ?? 'Supported Languages', options);
		this.addClass('jp-LanguageManagerWidget');
		this.filterAndRender();
		this._sidebarWidget = new LanguageListWidget(LanguageListWidget.name, 'Languages', {
			itemsChanged: this.itemsChanged
		});
		this.addClass('lang-detail-pane');
		this._loading = this.loadLanguages();
		this._loadingDocs = this.loadReadme();
		this._loadingEuler = this.loadEuler();
	}


	private async loadLanguages()
	{
		const data = await widgetSelf.cacheFile?.(
			widgetSelf.DB_STORE_NAME ?? 'FILE_DATA',
			'briancullinan2',
			'voidzero',
			'components/rosetta/languages.yml')
			?? await (await fetch('components/rosetta/languages.yml'))?.arrayBuffer();
		if(!data)
		{
			return;
		}
		const languages: any | undefined = data instanceof ArrayBuffer
			|| data instanceof Uint8Array
			? load(new TextDecoder().decode(data))
			: data instanceof FileSystemFileHandle
				? load(new TextDecoder().decode(await (await data.getFile()).arrayBuffer()))
				: undefined;
		this.items = Object.keys(languages ?? {}).map(k =>
		{
			languages[k].id = k;
			languages[k].label = k;
			return languages[k];
		}) as LanguageRuntime[];
		this._itemsChanged.emit(this.items);
	}


	private loadEulerZip(): Promise<JSZip>
	{
		this._fetchZip = fetch('3rdparty/rosetta-euler-master.zip').then(response => response.arrayBuffer());
		this._loadZip = this._fetchZip.then(zip => new JSZip().loadAsync(zip));
		return this._loadZip;
	}


	private async loadDocs(): Promise<string>
	{
		let data: string | ArrayBuffer | Uint8Array | FileSystemDirectoryHandle | FileSystemFileHandle | null | undefined;
		try
		{
			data = await widgetSelf.cacheFile?.(
				widgetSelf.DB_STORE_NAME ?? 'FILE_DATA',
				'seaneshbaugh',
				'rosetta-euler',
				'README.md');
		} catch(e)
		{
			console.error(e);
		}

		if(!data)
		{
			const zip = await this.loadEulerZip();
			data = await zip.file(/README\.md$/i)[0]?.async('text');
		}

		if(!data)
		{
			return '';
		} else if(data instanceof ArrayBuffer || data instanceof Uint8Array)
		{
			return new TextDecoder().decode(data);
		} else if(data instanceof FileSystemFileHandle)
		{
			return new TextDecoder().decode(await (await data.getFile()).arrayBuffer());
		} else if(typeof data === 'string')
		{
			return data;
		} else
		{
			return '';
		}
	}


	private async loadReadme()
	{
		const readMe = await this.loadDocs();
		if(!readMe)
		{
			return;
		}

		// wait for language list to go with docs
		await this._loading;

		this.langInstalls = {};
		readMe.split(/^###\s+/gmi).slice(1)
			.forEach(section =>
			{
				const split = section.split('\n');
				const lang = split[0].trim();
				if(lang.length > 0)
				{
					this.langInstalls[lang] = split.slice(1).join('\n').trim();

					for(const i of this.items)
					{
						if(i.label === lang || i.ace_mode?.toLowerCase() === lang.toLowerCase())
						{
							i.subtext = this.langInstalls[lang];
						}
					}
				}
			});

		this._itemsChanged.emit(this.items);
	}


	private async loadSampleCode(codeFolder: string)
	{
		// Pick a random problem folder or look through them to gather files
		const languageFolder = await widgetSelf.loadGitHubTree?.('seaneshbaugh', 'rosetta-euler', 'master', codeFolder);
		const problemFolders = Object.values(languageFolder ?? {});
		const randomFolder = problemFolders[Math.floor(Math.random() * problemFolders.length)];
		if(!randomFolder)
		{
			return;
		}
		const subTree = await widgetSelf.loadGitHubTree?.('seaneshbaugh', 'rosetta-euler', 'master', randomFolder.sha ?? randomFolder.path);
		if(!subTree)
		{
			return;
		}
		const fileNodes = Object.values(subTree ?? {}).filter(node => node.type === 'blob' || node.path);

		// 2. Map items against available extensions and fetch via cacheFile
		for(const i of this.items ?? [])
		{
			const extensions = /** @type {string[]} */ (i.extensions ?? [(i as any).extension ?? '']);

			// Find a file in the tree matching one of this language's extensions
			const matchedFile = fileNodes.find(node =>
				extensions.some(ext => node.path.toLowerCase().endsWith(ext.toLowerCase()))
			);

			if(matchedFile)
			{
				// Extract parts of path for cacheFile: owner, repo, filePath
				const filePath = matchedFile.path.startsWith('/') ? matchedFile.path.slice(1) : matchedFile.path;

				let fileContent: string | ArrayBuffer | Uint8Array | FileSystemDirectoryHandle | FileSystemFileHandle | null | undefined = await widgetSelf.cacheFile?.(
					widgetSelf.DB_STORE_NAME ?? 'FILE_DATA',
					'seaneshbaugh',
					'rosetta-euler',
					filePath
				);

				if(fileContent instanceof ArrayBuffer || fileContent instanceof Uint8Array)
				{
					fileContent = new TextDecoder().decode(fileContent);
				}
				if(fileContent instanceof FileSystemFileHandle)
				{
					fileContent = new TextDecoder().decode(await (await fileContent.getFile()).arrayBuffer());
				}

				if(typeof fileContent === 'string')
				{
					this.codeSamples[i.label] = fileContent;
					i.description = fileContent; // Store sample code in i.description as requested
				}
			}
		}
	}


	private async loadEuler()
	{
		try
		{
			// 1. Load root tree to get problem directories (e.g., 001, 002, ...)
			const rootTree = await widgetSelf.loadGitHubTree?.('seaneshbaugh', 'rosetta-euler', 'master', '/');
			const problemFolders = Object.values(rootTree ?? {})
				.filter(node => node.type === 'tree' || node.path);
			const fresh = [];
			// wait for languages list
			await this._loading;
			for(const f of problemFolders)
			{
				if(f.path.split('/').pop()?.[0] === '.' || f.path[0] === '.')
				{
					continue;
				}
				const item = this.items?.find(x =>
					x.ace_mode?.toLowerCase() === f.path.toLowerCase()
					|| x.id.toLowerCase() === f.path.toLowerCase());
				if(item)
				{
					fresh.push(this.loadSampleCode(f.sha ?? f.path));
					break;
				}
			}
			await Promise.all(fresh);
		} catch(e)
		{
			console.warn("[Euler GitHub Tree Load Failed, falling back to ZIP]:", e);
		}

		// 3. Fallback: If samples are missing, extract from ZIP backup
		const missingItems = (this.items ?? []).filter(i => !i.description);
		if(missingItems.length > 0)
		{
			try
			{
				const zip = await this.loadEulerZip();
				if(zip)
				{
					for(const i of missingItems)
					{
						const extensions = /** @type {string[]} */ (i.extensions ?? []);
						// Search files inside zip matching extensions
						for(const ext of extensions)
						{
							const matchedZipFile = Object.values(zip.files ?? {}).find(f => f.name.endsWith(ext) && !f.dir);

							if(matchedZipFile)
							{
								const text = await matchedZipFile.async('text');
								if(text)
								{
									this.codeSamples[i.label] = text;
									i.description = text;
									break;
								}
							}
						}
					}
				}
			} catch(zipErr)
			{
				console.error("[Euler ZIP Fallback Error]:", zipErr);
			}
		}
	}


	protected async onAfterAttach(msg: Message): Promise<void>
	{
		super.onAfterAttach(msg);
		this._itemsChanged.emit(this.items);
		await Promise.all([
			this._loading,
			this._loadingDocs,
			this._loadingEuler,
		]);
	}

	private getActiveLanguage(): LanguageRuntime | undefined
	{
		return this.items.find(i => i.id === this._selectedItemId);
	}

	protected async filterAndRender()
	{
		const active = this.getActiveLanguage();

		if(!active)
		{
			this.node.innerHTML = `
                <div class="lang-empty-state">
                    <i class="bx bx-code-alt"></i>
                    <p>Select a language from the sidebar to view a demo of system usage.</p>
                </div>`;
			return;
		}

		this.node.innerHTML = `
			<div class="lang-detail-content">
				<div class="lang-detail-header">
					<i class="${active.iconClass} lang-detail-icon-lg"></i>
					<div class="lang-detail-title-block">
						<h3>${active.label}</h3>
						<span class="lang-detail-version-tag">${active.version}</span>
					</div>
				</div>
				<div>
					<div class="lang-section-title">Test Code</div>
					<div class="lang-description-box">${this.highlightCode(active)}</div>
				</div>
				<div>
					<div class="lang-section-title">Setup Instructions</div>
					<div class="lang-subtext-box">${await marked.parse(active.subtext ?? '')}</div>
				</div>
			</div>
			<div class="lang-manager-footer">
				<div class="lang-runtime-stats">Storage: 42.8 MB • Memory Sandbox: Active</div>
				<button class="lang-action-btn" id="toggleInstallBtn">
					${active.installed ? 'Uninstall Runtime' : 'Install & Provision'}
				</button>
			</div>`;

		this.attachEventListeners();
	}


	private highlightCode(active: LanguageRuntime)
	{
		if(!active.description)
		{
			return 'Not available. Please enter your own code to view the abstract syntax tree (AST) and parse errors.';
		}

		this._highlighterCallback = () =>
		{
			// TODO: initiate worker earlier to also share "rosetta" capable languages
			const modelist = widgetSelf.ace?.require("ace/ext/modelist");
			const mode = modelist.modes.find((m: any) => m.extensions.split('|').find((e: string) => active.extensions?.includes(e.toLowerCase())));
			debugger;
			const results = this.colorizeCode(active.description ?? '', mode);
			console.log(results);

		};

		return '<pre>' + this.escapeHTML(active.description) + '</pre>';
	}


	private async colorizeCode(codeString: string, mode: string)
	{
		// Require Ace core headless components
		const Document = widgetSelf.ace?.require("ace/document").Document;
		const EditSession = widgetSelf.ace?.require("ace/edit_session").EditSession;

		// 1. Create a headless document with your code string
		const doc = new Document(codeString);

		// 2. Instantiate a session with your desired mode (e.g., JavaScript, Python, etc.)
		const session = new EditSession(doc, mode);

		// 3. Force background tokenizer to compute tokens up to the end
		session.bgTokenizer.start(0);
		const totalLines = session.getLength();

		// 4. Extract tokens line-by-line asynchronously or synchronously
		const tokenLinesByRow = [];

		for(let row = 0; row < totalLines; row++)
		{
			// bgTokenizer caches lines as they finish computing
			const lineTokens = session.bgTokenizer.lines[row] || session.getTokens(row);
			tokenLinesByRow.push(lineTokens);

			// Optional: Yield to event loop if processing massive files
			if(row % 100 === 0) await new Promise(resolve => setTimeout(resolve, 0));
		}

		return tokenLinesByRow;
	}


	private tokenizeCode(codeString: string, mode: string)
	{
		const Tokenizer = widgetSelf.ace?.require("ace/tokenizer").Tokenizer;
		const ModeClass = widgetSelf.ace?.require(mode).Mode; // Replace with your mode path
		const modeInstance = new ModeClass();

		// Extract the highlight rules from the mode
		const highlightRules = modeInstance.getHighlightRules().getRules();
		const tokenizer = new Tokenizer(highlightRules);

		// Tokenize line by line manually while tracking state
		const lines = codeString.split('\n');
		let currentState = "start";
		const tokenLines = [];

		for(const line of lines)
		{
			// getLineTokens returns { tokens: [...], state: "nextState" }
			const data = tokenizer.getLineTokens(line, currentState);
			tokenLines.push(data.tokens);
			currentState = data.state; // Carry over multi-line state
		}

		return tokenLines;
	}


	private attachEventListeners()
	{
		const actionBtn = this.node.querySelector('#toggleInstallBtn');
		if(actionBtn)
		{
			actionBtn.addEventListener('click', () =>
			{
				const active = this.getActiveLanguage();
				if(active)
				{
					active.installed = !active.installed;
					this._itemsChanged.emit([active]);
					this.filterAndRender();
				}
			});
		}
	}
}


export class LanguageListWidget extends widgetSelf.SidebarChangeWidget<LanguagesWidget, LanguageRuntime>
{
	private _filter?: string;

	protected override onAfterAttach(msg: Message): void
	{
		super.onAfterAttach(msg);
		this.node.addEventListener('click', (e) =>
		{
			const el = (e.target as HTMLElement)?.closest('.lang-item-card');
			// update installed status when checkbox is used
			if((e.target as HTMLElement).tagName === 'INPUT')
			{
				const item = this.items?.find(i => i.id === id);
				if(item)
				{
					item.installed = (e.target as HTMLInputElement).checked;
					this._itemsChanged.emit([item]);
				}
				return;
			}

			// update language demo when selected
			const id = el?.getAttribute('data-id');
			if(id)
			{
				this._selectedItemId = id;
				const item = this.items?.find(i => i.id === id);
				if(item)
				{
					this._selectedItem.emit(item);
				}
				this.filterAndRender();
			}

			if((e.target as HTMLButtonElement).value)
			{
				this._filter = (e.target as HTMLButtonElement).value;
				this.filterAndRender();
			}
		});
	}



	protected filterAndRender()
	{
		this.addClass('lang-list-pane');
		this.node.innerHTML = `
			<div class="lang-status-badge">
				${this.items?.filter(l => l.installed).length} Runtimes Active
			</div>
			<div class="lang-filter-pills">
				<button class="lang-pill" value="install">Install</button>
				<button class="lang-pill" value="euler">Euler</button>
				<button class="lang-pill"><i class="bx bx-x"></i> Clear</button>
			</div>
		${this.items?.filter(i =>
		{
			return !this._filter
				|| this._filter === 'install' && i.subtext
				|| this._filter === 'euler' && i.description;
		}).map(lang => `
			<div class="lang-item-card ${lang.id === this._selectedItemId ? 'active' : ''}" data-id="${lang.id}">
				<div class="lang-item-info">
					<i class="${lang.iconClass} lang-item-icon" ${lang.color ? `style="color: ${lang.color};"` : ''}></i>
					<div>
						<div class="lang-item-name">${lang.label}</div>
						<div class="lang-item-version">${lang.version ? lang.version + ' ' : ''}
						${lang.subtext ? '<span class="lang-pill">Install</span>' : ''}
						${lang.description ? '<span class="lang-pill">Euler</span>' : ''}
						</div>
					</div>
				</div>
				<input type="checkbox" class="lang-install-checkbox" data-id="${lang.id}" ${lang.installed ? 'checked' : ''} />
			</div>
		`).join('')}`;
	}

}

