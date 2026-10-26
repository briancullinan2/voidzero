import { Widget } from '@lumino/widgets';
import Graph from 'graphology';
import Sigma from 'sigma';
import { WillowEdge, WillowNode, WillowWidget } from './widget-willow';
import { SemanticWidget } from './widget-semantic';
import { SearchCodeWidget } from './widget-search';
import type { WidgetExtensionsWindow } from '../bundle/widget-extensions';
import { LanguageListWidget, LanguagesWidget } from './widget-languages';
import type { GlobalToolbarsWindow } from '../bundle/menu.d';
import type { GithubWindow } from '../bundle/github.d';
import { GitHubFileEntry } from '../bundle/github-types';
import { hsl as d3HSL, rgb as d3RGB } from 'd3';
import { ProjectNodes } from './widget-nodes';
import { Message } from '@lumino/messaging';
import forceLayout from "graphology-layout-force";
import forceAtlas2 from 'graphology-layout-forceatlas2';
import type { LuminoLayoutWindow } from '../bundle/lumino.d';


const SCALE_FACTOR = 100;
const SCALE_NODES = 30;
const EDGE_SCALE = 2;


const widgetSelf: WidgetExtensionsWindow & GlobalToolbarsWindow & GithubWindow & LuminoLayoutWindow & {
	CodeWidget: typeof CodeWidget,
	WillowWidget: typeof WillowWidget,
	SemanticWidget: typeof SemanticWidget,
	SearchCodeWidget: typeof SearchCodeWidget,
	LanguagesWidget: typeof LanguagesWidget,
	LanguageListWidget: typeof LanguageListWidget,

} = self as unknown as any;


export class CodeWidget extends widgetSelf.GenericSearchableWidget
{
	private _graph?: Graph;
	private _fileGraph?: Graph;
	private _combinedGraph?: Graph;
	private _renderer: Sigma | null = null;
	private _container?: HTMLDivElement;
	private _isInitialized = false;
	private _willow?: WillowWidget;
	private selector?: string;
	private files?: Record<string, GitHubFileEntry> | undefined;
	private _loading!: Promise<never[] | undefined>;
	private _loadTier0!: Promise<WillowNode[]>;
	private _loadTier1!: Promise<{ nodes: WillowNode[]; edges: WillowEdge[]; }>;
	private _loadTier2!: Promise<{ nodes: WillowNode[]; edges: WillowEdge[]; }>;
	private _loadTier3!: Promise<{ nodes: WillowNode[]; edges: WillowEdge[]; }>;
	private hoverNode?: WillowNode;
	private hoverNodeId?: string;
	private _mouseY?: number;
	private _mouseX?: number;
	private allNodes?: WillowNode[];
	private edgeMap: Map<string, WillowEdge> = new Map();
	private edgeSource: Map<string, number> = new Map();
	private edgeTarget: Map<string, number> = new Map();

	constructor()
	{
		super();
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

		this.node.addEventListener('mousemove', (e: MouseEvent) =>
		{
			this._mouseX = e.clientX;
			this._mouseY = e.clientY;
			this.updateStatus();
		});

		this._container = this.node.querySelector('#sigma-container') as HTMLDivElement;

		this._container.addEventListener('wheel', (e: WheelEvent) =>
		{
			e.preventDefault();
			e.stopImmediatePropagation();

			if(!this._renderer) return;
			const camera = this._renderer.getCamera();
			const zoomFactor = e.deltaY < 0 ? 1.25 : 0.75;
			camera.zoomIn({ factor: zoomFactor, duration: 100 });
			this.updateStatus();
		}, { capture: true, passive: false });
		this._graph = new Graph();
		this._fileGraph = new Graph();
		this._combinedGraph = new Graph();
		this._loading = this.loadFiles();
	}


	protected override onAfterAttach(msg: any): void
	{
		super.onAfterAttach(msg);
		this.renderLayout();
		requestAnimationFrame(() =>
		{
			this.tryInit();
		});
	}

	public renderLayout()
	{
		if(this.viewMode === this.VIEW_1)
		{
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


	protected override onAfterShow(msg: Message): void
	{
		super.onAfterShow(msg);
		requestAnimationFrame(() =>
		{
			this.tryInit();
		});
	}


	protected override onResize(msg: any): void
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
		try
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


			this._loadTier0 = ProjectNodes.getTier0Services(Object.values(this.files ?? {}));
			this._loadTier1 = ProjectNodes.getTier1Services(Object.values(this.files ?? {}));
			this._loadTier2 = ProjectNodes.getTier2Services(Object.values(this.files ?? {}));
			this._loadTier3 = ProjectNodes.getTier3Files(Object.values(this.files ?? {}));
		} catch(e)
		{
			console.error(e);
		}

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
			const color = `rgba(${Math.round(targetColor.r)}, ${Math.round(targetColor.g)}, ${Math.round(targetColor.b)}, 0.5)`;
			if(color.includes('NaN'))
			{
				debugger;
			}
			this._graph?.addNode(node.id, {
				tier: node.tier,
				label: node.name,
				x: node.x,
				y: node.y,
				size: this.getScaledSize(node, (grouped.get(node.id) ?? []).length),
				color: color,
				service: node.name
			});
		});


		for(let i = 0; i < services.length; i++)
		{
			const source = services[i].id;
			const target = services[(i + 2) % services.length].id;
			try
			{
				if(!this._graph.hasEdge(source, target) && source !== target)
				{
					const edgeId = this._graph.addEdge(source, target, {
						color: '#cbd5e1',
						size: this.getScaledEdge(services[i])
					});
					this.edgeMap.set(edgeId, {
						source, target,
						color: '#cbd5e1',
						size: this.getScaledEdge(services[i])
					});
				}
			} catch(e)
			{

			}
		}

		return services;
	}


	private getScaledSize(node: WillowNode, children: number)
	{
		const units = (this._graph?.nodes().length ?? 0) / SCALE_FACTOR;
		return (Math.max(1, units) - ((node.tier ?? 0) + 1) / 4 * Math.max(1, units))
			* (SCALE_FACTOR / SCALE_NODES) + Math.max(SCALE_FACTOR / SCALE_NODES, Math.min(0, children / SCALE_FACTOR));
	}

	private getScaledEdge(node: WillowNode)
	{
		const units = (this._graph?.nodes().length ?? 0) / SCALE_FACTOR;
		return Math.max(1, units) - ((node.tier ?? 0) + 1) / 4 * Math.max(1, units);
	}


	private static getZoomAlpha(ratio: number, tier: number, isEdge: boolean): number
	{
		// Simple list of boundary thresholds for the tiers (descending from zoomed out to zoomed in)
		const thresholds = [2.0, 1.0, 0.5, 0.25, 0.15, 0.05, 0.0];

		if(tier < 0 || tier >= thresholds.length - 1)
		{
			return 0.05;
		}

		const minOp = 0.05;
		const maxOp = tier === 0 ? 0.5 : 0.4;

		const high = thresholds[tier];     // The upper zoom boundary (zoomed out)
		const low = thresholds[tier + 1];    // The lower zoom boundary (zoomed in)
		const mid = (high + low) / 2;        // Peak opacity point right in the middle

		// If ratio is outside this tier's [low, high] span, it stays at minOp
		if(ratio < low || ratio > high)
		{
			return minOp;
		}

		// Smooth triangle fade between low, mid, and high
		if(ratio <= mid)
		{
			return minOp + ((ratio - low) / (mid - low)) * (maxOp - minOp);
		}
		else
		{
			return maxOp - ((ratio - mid) / (high - mid)) * (maxOp - minOp);
		}
	}


	private async initGraph()
	{
		if(!this._graph || !this._combinedGraph || !this._fileGraph || !this._container)
		{
			this.initDom();
		}
		if(!this._graph || !this._combinedGraph || !this._fileGraph || !this._container)
		{
			return;
		}
		await this._loading;
		// Initialize Sigma renderer
		this._renderer = new Sigma(this._combinedGraph, this._container, {
			settings: {
				//defaultNodeColor: '#999',
				labelDensity: 0.07,
				//labelSize: 11,
				// Adjust label rendering settings for clarity at a distance
				renderEdgeLabels: false,
				minCameraRatio: 0.001,
				maxCameraRatio: 10.0,
				enableEdgeEvents: false,
				autoRescale: true,
				labelRenderedSizeThreshold: 3,
			},

			nodeReducer: (node, data) =>
			{
				const res = { ...data };
				const ratio = this._renderer?.getCamera().ratio ?? 1.0;
				const attrs = this._combinedGraph?.getNodeAttributes(node);
				const tier = attrs?.tier ?? (data as any).tier ?? 0;

				const alpha = CodeWidget.getZoomAlpha(ratio, tier, false);
				const rgb = d3HSL(data.color || '#333').rgb();

				res.color = `rgba(${Math.round(rgb.r)}, ${Math.round(rgb.g)}, ${Math.round(rgb.b)}, ${alpha})`;

				if(res.color.includes('NaN')) { debugger; }
				return res;
			},
			edgeReducer: (edge, data) =>
			{
				const res = { ...data };
				const ratio = this._renderer?.getCamera().ratio ?? 1.0;
				const edgeSpec = this.edgeMap.get(edge);
				const targetNode = this.edgeTarget.get(edgeSpec?.target ?? '') ?? 0;
				const sourceNode = this.edgeSource.get(edgeSpec?.target ?? '') ?? 0;;

				const alpha = CodeWidget.getZoomAlpha(ratio, targetNode ?? 0, true);
				const alpha2 = CodeWidget.getZoomAlpha(ratio, sourceNode ?? 0, true);
				const rgb = d3HSL(data.color || '#cbd5e1').rgb();

				res.color = `rgba(${Math.round(rgb.r)}, ${Math.round(rgb.g)}, ${Math.round(rgb.b)}, ${Math.max(alpha, alpha2)})`;

				if(res.color.includes('NaN')) { debugger; }
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

		this.allNodes = [...services, ...nodes1, ...nodes2, ...nodes3];

		this.appendEdges(this.allNodes, [...edges1, ...edges2], this._graph);




		this._renderer.on("enterNode", ({ node }) =>
		{
			this.hoverNodeId = node;
			this.hoverNode = this.allNodes?.find(n => n.id === node);
		});

		this._renderer.on("leaveNode", () =>
		{
			this.hoverNode = undefined;
			this.hoverNodeId = undefined;
		});



		// Apply ForceAtlas2 safely with fallback
		try
		{
			const sensibleSettings = forceAtlas2.inferSettings(this._graph);
			forceAtlas2.assign(this._graph, {
				iterations: 10,
				settings: {
					...sensibleSettings,
					gravity: 1.0,
					strongGravityMode: true
				}
			});

			CodeWidget.mergeSubGraph(this._fileGraph, this._graph);

			this.appendGraph(servicesAndNodesAndMore, childrenByParentAll, nodes3, services.length + nodes1.length, childrenByParentAll, this._fileGraph);

			this.appendEdges(this.allNodes, [...edges1, ...edges2, ...edges3], this._fileGraph);

			// const sensibleSettings2 = forceAtlas2.inferSettings(this._fileGraph);
			// forceLayout.assign(this._fileGraph, {
			// 	maxIterations: 10,
			// 	// iterations: 10,
			// 	isNodeFixed: (node, attributes) =>
			// 	{
			// 		const attrs = this._fileGraph?.getNodeAttributes(node);
			// 		const tier = attrs?.tier ?? 0;
			// 		return tier <= 2;
			// 	},
			// 	settings: {
			// 		...sensibleSettings2,
			// 		// attraction: 0.005,
			// 		// repulsion: 0.1,
			// 		gravity: 0.1
			// 	}
			// });

			CodeWidget.mergeSubGraph(this._combinedGraph, this._fileGraph);


		} catch(e)
		{
			console.warn('ForceAtlas2 layout skipped.', e);
		}

		this._renderer.refresh();

		// Fix: Zoom out the camera so the entire graph is visible and not giant
		const camera = this._renderer.getCamera();
		camera.setState({ x: 0, y: 0, ratio: 1.5, angle: 0 });
		this.startAnimators();
	}


	private appendEdges(allNodes: WillowNode[], edges: WillowEdge[], graph: Graph)
	{
		edges.forEach(edge =>
		{
			try
			{
				if(!graph.hasEdge(edge.source, edge.target) &&
					graph.hasNode(edge.source) &&
					graph.hasNode(edge.target))
				{
					const node = allNodes?.find(n => n.id === edge.source);
					const targetTier = graph.getNodeAttribute(edge.target, 'tier') ?? 0;
					const targetColor = graph.getNodeAttribute(edge.target, 'color') ?? '#FFFFFF';
					const translucent = d3RGB(targetColor);
					const targetStr = `rgba(${translucent.r}, ${translucent.g}, ${translucent.b}, ${0.5 - (0.10 * (targetTier ?? 0))})`;
					if(targetStr.includes('NaN'))
					{
						debugger;
					}
					const edgeId = graph.addEdge(edge.source, edge.target, {
						color: targetStr ?? edge.color ?? '#e2e8f0',
						size: node ? this.getScaledEdge(node) : 1
					});
					this.edgeMap.set(edgeId, edge);
					this.edgeSource.set(edgeId, node?.tier ?? 0);
					this.edgeTarget.set(edgeId, targetTier);
				}
			} catch(e)
			{
				// Ignore duplicate edges
			}
		});
	}



	private updateStatus()
	{
		if(!this._renderer) return;

		const camera = this._renderer.getCamera();
		const state = camera.getState();

		widgetSelf.statusBar?.updateStatusItem('env-state',
			`Mouse: ${this._mouseX ?? 0}x${this._mouseY ?? 0}, `
			+ `Camera: X: ${Math.round(state.x)}, Y: ${Math.round(state.y)}, `
			+ `Zoom (Ratio): ${state.ratio.toFixed(2)}, `
			+ `Rotation: ${(state.angle * (180 / Math.PI)).toFixed(1)}°, `
			+ `Node: ${this.hoverNode?.name ?? 'None'}, `
			+ `Graph: ${this._graph?.order ?? 0} nodes, ${this._graph?.size ?? 0} edges, `
			+ `Repository: ${widgetSelf.RepositoryToolbar?.owner?.value ?? ''}/${widgetSelf.RepositoryToolbar?.repository?.value ?? ''}`
		);
	}


	static mergeSubGraph(masterGraph: Graph, subGraph: Graph)
	{
		subGraph.forEachNode((nodeId: string, attributes) =>
		{
			if(!masterGraph.hasNode(nodeId))
			{
				masterGraph.addNode(nodeId, attributes);
			}
		});
		subGraph.forEachEdge((edgeId: string, attributes, source, target) =>
		{
			if(!masterGraph.hasEdge(source, target))
			{
				masterGraph.addEdge(source, target, attributes);
			}
		});
		return masterGraph;
	}


	private startAnimators(renderer = this._renderer, graph = this._graph)
	{
		if(!renderer || !graph)
		{
			return;
		}
		// if(!this.targeter) this.targeter = setInterval(() => NodeAnimator.reTarget(renderer, graph), 200);
		// if(!this.animator) this.animator = setInterval(() => NodeAnimator.reGraph(renderer, graph, true, false, false), 100);
	}


	private appendGraph(nodes: WillowNode[], lookup: Map<string, string[]>, children: WillowNode[], totalServices: number, grouped: Map<string, string[]>, graph?: Graph)
	{
		const subRadius = 55;
		[...nodes].forEach((serviceNode: WillowNode, i: number) =>
		{
			const childIds = lookup.get(serviceNode.id) || [];
			const root = Math.max(1, Math.round(Math.sqrt(childIds.length) - 0.8));
			const totalPieces = childIds.length - root * root;
			const segment = (360 / totalServices / totalPieces);
			const parent = serviceNode.color ? d3HSL(serviceNode.color) : d3HSL((360 / totalServices / totalPieces) * i, 0.5, 0.5);
			const offset = 360 / (totalServices * totalPieces * 2);
			let attrs: any;
			try
			{
				attrs = graph?.getNodeAttributes(serviceNode.id);
			} catch(e)
			{

			}


			childIds.forEach((childId, j) =>
			{
				const childNodeData = children.find(n => n.id === childId);
				if(!childNodeData) return;

				// Spread children evenly in a ring around the parent's coordinates
				const childAngle = (2 * Math.PI * j) / childIds.length;
				const childX = (attrs?.x ?? serviceNode.x ?? 0) + Math.cos(childAngle) * subRadius;
				const childY = (attrs?.y ?? serviceNode.y ?? 0) + Math.sin(childAngle) * subRadius;

				if(!(graph ?? this._graph)!.hasNode(childId))
				{
					const targetColor = serviceNode.color ? d3RGB(serviceNode.color) : d3HSL(
						(parent.h - offset + ((j / totalPieces) * segment)) % 360,
						Math.min(0.8, Math.max(0.2, 0.25 + ((j % root) / root * 0.5))),
						Math.min(0.8, Math.max(0.2, 0.25 + ((j % root) / root * 0.5)))
					).rgb();
					const targetTier = childNodeData.tier;
					const color = `rgba(${Math.round(targetColor.r)}, ${Math.round(targetColor.g)}, ${Math.round(targetColor.b)}, ${0.5 - 0.10 * (targetTier ?? 0)})`;
					if(color.includes('NaN'))
					{
						debugger;
					}
					(graph ?? this._graph)!.addNode(childId, {
						tier: childNodeData.tier,
						label: childNodeData.name || childId,
						x: childX,
						y: childY,
						size: this.getScaledSize(childNodeData, (grouped.get(childNodeData.id) ?? []).length),
						color: color,
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
