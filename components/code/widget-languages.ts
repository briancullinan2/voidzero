import { Widget } from '@lumino/widgets';
import type { IMainpanelOptions, WidgetExtensionsWindow } from '../bundle/widget-extensions';
import { Message } from '@lumino/messaging';
import { load } from 'js-yaml';
import type { LocalWindow } from '../bundle/local.d';
import type { GithubWindow } from '../bundle/github.d';
import JSZip from 'jszip';
import { marked } from 'marked';

const widgetSelf: WidgetExtensionsWindow & LocalWindow & GithubWindow = self as unknown as any;


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
	private _loadingDocs?: Promise<string>;
	private langInstalls: Record<string, string> = {};

	constructor(title?: string, options?: IMainpanelOptions<LanguagesWidget, LanguageRuntime[]>)
	{
		super(title ?? 'Supported Languages', options);
		this.addClass('jp-LanguageManagerWidget');
		this.filterAndRender();
		this._sidebarWidget = new LanguageListWidget(LanguageListWidget.name, 'Languages', {
			itemsChanged: this.itemsChanged
		});
		this.addClass('lang-detail-pane');
		this._loading = (async () =>
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
		})();
	}

	protected async onAfterAttach(msg: Message): Promise<void>
	{
		super.onAfterAttach(msg);
		this._itemsChanged.emit(this.items);
		await this._loading;
		this._loadingDocs = (async () =>
		{
			const data = await widgetSelf.cacheFile?.(
				widgetSelf.DB_STORE_NAME ?? 'FILE_DATA',
				'seaneshbaugh',
				'rosetta-euler',
				'README.md')
				?? await new JSZip()
					.loadAsync(await (await fetch('rosetta-euler-master.zip'))
						.arrayBuffer())
					.then(zip => zip.file(/README\.md$/i)[0]?.async('text'));
			if(!data)
			{
				return '';
			} else if(data instanceof ArrayBuffer || data instanceof Uint8Array)
			{
				return new TextDecoder().decode(data);
			} else if(data instanceof FileSystemFileHandle)
			{
				return new TextDecoder().decode(await (await data.getFile()).arrayBuffer());
			} else
			{
				return '';
			}
		})();
		const readMe = await this._loadingDocs;
		if(readMe)
		{
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
		}
		this._itemsChanged.emit(this.items);
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
					<div class="lang-section-title">Runtime Description</div>
					<div class="lang-description-box">${active.description}</div>
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
				<button class="lang-pill"><i class="bx bx-x"></i> Clear</button>
			</div>
		${this.items?.filter(i =>
		{
			return !this._filter
				|| this._filter === 'install' && i.subtext;
		}).map(lang => `
			<div class="lang-item-card ${lang.id === this._selectedItemId ? 'active' : ''}" data-id="${lang.id}">
				<div class="lang-item-info">
					<i class="${lang.iconClass} lang-item-icon" ${lang.color ? `style="color: ${lang.color};"` : ''}></i>
					<div>
						<div class="lang-item-name">${lang.label}</div>
						<div class="lang-item-version">${lang.version ? lang.version + ' ' : ''}
						${lang.subtext ? '<span class="lang-pill">Install</span>' : ''}</div>
					</div>
				</div>
				<input type="checkbox" class="lang-install-checkbox" data-id="${lang.id}" ${lang.installed ? 'checked' : ''} />
			</div>
		`).join('')}`;
	}

}

