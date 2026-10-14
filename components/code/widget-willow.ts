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
		this.initCustomControls();
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

	private _isLeftMouseDown = false;
	private _isRightMouseDown = false;
	private _mouseX = 0;
	private _mouseY = 0;
	private _centerX = 0;
	private _centerY = 0;
	private _centerZ = 0; // Level of Detail / Z-Height axis
	private _theta = Math.PI / 4; // Orbit angle horizontal
	private _phi = Math.PI / 3;   // Orbit angle vertical
	private _orbitRadius = 500;

	private initCustomControls()
	{
		this.node.addEventListener('contextmenu', e => e.preventDefault());

		this.node.addEventListener('mousedown', (e: MouseEvent) =>
		{
			if(e.button === 0) this._isLeftMouseDown = true;
			if(e.button === 2) this._isRightMouseDown = true;
			this._mouseX = e.clientX;
			this._mouseY = e.clientY;
		});

		window.addEventListener('mouseup', (e: MouseEvent) =>
		{
			if(e.button === 0) this._isLeftMouseDown = false;
			if(e.button === 2) this._isRightMouseDown = false;
		});

		this.node.addEventListener('mousemove', (e: MouseEvent) =>
		{
			if(!this._graph) return;
			const dx = e.clientX - this._mouseX;
			const dy = e.clientY - this._mouseY;
			this._mouseX = e.clientX;
			this._mouseY = e.clientY;

			// 1. Left Click: Strictly constrained orbital rotation around center point (cannot flip upside down)
			if(this._isLeftMouseDown)
			{
				this._theta -= dx * 0.005;
				// Strict clamping so the tree never tilts sideways or inverts
				this._phi = Math.max(Math.PI * 0.15, Math.min(Math.PI * 0.65, this._phi - dy * 0.005));
				this.updateCameraPosition();
			}

			// 2. Right Click: Strict Axis Separation (Horizontal time-morph vs Vertical LOD)
			if(this._isRightMouseDown)
			{
				if(Math.abs(dx) >= Math.abs(dy))
				{
					this._centerX = Math.max(-50, Math.min(500, this._centerX - dx * 2.0));
					this.updateHUD();
				} else
				{
					// Control vertical height (_centerY) so dragging up/down pans through tree tiers
					this._centerY = Math.max(-120, Math.min(120, this._centerY - dy * 1.5));
					this.updateHUD();
				}
				this.updateCameraPosition();
			}
		});

		this.node.addEventListener('wheel', (e: WheelEvent) =>
		{
			e.preventDefault();
			this._orbitRadius = Math.max(150, Math.min(1200, this._orbitRadius + e.deltaY * 0.5));
			this.updateCameraPosition();
		}, { passive: false });
	}

	private updateHUD()
	{
		const hud = this.node.querySelector('#hud-status');
		if(!hud) return;
		const timeState = this._centerX < -150 ? 'Previous Commit (v0.9)' : this._centerX > 150 ? 'Future Branch (v1.1)' : 'HEAD (Active Commit)';
		const tierState = this._centerY > 60 ? 'Project Root & Configs' : this._centerY < -40 ? 'AST Code Tokens & Statements' : 'Modules & Components';
		hud.textContent = `Timeline: ${timeState} | View: ${tierState}`;
	}

	private updateCameraPosition()
	{
		if(!this._graph) return;

		// Force a stable upright camera vector so the world never rolls sideways
		const cam = this._graph.camera();
		if(cam && (cam as THREE.PerspectiveCamera).up)
		{
			(cam as THREE.PerspectiveCamera).up.set(0, 1, 0);
		}

		const x = this._centerX + this._orbitRadius * Math.sin(this._phi) * Math.cos(this._theta);
		const y = this._centerY + this._orbitRadius * Math.cos(this._phi);
		const z = this._centerZ + this._orbitRadius * Math.sin(this._phi) * Math.sin(this._theta);

		this._graph.cameraPosition(
			{ x, y, z },
			{ x: this._centerX, y: this._centerY, z: this._centerZ },
			0 // zero transition duration removes any internal lag/jitter
		);
	}
	private init3DGraph()
	{
		if(this._container.clientWidth === 0 || this._container.clientHeight === 0)
		{
			requestAnimationFrame(() => this.init3DGraph());
			return;
		}

		const graphData = this.generateWillowData();

		this._graph = new ForceGraph3D(this._container)
			.graphData(graphData)
			.enableNavigationControls(false)
			.nodeThreeObject((node: any) =>
			{
				const size = node.val || 5;
				const geometry = new THREE.SphereGeometry(size, 16, 16);
				const material = new THREE.MeshLambertMaterial({
					color: node.color || '#2ecc71',
					transparent: true,
					opacity: 1.0
				});
				const mesh = new THREE.Mesh(geometry, material);
				(mesh as any).nodeData = node;
				return mesh;
			})
			.nodeLabel('name')
			.linkColor((link: any) =>
				link.isAnchor ? 'rgba(239, 68, 68, 0.9)' :
					link.isToken ? 'rgba(99, 102, 241, 0.8)' :
						'rgba(59, 130, 246, 0.75)' // 🌟 Vibrant, highly visible link color
			)
			.linkWidth((link: any) =>
				link.isAnchor ? 2.5 :
					link.isToken ? 1.2 :
						1.0 // 🌟 Thicker, more solid links
			);

		const fg = this._graph;
		fg.d3Force('charge')?.strength(-80);

		// Z-height LOD & Horizontal Multi-Commit Overlap Slide Ticker
		const scene = fg.scene();
		scene.onBeforeRender = () =>
		{
			scene.traverse((obj: any) =>
			{
				if(obj.isMesh && obj.nodeData)
				{
					const node = obj.nodeData;
					const y = obj.position.y;

					// 🌟 Top-to-bottom vertical fade based on distance from current vertical view center (_centerY)
					const verticalDistance = Math.abs(y - this._centerY);
					let opacity = Math.max(0.1, 1.0 - (verticalDistance / 220));

					// Multi-commit horizontal sliding overlap logic
					if(node.commitX !== undefined)
					{
						const distanceToCenter = Math.abs(node.commitX - this._centerX);
						const fadeFactor = Math.max(0, 1.0 - (distanceToCenter / 400));
						opacity *= fadeFactor;
					}

					if(obj.material)
					{
						obj.material.opacity = opacity;
						obj.visible = opacity > 0.05;
					}
				}
			});
		};

		this.updateCameraPosition();
	}

	private generateWillowData(): { links: any[], nodes: any[]; }
	{
		const nodes: any[] = [];
		const links: any[] = [];

		// Helper to build a complete project hierarchy tree at a specific commit center X coordinate
		const buildCommitTree = (commitName: string, centerX: number, isGhost: boolean) =>
		{
			// ---------- Tier 0: Project Root (top center) ----------
			const rootId = `${commitName}_root`;
			nodes.push({
				id: rootId,
				name: isGhost ? '📁 Project Root (v0.9 - Previous)' : '🚀 Project Root (HEAD)',
				val: 22,
				color: isGhost ? '#eab308' : '#3b82f6', // Yellow for v0.9, Blue for HEAD
				fx: centerX, fy: 150, fz: isGhost ? -60 : 0, // Ghost tree angled slightly behind (Z: -60)
				commitX: centerX
			});

			// ---------- Tier 1: Major folders / hubs (ring just under root) ----------
			const hubs = [
				{ id: `${commitName}_app`, name: '📁 app', color: isGhost ? '#facc15' : '#60a5fa' },
				{ id: `${commitName}_build`, name: '📁 build', color: isGhost ? '#facc15' : '#60a5fa' },
				{ id: `${commitName}_workers`, name: '📁 workers', color: isGhost ? '#facc15' : '#60a5fa' },
				{ id: `${commitName}_tests`, name: '📁 tests', color: isGhost ? '#facc15' : '#60a5fa' },
				{ id: `${commitName}_shared`, name: '📁 shared', color: isGhost ? '#facc15' : '#60a5fa' },
				{ id: `${commitName}_scripts`, name: '📁 scripts', color: isGhost ? '#facc15' : '#60a5fa' }
			];

			hubs.forEach((h, i) =>
			{
				const angle = (2 * Math.PI * i) / hubs.length;
				const radius = 75;
				nodes.push({
					id: h.id,
					name: h.name,
					val: 16,
					color: h.color,
					fx: centerX + Math.cos(angle) * radius,
					fy: 100,
					fz: (isGhost ? -60 : 0) + Math.sin(angle) * radius * 0.45,
					commitX: centerX
				});
				links.push({ source: rootId, target: h.id });
			});

			// ---------- Tier 2: Components / sub-folders ----------
			const components = [
				{ id: `${commitName}_Header`, name: isGhost ? '📄 Header.ts (Old)' : '📄 Header.tsx', parent: `${commitName}_app`, dx: -30, dz: -20 },
				{ id: `${commitName}_Sidebar`, name: '📄 Sidebar.tsx', parent: `${commitName}_app`, dx: 25, dz: 15 },
				{ id: `${commitName}_Dashboard`, name: '📄 Dashboard.tsx', parent: `${commitName}_app`, dx: 0, dz: -35 },
				{ id: `${commitName}_webpack`, name: '📄 webpack.config', parent: `${commitName}_build`, dx: -20, dz: 25 },
				{ id: `${commitName}_unit`, name: '📁 unit', parent: `${commitName}_tests`, dx: 30, dz: -15 },
				{ id: `${commitName}_integration`, name: '📁 integration', parent: `${commitName}_tests`, dx: -25, dz: 30 },
				{ id: `${commitName}_utils`, name: '📄 utils.ts', parent: `${commitName}_shared`, dx: 15, dz: -25 },
				{ id: `${commitName}_types`, name: '📄 types.ts', parent: `${commitName}_shared`, dx: -15, dz: 20 },
				{ id: `${commitName}_platforms`, name: '📁 platforms', parent: `${commitName}_build`, dx: 28, dz: 22 }
			];

			components.forEach(c =>
			{
				const parent = nodes.find(n => n.id === c.parent);
				if(!parent) return;

				nodes.push({
					id: c.id,
					name: c.name,
					val: 11,
					color: isGhost ? '#ca8a04' : '#34d399',
					fx: parent.fx + c.dx,
					fy: 40,
					fz: parent.fz + c.dz,
					commitX: centerX
				});
				links.push({ source: c.parent, target: c.id });
			});

			// ---------- Tier 3: AST / code tokens hanging under the files ----------
			const filesWithAst = [
				`${commitName}_Header`,
				`${commitName}_Sidebar`,
				`${commitName}_Dashboard`,
				`${commitName}_utils`,
				`${commitName}_types`,
				`${commitName}_webpack`
			];

			filesWithAst.forEach(fileId =>
			{
				const file = nodes.find(n => n.id === fileId);
				if(!file) return;

				const count = 6 + Math.floor(Math.random() * 3);
				for(let t = 0; t < count; t++)
				{
					const astId = `${fileId}_ast_${t}`;
					const isBranch = t % 3 === 0;

					nodes.push({
						id: astId,
						name: isBranch ? (t % 2 === 0 ? `if (...)` : `return`) : `AST Token ${t}`,
						val: isBranch ? 5 : 3.5,
						color: isGhost ? '#fde047' : (isBranch ? '#818cf8' : '#a78bfa'),
						fx: file.fx + (t - count / 2) * 12 + (Math.random() - 0.5) * 8,
						fy: -20 - t * 18 - Math.random() * 10,
						fz: file.fz + (Math.random() - 0.5) * 20,
						commitX: centerX
					});
					links.push({ source: fileId, target: astId, isToken: true });
				}
			});
		};

		// 1. Build HEAD (Active Commit Tree) centered at X = 0
		buildCommitTree('HEAD', 0, false);

		// 2. Build v0.9 (Previous Commit Tree) offset to the right at X = 450, angled slightly behind
		buildCommitTree('v0.9', 450, true);

		// 3. Diff Anchor Strings connecting corresponding nodes between HEAD and v0.9 during horizontal overlap
		nodes.forEach(node =>
		{
			if(node.commitX === 0)
			{
				const oldId = node.id.replace('HEAD_', 'v0.9_');
				const oldNode = nodes.find(n => n.id === oldId);
				if(oldNode)
				{
					links.push({
						source: node.id,
						target: oldNode.id,
						isAnchor: true
					});
				}
			}
		});

		return { nodes, links };
	}
}
