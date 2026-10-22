import type { IMainpanelOptions, WidgetExtensionsWindow } from '../bundle/widget-extensions';
import { Message } from '@lumino/messaging';
import { load } from 'js-yaml';
import type { LocalWindow } from '../bundle/local.d';
import type { GithubWindow } from '../bundle/github.d';
import JSZip from 'jszip';
import { marked } from 'marked';
import type { AceEditor, AceSession, EditorWindow } from '../editor/widget.d';
import type { LuminoLayoutWindow } from '../bundle/lumino.d';
import type { GlobalToolbarsWindow } from '../bundle/menu.d';
import { GitHubFileEntry } from '../bundle/github-types';
import { TabPanel, Widget } from '@lumino/widgets';

const widgetSelf: LuminoLayoutWindow & EditorWindow & WidgetExtensionsWindow
	& GlobalToolbarsWindow & LocalWindow & GithubWindow = self as unknown as any;


export interface LanguageRuntime
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
	grammars?: GitHubFileEntry[] | JSZip.JSZipObject[];
}

export interface AceMode
{
	name: string;
	caption: string;
	extensions: string;
	mode: string;
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
	private codeFiles: Record<string, JSZip.JSZipObject> = {};
	private loadedGrammars: Record<string, string> = {};
	private grammarMapping: Record<string, GitHubFileEntry[]> = {};
	private grammarFiles: Record<string, JSZip.JSZipObject[]> = {};
	private _highlighterCallback?: Promise<void>;
	private _loadAce: Promise<void>;
	private modes?: Record<string, AceMode>;
	private _loadGrammars: Promise<void>;
	private folderTree?: Record<string, GitHubFileEntry>;
	private _fetchGrammars?: Promise<ArrayBuffer>;
	private _loadGrammarsZip?: Promise<JSZip>;
	private codeTab?: Widget;
	private setupTab?: Widget;
	private tabPanel?: TabPanel;
	private header?: Widget;
	private footer?: Widget;
	private emptyDiv?: HTMLDivElement;
	private parserTab?: Widget;
	private lexerTab?: Widget;
	private emptyCode?: HTMLDivElement;

	constructor(title?: string, options?: IMainpanelOptions<LanguagesWidget, LanguageRuntime[]>)
	{
		super(title ?? 'Supported Languages', options);
		this.addClass('jp-LanguageManagerWidget');
		this._sidebarWidget = new LanguageListWidget(LanguageListWidget.name, 'Languages', {
			itemsChanged: this.itemsChanged
		});
		this.addClass('lang-detail-pane');
		this.buildTabs();
		this.filterAndRender();
		this._loading = this.loadLanguages();
		this._loadingDocs = this.loadReadme();
		this._loadingEuler = this.loadEuler();
		this._loadAce = this.loadAce();
		this._loadGrammars = this.loadGrammars();
	}


	private buildTabs()
	{
		// 1. Create the TabPanel
		this.tabPanel = new TabPanel();

		// 2. Create your content widgets
		if(!this.codeTab)
		{
			this.codeTab = new Widget();
			this.codeTab.addClass('lang-description-box');
			this.codeTab.title.label = 'Test Code';
			this.codeTab.title.iconClass = 'bx bx-code-alt';
			this.codeTab.node.textContent = 'Content for Tab 1';
		}

		if(!this.setupTab)
		{

			this.setupTab = new Widget();
			this.setupTab.addClass('lang-subtext-box');
			this.setupTab.title.label = 'Install';
			this.setupTab.title.iconClass = 'bx bx-cursor-click';
			this.setupTab.node.textContent = 'Content for Tab 2';
		}

		if(!this.parserTab)
		{

			this.parserTab = new Widget();
			this.parserTab.addClass('lang-parser-box');
			this.parserTab.title.label = 'Parser';
			this.parserTab.title.iconClass = 'bx bx-lambda';
			this.parserTab.node.textContent = 'Content for Tab 3';
		}

		if(!this.lexerTab)
		{

			this.lexerTab = new Widget();
			this.lexerTab.addClass('lang-lexer-box');
			this.lexerTab.title.label = 'Lexer';
			this.lexerTab.title.iconClass = 'bx bx-letter-spacing-alt';
			this.lexerTab.node.textContent = 'Content for Tab 4';
		}

		// or tabPanel.currentIndex = 0;
		if(!this.header)
		{
			this.header = new Widget();
			this.header.addClass('lang-detail-header');
		}
		if(!this.footer)
		{
			this.footer = new Widget();
			this.footer.addClass('lang-manager-footer');
		}

	}


	private unbuildTabs()
	{
		if(this.codeTab)
		{
			this.tabPanel?.layout?.removeWidget(this.codeTab);
			this.codeTab.parent = null;
		}
		if(this.setupTab)
		{
			this.tabPanel?.layout?.removeWidget(this.setupTab);
			this.setupTab.parent = null;
		}
		if(this.parserTab)
		{
			this.tabPanel?.layout?.removeWidget(this.parserTab);
			this.parserTab.parent = null;
		}
		if(this.lexerTab)
		{
			this.tabPanel?.layout?.removeWidget(this.lexerTab);
			this.lexerTab.parent = null;
		}
	}


	private async loadAce()
	{
		let aceEditor: AceEditor | undefined = widgetSelf.ace;
		if(!aceEditor)
		{
			await widgetSelf.preloadDependencies?.(['/ace/ace-noconflict.js']);
			aceEditor = widgetSelf.ace;
			if(aceEditor)
			{
				aceEditor.config.setModuleUrl(
					"ace/ext/keybinding_menu",
					"/ace/ext-keybinding_menu.js"
				);
				aceEditor.config.set('basePath', '/ace');
				aceEditor.config.set('modePath', '/ace');
				aceEditor.config.set('workerPath', '/ace');
				aceEditor.config.set('themePath', '/ace');

				await this.loadModes();
				await this.loadTheme();
			}
		}
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
		const languages: Record<string, LanguageRuntime> = data instanceof ArrayBuffer
			|| data instanceof Uint8Array
			? load(new TextDecoder().decode(data)) as Record<string, LanguageRuntime>
			: data instanceof FileSystemFileHandle
				? load(new TextDecoder().decode(await (await data.getFile()).arrayBuffer())) as Record<string, LanguageRuntime>
				: {};
		await this._loadAce;
		this.items = Object.keys(languages ?? {}).map(k =>
		{
			if(languages[k].ace_mode === 'text')
			{
				languages[k].ace_mode = undefined;
			}
			if(languages[k].ace_mode)
			{
				languages[k].ace_mode = this.modes?.[languages[k].ace_mode]
					? languages[k].ace_mode : undefined;
			}
			languages[k].id = k;
			languages[k].label = k;
			return languages[k];
		}) as LanguageRuntime[];
		this._itemsChanged.emit(this.items);
	}


	private loadEulerZip(): Promise<JSZip>
	{
		this._fetchGrammars = fetch('3rdparty/rosetta-euler-master.zip').then(response => response.arrayBuffer());
		this._loadGrammarsZip = this._fetchGrammars.then(zip => new JSZip().loadAsync(zip));
		return this._loadGrammarsZip;
	}


	private loadGrammarZip(): Promise<JSZip>
	{
		this._fetchZip = fetch('3rdparty/grammars-v4-master.zip').then(response => response.arrayBuffer());
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


	private async loadSampleCode(codeFolder: string, path: string, item: LanguageRuntime)
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

		// Find a file in the tree matching one of this language's extensions
		const matchedFile = fileNodes.find(node =>
			item.extensions?.some(ext => node.path.toLowerCase().endsWith(ext.toLowerCase()))
		);

		if(matchedFile)
		{
			// Extract parts of path for cacheFile: owner, repo, filePath
			const filePath = matchedFile.path.startsWith('/')
				? matchedFile.path.slice(1)
				: matchedFile.path;

			let fileContent: string | ArrayBuffer | Uint8Array | FileSystemDirectoryHandle
				| FileSystemFileHandle | null | undefined = await widgetSelf.cacheFile?.(
					widgetSelf.DB_STORE_NAME ?? 'FILE_DATA',
					'seaneshbaugh',
					'rosetta-euler',
					path + '/' + randomFolder.path + '/' + filePath,
					null, true
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
				this.codeSamples[item.label.toLowerCase()] = fileContent;
				item.description = fileContent;
			}
		}
	}


	private async loadGrammars()
	{
		try
		{
			if(!this.folderTree)
			{
				this.folderTree = await widgetSelf.loadGitHubTree?.('antlr', 'grammars-v4', 'master');
			}

			await this._loading;

			const nodes = Object.values(this.folderTree ?? {});
			const fileNodes = nodes.filter(node => node.type === 'blob' && node.path?.toLowerCase().endsWith('.g4'));
			this.items.forEach(item =>
			{
				const matchedFiles = fileNodes.filter(node => node.path.startsWith(item.ace_mode + '/')
					|| node.path.startsWith(item.label.toLowerCase() + '/'));
				this.grammarMapping[item.label.toLowerCase()] = matchedFiles;
				item.grammars = matchedFiles;
			});

			await this.loadGrammarZip();

		} catch(e)
		{

		}

		const zip = await this.loadGrammarZip();
		if(!zip)
		{
			return;
		}

		const languageDirectories = Object.values(zip.files ?? {})
			.filter(f => f.name.endsWith('.g4'))
			.reduce((obj: Record<string, JSZip.JSZipObject[]>, i: JSZip.JSZipObject) =>
			{
				const code = i.name.replace('grammars-v4-master/', '').split('/')[0] ?? i.name;
				if(!obj[code])
				{
					obj[code] = [];
				}
				obj[code].push(i);
				return obj;
			}, {});

		await this._loading;

		for(const i of this.items ?? [])
		{
			const matchedZipFiles = i.ace_mode
				? languageDirectories[i.ace_mode]
				: languageDirectories[i.label.toLowerCase()];
			i.grammars = matchedZipFiles;
			this.grammarFiles[i.ace_mode ?? i.label.toLowerCase()] = matchedZipFiles;
		}

	}


	private async loadGrammar(codeFolder: string, path: string, item: LanguageRuntime)
	{
		// 1. Load the language folder from antlr/grammars-v4
		if(!this.folderTree)
		{
			await this._loadGrammars;
		}
		if(!this.folderTree) return;

		const nodes = Object.values(this.folderTree ?? {});

		// Find all blob nodes ending with .g4 at this level
		const fileNodes = nodes.filter(node => node.type === 'blob' && node.path?.toLowerCase().endsWith('.g4'));
		const matchedFile = fileNodes.find(node => node.path.startsWith(item.ace_mode + '/')
			|| node.path.startsWith(item.label.toLowerCase() + '/'));

		if(!matchedFile) return;

		// 3. Construct clean cache path for antlr/grammars-v4
		const filePath = matchedFile.path.startsWith('/')
			? matchedFile.path.slice(1)
			: matchedFile.path;
		const fullCachePath = path ? `${path}/${filePath}` : filePath;

		let fileContent: string | ArrayBuffer | Uint8Array | FileSystemDirectoryHandle
			| FileSystemFileHandle | null | undefined = await widgetSelf.cacheFile?.(
				widgetSelf.DB_STORE_NAME ?? 'FILE_DATA',
				'antlr',
				'grammars-v4',
				fullCachePath,
				null, true
			);

		if(fileContent instanceof ArrayBuffer || fileContent instanceof Uint8Array)
		{
			fileContent = new TextDecoder().decode(fileContent);
		}
		else if(fileContent instanceof FileSystemFileHandle)
		{
			fileContent = new TextDecoder().decode(await (await fileContent.getFile()).arrayBuffer());
		}

		if(typeof fileContent === 'string')
		{
			this.loadedGrammars[fullCachePath] = fileContent;
			// TODO: insert grammar tabs into details page
			// item.grammars = fileContent;
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
			const fresh: Promise<void>[] = [];
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
					// fresh.push(this.loadSampleCode(f.sha ?? f.path, f.path, item));
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
				if(!zip)
				{
					return;
				}

				for(const i of missingItems)
				{
					const extensions = /** @type {string[]} */ (i.extensions ?? []);
					// Search files inside zip matching extensions
					for(const ext of extensions)
					{
						const matchedZipFile = Object.values(zip.files ?? {})
							.find(f => f.name.endsWith(ext) && !f.dir);

						if(matchedZipFile)
						{
							this.codeFiles[matchedZipFile.name] = matchedZipFile;
							this.codeFiles[i.label] = matchedZipFile;
							this.codeFiles[i.ace_mode ?? i.label?.toLowerCase()] = matchedZipFile;
							i.description = matchedZipFile.name;
							// TODO: bail out early and only load text if they click on the language
							// const text = await matchedZipFile.async('text');
							// if(text)
							// {
							// 	this.codeSamples[i.label] = text;
							// 	i.description = text;
							// 	break;
							// }
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

		// Attach it to your DOM container
		if(this.header)
			Widget.attach(this.header, this.node);
		if(this.tabPanel)
		{
			Widget.attach(this.tabPanel, this.node);
			if(this.codeTab)
			{
				this.tabPanel.addWidget(this.codeTab);
				this.tabPanel.currentWidget = this.codeTab;
			}
			if(this.setupTab)
			{
				this.tabPanel.addWidget(this.setupTab);
			}
			if(this.parserTab)
			{
				this.tabPanel.addWidget(this.parserTab);
			}
			if(this.lexerTab)
			{
				this.tabPanel.addWidget(this.lexerTab);
			}
		}
		if(this.footer)
			Widget.attach(this.footer, this.node);

		await Promise.all([
			this._loading,
			this._loadingDocs,
			this._loadingEuler,
			this._loadAce,
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
			if(!this.emptyDiv)
			{
				this.emptyDiv = document.createElement('div');
				this.emptyDiv.classList.add('lang-empty-state');
				this.emptyDiv.innerHTML = `
					<i class="bx bx-code-alt"></i>
					<p>Select a language from the sidebar to view a demo of system usage.</p>
				`;
				this.node.appendChild(this.emptyDiv);
			}
			this.emptyDiv.style.display = 'block';
			if(this.tabPanel)
			{
				this.tabPanel.node.style.display = 'none';
			}
			if(this.header)
			{
				this.header.node.style.display = 'none';
			}
			if(this.footer)
			{
				this.footer.node.style.display = 'none';
			}
			return;
		} else if(this.emptyDiv)
		{
			this.emptyDiv.style.display = 'none';
			if(this.tabPanel)
			{
				this.tabPanel.node.style.display = 'block';
			}
		}

		if(this.header)
		{
			this.header.node.style.display = 'flex';
			this.header.node.innerHTML = `
				<i class="${active.iconClass} lang-detail-icon-lg"></i>
				<div class="lang-detail-title-block">
					<h3>${active.label}</h3>
					${active.version ? `<span class="lang-detail-version-tag">${active.version}</span>` : ''}
					${active.subtext ? '<span class="lang-pill">Install</span>' : ''}
					${active.description ? '<span class="lang-pill">Euler</span>' : ''}
					${active.ace_mode ? '<span class="lang-pill">Ace</span>' : ''}
					${active.grammars && active.grammars.length > 0 ? '<span class="lang-pill">Grammar</span>' : ''}

				</div>`;
		}

		if(this.codeTab)
		{
			if(active.description && this.codeFiles[active.description])
			{
				this.codeTab.removeClass('lang-empty-state');
				active.description = await this.codeFiles[active.description].async('text');
				this.codeTab.node.innerHTML = this.highlightCode(active);
			} else if(active.description)
			{
				this.codeTab.removeClass('lang-empty-state');
				this.codeTab.node.innerHTML = this.highlightCode(active);
			} else
			{
				if(!this.emptyCode)
				{
					this.emptyCode = document.createElement('div');
					this.emptyCode.classList.add('lang-empty-state');
					this.emptyCode.innerHTML = `
						<i class="bx bx-code-alt"></i>
						<p>No sample code available.
						Click here to try and generate sample code with an LLM model.
						<br /><button>Generate Code</button></p>`;
				}
				this.codeTab.node.innerHTML = '';
				this.codeTab.node.style.display = 'flex';
				this.codeTab.node.style.flexDirection = 'column';
				this.codeTab.node.appendChild(this.emptyCode);
			}
		}

		if(this.parserTab)
		{
			const zipFile = this.grammarFiles[active.ace_mode ?? active.label?.toLowerCase()]
				?.filter(f => !f.name.toLowerCase().includes('lexer'))[0];
			if(zipFile)
			{
				await this._loadAce;
				const results = await this.colorizeCode(await zipFile.async('text'), 'ace/mode/antlr_worker', zipFile.name, this.parserTab.node);

				//if('async' in active.grammars[0])
				if(results)
				{
					this.parserTab.node.innerHTML = '<pre>' + this.renderTokensToAceHtml(results) + '</pre>';
				}
			}
		}

		if(this.lexerTab)
		{
			const zipFile = this.grammarFiles[active.ace_mode ?? active.label?.toLowerCase()]
				?.filter(f => f.name.toLowerCase().includes('lexer'))[0];
			if(zipFile)
			{
				await this._loadAce;
				const results = await this.colorizeCode(await zipFile.async('text'), 'ace/mode/antlr_worker', zipFile.name, this.lexerTab.node);
				if(results)
				{
					this.lexerTab.node.innerHTML = '<pre>' + this.renderTokensToAceHtml(results) + '</pre>';
				}
				this.tabPanel?.stackedPanel.addWidget(this.lexerTab);
				this.tabPanel?.tabBar.addTab(this.lexerTab.title);
			} else
			{
				if(this.tabPanel && this.setupTab
					&& this.tabPanel.currentWidget === this.lexerTab)
				{
					this.tabPanel.currentWidget = this.setupTab;
				}
				this.tabPanel?.stackedPanel.layout?.removeWidget(this.lexerTab);
				this.tabPanel?.tabBar.removeTab(this.lexerTab.title);
			}
		}

		if(this.setupTab)
		{
			this.setupTab.node.innerHTML = await marked.parse(active.subtext ?? '');
		}

		this.tabPanel?.tabBar.update();
		this.tabPanel?.update();

		if(this.footer)
		{
			this.footer.node.style.display = 'flex';
			this.footer.node.innerHTML = `
				<div class="lang-runtime-stats">Storage: 42.8 MB • Memory Sandbox: Active</div>
				<button class="lang-action-btn" id="toggleInstallBtn">
					${active.installed ? 'Uninstall Runtime' : 'Install Language'}
				</button>`;
		}

		for(const c of this.tabPanel?.node.classList ?? [])
		{
			if(c.startsWith('ace-'))
			{
				this.tabPanel?.node.classList.remove(c);
			}
			const theme = widgetSelf.settingsManager?.get('editor', 'theme');
			this.tabPanel?.node.classList.add('ace-' + (theme.split('/').pop() ?? theme));
		}

		this.attachEventListeners();
	}


	private highlightCode(active: LanguageRuntime)
	{
		if(!active.description)
		{
			return 'No sample code available. Click here to try and generate sample code with an LLM model. <br /><button>Generate Code</button>';
		}

		this._highlighterCallback = (async () =>
		{
			// TODO: initiate worker earlier to also share "rosetta" capable languages
			const mode = Object.values(this.modes ?? {}).find((m: any) =>
				m.name.toLowerCase() === active.ace_mode
				|| m.caption.toLowerCase() === active.label
				|| m.extensions.split('|').find((e: string) =>
					active.extensions?.includes(e.toLowerCase())));
			if(mode)
			{
				await this._loadAce;
				const code = this.codeFiles[active.ace_mode ?? active.label.toLowerCase()];
				const results = await this.colorizeCode(active.description ?? '', mode.mode ?? '', code.name, this.codeTab?.node);
				if(this.codeTab)
				{
					const theme = widgetSelf.settingsManager?.get('editor', 'theme');
					this.codeTab.node.innerHTML = `<pre>` + this.renderTokensToAceHtml(results) + '</pre>';
				}
			}
		})();

		return '<pre>' + this.escapeHTML(active.description) + '</pre>';
	}


	/**
	 * Converts Ace token lines into Ace-compatible styled HTML
	 */
	private renderTokensToAceHtml(tokenLines: Array<Array<{ type: string, value: string; }>>): string
	{
		if(!Array.isArray(tokenLines)) return '';

		return tokenLines.map(lineTokens =>
		{
			if(!Array.isArray(lineTokens) || lineTokens.length === 0)
			{
				return '<div class="ace_line">&nbsp;</div>';
			}

			const lineHtml = lineTokens.map(token =>
			{
				// 1. Escape HTML entities in the token value for safety
				const escapedValue = (token.value || '')
					.replace(/&/g, "&amp;")
					.replace(/</g, "&lt;")
					.replace(/>/g, "&gt;")
					.replace(/"/g, "&quot;")
					.replace(/'/g, "&#039;");

				// 2. Convert dot-separated token types into Ace classes
				// e.g. "keyword.control" -> "ace_keyword ace_control"
				const cssClasses = token.type
					? token.type.split('.').map(t => `ace_${t}`).join(' ')
					: 'ace_text';

				return `<span class="${cssClasses}">${escapedValue}</span>`;
			}).join('');

			return `<div class="ace_line">${lineHtml}</div>`;
		}).join('');
	}


	private async loadModes()
	{
		return await new Promise<Record<string, AceMode> | undefined>(resolve =>
		{
			widgetSelf.ace?.config.loadModule(['ext', 'ace/ext/modelist'],
				(...args: any[]) =>
				{
					if(args[0] && args[0].modes instanceof Array)
					{
						this.modes = args[0].modes.reduce((obj: Record<string, AceMode>, v: AceMode) =>
						{
							obj[v.name] = v;
							return obj;
						}, {});
					}
					resolve(this.modes);
				});
		});
	}


	private async loadTheme()
	{
		let theme: string | undefined;
		theme = await new Promise<string | undefined>(resolve =>
		{
			const theme = widgetSelf.settingsManager?.get('editor', 'theme');
			widgetSelf.ace?.config.loadModule(['theme', theme],
				function (...args: any[])
				{
					const theme = args[0];
					resolve(theme.cssText);
				});
		});

		if(theme)
		{
			// Create a style element and inject the theme's CSS rules
			const styleId = 'ace-theme-css-override';
			let styleEl = document.getElementById(styleId);

			if(!styleEl)
			{
				styleEl = document.createElement('style');
				styleEl.id = styleId;
				document.head.appendChild(styleEl);
			}

			styleEl.textContent = theme;
		}
	}


	private async colorizeCode(codeString: string, mode: string, file: string, node: HTMLElement | undefined)
	{
		// Require Ace core headless components
		const Document = widgetSelf.ace?.require('ace/document').Document;
		const EditSession = widgetSelf.ace?.require('ace/edit_session').EditSession;

		// 1. Create a headless document with your code string
		const doc = new Document(codeString);

		const languageMode = await new Promise<any>(resolve =>
		{
			widgetSelf.ace?.config.loadModule(['mode', mode],
				(...args: any[]) =>
				{
					return resolve(new args[0].Mode());
				});
		});

		// 2. Instantiate a session with your desired mode (e.g., JavaScript, Python, etc.)
		const session: AceSession = new EditSession(doc, languageMode);
		session.workspaceFileId = file;
		await new Promise(resolve =>
		{
			session.bgTokenizer.start(0);
			session.bgTokenizer.on('update', (e, emitter) =>
			{
				if(node)
				{
					node.innerHTML = `<pre>` + this.renderTokensToAceHtml(session.bgTokenizer.lines) + '</pre>';
					return resolve(undefined);
				}
			});


			widgetSelf.ace?.require(["ace/mode/antlr_worker"], (antlrWorkerModule) =>
			{
				if(antlrWorkerModule && antlrWorkerModule.switchActiveSession)
				{
					antlrWorkerModule.switchActiveSession(session);
				}
			});
		});


		const totalLines = session.getLength();
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
		const Tokenizer = widgetSelf.ace?.require('ace/tokenizer').Tokenizer;
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
				<button class="lang-pill" value="ace">Ace</button>
				<button class="lang-pill" value="grammar">Grammar</button>
				<button class="lang-pill" value="programming">Programming</button>
				<button class="lang-pill" value="data">Data</button>
				<button class="lang-pill" value="markup">Markup</button>
				<button class="lang-pill" value="all"><i class="bx bx-x"></i> Clear</button>
				<button class="lang-pill" value="missing">Missing</button>
			</div>
		${this.items?.filter(i =>
		{
			return !this._filter
				|| this._filter === 'all'
				|| this._filter === 'install' && i.subtext
				|| this._filter === 'euler' && i.description
				|| this._filter === 'ace' && i.ace_mode
				|| this._filter === 'grammar' && i.grammars && i.grammars.length > 0
				|| this._filter === 'missing' && (
					!i.subtext || !i.description || !i.grammars
					|| i.grammars.length === 0
				);
		}).map(lang => `
			<div class="lang-item-card ${lang.id === this._selectedItemId ? 'active' : ''}" data-id="${lang.id}">
				<div class="lang-item-info">
					<i class="${lang.iconClass} lang-item-icon" ${lang.color ? `style="color: ${lang.color};"` : ''}></i>
					<div>
						<div class="lang-item-name">${lang.label}</div>
						<div class="lang-item-version">${lang.version ? lang.version + ' ' : ''}
						${lang.subtext ? '<span class="lang-pill">Install</span>' : ''}
						${lang.description ? '<span class="lang-pill">Euler</span>' : ''}
						${lang.ace_mode ? '<span class="lang-pill">Ace</span>' : ''}
						${lang.grammars && lang.grammars.length > 0 ? '<span class="lang-pill">Grammar</span>' : ''}
						</div>
					</div>
				</div>
				<input type="checkbox" class="lang-install-checkbox" data-id="${lang.id}" ${lang.installed ? 'checked' : ''} />
			</div>
		`).join('')}`;
	}

}

