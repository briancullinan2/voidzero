import { Widget } from '@lumino/widgets';
import type { WidgetExtensionsWindow } from '../bundle/widget-extensions';

interface ASTTemplate
{
	id: string;
	name: string;
	category: 'structural' | 'semantic';
	description: string;
	snippet: string;
	shapeType: 'sink' | 'cache' | 'bootstrap' | 'dangling' | 'pci';
	results: { path: string; matchName: string; metadata: string; }[];
}

const widgetSelf: WidgetExtensionsWindow = self as unknown as any;

export class SearchCodeWidget extends widgetSelf.GenericSearchableWidget
{
	private _activeTemplateId: string = 'fs-sink';

	private _templates: ASTTemplate[] = [
		{
			id: 'fs-sink',
			name: 'FS Sink Trace',
			category: 'structural',
			description: 'Traces data flows leading directly into file system read/write sinks while ignoring local utility wrappers.',
			snippet: 'fs.writeFile(destPath, data, callback);',
			shapeType: 'sink',
			results: [
				{ path: 'src/workers/importer.ts', matchName: 'fs.writeFileSync(targetFile, payload)', metadata: '({ sink: "fs", level: 3, resolved: true })' },
				{ path: 'server/storage/sync.js', matchName: 'fs.createWriteStream(cacheKey)', metadata: '({ sink: "fs", level: 1, resolved: false })' }
			]
		},
		{
			id: 'cache-loop',
			name: 'Cache Iterator Loop',
			category: 'structural',
			description: 'Matches recurring cache validation loops evaluating outdated items before execution.',
			snippet: 'for(let i=0; i<files.length; i++) { if(outdated(files[i])) update(files[i]); }',
			shapeType: 'cache',
			results: [
				{ path: 'app/cache/manager.ts', matchName: 'CacheManager.prototype.validateAll', metadata: '({ boostrap: ["gutil"], load: "middleware", init: ["npm"] })' }
			]
		},
		{
			id: 'bootstrap',
			name: 'Framework Bootstrap',
			category: 'structural',
			description: 'Recognizes core application initialization sequences, dependency injections, and environment loaders.',
			snippet: 'function framework(env) { bootstrap(); load(env); init(); }',
			shapeType: 'bootstrap',
			results: [
				{ path: 'src/main.ts', matchName: 'initializeApp(runtimeEnv)', metadata: '({ bootstrap: ["express", "wasm"], load: "env_loader", init: ["core"] })' },
				{ path: 'engine/wasm/sys_main.c', matchName: 'sys_bootstrap_init()', metadata: '({ bootstrap: ["wasi"], load: "memory", init: ["engine"] })' }
			]
		},
		{
			id: 'dangling-conditional',
			name: 'Dangling Conditional',
			category: 'structural',
			description: 'Locates incomplete if/else switch blocks lacking proper return statements or fallback guards.',
			snippet: 'if (status === 200) { process(); } // Missing else/return',
			shapeType: 'dangling',
			results: [
				{ path: 'components/auth/validator.ts', matchName: 'validateTokenState(token)', metadata: '({ risk: "unhandled_branch", line: 142 })' }
			]
		},
		{
			id: 'pci-fields',
			name: 'PCI-DSS Field Pattern',
			category: 'semantic',
			description: 'Scans variable names, parameters, and database schemas matching sensitive cardholder data fields.',
			snippet: 'const { pan, cvv, expiryDate } = paymentPayload;',
			shapeType: 'pci',
			results: [
				{ path: 'server/billing/gateway.ts', matchName: 'extractCardMetadata(req.body)', metadata: '({ pci_match: ["pan", "cvv"], encrypted: false })' }
			]
		}
	];

	constructor()
	{
		super();
		this.addClass('jp-ASTMatcherWidget');
		this.updateContent();
	}

	private getActiveTemplate(): ASTTemplate
	{
		return this._templates.find(t => t.id === this._activeTemplateId) || this._templates[0];
	}

	private updateContent()
	{
		const active = this.getActiveTemplate();

		this.node.innerHTML = `
            <div class="ast-sidebar">
                <div class="ast-sidebar-header">AST Template Matcher</div>
                <div class="ast-category-title">Structural Patterns</div>
                ${this._templates.filter(t => t.category === 'structural').map(t => `
                    <div class="ast-template-item ${t.id === this._activeTemplateId ? 'active' : ''}" data-id="${t.id}">
                        <span>${t.name}</span>
                        <span class="ast-badge structural">structural</span>
                    </div>
                `).join('')}
                <div class="ast-category-title">Semantic / Metrics</div>
                ${this._templates.filter(t => t.category === 'semantic').map(t => `
                    <div class="ast-template-item ${t.id === this._activeTemplateId ? 'active' : ''}" data-id="${t.id}">
                        <span>${t.name}</span>
                        <span class="ast-badge semantic">semantic</span>
                    </div>
                `).join('')}
            </div>
            <div class="ast-main-content">
                <div class="ast-primary-view">
                    <div class="ast-shape-container">
                        <canvas class="ast-shape-preview" id="shapeCanvas" width="180" height="180"></canvas>
                    </div>
                    <div class="ast-metadata-panel">
                        <div class="ast-metadata-title">${active.name}</div>
                        <div class="ast-metadata-desc">${active.description}</div>
                        <div class="ast-code-snippet">${this.escapeHTML(active.snippet)}</div>
                    </div>
                </div>
                <div class="ast-secondary-view">
                    <div class="ast-results-header">
                        <span>Matched Nodes & Code Tree Results</span>
                        <span>${active.results.length} matches found</span>
                    </div>
                    <div class="ast-results-list">
                        ${active.results.map(r => `
                            <div class="ast-result-card">
                                <div class="ast-result-path">${r.path}</div>
                                <div class="ast-result-match">${r.matchName}</div>
                                <div class="ast-inspector-popup">Inspector: ${r.metadata}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

		this.attachEventListeners();
		this.drawShapeIcon(active.shapeType);
	}

	private attachEventListeners()
	{
		const items = this.node.querySelectorAll('.ast-template-item');
		items.forEach(item =>
		{
			item.addEventListener('click', (e) =>
			{
				const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
				if(id)
				{
					this._activeTemplateId = id;
					this.updateContent();
				}
			});
		});
	}

	private drawShapeIcon(type: string)
	{
		const canvas = this.node.querySelector('#shapeCanvas') as HTMLCanvasElement;
		if(!canvas) return;
		const ctx = canvas.getContext('2d');
		if(!ctx) return;

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.strokeStyle = '#38bdf8';
		ctx.fillStyle = 'rgba(56, 189, 248, 0.1)';
		ctx.lineWidth = 2;

		if(type === 'sink')
		{
			// Funnel shape leading to a node sink
			ctx.beginPath();
			ctx.moveTo(30, 30); ctx.lineTo(150, 30); ctx.lineTo(110, 100); ctx.lineTo(70, 100); ctx.closePath();
			ctx.fill(); ctx.stroke();
			ctx.beginPath(); ctx.arc(90, 140, 20, 0, Math.PI * 2);
			ctx.fillStyle = '#ef4444'; ctx.fill(); ctx.stroke();
		} else if(type === 'cache')
		{
			// Circular loop / iteration nodes
			ctx.beginPath();
			ctx.arc(90, 90, 50, 0, Math.PI * 2);
			ctx.stroke();
			ctx.beginPath();
			ctx.arc(90, 40, 12, 0, Math.PI * 2);
			ctx.fillStyle = '#34d399'; ctx.fill(); ctx.stroke();
		} else if(type === 'bootstrap')
		{
			// Hierarchical tiered tree shape
			ctx.beginPath();
			ctx.arc(90, 40, 16, 0, Math.PI * 2);
			ctx.arc(50, 100, 12, 0, Math.PI * 2);
			ctx.arc(130, 100, 12, 0, Math.PI * 2);
			ctx.fillStyle = '#60a5fa'; ctx.fill(); ctx.stroke();
		} else if(type === 'dangling')
		{
			// Broken branch shape
			ctx.beginPath();
			ctx.moveTo(90, 30); ctx.lineTo(50, 90); ctx.moveTo(90, 30); ctx.lineTo(130, 90);
			ctx.stroke();
			ctx.beginPath(); ctx.arc(130, 90, 10, 0, Math.PI * 2);
			ctx.fillStyle = '#f59e0b'; ctx.fill(); ctx.stroke();
		} else if(type === 'pci')
		{
			// Shield / field pattern grid
			ctx.strokeRect(45, 45, 90, 90);
			ctx.fillRect(60, 60, 60, 20);
		}
	}
}
