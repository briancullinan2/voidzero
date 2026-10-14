import { Widget } from '@lumino/widgets';
import ForceGraph3D, { ForceGraph3DInstance } from '3d-force-graph';
import * as THREE from 'three';

export class WillowWidget extends Widget
{
	private _container: HTMLDivElement;
	private _graph: ForceGraph3DInstance | null = null;

	constructor()
	{
		super();
		this.addClass('jp-WillowGraphWidget');
		this.node.style.position = 'relative';
		this.node.style.width = '100%';
		this.node.style.height = '100%';
		this.node.style.overflow = 'hidden';

		this.node.innerHTML = `
      <div id="willow-container" style="width: 100%; height: 100%; position: absolute; top: 0; left: 0;"></div>
      <div style="position: absolute; top: 12px; left: 12px; z-index: 10; background: rgba(255,255,255,0.9); padding: 8px 12px; border-radius: 6px; font-family: sans-serif; font-size: 12px;">
        3D Weeping Willow Code Graph (Z-Depth Opacity)
      </div>
    `;

		this._container = this.node.querySelector('#willow-container') as HTMLDivElement;
	}

	protected onAfterAttach(msg: any): void
	{
		super.onAfterAttach(msg);
		this.init3DGraph();
	}

	protected onResize(msg: any): void
	{
		super.onResize(msg);
		if(this._graph && this._container)
		{
			this._graph.width(this._container.clientWidth);
			this._graph.height(this._container.clientHeight);
		}
	}

	private init3DGraph()
	{
		if(this._container.clientWidth === 0 || this._container.clientHeight === 0)
		{
			requestAnimationFrame(() => this.init3DGraph());
			return;
		}

		// Generate Hierarchical Weeping Willow Test Data
		const graphData = this.generateWillowData();

		// Initialize 3D Force Graph
		this._graph = new ForceGraph3D(this._container)
			.graphData(graphData)
			// 🌟 Custom 3D Node Representation with height-based opacity (Weeping Willow Effect)
			.nodeThreeObject((node: any) =>
			{
				const size = node.val || 5;
				const color = node.color || '#2ecc71';

				// Create a sphere geometry for nodes
				const geometry = new THREE.SphereGeometry(size, 16, 16);
				const material = new THREE.MeshLambertMaterial({
					color: color,
					transparent: true,
					opacity: 1.0, // Will be dynamically updated in tick
				});

				const mesh = new THREE.Mesh(geometry, material);
				(mesh as any).nodeData = node; // store reference for opacity updates
				return mesh;
			})
			.nodeLabel('name')
			.linkColor(() => 'rgba(200, 200, 200, 0.2)')
			.linkWidth(0.8);

		// Custom force layout configuration to form the weeping willow tiers
		const fg = this._graph;

		// Custom Z/Y positioning logic simulating a tree canopy cascading down
		fg.d3Force('charge')?.strength(-120);

		// Add custom ticker to handle the Z-height / Y-height opacity fade (0 to 1)
		const scene = fg.scene();
		scene.onBeforeRender = () =>
		{
			scene.traverse((obj: any) =>
			{
				if(obj.isMesh && obj.nodeData)
				{
					const y = obj.position.y; // Height axis

					// Calculate fade based on height position (e.g., fading out near the bottom or top roots)
					// Range: Y goes from +150 (Top Hubs) down to -150 (AST Leaf nodes)
					const minH = -150;
					const maxH = 150;
					const normalized = (y - minH) / (maxH - minH);

					// Clamp opacity between 0.1 and 1.0 as it comes into view
					const opacity = Math.min(Math.max(normalized, 0.1), 1.0);

					if(obj.material)
					{
						obj.material.opacity = opacity;
					}
				}
			});
		};
	}

	private generateWillowData()
	{
		const nodes: any[] = [];
		const links: any[] = [];

		// --- Tier 1: Top Core Hubs (Largest, radial ring at the top) ---
		const topHubs = ['Core App', 'Engine', 'Router'];
		topHubs.forEach((hub, i) =>
		{
			const angle = (2 * Math.PI * i) / topHubs.length;
			nodes.push({
				id: hub,
				name: hub,
				group: 'hub',
				val: 16,
				color: '#7f8c8d',
				fx: Math.cos(angle) * 40,
				fy: 120, // High up on Y-axis
				fz: Math.sin(angle) * 40
			});
		});

		// --- Tier 2: Modules / Folders / Namespaces ---
		const modules = ['AuthModule', 'DatabaseModule', 'UIModule', 'UtilsModule'];
		modules.forEach((mod, i) =>
		{
			const angle = (2 * Math.PI * i) / modules.length;
			nodes.push({
				id: mod,
				name: mod,
				group: 'module',
				val: 10,
				color: '#2ecc71',
				fy: 40 // Middle tier
			});
			// Link to a top hub
			links.push({ source: topHubs[i % topHubs.length], target: mod });
		});

		// --- Tier 3: Leafy Files & AST Nodes (Weeping Willow Drip Effect) ---
		for(let i = 0; i < 40; i++)
		{
			const parentMod = modules[i % modules.length];
			const leafId = `AST_Node_${i}`;

			// Spread AST nodes downwards and outwards like weeping willow branches
			nodes.push({
				id: leafId,
				name: leafId,
				group: 'ast_leaf',
				val: 4,
				color: '#34495e',
				fy: -50 - Math.random() * 80 // Draped lower down on Y-axis
			});
			links.push({ source: parentMod, target: leafId });
		}

		return { nodes, links };
	}
}
