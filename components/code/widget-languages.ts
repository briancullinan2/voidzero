import { Widget } from '@lumino/widgets';

interface LanguageRuntime
{
	id: string;
	label: string;
	version: string;
	iconClass: string;
	installed: boolean;
	subtext: string;
	description: string;
}

export class LanguagesWidget extends Widget
{
	private _activeLangId: string = 'typescript';

	private _languages: Record<string, LanguageRuntime> = {
		'typescript': {
			id: 'typescript',
			label: 'TypeScript / Node.js Engine',
			version: 'v5.4.2-wasm',
			iconClass: 'bx bxl-typescript',
			installed: true,
			subtext: 'Depends on V8 worker runtimes, AST transpiler wrappers, IDB module caches, and Webpack compiler bindings.',
			description: 'Enables real-time client-side code transformation, type checking, custom AST template matching, and browser-based script execution.'
		},
		'python': {
			id: 'python',
			label: 'Python WebAssembly (Pyodide)',
			version: 'v3.11.4',
			iconClass: 'bx bxl-python',
			installed: true,
			subtext: 'Depends on Emscripten virtual file system, NumPy/SciPy WASM builds, and pip package memory mounts.',
			description: 'Provides fully sandboxed Python script evaluation, data science notebook parsing, and script stepping straight inside browser Web Workers.'
		},
		'c_cpp': {
			id: 'c_cpp',
			label: 'C / C++ WASI SDK',
			version: 'LLVM 18.1',
			iconClass: 'bx bxl-c-plus-plus',
			installed: false,
			subtext: 'Depends on Clang/LLVM toolchain, WASI system headers, sys_main.c emulation layers, and makefile build pipelines.',
			description: 'Compiles native high-performance game engines (like Quake 3 WASM ports), custom memory allocators, and binary parsers directly in-browser.'
		},
		'rust': {
			id: 'rust',
			label: 'Rust WASM Toolchain',
			version: '1.78.0-nightly',
			iconClass: 'bx bxl-rust',
			installed: false,
			subtext: 'Depends on rustc target wasm32-unknown-wasi, cargo package registry proxy, and memory safety verifiers.',
			description: 'Compiles memory-safe systems modules, high-speed AST traversal parsers, and multi-threaded Web Workers with strict type guarantees.'
		}
	};

	constructor()
	{
		super();
		this.addClass('jp-LanguageManagerWidget');
		this.updateContent();
	}

	private getActiveLanguage(): LanguageRuntime
	{
		return this._languages[this._activeLangId] || this._languages['typescript'];
	}

	private updateContent()
	{
		const active = this.getActiveLanguage();

		this.node.innerHTML = `
            <div class="lang-manager-header">
                <div class="lang-manager-title-group">
                    <h2>OS Environment & Language Runtimes</h2>
                    <p>Configure and provision browser-native compilation stacks and execution engines.</p>
                </div>
                <div class="lang-status-badge">
                    ${Object.values(this._languages).filter(l => l.installed).length} Runtimes Active
                </div>
            </div>
            <div class="lang-manager-body">
                <div class="lang-list-pane">
                    ${Object.values(this._languages).map(lang => `
                        <div class="lang-item-card ${lang.id === this._activeLangId ? 'active' : ''}" data-id="${lang.id}">
                            <div class="lang-item-info">
                                <i class="${lang.iconClass} lang-item-icon"></i>
                                <div>
                                    <div class="lang-item-name">${lang.label}</div>
                                    <div class="lang-item-version">${lang.version}</div>
                                </div>
                            </div>
                            <input type="checkbox" class="lang-install-checkbox" data-id="${lang.id}" ${lang.installed ? 'checked' : ''} />
                        </div>
                    `).join('')}
                </div>
                <div class="lang-detail-pane">
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
                            <div class="lang-section-title">System Dependencies & Architecture</div>
                            <div class="lang-subtext-box">${active.subtext}</div>
                        </div>
                    </div>
                    <div class="lang-manager-footer">
                        <div class="lang-runtime-stats">Storage: 42.8 MB • Memory Sandbox: Active</div>
                        <button class="lang-action-btn" id="toggleInstallBtn">
                            ${active.installed ? 'Uninstall Runtime' : 'Install & Provision'}
                        </button>
                    </div>
                </div>
            </div>
        `;

		this.attachEventListeners();
	}

	private attachEventListeners()
	{
		// Switch active inspector view on card click
		const cards = this.node.querySelectorAll('.lang-item-card');
		cards.forEach(card =>
		{
			card.addEventListener('click', (e) =>
			{
				// Ignore if checkbox itself was clicked directly
				if((e.target as HTMLElement).tagName === 'INPUT') return;
				const id = card.getAttribute('data-id');
				if(id)
				{
					this._activeLangId = id;
					this.updateContent();
				}
			});
		});

		// Toggle install status via checkbox or button
		const checkboxes = this.node.querySelectorAll('.lang-install-checkbox');
		checkboxes.forEach(cb =>
		{
			cb.addEventListener('change', (e) =>
			{
				const id = cb.getAttribute('data-id');
				if(id && this._languages[id])
				{
					this._languages[id].installed = (e.target as HTMLInputElement).checked;
					this.updateContent();
				}
			});
		});

		const actionBtn = this.node.querySelector('#toggleInstallBtn');
		if(actionBtn)
		{
			actionBtn.addEventListener('click', () =>
			{
				const active = this.getActiveLanguage();
				active.installed = !active.installed;
				this.updateContent();
			});
		}
	}
}
