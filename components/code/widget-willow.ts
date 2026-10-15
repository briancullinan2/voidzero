import { Widget } from '@lumino/widgets';
import ForceGraph3D, { ForceGraph3DInstance, NodeObject } from '3d-force-graph';
import type * as THREE from 'three';
import type { CodeWidget } from './widget';
import type { SemanticWidget } from './widget-semantic';
import type { LuminoLayoutWindow } from '../bundle/lumino.d';
import { Message } from '@lumino/messaging';

export interface WillowNode extends NodeObject
{
	id: string;
	name: string;
	val: number;
	color: string;
	commitX: number;
	offsetX: number;
	isGhost: boolean;
	commitName: string;
	position?: { x: number, y: number; };
}

const widgetSelf: {
	THREE: typeof THREE;
	CodeWidget: typeof CodeWidget,
	WillowWidget: typeof WillowWidget,
	SemanticWidget: typeof SemanticWidget,
} & LuminoLayoutWindow = self as unknown as any;

export class WillowWidget extends Widget
{
	private _container: HTMLDivElement;
	private _graph: ForceGraph3DInstance | null = null;
	private hoverNode?: WillowNode;

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

	protected override onAfterAttach(msg: Message): void
	{
		super.onAfterAttach(msg);
		this.init3DGraph();
	}

	protected override onResize(msg: Widget.ResizeMessage): void
	{
		super.onResize(msg);
		if(this._graph && this._container)
		{
			this._graph.width(this._container.clientWidth);
			this._graph.height(this._container.clientHeight);
		}
	}

	public static COMMIT_GRAPH_DISTANCE = 450;
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
	private _focalX = 0;
	private _focalY = 0;
	private _animFrameId: number | null = null;
	private _centerX2 = 0;
	private _centerX1 = 0;

	private animateToFocal(targetX: number, targetY: number, duration = 300)
	{
		// Cancel any active animation so it instantly interrupts smoothly
		if(this._animFrameId !== null)
		{
			cancelAnimationFrame(this._animFrameId);
			this._animFrameId = null;
		}

		const startX = this._focalX;
		const startY = this._focalY;
		const startTime = performance.now();

		const step = (now: number) =>
		{
			const elapsed = now - startTime;
			const progress = Math.min(1, elapsed / duration);
			// Cubic ease-out for a smooth deceleration into the resting focal point
			const ease = 1 - Math.pow(1 - progress, 3);

			this._focalX = startX + (targetX - startX) * ease;
			this._focalY = startY + (targetY - startY) * ease;
			this.updateCameraPosition();

			if(progress < 1)
			{
				this._animFrameId = requestAnimationFrame(step);
			} else
			{
				this._animFrameId = null;
			}
		};

		this._animFrameId = requestAnimationFrame(step);
	}

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


			if(!this._isLeftMouseDown && !this._isRightMouseDown)
			{
				if(this.hoverNode)
				{
					// 🌟 Smoothly animate toward the node's relative offset using the new animation runner
					const targetOffsetX = (this.hoverNode.fx ?? 0) - this._centerX;
					const targetOffsetY = (this.hoverNode.fy ?? 0) - this._centerY;
					this.animateToFocal(targetOffsetX, targetOffsetY, 250);
				} else
				{
					//this.animateToFocal(0, 0, 250);
				}
				return;
			}


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
				this.animateToFocal(0, 0, 250);
				if(Math.abs(dx) >= Math.abs(dy))
				{
					// 1. Primary commit (_centerX): starts with near-zero crawl, then accelerates to slide out of frame
					this._centerX = Math.max(-50, Math.min(WillowWidget.COMMIT_GRAPH_DISTANCE + 50, this._centerX - dx * 1.1));

					const progress = this._centerX / WillowWidget.COMMIT_GRAPH_DISTANCE;
					if(progress < 0.5)
					{
						this._centerX1 = Math.max(-50, Math.min(WillowWidget.COMMIT_GRAPH_DISTANCE + 50, this._centerX + (progress / 0.5 * WillowWidget.COMMIT_GRAPH_DISTANCE * 0.25)));
						//this._centerX2 = Math.max(-50, Math.min(WillowWidget.COMMIT_GRAPH_DISTANCE + 50, ((progress - 0.5) / 0.5 * 2.0 * WillowWidget.COMMIT_GRAPH_DISTANCE)));
					} else
					{
						this._centerX1 = Math.max(-50, Math.min(WillowWidget.COMMIT_GRAPH_DISTANCE + 50, this._centerX + WillowWidget.COMMIT_GRAPH_DISTANCE * 0.25 - ((progress - 0.5) / 0.5 * (WillowWidget.COMMIT_GRAPH_DISTANCE + WillowWidget.COMMIT_GRAPH_DISTANCE * 0.25))));
						//this._centerX2 = Math.max(-50, Math.min(WillowWidget.COMMIT_GRAPH_DISTANCE + 50, 0));
					}

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
		widgetSelf.statusBar?.updateStatusItem('env-state', 'Graph: '
			+ `Mouse: ${this._mouseX}x${this._mouseY}, `
			+ `Cursor: ${this._centerX}x${this._centerY}x${this._centerZ}, `
			+ `Radius: ${this._orbitRadius}, `
			//+ errorInfo
			+ `Node: ${this.hoverNode?.name}, Commit: ${this.hoverNode?.commitName}`
		);

	}

	private updateCameraPosition()
	{
		if(!this._graph) return;

		const cam = this._graph.camera();
		if(cam && (cam as THREE.PerspectiveCamera).up)
		{
			(cam as THREE.PerspectiveCamera).up.set(0, 1, 0);
		}

		// 🌟 Combine base center with animated focal offsets
		const targetX = this._centerX + this._focalX;
		const targetY = this._centerY + this._focalY;
		const targetZ = this._centerZ;

		const x = targetX + this._orbitRadius * Math.sin(this._phi) * Math.cos(this._theta);
		const y = targetY + this._orbitRadius * Math.cos(this._phi);
		const z = targetZ + this._orbitRadius * Math.sin(this._phi) * Math.sin(this._theta);

		this._graph.cameraPosition(
			{ x, y, z },
			{ x: targetX, y: targetY, z: targetZ },
			0
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
			.onNodeHover((node: NodeObject | WillowNode | any | null) =>
			{
				if(node && node.commitName === 'HEAD')
				{
					this.hoverNode = node;
				} else
				{
					this.hoverNode = undefined;
				}
			})
			.nodeThreeObject((node: NodeObject | WillowNode | any | null) =>
			{
				const size = node?.val ?? 5;
				const geometry = new widgetSelf.THREE.SphereGeometry(size, 16, 16);
				const material = new widgetSelf.THREE.MeshLambertMaterial({
					color: node?.color ?? '#2ecc71',
					transparent: true,
					opacity: 1.0
				});
				const mesh = new widgetSelf.THREE.Mesh(geometry, material);
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

					if(node.isGhost)
					{
						node.fx = node.commitX + node.offsetX + this._centerX2;
					} else
					{
						node.fx = node.commitX + node.offsetX + this._centerX1;
					}

					// 🌟 Top-to-bottom vertical fade based on distance from current vertical view center (_centerY)
					const verticalDistance = Math.abs(y - this._centerY);
					let opacity = Math.max(0.1, 1.0 - (verticalDistance / 220));

					// Multi-commit horizontal sliding overlap logic
					if(node.commitX !== undefined)
					{
						const distanceToCenter = Math.abs(node.commitX - this._centerX);
						// const fadeFactor = Math.max(0, 1.0 - (distanceToCenter / 400));
						const fadeFactor = Math.max(0, 1.0 - (distanceToCenter / (2 * WillowWidget.COMMIT_GRAPH_DISTANCE)));
						opacity *= fadeFactor;
					}

					if(obj.material)
					{
						obj.material.opacity = opacity;
						obj.visible = opacity > 0.05;
					}
				}
			});
			this._graph?.d3ReheatSimulation();
		};

		this.updateCameraPosition();
	}

	private generateWillowData(): { links: any[], nodes: WillowNode[]; }
	{
		const nodes: WillowNode[] = [];
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
				commitX: centerX,
				offsetX: 0,
				isGhost: isGhost,
				commitName
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
					commitX: centerX,
					offsetX: Math.cos(angle) * radius,
					isGhost: isGhost,
					commitName
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
					fx: (parent.fx ?? 0) + c.dx,
					fy: 40,
					fz: (parent.fz ?? 0) + c.dz,
					commitX: centerX,
					offsetX: parent.offsetX + c.dx,
					isGhost: isGhost,
					commitName
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
						fx: (file.fx ?? 0) + (t - count / 2) * 12 + (Math.random() - 0.5) * 8,
						fy: -20 - t * 18 - Math.random() * 10,
						fz: (file.fz ?? 0) + (Math.random() - 0.5) * 20,
						commitX: centerX,
						offsetX: file.offsetX + (t - count / 2) * 12 + (Math.random() - 0.5) * 8,
						isGhost: isGhost,
						commitName
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
