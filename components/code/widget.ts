import { Widget } from '@lumino/widgets';
import Graph from 'graphology';
import Sigma from 'sigma';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import { WillowEdge, WillowNode, WillowWidget } from './widget-willow';
import * as THREE from 'three';
import { SemanticWidget } from './widget-semantic';
import { SearchCodeWidget } from './widget-search';
import type { WidgetExtensionsWindow } from '../bundle/widget-extensions';
import { LanguageListWidget, LanguagesWidget } from './widget-languages';
import type { GlobalToolbarsWindow } from '../bundle/menu.d';
import type { GithubWindow } from '../bundle/github.d';
import { GitHubFileEntry } from '../bundle/github-types';
import { PROJECT_LAYOUT_TIERS, TierRule } from './widget-tiers';

import { hsl } from 'd3';

const widgetSelf: WidgetExtensionsWindow & GlobalToolbarsWindow & GithubWindow & {
	THREE: typeof THREE;
	CodeWidget: typeof CodeWidget,
	WillowWidget: typeof WillowWidget,
	SemanticWidget: typeof SemanticWidget,
	SearchCodeWidget: typeof SearchCodeWidget,
	LanguagesWidget: typeof LanguagesWidget,
	LanguageListWidget: typeof LanguageListWidget,

} = self as unknown as any;

widgetSelf.THREE = THREE;

export class CodeWidget extends widgetSelf.GenericSearchableWidget
{
	private _graph?: Graph;
	private _renderer: Sigma | null = null;
	private _container?: HTMLDivElement;
	private _isInitialized = false;
	private _willow?: WillowWidget;
	private selector?: string;
	private files?: Record<string, GitHubFileEntry> | undefined;
	private tier0Services: Record<string, WillowNode[]> = {};
	private _loading: Promise<never[] | undefined>;
	private _loadTier0: Promise<WillowNode[]>;
	private tier1Services: Record<string, WillowNode[]> = {};
	private tier1Edges: Record<string, WillowEdge[]> = {};

	constructor()
	{
		super();
		this._loading = this.loadFiles();
		this._loadTier0 = this.getTier0Services();
		this.initDom();
	}

	private initDom()
	{
		this.addClass('jp-GraphWidget');

		// Ensure the Lumino widget node itself fills space properly
		this.node.style.position = 'relative';
		this.node.style.width = '100%';
		this.node.style.height = '100%';
		this.node.style.overflow = 'hidden';

		this.node.innerHTML = `
            <div id="info" style="position: absolute; top: 12px; left: 12px; z-index: 20; padding: 8px 12px; border-radius: 6px; font-family: sans-serif; font-size: 12px; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">Zoom & drag to explore</div>
            <div id="sigma-container" style="width: 100%; height: 100%; position: absolute; top: 0; left: 0;"></div>
            <div id="legend" style="position: absolute; bottom: 20px; left: 20px; z-index: 20; padding: 12px; border-radius: 8px; font-family: sans-serif; font-size: 13px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                <div class="legend-item" style="font-weight:600; margin-bottom:8px;">Services & Modules</div>
            </div>`;

		this._container = this.node.querySelector('#sigma-container') as HTMLDivElement;
		this._graph = new Graph();
	}


	protected onAfterAttach(msg: any): void
	{
		super.onAfterAttach(msg);
		this.renderLayout();
	}

	public renderLayout()
	{
		if(this.viewMode === this.VIEW_1)
		{
			this.tryInit();
			if(this._willow)
			{
				this._willow.node.style.display = 'none';
			}
		} else
		{
			if(!this._willow)
			{
				this._willow = new WillowWidget;
			}
			if(this._willow && !this._willow.isAttached)
			{
				Widget.attach(this._willow, this.node);
			}
			if(this._willow)
			{
				this._willow.node.style.display = '';
			}
		}
	}


	protected onResize(msg: any): void
	{
		super.onResize(msg);
		if(this._renderer)
		{
			this._renderer.refresh();
		}
		this._willow?.update();
	}

	private tryInit()
	{
		// If container dimensions are not ready, retry next frame
		if(this._container?.clientWidth === 0 || this._container?.clientHeight === 0)
		{
			requestAnimationFrame(() => this.tryInit());
			return;
		}

		if(!this._isInitialized)
		{
			this._isInitialized = true;
			this.initGraph();
		}
	}


	protected async loadFiles()
	{
		const owner = widgetSelf.RepositoryToolbar?.owner?.value;
		const repo = widgetSelf.RepositoryToolbar?.repository?.value;
		this.selector = owner + '/' + repo;
		// TODO: local filesystem with lg2
		if(!owner || !repo)
		{
			return [];
		}
		const branch = await widgetSelf.getDefaultBranch?.(owner, repo);
		// TODO: detached local?
		if(!branch)
		{
			return [];
		}
		this.files = widgetSelf.filesRepo?.[this.selector];
		if(widgetSelf.filesRepo && !widgetSelf.filesRepo[this.selector])
		{
			this.files = widgetSelf.filesRepo[this.selector] = await widgetSelf.loadGitHubTree?.(owner, repo, branch);
		}

	}


	protected async getTier0Services(commitName?: string, centerX?: number): Promise<WillowNode[]>
	{
		if(!this.files)
		{
			await this._loading;
		}


		const services: ({ id: string, name: string, color?: string; })[] = [];
		const alreadyTiered: TierRule[] = [];
		const alreadyExted: string[] = [];
		for(const n of Object.values(this.files ?? {}))
		{
			if(n.name?.startsWith('.'))
			{
				continue;
			}
			const leaf = (n.name ?? n.path)?.split(/[\\\/]/gi).pop();
			const ext = leaf?.includes('.') ? leaf?.split('.').pop() : undefined;
			// const extSafe = ext?.toLowerCase().replace(/[^a-z0-9]/gi, '_');
			// if(ext && extSafe && !alreadyExted.includes(extSafe))
			// {
			// 	services.push({
			// 		id: `${commitName}_ext___${extSafe}`,
			// 		name: 'Ext: .' + ext,
			// 	});
			// 	alreadyExted.push(extSafe);
			// }
			if(ext && !alreadyExted.includes('Extension'))
			{
				services.push({
					id: `${commitName ?? 'HEAD'}_ext`,
					name: 'Extension',
				});
				alreadyExted.push('Extension');
			}

			const pathParts = n.path?.split(/[\\\/]/gi);
			if(pathParts.length > 2 && !alreadyExted.includes(pathParts[0]))
			{
				services.push({
					id: `${commitName ?? 'HEAD'}_folder___${pathParts[0].toLowerCase().replace(/[^a-z0-9]/gi, '_')}`,
					name: 'Folder: ' + pathParts[0],
				});
				alreadyExted.push(pathParts[0]);
			}
			// if(pathParts.length > 3 && !alreadyExted.includes(pathParts[1]))
			// {
			// 	services.push({
			// 		id: `${commitName}_folder___${pathParts[1].toLowerCase().replace(/[^a-z0-9]/gi, '_')}`,
			// 		name: 'Folder: ' + pathParts[1],
			// 	});
			// 	alreadyExted.push(pathParts[1]);
			// }
			for(const t of PROJECT_LAYOUT_TIERS)
			{
				if(alreadyTiered.includes(t))
				{
					continue;
				}
				for(const r of t.patterns)
				{
					if(typeof r === 'string' && !(n.path ?? n.name).includes(r))
					{
						continue;
					}
					else if(r instanceof RegExp && !(n.path ?? n.name).match(r))
					{
						continue;
					}
					services.push({
						id: `${commitName ?? 'HEAD'}_${t.name.toLowerCase().replace(/[^a-z0-9]/gi, '_')}`,
						name: t.name,
						// color: isGhost ? '#facc15' : '#60a5fa'
					});
					alreadyTiered.push(t);
				}
			}
		}

		this.tier0Services[commitName ?? 'HEAD'] = services.map((h, i) =>
		{
			const angle = (2 * Math.PI * i) / services.length;
			const radius = 75;
			return ({
				id: h.id,
				name: h.name,
				val: 16,
				color: h.color ?? hsl(360 / services.length * i, 0.5, 0.5).formatHex(),
				fx: (centerX ?? 0) + Math.cos(angle) * radius,
				fy: 100,
				fz: /* (isGhost ? -60 : 0) +*/ Math.sin(angle) * radius * 0.45,
				commitX: centerX ?? 0,
				offsetX: Math.cos(angle) * radius,
				commitName: commitName ?? 'HEAD'
			});
			// links.push({ source: rootId, target: h.id });
		});
		return this.tier0Services[commitName ?? 'HEAD'];
	}


	protected async getTier1Services(commitName?: string, centerX?: number): Promise<{ nodes: WillowNode[], edges: WillowEdge[]; }>
	{
		if(!this.files)
		{
			await this._loading;
		}

		// TODO: uncomment and edge into infinity

		const services: ({ id: string, name: string, color?: string; })[] = [];
		const alreadyTiered: TierRule[] = [];
		const alreadyExted: string[] = [];
		for(const n of Object.values(this.files ?? {}))
		{
			if(n.name?.startsWith('.'))
			{
				continue;
			}
			const leaf = (n.name ?? n.path)?.split(/[\\\/]/gi).pop();
			const ext = leaf?.includes('.') ? leaf?.split('.').pop() : undefined;
			// const extSafe = ext?.toLowerCase().replace(/[^a-z0-9]/gi, '_');
			// if(ext && extSafe && !alreadyExted.includes(extSafe))
			// {
			// 	services.push({
			// 		id: `${commitName}_ext___${extSafe}`,
			// 		name: 'Ext: .' + ext,
			// 	});
			// 	alreadyExted.push(extSafe);
			// }
			if(ext && !alreadyExted.includes('Extension'))
			{
				services.push({
					id: `${commitName ?? 'HEAD'}_ext`,
					name: 'Extension',
				});
				alreadyExted.push('Extension');
			}

			const pathParts = n.path?.split(/[\\\/]/gi);
			if(pathParts.length > 2 && !alreadyExted.includes(pathParts[0]))
			{
				services.push({
					id: `${commitName ?? 'HEAD'}_folder___${pathParts[0].toLowerCase().replace(/[^a-z0-9]/gi, '_')}`,
					name: 'Folder: ' + pathParts[0],
				});
				alreadyExted.push(pathParts[0]);
			}
			// if(pathParts.length > 3 && !alreadyExted.includes(pathParts[1]))
			// {
			// 	services.push({
			// 		id: `${commitName}_folder___${pathParts[1].toLowerCase().replace(/[^a-z0-9]/gi, '_')}`,
			// 		name: 'Folder: ' + pathParts[1],
			// 	});
			// 	alreadyExted.push(pathParts[1]);
			// }
			for(const t of PROJECT_LAYOUT_TIERS)
			{
				if(alreadyTiered.includes(t))
				{
					continue;
				}
				for(const r of t.patterns)
				{
					if(typeof r === 'string' && !(n.path ?? n.name).includes(r))
					{
						continue;
					}
					else if(r instanceof RegExp && !(n.path ?? n.name).match(r))
					{
						continue;
					}
					services.push({
						id: `${commitName ?? 'HEAD'}_${t.name.toLowerCase().replace(/[^a-z0-9]/gi, '_')}`,
						name: t.name,
						// color: isGhost ? '#facc15' : '#60a5fa'
					});
					alreadyTiered.push(t);
				}
			}
		}

		this.tier1Services[commitName ?? 'HEAD'] = services.map((h, i) =>
		{
			const angle = (2 * Math.PI * i) / services.length;
			const radius = 75;
			return ({
				id: h.id,
				name: h.name,
				val: 16,
				color: h.color ?? hsl(
					(360 / services.length) * i - (360 / (services.length * 2)),
					0.25 + (0.5) * (((i * 2) % services.length) / services.length),
					0.25 + (0.5) * (((i * 3) % services.length) / services.length)).formatHex(),
				fx: (centerX ?? 0) + Math.cos(angle) * radius,
				fy: 100,
				fz: /* (isGhost ? -60 : 0) +*/ Math.sin(angle) * radius * 0.45,
				commitX: centerX ?? 0,
				offsetX: Math.cos(angle) * radius,
				commitName: commitName ?? 'HEAD'
			});
			// links.push({ source: rootId, target: h.id });
		});
		return {
			nodes: this.tier1Services[commitName ?? 'HEAD'],
			edges: this.tier1Edges[commitName ?? 'HEAD']
		};
	}



	private async initGraph()
	{
		if(!this._graph || !this._container)
		{
			this.initDom();
		}
		if(!this._graph || !this._container)
		{
			return;
		}
		// Initialize Sigma renderer
		this._renderer = new Sigma(this._graph, this._container, {
			settings: {
				//defaultNodeColor: '#999',
				labelDensity: 0.07,
				//labelSize: 11,
				// Adjust label rendering settings for clarity at a distance
				renderEdgeLabels: false,
			},
		});

		// Rich test dataset ready out-of-the-box
		const services = await this._loadTier0 ?? [
			{ id: 'Core.js', name: 'Core', color: '#7f8c8d' },
			{ id: 'test-cells.js', name: 'Frameworks', color: '#2ecc71' },
			{ id: 'sigma-script.js', name: 'Frontends', color: '#d35400' },
			{ id: 'zuora-to-eloqua.ipynb', name: 'Databases', color: '#1abc9c' },
			{ id: 'node-graph.json', name: 'Cloud Services', color: '#f1c40f' },
			{ id: 'cache-notebook.js', name: 'Core', color: '#7f8c8d' },
			{ id: 'watch-files.js', name: 'Utilities', color: '#e67e22' }
		];

		const legendContainer = this.node.querySelector('#legend') as HTMLDivElement;
		const uniqueServices = Array.from(new Set(services.map(s => s.name)));

		uniqueServices.forEach((serviceName) =>
		{
			const match = services.find(s => s.name === serviceName);
			const item = document.createElement('div');
			item.className = 'legend-item';
			item.style.display = 'flex';
			item.style.alignItems = 'center';
			item.style.marginBottom = '6px';
			item.innerHTML = `<div class="legend-color" style="width:12px; height:12px; background-color: ${match?.color || '#333'}; margin-right:8px; border-radius:3px;"></div>${serviceName}`;
			legendContainer.appendChild(item);
		});

		// Populate nodes with compact initial coordinates (smaller radius prevents giant zoom)
		const radius = 150;
		services.forEach((node, i) =>
		{
			const angle = (2 * Math.PI * i) / services.length;
			this._graph?.addNode(node.id, {
				label: node.name,
				x: Math.cos(angle) * radius,
				y: Math.sin(angle) * radius,
				size: (node.val ?? 10) / 10, // Smaller dot size for a cleaner look
				color: node.color,
				service: node.name
			});
		});

		// Create inter-connecting edges
		for(let i = 0; i < services.length; i++)
		{
			const source = services[i].id;
			const target = services[(i + 2) % services.length].id;
			try
			{
				if(!this._graph.hasEdge(source, target) && source !== target)
				{
					this._graph.addEdge(source, target, { color: '#cbd5e1', size: 1.5 });
				}
			} catch(e)
			{
				// Ignore duplicate edges
			}
		}

		// Apply ForceAtlas2 safely with fallback
		try
		{
			const sensibleSettings = forceAtlas2.inferSettings(this._graph);
			forceAtlas2.assign(this._graph, {
				iterations: 40,
				settings: {
					...sensibleSettings,
					gravity: 1.0,
					strongGravityMode: true
				}
			});
		} catch(e)
		{
			console.warn('ForceAtlas2 layout skipped.', e);
		}

		this._renderer.refresh();

		// Fix: Zoom out the camera so the entire graph is visible and not giant
		const camera = this._renderer.getCamera();
		camera.setState({ x: 0, y: 0, ratio: 1.5, angle: 0 });
	}

	public highlightNodeByName(name: string)
	{
		this._graph?.forEachNode((node) =>
		{
			if(node.toLowerCase().includes(name.toLowerCase()))
			{
				this._graph?.setNodeAttribute(node, 'size', 2);
				this._graph?.setNodeAttribute(node, 'color', '#ef4444');
			} else
			{
				this._graph?.setNodeAttribute(node, 'size', 1);
			}
		});
		this._renderer?.refresh();
	}
}

widgetSelf.CodeWidget = CodeWidget;

widgetSelf.WillowWidget = WillowWidget;

widgetSelf.SemanticWidget = SemanticWidget;

widgetSelf.SearchCodeWidget = SearchCodeWidget;

widgetSelf.LanguagesWidget = LanguagesWidget;

widgetSelf.LanguageListWidget = LanguageListWidget;
