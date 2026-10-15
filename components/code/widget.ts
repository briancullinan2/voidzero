import { Widget } from '@lumino/widgets';
import Graph from 'graphology';
import Sigma from 'sigma';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import { WillowWidget } from './widget-willow';
import * as THREE from 'three';
import { SemanticWidget } from './widget-semantic';
import { SearchCodeWidget } from './widget-search';
import type { WidgetExtensionsWindow } from '../bundle/widget-extensions';

const widgetSelf: WidgetExtensionsWindow & {
	THREE: typeof THREE;
	CodeWidget: typeof CodeWidget,
	WillowWidget: typeof WillowWidget,
	SemanticWidget: typeof SemanticWidget,
	SearchCodeWidget: typeof SearchCodeWidget,
} = self as unknown as any;

widgetSelf.THREE = THREE;

export class CodeWidget extends widgetSelf.GenericSearchableWidget
{
	private _graph?: Graph;
	private _renderer: Sigma | null = null;
	private _container?: HTMLDivElement;
	private _isInitialized = false;

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
		this._graph = new Graph();
	}


	protected onAfterAttach(msg: any): void
	{
		super.onAfterAttach(msg);
		Widget.attach(new WillowWidget, this.node);
		//this.tryInit();

	}

	protected onResize(msg: any): void
	{
		super.onResize(msg);
		if(this._renderer)
		{
			this._renderer.refresh();
		}
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
	private initGraph()
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
		const services = [
			{ id: 'Core.js', service: 'Core', color: '#7f8c8d' },
			{ id: 'test-cells.js', service: 'Frameworks', color: '#2ecc71' },
			{ id: 'sigma-script.js', service: 'Frontends', color: '#d35400' },
			{ id: 'zuora-to-eloqua.ipynb', service: 'Databases', color: '#1abc9c' },
			{ id: 'node-graph.json', service: 'Cloud Services', color: '#f1c40f' },
			{ id: 'cache-notebook.js', service: 'Core', color: '#7f8c8d' },
			{ id: 'watch-files.js', service: 'Utilities', color: '#e67e22' }
		];

		const legendContainer = this.node.querySelector('#legend') as HTMLDivElement;
		const uniqueServices = Array.from(new Set(services.map(s => s.service)));

		uniqueServices.forEach((serviceName) =>
		{
			const match = services.find(s => s.service === serviceName);
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
				label: node.id,
				x: Math.cos(angle) * radius,
				y: Math.sin(angle) * radius,
				size: 1, // Smaller dot size for a cleaner look
				color: node.color,
				service: node.service
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

		// 🌟 Fix: Zoom out the camera so the entire graph is visible and not giant
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
