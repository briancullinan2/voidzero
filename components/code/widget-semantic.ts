import { Widget } from '@lumino/widgets';
import ForceGraph3D, { ForceGraph3DInstance } from '3d-force-graph';
import type * as THREE from 'three';
import type { CodeWidget } from './widget';
import type { WillowWidget } from './widget-willow';

type LayoutMode = 'city' | 'rings' | 'metaballs';

const widgetSelf: {
	THREE: typeof THREE;
	CodeWidget: typeof CodeWidget,
	WillowWidget: typeof WillowWidget,
	SemanticWidget: typeof SemanticWidget,
} = self as unknown as any;


export class SemanticWidget extends Widget
{
	private _container: HTMLDivElement;
	private _graph: ForceGraph3DInstance | null = null;
	private _mode: LayoutMode = 'city';
	private _rawData: { nodes: any[]; links: any[]; } | null = null;

	// simple orbit
	private _isDragging = false;
	private _mouseX = 0;
	private _mouseY = 0;
	private _theta = Math.PI * 0.3;
	private _phi = Math.PI * 0.4;
	private _radius = 420;
	private _lookAt = { x: 0, y: 40, z: 0 };

	constructor()
	{
		super();
		this.addClass('jp-SemanticShapeWidget');
		this.node.style.cssText = 'position:relative;width:100%;height:100%;overflow:hidden;background:#0a0a12;';

		this.node.innerHTML = `
      <div id="shape-container" style="width:100%;height:100%;position:absolute;inset:0;"></div>
      <div style="position:absolute;top:12px;left:12px;z-index:20;background:rgba(15,15,25,0.92);padding:12px 16px;border-radius:10px;font-family:system-ui,sans-serif;font-size:13px;color:#e2e8f0;box-shadow:0 4px 20px rgba(0,0,0,0.5);max-width:320px;">
        <b style="color:#38bdf8;">Semantic Shape Constructor</b><br/>
        <span style="opacity:0.75;font-size:11px;">LDA+MDS-style meaning → geometry</span>
        <div style="margin-top:10px;display:flex;gap:6px;">
          <button data-mode="city" class="mode-btn active">🏙 City</button>
          <button data-mode="rings" class="mode-btn">◎ Rings</button>
          <button data-mode="metaballs" class="mode-btn">🧬 Metaballs</button>
        </div>
        <div id="shape-hud" style="margin-top:8px;font-size:11px;opacity:0.7;">Layout: City · Left-drag orbit · Wheel zoom</div>
      </div>
      <style>
        .mode-btn {
          background:#1e293b;color:#94a3b8;border:1px solid #334155;border-radius:6px;
          padding:4px 10px;font-size:12px;cursor:pointer;transition:all .15s;
        }
        .mode-btn:hover { background:#334155;color:#e2e8f0; }
        .mode-btn.active { background:#0ea5e9;color:#fff;border-color:#38bdf8; }
      </style>
    `;

		this._container = this.node.querySelector('#shape-container') as HTMLDivElement;

		this.node.querySelectorAll('.mode-btn').forEach(btn =>
		{
			btn.addEventListener('click', (e) =>
			{
				const mode = (e.currentTarget as HTMLElement).dataset.mode as LayoutMode;
				this.setMode(mode);
			});
		});

		this.initControls();
	}

	protected onAfterAttach(): void
	{
		this.initGraph();
	}

	protected onResize(): void
	{
		if(this._graph && this._container)
		{
			this._graph.width(this._container.clientWidth);
			this._graph.height(this._container.clientHeight);
		}
	}

	private setMode(mode: LayoutMode)
	{
		this._mode = mode;
		this.node.querySelectorAll('.mode-btn').forEach(b =>
		{
			b.classList.toggle('active', (b as HTMLElement).dataset.mode === mode);
		});
		const hud = this.node.querySelector('#shape-hud');
		if(hud) hud.textContent = `Layout: ${mode.charAt(0).toUpperCase() + mode.slice(1)} · Left-drag orbit · Wheel zoom`;

		if(this._rawData)
		{
			this.applyLayout(this._rawData);
		}
	}

	private initControls()
	{
		this.node.addEventListener('mousedown', (e) =>
		{
			if(e.button === 0)
			{
				this._isDragging = true;
				this._mouseX = e.clientX;
				this._mouseY = e.clientY;
			}
		});
		window.addEventListener('mouseup', () => (this._isDragging = false));
		this.node.addEventListener('mousemove', (e) =>
		{
			if(!this._isDragging || !this._graph) return;
			const dx = e.clientX - this._mouseX;
			const dy = e.clientY - this._mouseY;
			this._mouseX = e.clientX;
			this._mouseY = e.clientY;
			this._theta -= dx * 0.006;
			this._phi = Math.max(0.2, Math.min(Math.PI - 0.2, this._phi - dy * 0.006));
			this.updateCamera();
		});
		this.node.addEventListener('wheel', (e) =>
		{
			e.preventDefault();
			this._radius = Math.max(120, Math.min(900, this._radius + e.deltaY * 0.4));
			this.updateCamera();
		}, { passive: false });
	}

	private updateCamera()
	{
		if(!this._graph) return;
		const x = this._lookAt.x + this._radius * Math.sin(this._phi) * Math.cos(this._theta);
		const y = this._lookAt.y + this._radius * Math.cos(this._phi);
		const z = this._lookAt.z + this._radius * Math.sin(this._phi) * Math.sin(this._theta);
		this._graph.cameraPosition({ x, y, z }, this._lookAt, 0);
	}

	private initGraph()
	{
		if(this._container.clientWidth === 0)
		{
			requestAnimationFrame(() => this.initGraph());
			return;
		}

		this._rawData = this.generateSemanticData();
		this._graph = new ForceGraph3D(this._container)
			.enableNavigationControls(false)
			.nodeLabel('name')
			.linkWidth(0.6)
			.linkColor(() => 'rgba(100,140,200,0.25)')
			.backgroundColor('#0a0a12');

		this.applyLayout(this._rawData);
		this.updateCamera();
	}

	// ---------- DATA (same spirit as Willow, but tagged with semantic groups) ----------
	private generateSemanticData()
	{
		const nodes: any[] = [];
		const links: any[] = [];

		// semantic groups (pretend these came from LDA topics)
		const groups = [
			{ id: 'ui', name: 'UI / Presentation', color: '#38bdf8' },
			{ id: 'data', name: 'Data / State', color: '#34d399' },
			{ id: 'logic', name: 'Business Logic', color: '#a78bfa' },
			{ id: 'infra', name: 'Infrastructure', color: '#fbbf24' },
			{ id: 'test', name: 'Tests', color: '#f472b6' }
		];

		// root
		nodes.push({ id: 'root', name: '🚀 Project', val: 18, group: 'infra', color: '#64748b' });

		// packages
		const packages = [
			{ id: 'app', parent: 'root', group: 'ui' },
			{ id: 'store', parent: 'root', group: 'data' },
			{ id: 'services', parent: 'root', group: 'logic' },
			{ id: 'build', parent: 'root', group: 'infra' },
			{ id: 'tests', parent: 'root', group: 'test' }
		];
		packages.forEach(p =>
		{
			nodes.push({ id: p.id, name: `📁 ${p.id}`, val: 12, group: p.group, color: groups.find(g => g.id === p.group)!.color });
			links.push({ source: p.parent, target: p.id });
		});

		// files + fake complexity / semantic weight
		const files = [
			{ id: 'Header', parent: 'app', group: 'ui', loc: 180 },
			{ id: 'Sidebar', parent: 'app', group: 'ui', loc: 140 },
			{ id: 'Dashboard', parent: 'app', group: 'ui', loc: 320 },
			{ id: 'UserStore', parent: 'store', group: 'data', loc: 90 },
			{ id: 'Cache', parent: 'store', group: 'data', loc: 70 },
			{ id: 'AuthSvc', parent: 'services', group: 'logic', loc: 210 },
			{ id: 'ApiClient', parent: 'services', group: 'logic', loc: 160 },
			{ id: 'webpack', parent: 'build', group: 'infra', loc: 110 },
			{ id: 'unit', parent: 'tests', group: 'test', loc: 250 },
			{ id: 'e2e', parent: 'tests', group: 'test', loc: 190 }
		];
		files.forEach(f =>
		{
			nodes.push({
				id: f.id,
				name: `📄 ${f.id}`,
				val: Math.max(4, Math.sqrt(f.loc) * 0.9),
				group: f.group,
				loc: f.loc,
				color: groups.find(g => g.id === f.group)!.color
			});
			links.push({ source: f.parent, target: f.id });
		});

		// a few AST leaves under the heavier files
		['Dashboard', 'AuthSvc', 'unit'].forEach(fid =>
		{
			for(let i = 0; i < 5; i++)
			{
				const id = `${fid}_ast_${i}`;
				nodes.push({
					id,
					name: i % 2 ? `fn_${i}` : `if_${i}`,
					val: 2.5,
					group: nodes.find(n => n.id === fid)!.group,
					color: '#94a3b8'
				});
				links.push({ source: fid, target: id });
			}
		});

		return { nodes, links };
	}

	// ---------- LAYOUT ENGINES ----------
	private applyLayout(data: { nodes: any[]; links: any[]; })
	{
		if(!this._graph) return;

		// clone so we can mutate positions freely
		const nodes = data.nodes.map(n => ({ ...n }));
		const links = data.links.map(l => ({ ...l }));

		if(this._mode === 'city') this.layoutCity(nodes);
		else if(this._mode === 'rings') this.layoutRings(nodes);
		else this.layoutMetaballs(nodes);

		this._graph
			.graphData({ nodes, links })
			.nodeThreeObject((node: any) => this.createNodeObject(node))
			.d3Force('charge')?.strength(this._mode === 'metaballs' ? -30 : -60);

		// freeze after short settle
		setTimeout(() =>
		{
			nodes.forEach(n => { n.fx = n.x; n.fy = n.y; n.fz = n.z; });
		}, 800);
	}

	private layoutCity(nodes: any[])
	{
		// packages as districts on a grid, files as buildings of height ~ loc
		const packages = nodes.filter(n => n.name.startsWith('📁'));
		const files = nodes.filter(n => n.name.startsWith('📄') || n.name.includes('ast'));

		packages.forEach((p, i) =>
		{
			const col = i % 3;
			const row = Math.floor(i / 3);
			p.x = (col - 1) * 90;
			p.y = 0;
			p.z = (row - 0.5) * 90;
			p.val = 8;
		});

		files.forEach(f =>
		{
			const parent = nodes.find(n => n.id === (f.id.includes('_ast') ? f.id.split('_ast')[0] : f.parent || f.id));
			// find real parent package
			const pkg = nodes.find(n => n.id === (f.parent || (f.id.includes('_') ? f.id.split('_')[0] : null)));
			const base = pkg || { x: 0, z: 0 };
			const angle = Math.random() * Math.PI * 2;
			const r = 18 + Math.random() * 25;
			f.x = base.x + Math.cos(angle) * r;
			f.z = base.z + Math.sin(angle) * r;
			f.y = (f.loc || 40) * 0.18;          // height = complexity
			f.val = Math.max(3, (f.loc || 40) * 0.04);
		});

		// root floating above
		const root = nodes.find(n => n.id === 'root');
		if(root) { root.x = 0; root.y = 80; root.z = 0; }
	}

	private layoutRings(nodes: any[])
	{
		// concentric rings by “depth” (root center → packages → files → ast)
		const depth = (n: any) =>
		{
			if(n.id === 'root') return 0;
			if(n.name.startsWith('📁')) return 1;
			if(n.name.startsWith('📄')) return 2;
			return 3;
		};

		const byDepth: any[][] = [[], [], [], []];
		nodes.forEach(n => byDepth[depth(n)].push(n));

		byDepth.forEach((layer, d) =>
		{
			const radius = d * 55;
			layer.forEach((n, i) =>
			{
				const angle = (2 * Math.PI * i) / Math.max(layer.length, 1);
				n.x = Math.cos(angle) * radius;
				n.z = Math.sin(angle) * radius * 0.7;
				n.y = 30 - d * 25;
				n.val = 14 - d * 2.5;
			});
		});
	}

	private layoutMetaballs(nodes: any[])
	{
		// soft clusters by semantic group (the “DNA / Jarvis” feel)
		const groups = ['ui', 'data', 'logic', 'infra', 'test'];
		const centers: Record<string, { x: number; y: number; z: number; }> = {};
		groups.forEach((g, i) =>
		{
			const a = (2 * Math.PI * i) / groups.length;
			centers[g] = {
				x: Math.cos(a) * 70,
				y: Math.sin(a * 1.3) * 25,
				z: Math.sin(a) * 70
			};
		});

		nodes.forEach(n =>
		{
			const c = centers[n.group] || { x: 0, y: 0, z: 0 };
			n.x = c.x + (Math.random() - 0.5) * 35;
			n.y = c.y + (Math.random() - 0.5) * 30;
			n.z = c.z + (Math.random() - 0.5) * 35;
			n.val = n.val * 1.4;   // bigger soft blobs
		});
	}

	// ---------- VISUAL OBJECTS ----------
	private createNodeObject(node: any): THREE.Object3D
	{
		if(this._mode === 'city' && (node.name.startsWith('📄') || node.loc))
		{
			// building
			const h = Math.max(8, node.y || 20);
			const geo = new widgetSelf.THREE.BoxGeometry(node.val * 1.6, h, node.val * 1.6);
			const mat = new widgetSelf.THREE.MeshLambertMaterial({
				color: node.color,
				transparent: true,
				opacity: 0.92
			});
			const mesh = new widgetSelf.THREE.Mesh(geo, mat);
			mesh.position.y = h / 2;
			return mesh;
		}

		if(this._mode === 'metaballs')
		{
			// soft glowing sphere
			const geo = new widgetSelf.THREE.SphereGeometry(node.val * 1.3, 20, 20);
			const mat = new widgetSelf.THREE.MeshPhongMaterial({
				color: node.color,
				transparent: true,
				opacity: 0.75,
				shininess: 80,
				emissive: new widgetSelf.THREE.Color(node.color).multiplyScalar(0.15)
			});
			return new widgetSelf.THREE.Mesh(geo, mat);
		}

		// default / rings → simple sphere
		const geo = new widgetSelf.THREE.SphereGeometry(node.val, 16, 16);
		const mat = new widgetSelf.THREE.MeshLambertMaterial({
			color: node.color,
			transparent: true,
			opacity: 0.9
		});
		return new widgetSelf.THREE.Mesh(geo, mat);
	}
}
