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
	private tier2Services: Record<string, WillowNode[]> = {};
	private tier2Edges: Record<string, WillowEdge[]> = {};
	private tier3Services: Record<string, WillowNode[]> = {};
	private tier3Edges: Record<string, WillowEdge[]> = {};

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
					});
					alreadyTiered.push(t);
				}
				break;
			}
		}

		this.tier0Services[commitName ?? 'HEAD'] = services.map((h, i) =>
		{
			const angle = (2 * Math.PI * i) / services.length;
			const radius = 75;
			return ({
				id: h.id,
				name: h.name,
				val: 22,
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
		const edges: ({ source: string, target: string; })[] = [];
		const alreadyEdged: string[] = [];
		const alreadyExted: string[] = [];
		for(const n of Object.values(this.files ?? {}))
		{
			if(n.name?.startsWith('.'))
			{
				continue;
			}
			const leaf = (n.name ?? n.path)?.split(/[\\\/]/gi).pop();
			const ext = leaf?.includes('.') ? leaf?.split('.').pop() : undefined;

			const extSafe = ext?.toLowerCase().replace(/[^a-z0-9]/gi, '_');
			if(ext && extSafe && !alreadyExted.includes(extSafe))
			{
				services.push({
					id: `${commitName ?? 'HEAD'}_ext___${extSafe}`,
					name: 'Ext: .' + ext,
				});
				alreadyExted.push(extSafe);
				edges.push({
					source: `${commitName ?? 'HEAD'}_ext___${extSafe}`,
					target: `${commitName ?? 'HEAD'}_ext`
				});
				alreadyEdged.push(`${commitName}_ext___${extSafe}->${commitName ?? 'HEAD'}_ext`);
			}


			const pathParts = n.path?.split(/[\\\/]/gi);
			if(pathParts.length > 2) // && !alreadyExted.includes(pathParts[0]))
			{
				if(ext && extSafe)
				{
					const edge: WillowEdge = {
						source: `${commitName ?? 'HEAD'}_folder___${pathParts[0].toLowerCase().replace(/[^a-z0-9]/gi, '_')}`,
						target: `${commitName ?? 'HEAD'}_ext___${extSafe}`
					};
					if(!alreadyEdged.includes(`${edge.source}->${edge.target}`))
					{
						edges.push(edge);
						alreadyEdged.push(`${edge.source}->${edge.target}`);
					}
				}
				// alreadyExted.push(pathParts[0]);
			}
			if(pathParts.length > 3)
			{
				if(!alreadyExted.includes(pathParts[1]))
				{
					services.push({
						id: `${commitName ?? 'HEAD'}_folder___${pathParts[1].toLowerCase().replace(/[^a-z0-9]/gi, '_')}`,
						name: 'Folder: ' + pathParts[1],
					});
					alreadyExted.push(pathParts[1]);
				}
				const edge: WillowEdge = {
					source: `${commitName ?? 'HEAD'}_folder___${pathParts[1].toLowerCase().replace(/[^a-z0-9]/gi, '_')}`,
					target: `${commitName ?? 'HEAD'}_folder___${pathParts[0].toLowerCase().replace(/[^a-z0-9]/gi, '_')}`
				};
				if(!alreadyEdged.includes(`${edge.source}->${edge.target}`))
				{
					edges.push(edge);
					alreadyEdged.push(`${edge.source}->${edge.target}`);
				}
			}
			for(const t of PROJECT_LAYOUT_TIERS)
			{
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
					if(pathParts.length > 3)
					{
						const edge: WillowEdge = {
							source: `${commitName ?? 'HEAD'}_folder___${pathParts[1].toLowerCase().replace(/[^a-z0-9]/gi, '_')}`,
							target: `${commitName ?? 'HEAD'}_${t.name.toLowerCase().replace(/[^a-z0-9]/gi, '_')}`
						};
						if(!alreadyEdged.includes(`${edge.source}->${edge.target}`))
						{
							edges.push(edge);
							alreadyEdged.push(`${edge.source}->${edge.target}`);
						}
					} else if(pathParts.length > 2)
					{

						const edge: WillowEdge = {
							source: `${commitName ?? 'HEAD'}_folder___${pathParts[0].toLowerCase().replace(/[^a-z0-9]/gi, '_')}`,
							target: `${commitName ?? 'HEAD'}_${t.name.toLowerCase().replace(/[^a-z0-9]/gi, '_')}`
						};
						if(!alreadyEdged.includes(`${edge.source}->${edge.target}`))
						{
							edges.push(edge);
							alreadyEdged.push(`${edge.source}->${edge.target}`);
						}
					}
					if(ext && extSafe)
					{
						const edge: WillowEdge = {
							source: `${commitName ?? 'HEAD'}_ext___${extSafe}`,
							target: `${commitName ?? 'HEAD'}_${t.name.toLowerCase().replace(/[^a-z0-9]/gi, '_')}`
						};
						if(!alreadyEdged.includes(`${edge.source}->${edge.target}`))
						{
							edges.push(edge);
							alreadyEdged.push(`${edge.source}->${edge.target}`);
						}
					}
					break;
				}
			}
		}

		this.tier1Edges[commitName ?? 'HEAD'] = edges.map((h, i) =>
		{
			return ({
				source: h.source,
				target: h.target,
				// color: h.color
				color: '#cbd5e1',
				size: 1.2
			});
		});
		this.tier1Services[commitName ?? 'HEAD'] = services.map((h, i) =>
		{
			const angle = (2 * Math.PI * i) / services.length;
			const radius = 75;
			return ({
				id: h.id,
				name: h.name,
				val: 16,
				// color: h.color ?? hsl(
				// 	(360 / services.length) * i - (360 / (services.length * 2)),
				// 	0.25 + (0.5) * (((i * 2) % services.length) / services.length),
				// 	0.25 + (0.5) * (((i * 3) % services.length) / services.length)).formatHex(),
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


	protected async getTier2Services(commitName?: string, centerX?: number): Promise<{ nodes: WillowNode[], edges: WillowEdge[]; }>
	{
		if(!this.files)
		{
			await this._loading;
		}

		// TODO: uncomment and edge into infinity

		const services: ({ id: string, name: string, color?: string; })[] = [];
		const edges: ({ source: string, target: string; })[] = [];
		const alreadyEdged: string[] = [];
		const alreadyFoldered: string[] = [];
		for(const n of Object.values(this.files ?? {}))
		{
			if(n.name?.startsWith('.'))
			{
				continue;
			}
			// const leaf = (n.name ?? n.path)?.split(/[\\\/]/gi).pop();
			// const ext = leaf?.includes('.') ? leaf?.split('.').pop() : undefined;

			const pathParts = n.path?.split(/[\\\/]/gi);

			if(pathParts.length > 3)
			{
				if(!alreadyFoldered.includes(pathParts[1]))
				{
					alreadyFoldered.push(pathParts[1]);
				}
			}
			else if(pathParts.length > 2)
			{
				if(!alreadyFoldered.includes(pathParts[0]))
				{
					alreadyFoldered.push(pathParts[0]);
				}
			}

		}

		for(const n of Object.values(this.files ?? {}))
		{
			if(n.name?.startsWith('.'))
			{
				continue;
			}

			const pathParts = n.path?.split(/[\\\/]/gi);

			if(pathParts.length > 3)
			{
				const remaining = pathParts.slice(2, -1).join('/');
				if(!alreadyFoldered.includes(remaining))
				{
					services.push({
						id: `${commitName ?? 'HEAD'}_folder___${remaining.toLowerCase().replace(/[^a-z0-9]/gi, '_')}`,
						name: 'Folder: ' + remaining,
					});
					alreadyFoldered.push(remaining);
				}

				const edge: WillowEdge = {
					source: `${commitName ?? 'HEAD'}_folder___${remaining.toLowerCase().replace(/[^a-z0-9]/gi, '_')}`,
					target: `${commitName ?? 'HEAD'}_folder___${pathParts[1].toLowerCase().replace(/[^a-z0-9]/gi, '_')}`
				};
				if(!alreadyEdged.includes(`${edge.source}->${edge.target}`))
				{
					edges.push(edge);
					alreadyEdged.push(`${edge.source}->${edge.target}`);
				}
			}
			else if(pathParts.length > 2)
			{
				if(!alreadyFoldered.includes(pathParts[1]))
				{
					services.push({
						id: `${commitName ?? 'HEAD'}_folder___${pathParts[1].toLowerCase().replace(/[^a-z0-9]/gi, '_')}`,
						name: 'Folder: ' + pathParts[1],
					});
					alreadyFoldered.push(pathParts[1]);
				}

				const edge: WillowEdge = {
					source: `${commitName ?? 'HEAD'}_folder___${pathParts[1].toLowerCase().replace(/[^a-z0-9]/gi, '_')}`,
					target: `${commitName ?? 'HEAD'}_folder___${pathParts[0].toLowerCase().replace(/[^a-z0-9]/gi, '_')}`
				};
				if(!alreadyEdged.includes(`${edge.source}->${edge.target}`))
				{
					edges.push(edge);
					alreadyEdged.push(`${edge.source}->${edge.target}`);
				}
			}
			else if(pathParts.length > 1)
			{
				if(!alreadyFoldered.includes(pathParts[0]))
				{
					services.push({
						id: `${commitName ?? 'HEAD'}_folder___${pathParts[0].toLowerCase().replace(/[^a-z0-9]/gi, '_')}`,
						name: 'Folder: ' + pathParts[0],
					});
					alreadyFoldered.push(pathParts[0]);
				}

			}
		}

		this.tier2Edges[commitName ?? 'HEAD'] = edges.map((h, i) =>
		{
			return ({
				source: h.source,
				target: h.target,
				// color: h.color
				color: '#cbd5e1',
				size: 1
			});
		});
		this.tier2Services[commitName ?? 'HEAD'] = services.map((h, i) =>
		{
			const angle = (2 * Math.PI * i) / services.length;
			const radius = 75;
			return ({
				id: h.id,
				name: h.name,
				val: 11,
				// color: h.color ?? hsl(
				// 	(360 / services.length) * i - (360 / (services.length * 2)),
				// 	0.25 + (0.5) * (((i * 2) % services.length) / services.length),
				// 	0.25 + (0.5) * (((i * 3) % services.length) / services.length)).formatHex(),
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
			nodes: this.tier2Services[commitName ?? 'HEAD'],
			edges: this.tier2Edges[commitName ?? 'HEAD']
		};
	}




	protected async getTier3Files(commitName?: string, centerX?: number): Promise<{ nodes: WillowNode[], edges: WillowEdge[]; }>
	{
		if(!this.files)
		{
			await this._loading;
		}

		// TODO: uncomment and edge into infinity

		const services: ({ id: string, name: string, color?: string; })[] = [];
		const edges: ({ source: string, target: string; })[] = [];
		const alreadyEdged: string[] = [];
		const alreadyFiled: string[] = [];
		for(const n of Object.values(this.files ?? {}))
		{
			if(n.name?.startsWith('.'))
			{
				continue;
			}

			const leaf = (n.name ?? n.path)?.split(/[\\\/]/gi).pop();
			const ext = leaf?.includes('.') ? leaf?.split('.').pop() : undefined;
			const extSafe = ext?.toLowerCase().replace(/[^a-z0-9]/gi, '_');


			if(!n.path || alreadyFiled.includes(n.path))
			{
				continue;
			}


			services.push({
				id: `${commitName ?? 'HEAD'}_file___${n.path.toLowerCase().replace(/[^a-z0-9]/gi, '_')}`,
				name: n.name ?? n.path.split(/[\\\/]/gi).pop() ?? '',
			});
			alreadyFiled.push(n.path);

			const pathParts = n.path?.split(/[\\\/]/gi);

			// TODO: link parent folder
			if(pathParts.length > 3)
			{
				const remaining = pathParts.slice(2, -1).join('/');
				const edge: WillowEdge = {
					source: `${commitName ?? 'HEAD'}_file___${n.path.toLowerCase().replace(/[^a-z0-9]/gi, '_')}`,
					target: `${commitName ?? 'HEAD'}_folder___${remaining.toLowerCase().replace(/[^a-z0-9]/gi, '_')}`
				};
				if(!alreadyEdged.includes(`${edge.source}->${edge.target}`))
				{
					edges.push(edge);
					alreadyEdged.push(`${edge.source}->${edge.target}`);
				}
			} else if(pathParts.length > 1)
			{
				const edge: WillowEdge = {
					source: `${commitName ?? 'HEAD'}_file___${n.path.toLowerCase().replace(/[^a-z0-9]/gi, '_')}`,
					target: `${commitName ?? 'HEAD'}_folder___${pathParts[pathParts.length - 2].toLowerCase().replace(/[^a-z0-9]/gi, '_')}`
				};
				if(!alreadyEdged.includes(`${edge.source}->${edge.target}`))
				{
					edges.push(edge);
					alreadyEdged.push(`${edge.source}->${edge.target}`);
				}
			}

			if(extSafe)
			{
				const edge: WillowEdge = {
					source: `${commitName ?? 'HEAD'}_file___${n.path.toLowerCase().replace(/[^a-z0-9]/gi, '_')}`,
					target: `${commitName ?? 'HEAD'}_ext___${extSafe}`
				};
				if(!alreadyEdged.includes(`${edge.source}->${edge.target}`))
				{
					edges.push(edge);
					alreadyEdged.push(`${edge.source}->${edge.target}`);
				}
			}

			for(const t of PROJECT_LAYOUT_TIERS)
			{
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

					const edge: WillowEdge = {
						source: `${commitName ?? 'HEAD'}_file___${n.path.toLowerCase().replace(/[^a-z0-9]/gi, '_')}`,
						target: `${commitName ?? 'HEAD'}_${t.name.toLowerCase().replace(/[^a-z0-9]/gi, '_')}`
					};
					if(!alreadyEdged.includes(`${edge.source}->${edge.target}`))
					{
						edges.push(edge);
						alreadyEdged.push(`${edge.source}->${edge.target}`);
					}
					break;
				}
			}
		}


		this.tier3Edges[commitName ?? 'HEAD'] = edges.map((h, i) =>
		{
			return ({
				source: h.source,
				target: h.target,
				// color: h.color
				color: '#cbd5e1',
				size: 0.8
			});
		});
		this.tier3Services[commitName ?? 'HEAD'] = services.map((h, i) =>
		{
			const angle = (2 * Math.PI * i) / services.length;
			const radius = 75;
			return ({
				id: h.id,
				name: h.name,
				val: 8,
				// color: h.color ?? hsl(
				// 	(360 / services.length) * i - (360 / (services.length * 2)),
				// 	0.25 + (0.5) * (((i * 2) % services.length) / services.length),
				// 	0.25 + (0.5) * (((i * 3) % services.length) / services.length)).formatHex(),
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
			nodes: this.tier3Services[commitName ?? 'HEAD'],
			edges: this.tier3Edges[commitName ?? 'HEAD']
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
				minCameraRatio: 0.1,
				maxCameraRatio: 10.0,
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
		services.forEach((node: WillowNode, i: number) =>
		{
			const angle = (2 * Math.PI * i) / services.length;
			node.x = Math.cos(angle) * radius;
			node.y = Math.sin(angle) * radius;
			this._graph?.addNode(node.id, {
				label: node.name,
				x: node.x,
				y: node.y,
				size: node.val ?? 10, // Smaller dot size for a cleaner look
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

		const { nodes: nodes1, edges: edges1 } = await this.getTier1Services();
		const { nodes: nodes2, edges: edges2 } = await this.getTier2Services();
		const { nodes: nodes3, edges: edges3 } = await this.getTier3Files();
		//const nodes2: WillowNode[] = [], edges2: WillowEdge[] = [];

		// 1. Group secondary nodes by their connected parent service ID
		const childrenByParent = new Map<string, string[]>();
		edges1.forEach(edge =>
		{
			const parentId = services.some(s => s.id === edge.source) ? edge.source : edge.target;
			const childId = services.some(s => s.id === edge.target) ? edge.source : edge.target;

			if(!childrenByParent.has(parentId))
			{
				childrenByParent.set(parentId, []);
			}
			childrenByParent.get(parentId)?.push(childId);
		});

		const servicesAndNodes = [...services, ...nodes1];
		const childrenByParent2 = new Map<string, string[]>();
		edges2.forEach(edge =>
		{
			const parentId = servicesAndNodes.some(s => s.id === edge.source) ? edge.source : edge.target;
			const childId = servicesAndNodes.some(s => s.id === edge.target) ? edge.source : edge.target;

			if(!childrenByParent2.has(parentId))
			{
				childrenByParent2.set(parentId, []);
			}
			childrenByParent2.get(parentId)?.push(childId);
		});

		const servicesAndNodesAndMore = [...services, ...nodes1, ...nodes2];
		const childrenByParent3 = new Map<string, string[]>();
		edges3.forEach(edge =>
		{
			const parentId = servicesAndNodesAndMore.some(s => s.id === edge.source) ? edge.source : edge.target;
			const childId = servicesAndNodesAndMore.some(s => s.id === edge.target) ? edge.source : edge.target;

			if(!childrenByParent3.has(parentId))
			{
				childrenByParent3.set(parentId, []);
			}
			childrenByParent3.get(parentId)?.push(childId);
		});

		this.appendGraph(services, childrenByParent, nodes1, services.length);

		this.appendGraph(servicesAndNodes, childrenByParent2, nodes2, services.length);

		this.appendGraph(servicesAndNodesAndMore, childrenByParent3, nodes3, services.length + nodes1.length);


		// 3. Add Tier 1 edges to the graph safely
		[...edges1, ...edges2, ...edges3].forEach(edge =>
		{
			try
			{
				if(!this._graph!.hasEdge(edge.source, edge.target) &&
					this._graph!.hasNode(edge.source) &&
					this._graph!.hasNode(edge.target))
				{
					const targetColor = this._graph?.getNodeAttribute(edge.target, 'color');
					this._graph!.addEdge(edge.source, edge.target, { color: targetColor ?? edge.color ?? '#e2e8f0', size: edge.size ?? 1 });
				}
			} catch(e)
			{
				// Ignore duplicate edges
			}
		});

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


	private appendGraph(nodes: WillowNode[], lookup: Map<string, string[]>, children: WillowNode[], totalServices: number)
	{
		const subRadius = 55;
		[...nodes].forEach((serviceNode: WillowNode, i: number) =>
		{
			const childIds = lookup.get(serviceNode.id) || [];
			const root = Math.round(Math.sqrt(childIds.length) - 0.8);
			const totalPieces = childIds.length - root * root;
			const segment = (360 / totalServices / totalPieces);
			const parent = serviceNode.color ? hsl(serviceNode.color) : hsl((360 / totalServices / totalPieces) * i, 0.5, 0.5);
			const offset = 360 / (totalServices * totalPieces * 2);

			childIds.forEach((childId, j) =>
			{
				const childNodeData = children.find(n => n.id === childId);
				if(!childNodeData) return;

				// Spread children evenly in a ring around the parent's coordinates
				const childAngle = (2 * Math.PI * j) / childIds.length;
				const childX = (serviceNode.x ?? 0) + Math.cos(childAngle) * subRadius;
				const childY = (serviceNode.y ?? 0) + Math.sin(childAngle) * subRadius;

				if(!this._graph!.hasNode(childId))
				{
					this._graph!.addNode(childId, {
						label: childNodeData.name || childId,
						x: childX,
						y: childY,
						size: (childNodeData.val ?? 8) / 10,
						color: serviceNode.color ?? hsl(
							(parent.h - offset + ((j / totalPieces) * segment)) % 360,
							Math.min(0.8, Math.max(0.2, 0.25 + ((j % root) / root * 0.5))),
							Math.min(0.8, Math.max(0.2, 0.25 + ((j % root) / root * 0.5)))
						).formatHex(),
						service: serviceNode.name
					});
				}
			});
		});

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
