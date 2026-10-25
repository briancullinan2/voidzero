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

import { hsl as d3HSL, rgb as d3RGB } from 'd3';

const SCALE_FACTOR = 100;


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
	private _loadTier1: Promise<{ nodes: WillowNode[]; edges: WillowEdge[]; }>;
	private _loadTier2: Promise<{ nodes: WillowNode[]; edges: WillowEdge[]; }>;
	private _loadTier3: Promise<{ nodes: WillowNode[]; edges: WillowEdge[]; }>;

	constructor()
	{
		super();
		this._loading = this.loadFiles();
		this._loadTier0 = this.getTier0Services();
		this._loadTier1 = this.getTier1Services();
		this._loadTier2 = this.getTier2Services();
		this._loadTier3 = this.getTier3Files();
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
				tier: 0,
				id: h.id,
				name: h.name,
				val: 22,
				color: h.color ?? d3HSL(360 / services.length * i, 0.5, 0.5).formatHex(),
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
				// size: 1.2
			});
		});
		this.tier1Services[commitName ?? 'HEAD'] = services.map((h, i) =>
		{
			const angle = (2 * Math.PI * i) / services.length;
			const radius = 75;
			return ({
				tier: 1,
				id: h.id,
				name: h.name,
				val: 16,
				// color: h.color ?? d3HSL(
				// 	(360 / services.length) * i - (360 / (services.length * 2)),
				// 	0.25 + (0.5) * (((i * 2) % services.length) / services.length),
				// 	0.25 + (0.5) * (((i * 3) % services.length) / services.length)).formatHex(),
				fx: (centerX ?? 0) + Math.cos(angle) * radius,
				fy: 100,
				fz: /* (isGhost ? -60 : 0) +*/ Math.sin(angle) * radius * 0.45,
				commitX: centerX ?? 0,
				offsetX: Math.cos(angle) * radius,
				commitName: commitName ?? 'HEAD'
			} as WillowNode);
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
				// size: 1
			});
		});
		this.tier2Services[commitName ?? 'HEAD'] = services.map((h, i) =>
		{
			const angle = (2 * Math.PI * i) / services.length;
			const radius = 75;
			return ({
				tier: 2,
				id: h.id,
				name: h.name,
				// val: 11,
				// color: h.color ?? d3HSL(
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
				// size: 0.8
			});
		});
		this.tier3Services[commitName ?? 'HEAD'] = services.map((h, i) =>
		{
			const angle = (2 * Math.PI * i) / services.length;
			const radius = 75;
			return ({
				tier: 3,
				id: h.id,
				name: h.name,
				// val: 8,
				// color: h.color ?? d3HSL(
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



	private appendServices(services: WillowNode[], grouped: Map<string, string[]>)
	{
		if(!this._graph)
		{
			return;
		}

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
			const targetColor = d3RGB(node.color ?? '#FFFFFF');
			this._graph?.addNode(node.id, {
				tier: node.tier,
				label: node.name,
				x: node.x,
				y: node.y,
				size: this.getScaledSize(node, (grouped.get(node.id) ?? []).length),
				color: `rgba(${Math.round(targetColor.r)}, ${Math.round(targetColor.g)}, ${Math.round(targetColor.b)}, 0.5)`,
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
					this._graph.addEdge(source, target, {
						color: '#cbd5e1',
						size: this.getScaledEdge(services[i])
					});
				}
			} catch(e)
			{
				// Ignore duplicate edges
			}
		}

		return services;
	}


	private getScaledSize(node: WillowNode, children: number)
	{
		const units = (this._graph?.nodes.length ?? 0) / SCALE_FACTOR;
		return (Math.max(1, units) - ((node.tier ?? 0) + 1) / 4 * Math.max(1, units))
			* (SCALE_FACTOR / 10) + Math.max(SCALE_FACTOR / 10, Math.min(0, children / SCALE_FACTOR));
	}

	private getScaledEdge(node: WillowNode)
	{
		const units = (this._graph?.nodes.length ?? 0) / SCALE_FACTOR;
		return Math.max(1, units) - ((node.tier ?? 0) + 1) / 4 * Math.max(1, units);
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
				minCameraRatio: 0.001,
				maxCameraRatio: 10.0,
			},
			nodeReducer: (node, data) =>
			{
				const res = { ...data };
				const ratio = this._renderer?.getCamera().ratio; // Get current zoom level

				if(ratio && (data as any).tier === 0)
				{
					const alpha = Math.max(0, Math.min(0.5, (ratio - 0.1) / 0.4));
					const rgb = d3HSL(data.color || '#333').rgb();
					res.color = `rgba(${Math.round(rgb.r)}, ${Math.round(rgb.g)}, ${Math.round(rgb.b)}, ${alpha})`;
				}

				return res;
			},
			edgeReducer: (edge, data) =>
			{
				const res = { ...data };
				const ratio = this._renderer?.getCamera().ratio;

				if(ratio && ratio < 0.5)
				{
					const alpha = Math.max(0, Math.min(0.5, (ratio - 0.1) / 0.4));
					const rgb = d3HSL(data.color || '#cbd5e1').rgb();
					res.color = `rgba(${Math.round(rgb.r)}, ${Math.round(rgb.g)}, ${Math.round(rgb.b)}, ${alpha * 0.4})`;
				}

				return res;
			}
		});

		const services = await this._loadTier0 ?? [
			{ id: 'Core.js', name: 'Core', color: '#7f8c8d' },
			{ id: 'test-cells.js', name: 'Frameworks', color: '#2ecc71' },
			{ id: 'sigma-script.js', name: 'Frontends', color: '#d35400' },
			{ id: 'zuora-to-eloqua.ipynb', name: 'Databases', color: '#1abc9c' },
			{ id: 'node-graph.json', name: 'Cloud Services', color: '#f1c40f' },
			{ id: 'cache-notebook.js', name: 'Core', color: '#7f8c8d' },
			{ id: 'watch-files.js', name: 'Utilities', color: '#e67e22' }
		];

		const { nodes: nodes1, edges: edges1 } = await this._loadTier1;
		const { nodes: nodes2, edges: edges2 } = await this._loadTier2;
		const { nodes: nodes3, edges: edges3 } = await this._loadTier3;

		const childrenByParent = new Map<string, string[]>();
		const childrenByParent2 = new Map<string, string[]>();
		const childrenByParentAll = new Map<string, string[]>();
		edges1.forEach(edge =>
		{
			const parentId = services.some(s => s.id === edge.source) ? edge.source : edge.target;
			const childId = services.some(s => s.id === edge.target) ? edge.source : edge.target;

			if(!childrenByParent.has(parentId))
			{
				childrenByParent.set(parentId, []);
				childrenByParent2.set(parentId, []);
				childrenByParentAll.set(parentId, []);
			}

			childrenByParent.get(parentId)?.push(childId);
			childrenByParent2.get(parentId)?.push(childId);
			childrenByParentAll.get(parentId)?.push(childId);
		});

		const servicesAndNodes = [...services, ...nodes1];
		edges2.forEach(edge =>
		{
			const parentId = servicesAndNodes.some(s => s.id === edge.source) ? edge.source : edge.target;
			const childId = servicesAndNodes.some(s => s.id === edge.target) ? edge.source : edge.target;

			if(!childrenByParent2.has(parentId))
			{
				childrenByParent2.set(parentId, []);
				childrenByParentAll.get(parentId)?.push(childId);
			}
			childrenByParent2.get(parentId)?.push(childId);
			childrenByParentAll.get(parentId)?.push(childId);
		});

		const servicesAndNodesAndMore = [...services, ...nodes1, ...nodes2];
		edges3.forEach(edge =>
		{
			const parentId = servicesAndNodesAndMore.some(s => s.id === edge.source) ? edge.source : edge.target;
			const childId = servicesAndNodesAndMore.some(s => s.id === edge.target) ? edge.source : edge.target;

			if(!childrenByParentAll.has(parentId))
			{
				childrenByParentAll.set(parentId, []);
			}
			childrenByParentAll.get(parentId)?.push(childId);
		});


		this.appendServices(services, childrenByParentAll);

		this.appendGraph(services, childrenByParent, nodes1, services.length, childrenByParentAll);

		this.appendGraph(servicesAndNodes, childrenByParent2, nodes2, services.length, childrenByParentAll);

		this.appendGraph(servicesAndNodesAndMore, childrenByParentAll, nodes3, services.length + nodes1.length, childrenByParentAll);

		const allNodes = [...services, ...nodes1, ...nodes2, ...nodes3];
		[...edges1, ...edges2, ...edges3].forEach(edge =>
		{
			try
			{
				if(!this._graph!.hasEdge(edge.source, edge.target) &&
					this._graph!.hasNode(edge.source) &&
					this._graph!.hasNode(edge.target))
				{
					const node = allNodes.find(n => n.id === edge.source);
					const targetTier = this._graph?.getNodeAttribute(edge.target, 'tier') ?? 0;
					const targetColor = this._graph?.getNodeAttribute(edge.target, 'color') ?? '#FFFFFF';
					const translucent = d3RGB(targetColor);
					const targetStr = `rgba(${translucent.r}, ${translucent.g}, ${translucent.b}, ${0.5 - 0.10 * (targetTier ?? 0)})`;
					this._graph!.addEdge(edge.source, edge.target, {
						color: targetStr ?? edge.color ?? '#e2e8f0',
						size: node ? this.getScaledEdge(node) : 1
					});
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


	private appendGraph(nodes: WillowNode[], lookup: Map<string, string[]>, children: WillowNode[], totalServices: number, grouped: Map<string, string[]>)
	{
		const subRadius = 55;
		[...nodes].forEach((serviceNode: WillowNode, i: number) =>
		{
			const childIds = lookup.get(serviceNode.id) || [];
			const root = Math.round(Math.sqrt(childIds.length) - 0.8);
			const totalPieces = childIds.length - root * root;
			const segment = (360 / totalServices / totalPieces);
			const parent = serviceNode.color ? d3HSL(serviceNode.color) : d3HSL((360 / totalServices / totalPieces) * i, 0.5, 0.5);
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
					const targetColor = serviceNode.color ? d3RGB(serviceNode.color) : d3HSL(
						(parent.h - offset + ((j / totalPieces) * segment)) % 360,
						Math.min(0.8, Math.max(0.2, 0.25 + ((j % root) / root * 0.5))),
						Math.min(0.8, Math.max(0.2, 0.25 + ((j % root) / root * 0.5)))
					).rgb();
					const targetTier = childNodeData.tier;
					this._graph!.addNode(childId, {
						tier: childNodeData.tier,
						label: childNodeData.name || childId,
						x: childX,
						y: childY,
						size: this.getScaledSize(childNodeData, (grouped.get(childNodeData.id) ?? []).length),
						color: `rgba(${Math.round(targetColor.r)}, ${Math.round(targetColor.g)}, ${Math.round(targetColor.b)}, ${0.5 - 0.10 * (targetTier ?? 0)})`,
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
