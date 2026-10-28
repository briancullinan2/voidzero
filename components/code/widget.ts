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
import { ProjectNodes, SCALE_FACTOR } from './widget-nodes';
import { Message } from '@lumino/messaging';
import forceLayout from "graphology-layout-force";
import forceAtlas2 from 'graphology-layout-forceatlas2';
import type { LuminoLayoutWindow } from '../bundle/lumino.d';
import { NodeAnimator } from './widget-animate';

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
	private _graph: Graph = new Graph;
	private _fileGraph: Graph = new Graph;
	private _combinedGraph: Graph = new Graph;
	private _tier0OrbitalGraph: Graph = new Graph;
	private _tier0ForcedGraph: Graph = new Graph;
	private _tier2OrbitalGraph: Graph = new Graph;
	private _tier2ForcedGraph: Graph = new Graph;
	private _combinedOrbitalGraph: Graph = new Graph;
	private _combinedForcedGraph: Graph = new Graph;
	private _selectedRingGraph: Graph = new Graph;
	private _selectedForcedGraph: Graph = new Graph;
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
	protected zoomLevel: number = 4 * 10;
	protected zoomTier: number = 0;
	protected _tier0OrbitalRatio: number | undefined;
	protected _tier0ForcedRatio: number | undefined;
	protected selected: WillowNode | undefined;
	protected childrenByParentAll?: Map<string, string[]>;
	protected parentByChildren?: Map<string, string[]>;
	protected selectedId: string | undefined;
	protected allConnected?: string[];

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


		this._container = this.node.querySelector('#sigma-container') as HTMLDivElement;
		this._container.addEventListener('click', this.mouseClick.bind(this), { capture: true, passive: false });
		this._container.addEventListener('wheel', this.wheelZoom.bind(this), { capture: true, passive: false });
		this._container.addEventListener('mousemove', this.mouseMove.bind(this), { capture: true, passive: false });
		this._loading = this.loadFiles();
	}


	protected mouseMove(event: MouseEvent)
	{
		this._mouseX = event.clientX;
		this._mouseY = event.clientY;
		event.preventDefault();
		event.stopImmediatePropagation();

		// Call your custom hit-test function
		const activeNodeId = this.getActiveNodeUnderMouse(event);

		if(activeNodeId)
		{
			this.hoverNode = this.allNodes?.find(n => n.id === activeNodeId);
		} else
		{
			this.hoverNode = undefined;
			// this.selected = undefined;
			// this.selectedId = undefined;
		}

		this.updateStatus();
		return false;
	}



	private getActiveNodeUnderMouse(event: MouseEvent): string | undefined
	{
		if(!this._renderer || !this._container) return;

		const rect = this._container.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;

		// Convert container pixel coordinates to graph-space coordinates
		const mouseGraph = this._renderer.viewportToGraph({ x, y });
		const graph = this._renderer.getGraph();

		let hoveredNodeId: string | undefined = undefined;

		graph.forEachNode((node, attrs) =>
		{
			// Skip non-interactive, hidden, or disabled nodes entirely
			if(attrs.nonInteractive || attrs.hidden)
			{
				return;
			}

			const dx = attrs.x - mouseGraph.x;
			const dy = attrs.y - mouseGraph.y;
			const distance = Math.sqrt(dx * dx + dy * dy);

			// Check if the mouse is within the node's radius
			if(distance <= attrs.size)
			{
				hoveredNodeId = node;
			}
		});

		return hoveredNodeId;
	}


	protected mouseClick(e: MouseEvent)
	{

		if(!this._renderer) return;
		if(this.hoverNode && this.selected !== this.hoverNode)
		{
			this.selected = this.hoverNode;
			this.selectedId = this.selected?.id;
			this.allConnected = [
				this.selectedId,
				...this.childrenByParentAll?.get(this.selected.id) ?? [],
				...this.parentByChildren?.get(this.selected.id) ?? []
			];
			for(const n of this.allConnected)
			{
				if(this._combinedGraph.hasNode(n))
				{
					this._combinedGraph.setNodeAttribute(n, 'x', 0);
					this._combinedGraph.setNodeAttribute(n, 'y', 0);
				}
			}
			const notConnected: string[] = [];
			this._combinedForcedGraph.forEachNode(n =>
			{
				if(!this.allConnected?.includes(n))
				{
					notConnected.push(n);
				}
			});
			this.forceSelectedGraph();
			NodeAnimator.transitionToGraph(this._renderer, this._combinedForcedGraph, this._selectedRingGraph, 1, this.allConnected);
			NodeAnimator.transitionToGraph(this._renderer, this._combinedForcedGraph, this._selectedForcedGraph, 1, notConnected);
		} else if(!this.hoverNode)
		{
			this.selected = this.hoverNode;
			this.selectedId = undefined;
			this.allConnected = undefined;
			NodeAnimator.transitionToRatio(this._renderer, this._combinedOrbitalGraph, this._combinedForcedGraph, this.zoomLevel);
		}
	}


	protected wheelZoom(e: WheelEvent)
	{
		e.preventDefault();
		e.stopImmediatePropagation();

		if(!this._renderer) return;
		const camera = this._renderer.getCamera();
		const zoomFactor = e.deltaY < 0 ? 1.25 : 0.75;
		if(e.deltaY < 0)
		{
			this.zoomLevel--;
		} else if(this.zoomLevel < 40)
		{
			this.zoomLevel++;
		}
		//camera.zoomIn({ factor: zoomFactor, duration: 100 });
		this.zoomTier = Math.round(4 - this.zoomLevel / 10);
		if(this.selected)
		{
			NodeAnimator.transitionToGraph(this._renderer, this._combinedForcedGraph, this._selectedRingGraph, 1, this.allConnected);
		} else
		{
			NodeAnimator.transitionToRatio(this._renderer, this._combinedOrbitalGraph, this._combinedForcedGraph, this.zoomLevel);
		}

		this._combinedGraph.forEachNode((n, { tier }) =>
		{
			const targetZoom = (4 - tier) * 10;
			const isHidden = Math.abs(targetZoom - this.zoomLevel) >= 10;
			this._combinedGraph.setNodeAttribute(n, 'hidden', isHidden);
		});
		this._combinedGraph.forEachEdge((n, { tier }) =>
		{
			const targetZoom = (4 - tier) * 10;
			const isHidden = Math.abs(targetZoom - this.zoomLevel) >= 10;
			this._combinedGraph.setEdgeAttribute(n, 'hidden', isHidden);
		});

		this.updateStatus();
		this._renderer.refresh();
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


	private appendServices(services: WillowNode[], grouped: Map<string, string[]>, factor: number)
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
				size: ProjectNodes.getScaledSize(node, (grouped.get(node.id) ?? []).length, this._graph),
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
						size: ProjectNodes.getScaledEdge(services[i], factor)
					});
					this.edgeMap.set(edgeId, {
						source, target,
						color: '#cbd5e1',
						size: ProjectNodes.getScaledEdge(services[i], factor)
					});
				}
			} catch(e)
			{

			}
		}

		return services;
	}

	// private static getZoomAlpha(ratio: number, tier: number, isEdge: boolean): number
	// {
	// 	// Simple list of boundary thresholds for the tiers (descending from zoomed out to zoomed in)
	// 	const thresholds = [2.0, 1.0, 0.5, 0.25, 0.15, 0.05, 0.0];

	// 	if(tier < 0 || tier >= thresholds.length - 1)
	// 	{
	// 		return 0.05;
	// 	}

	// 	const minOp = 0.05;
	// 	const maxOp = tier === 0 ? 0.5 : 0.4;

	// 	const high = thresholds[tier];     // The upper zoom boundary (zoomed out)
	// 	const low = thresholds[tier + 1];    // The lower zoom boundary (zoomed in)
	// 	const mid = (high + low) / 2;        // Peak opacity point right in the middle

	// 	// If ratio is outside this tier's [low, high] span, it stays at minOp
	// 	if(ratio < low || ratio > high)
	// 	{
	// 		return minOp;
	// 	}

	// 	// Smooth triangle fade between low, mid, and high
	// 	if(ratio <= mid)
	// 	{
	// 		return minOp + ((ratio - low) / (mid - low)) * (maxOp - minOp);
	// 	}
	// 	else
	// 	{
	// 		return maxOp - ((ratio - mid) / (high - mid)) * (maxOp - minOp);
	// 	}
	// }

	protected getGraphBBox(graph: Graph)
	{
		let minX = Infinity;
		let maxX = -Infinity;
		let minY = Infinity;
		let maxY = -Infinity;

		// Loop through every node in the graph instance to find spatial bounds
		graph.forEachNode((node, attributes) =>
		{
			const x = attributes.x ?? 0;
			if(x < minX) minX = x;
			if(x > maxX) maxX = x;

			const y = attributes.y ?? 0;
			if(y < minY) minY = y;
			if(y > maxY) maxY = y;
		});

		const graphWidth = maxX - minX;
		const graphHeight = maxY - minY;
		const widestGraphDimension = Math.max(graphWidth, graphHeight);

		// Get the physical pixel size of your canvas/container element
		if(!this._renderer)
		{
			return;
		}
		const container = this._renderer.getContainer();
		const canvasSize = Math.max(container.offsetWidth, container.offsetHeight);

		// Calculate the camera ratio where the graph's width/height is exactly 2x the canvas size
		const ratioFor2xSize = (widestGraphDimension / canvasSize) / 2;
		return ratioFor2xSize;
	}



	protected getRendererBBox()
	{
		if(!this._renderer)
		{
			return;
		}
		const bbox = this._renderer.getBBox(); // or sigmaInstance.getBBox()
		const graphWidth = bbox.x[1] - bbox.x[0];
		const graphHeight = bbox.y[1] - bbox.y[0];
		const widestEdgeOrDimension = Math.max(graphWidth, graphHeight);

		// 2. Get canvas/container dimensions
		const container = this._renderer.getContainer();
		const canvasSize = Math.max(container.offsetWidth, container.offsetHeight);

		// 3. Determine the ratio where graph size is 2x the canvas size
		// At ratio = 1, the graph fits the canvas.
		// To make it 2x larger than the canvas, the ratio needs to be halved (zoomed in).
		const ratioFor2xSize = (widestEdgeOrDimension / canvasSize) / 2;
		return ratioFor2xSize;
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
				nodeLabelEvents: false,
				edgeLabelEvents: false,
			},

			// hoverReducer: (node, data) =>
			// {
			// 	// If the node is non-interactive or should not show a hover box
			// 	if(this._combinedGraph.getNodeAttribute(node, 'nonInteractive'))
			// 	{
			// 		return { ...data, label: "" }; // Clear the label during hover pass so no box renders
			// 	}
			// 	return data;
			// },
			nodeReducer: (node, data) =>
			{
				const res = { ...data };
				const ratio = this._renderer?.getCamera().ratio ?? 1.0;
				const attrs = this._combinedGraph?.getNodeAttributes(node);
				const rawTier = attrs?.tier ?? (data as any).tier ?? 0;

				// Tier 0 -> peak zoom 40, Tier 1 -> peak zoom 30
				const targetZoom = (4 - rawTier) * 10;
				const tierRatio = Math.abs(Math.min(10, Math.max(-10, targetZoom - this.zoomLevel)) / 10);

				// Peak alpha is 0.4 when distance (tierRatio) is 0, fading out to 0 at distance 1
				const alpha = Math.max(0, 1 - tierRatio) * 0.4;
				const rgb = d3HSL(data.color || '#333').rgb();
				const isHidden = Math.abs(targetZoom - this.zoomLevel) >= 10;

				//this._combinedGraph.setNodeAttribute(node, 'hidden', isHidden);
				res.hidden = isHidden;
				res.size = data.size + tierRatio * 10;
				res.color = `rgba(${Math.round(rgb.r)}, ${Math.round(rgb.g)}, ${Math.round(rgb.b)}, ${alpha})`;
				res.highlighted = false;

				if(res.color.includes('NaN')) { debugger; }
				return res;
			},
			edgeReducer: (edge, data) =>
			{
				const res = { ...data };
				const graph = this._combinedGraph;
				const edgeSpec = this.edgeMap.get(edge);

				// Robustly retrieve source and target node keys from Graphology or edge spec
				const source = graph?.source?.(edge) ?? edgeSpec?.source;// ?? data.source;
				const target = graph?.target?.(edge) ?? edgeSpec?.target;// ?? data.target;

				// Get attributes for source and target nodes
				const sourceAttrs = source ? graph?.getNodeAttributes(source) : null;
				const targetAttrs = target ? graph?.getNodeAttributes(target) : null;

				const sourceRawTier = sourceAttrs?.tier ?? (graph?.getNodeAttribute?.(source, 'tier')) ?? 0;
				const targetRawTier = targetAttrs?.tier ?? (graph?.getNodeAttribute?.(target, 'tier')) ?? 0;

				const sourceZoom = (4 - sourceRawTier) * 10;
				const targetZoom = (4 - targetRawTier) * 10;

				// Define the inclusive tier range bounds (e.g., 30 to 40)
				const minZoom = Math.min(sourceZoom, targetZoom);
				const maxZoom = Math.max(sourceZoom, targetZoom);

				// Calculate distance only when zoomLevel is outside the [minZoom, maxZoom] range
				let distance = 0;
				if(this.zoomLevel < minZoom)
				{
					distance = minZoom - this.zoomLevel;
				} else if(this.zoomLevel > maxZoom)
				{
					distance = this.zoomLevel - maxZoom;
				}
				const isHidden = distance >= 10;
				const tierRatio = Math.min(10, Math.max(0, distance)) / 10;
				const alpha = Math.max(0, 1 - tierRatio) * 0.4;

				const rgb = d3HSL(data.color || '#cbd5e1').rgb();


				//this._combinedGraph.setEdgeAttribute(edge, 'hidden', isHidden);
				res.hidden = isHidden;
				res.color = `rgba(${Math.round(rgb.r)}, ${Math.round(rgb.g)}, ${Math.round(rgb.b)}, ${alpha})`;

				if(res.color.includes('NaN')) { debugger; }
				return res; //{ ...res, label: undefined };
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
		this.parentByChildren = new Map<string, string[]>();
		this.childrenByParentAll = new Map<string, string[]>();
		edges1.forEach(edge =>
		{
			const parentId = services.some(s => s.id === edge.source) ? edge.source : edge.target;
			const childId = services.some(s => s.id === edge.target) ? edge.source : edge.target;

			if(!childrenByParent.has(parentId))
			{
				childrenByParent.set(parentId, []);
				childrenByParent2.set(parentId, []);
				this.childrenByParentAll?.set(parentId, []);
			}
			if(!this.parentByChildren?.has(childId))
			{
				this.parentByChildren?.set(childId, []);
			}
			childrenByParent.get(parentId)?.push(childId);
			childrenByParent2.get(parentId)?.push(childId);
			this.childrenByParentAll?.get(parentId)?.push(childId);
			this.parentByChildren?.get(childId)?.push(parentId);
		});

		const servicesAndNodes = [...services, ...nodes1];
		edges2.forEach(edge =>
		{
			const parentId = servicesAndNodes.some(s => s.id === edge.source) ? edge.source : edge.target;
			const childId = servicesAndNodes.some(s => s.id === edge.target) ? edge.source : edge.target;

			if(!childrenByParent2.has(parentId))
			{
				childrenByParent2.set(parentId, []);
				this.childrenByParentAll?.set(parentId, []);
			}
			if(!this.parentByChildren?.has(childId))
			{
				this.parentByChildren?.set(childId, []);
			}
			childrenByParent2.get(parentId)?.push(childId);
			this.childrenByParentAll?.get(parentId)?.push(childId);
			this.parentByChildren?.get(childId)?.push(parentId);
		});

		const servicesAndNodesAndMore = [...services, ...nodes1, ...nodes2];
		edges3.forEach(edge =>
		{
			const parentId = servicesAndNodesAndMore.some(s => s.id === edge.source) ? edge.source : edge.target;
			const childId = servicesAndNodesAndMore.some(s => s.id === edge.target) ? edge.source : edge.target;

			if(!this.childrenByParentAll?.has(parentId))
			{
				this.childrenByParentAll?.set(parentId, []);
			}
			if(!this.parentByChildren?.has(childId))
			{
				this.parentByChildren?.set(childId, []);
			}
			this.childrenByParentAll?.get(parentId)?.push(childId);
			this.parentByChildren?.get(childId)?.push(parentId);
		});



		this.allNodes = [...services, ...nodes1, ...nodes2, ...nodes3];

		this.appendServices(services, this.childrenByParentAll, servicesAndNodes.length / SCALE_FACTOR);

		ProjectNodes.appendGraph(services, childrenByParent, nodes1, services.length, this.childrenByParentAll, this._graph, servicesAndNodes.length / SCALE_FACTOR);

		this.appendEdges(this.allNodes, [...edges1, ...edges2], this._graph);



		this._renderer.on("enterNode", ({ node, event }) =>
		{
			if(this._combinedGraph.getNodeAttribute(node, 'hidden'))
			{
				event.preventSigmaDefault();
				return { label: "" };
			}
			this.hoverNodeId = node;
			this.hoverNode = this.allNodes?.find(n => n.id === node);
			this._renderer?.refresh();
		});

		this._renderer.on("leaveNode", ({ node, event }) =>
		{
			// if(this._combinedGraph.getNodeAttribute(node, 'hidden'))
			// {
			// 	event.preventSigmaDefault();
			// 	return;
			// }
			this.hoverNode = undefined;
			this.hoverNodeId = undefined;
			this._renderer?.refresh();
		});

		this._renderer.on('clickNode', ({ node, event }) =>
		{
			// Check if the node is marked as non-interactive / un-hoverable
			if(this._combinedGraph.getNodeAttribute(node, 'hidden'))
			{
				event.preventSigmaDefault();
				return { label: "" }; // Completely ignore clicks/hovers for this node
			}

			// Your normal click logic here...
			// highlightNodes(renderer, { data: {}, node });
		});

		// Apply ForceAtlas2 safely with fallback
		try
		{
			CodeWidget.mergeSubGraph(this._tier0OrbitalGraph, this._graph);
			this._tier0OrbitalRatio = this.getGraphBBox(this._tier0OrbitalGraph);

			CodeWidget.mergeSubGraph(this._tier0ForcedGraph, this._graph);
			const sensibleSettings = forceAtlas2.inferSettings(this._tier0ForcedGraph);
			forceAtlas2.assign(this._tier0ForcedGraph, {
				iterations: 20,
				settings: {
					...sensibleSettings,
					gravity: 1.0,
					strongGravityMode: true
				}
			});
			this._tier0ForcedRatio = this.getGraphBBox(this._tier0ForcedGraph);

			const ring1 = ProjectNodes.generateAlienRingGraph(
				[...services, ...nodes1],
				childrenByParent,
				nodes1,
				servicesAndNodes.length,
				this.childrenByParentAll,
				this._tier0ForcedGraph,
				servicesAndNodes.length / SCALE_FACTOR);


			CodeWidget.mergeSubGraph(this._tier2OrbitalGraph, this._tier0ForcedGraph);
			ProjectNodes.appendGraph(servicesAndNodes, childrenByParent2, nodes2, services.length, this.childrenByParentAll, this._tier2OrbitalGraph, this.allNodes.length / SCALE_FACTOR);
			this.appendEdges(this.allNodes, [...edges1, ...edges2], this._tier2OrbitalGraph);
			CodeWidget.mergeSubGraph(this._tier2ForcedGraph, this._tier2OrbitalGraph);

			const sensibleSettings2 = forceAtlas2.inferSettings(this._tier2ForcedGraph);
			forceLayout.assign(this._tier2ForcedGraph, {
				maxIterations: 30,
				isNodeFixed: (node, attributes) =>
				{
					return attributes.tier < 2;
				},
				settings: {
					...sensibleSettings2,
					attraction: 0.005,
					repulsion: 0.15,
					gravity: 0.5
				}
			});

			CodeWidget.mergeSubGraph(this._combinedForcedGraph, this._tier2ForcedGraph);
			CodeWidget.mergeSubGraph(this._combinedForcedGraph, this._tier0ForcedGraph);
			// CodeWidget.mergeSubGraph(this._fileGraph, this._graph);

			// ProjectNodes.appendGraph(servicesAndNodesAndMore, childrenByParentAll, nodes3, services.length + nodes1.length, childrenByParentAll, this._fileGraph, this.allNodes.length / SCALE_FACTOR);

			// this.appendEdges(this.allNodes, [...edges1, ...edges2, ...edges3], this._fileGraph);

			const moreRings = ProjectNodes.generateAlienRingGraph(
				[...services, ...nodes1, ...nodes2],
				this.childrenByParentAll,
				[...nodes1, ...nodes2],
				servicesAndNodesAndMore.length,
				this.parentByChildren,
				this._combinedForcedGraph,
				servicesAndNodesAndMore.length / SCALE_FACTOR);

			CodeWidget.mergeSubGraph(this._selectedRingGraph, moreRings);
			CodeWidget.mergeSubGraph(this._selectedRingGraph, ring1);

			// CodeWidget.mergeSubGraph(this._combinedGraph, this._fileGraph);
			CodeWidget.mergeSubGraph(this._combinedGraph, this._tier2OrbitalGraph);
			CodeWidget.mergeSubGraph(this._combinedGraph, this._tier0OrbitalGraph);

			CodeWidget.mergeSubGraph(this._combinedOrbitalGraph, this._combinedGraph);


		} catch(e)
		{
			console.warn('ForceAtlas2 layout skipped.', e);
		}

		this._renderer.refresh();

		// Fix: Zoom out the camera so the entire graph is visible and not giant
		//CodeWidget.centerGraph(this._renderer);
		this.startAnimators();
	}



	protected forceSelectedGraph()
	{
		// 1. Increase gravity and repulsion to pull movable nodes inward toward the center
		const moreConnected: string[] = [];
		this._selectedRingGraph.forEachEdge((edgeId: string, attributes, source, target) =>
		{
			if(this.allConnected?.includes(source) || this.allConnected?.includes(target))
			{
				if(!moreConnected.includes(source) && !this.allConnected?.includes(source))
				{
					moreConnected.push(source);
				}
				if(!moreConnected.includes(target) && !this.allConnected?.includes(target))
				{
					moreConnected.push(target);
				}
			}
		});

		this._selectedForcedGraph = new Graph;
		const existingCount = [...this.allConnected ?? []] //, ...moreConnected]
			.filter(n => this._combinedForcedGraph.hasNode(n));
		let j = 0;
		this._selectedRingGraph.forEachNode((nodeId: string, attributes) =>
		{
			if(this.allConnected?.includes(nodeId))
			{
				const childAngle = (2 * Math.PI * j) / (existingCount.length ?? 0);
				const childX = /*(attributes?.x ?? 0)*/ + Math.cos(childAngle) * 55;
				const childY = /*(attributes?.y ?? 0)*/ + Math.sin(childAngle) * 55;
				if(!this._selectedForcedGraph.hasNode(nodeId))
				{
					this._selectedForcedGraph.addNode(nodeId, Object.assign(Object.assign({}, attributes), {
						x: childX, y: childY
					}));
					j++;
				}
				else
				{
					// If the node already exists, copy/update its x and y values
					if(attributes.x !== undefined)
					{
						this._selectedForcedGraph.setNodeAttribute(nodeId, 'x', childX ?? attributes.x);
					}
					if(attributes.y !== undefined)
					{
						this._selectedForcedGraph.setNodeAttribute(nodeId, 'y', childY ?? attributes.y);
					}
				}
			}

			if(moreConnected.includes(nodeId) && !this._selectedForcedGraph.hasNode(nodeId))
			{
				this._selectedForcedGraph.addNode(nodeId, Object.assign({}, attributes));
			}
		});

		this._selectedRingGraph.forEachEdge((edgeId: string, attributes, source, target) =>
		{
			if(!this._selectedForcedGraph.hasEdge(source, target)
				&& (this.allConnected?.includes(source) || this.allConnected?.includes(target)
					// || moreConnected?.includes(source) || moreConnected?.includes(target))
				))
			{
				this._selectedForcedGraph.addEdge(source, target, Object.assign({}, attributes));
			}
		});



		const sensibleSettings2 = forceAtlas2.inferSettings(this._selectedForcedGraph);
		forceAtlas2.assign(this._selectedForcedGraph, {
			iterations: 30,
			// maxIterations: 30,
			// isNodeFixed: (node, attributes) =>
			// {
			// 	const isFixed = !this.allConnected?.includes(node);
			// 	//&& !moreConnected.includes(node);
			// 	//|| node === this.selectedId;
			// 	//|| attributes.tier === 0;
			// 	return isFixed;
			// },
			settings: {
				...sensibleSettings2,
				// attraction: 0.1,
				// repulsion: 1.5,
				gravity: 0.05,
				strongGravityMode: true,
			}
		});



		// 2. Shape the connected nodes into a central DNA double-helix structure
		// if(this.allConnected && this.allConnected.length > 0)
		// {
		// 	const verticalSpacing = 35; // Distance between base pairs along the spine
		// 	const helixRadius = 90;     // Width of the DNA strands
		// 	const twistRate = 0.45;     // Controls how tightly the DNA twists

		// 	// Center the helix vertically based on the number of connected nodes
		// 	const startY = -(this.allConnected.length * verticalSpacing) / 2;

		// 	this.allConnected.forEach((nodeId, index) =>
		// 	{
		// 		if(!this._combinedGraph.hasNode(nodeId)) return;

		// 		// Vertical position cascading down the center axis
		// 		const y = startY + (index * verticalSpacing);

		// 		// Double-helix sine/cosine twist
		// 		// Alternates nodes between the two intertwined strands (+x and -x sides)
		// 		const angle = index * twistRate;
		// 		const strandMultiplier = index % 2 === 0 ? 1 : -1;
		// 		const x = Math.cos(angle) * helixRadius * strandMultiplier;

		// 		// Apply the DNA coordinates to the graph
		// 		this._combinedGraph.setNodeAttribute(nodeId, 'x', x);
		// 		this._combinedGraph.setNodeAttribute(nodeId, 'y', y);
		// 	});
		// }
	}



	public static centerGraph(renderer: Sigma)
	{
		const bbox = renderer.getBBox();

		// 1. Calculate the exact center using your [min, max] tuple extents
		const graphCenterX = (bbox.x[0] + bbox.x[1]) / 2;
		const graphCenterY = (bbox.y[0] + bbox.y[1]) / 2;

		// 2. Convert graph-space center to camera/framed-graph space using Sigma's native method
		const targetState = renderer.graphToFramedGraph({
			x: graphCenterX,
			y: graphCenterY
		});

		// 3. Animate the camera to the properly mapped coordinates
		renderer.getCamera().animate(
			{
				x: targetState.x,
				y: targetState.y
			},
			{
				duration: 300,
				easing: 'quadraticInOut'
			}
		);
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
						size: node ? ProjectNodes.getScaledEdge(node, (graph.nodes().length ?? 0) / SCALE_FACTOR) : 1
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
			+ `Zoom (Ratio): ${state.ratio.toFixed(2)}, Tier: ${this.zoomTier}, Level: ${this.zoomLevel}, `
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
				masterGraph.addNode(nodeId, Object.assign({}, attributes));
			}
			else
			{
				// If the node already exists, copy/update its x and y values
				if(attributes.x !== undefined)
				{
					masterGraph.setNodeAttribute(nodeId, 'x', attributes.x);
				}
				if(attributes.y !== undefined)
				{
					masterGraph.setNodeAttribute(nodeId, 'y', attributes.y);
				}

				// Optional: If you want to merge all incoming attributes for existing nodes:
				// masterGraph.mergeNodeAttributes(nodeId, attributes);
			}
		});

		subGraph.forEachEdge((edgeId: string, attributes, source, target) =>
		{
			if(!masterGraph.hasEdge(source, target))
			{
				masterGraph.addEdge(source, target, Object.assign({}, attributes));
			} else
			{
				// masterGraph.updateEdgeWithKey()
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
