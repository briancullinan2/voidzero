import Graph from "graphology";
import { GitHubFileEntry } from "../bundle/github-types";
import { PROJECT_LAYOUT_TIERS, TierRule } from "./widget-tiers";
import { WillowEdge, WillowNode } from "./widget-willow";
import { hsl as d3HSL, rgb as d3RGB } from 'd3';



export const SCALE_FACTOR = 100;
export const SCALE_NODES = 30;
export const EDGE_SCALE = 2;


export class ProjectNodes
{

	public static async getTier0Services(files: GitHubFileEntry[], commitName?: string, centerX?: number): Promise<WillowNode[]>
	{

		const services: ({ id: string, name: string, color?: string; })[] = [];
		const alreadyTiered: string[] = [];
		const alreadyExted: string[] = [];
		for(const n of files)
		{
			const leaf = (n.name ?? n.path)?.split(/[\\\/]/gi).pop();
			const pathParts = n.path?.split(/[\\\/]/gi);

			if(pathParts.some(p => p.startsWith('.')))
			{
				continue;
			}
			const ext = leaf?.includes('.') ? leaf?.split('.').pop() : undefined;


			if(ext && !alreadyExted.includes('Extension'))
			{
				services.push({
					id: `${commitName ?? 'HEAD'}_ext`,
					name: 'Extension',
				});
				alreadyExted.push('Extension');
			}

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
				if(alreadyTiered.includes(t.name))
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
					alreadyTiered.push(t.name);
					break;
				}
			}
		}

		const fullServiceObjects = services.map((h, i) =>
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
		return fullServiceObjects;
	}


	public static async getTier1Services(files: GitHubFileEntry[], commitName?: string, centerX?: number): Promise<{ nodes: WillowNode[], edges: WillowEdge[]; }>
	{

		const services: ({ id: string, name: string, color?: string; })[] = [];
		const edges: ({ source: string, target: string; })[] = [];
		const alreadyEdged: string[] = [];
		const alreadyExted: string[] = [];
		for(const n of files)
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

		const fullEdgeObjects = edges.map((h, i) =>
		{
			return ({
				source: h.source,
				target: h.target,
				// color: h.color
				color: '#cbd5e1',
				// size: 1.2
			});
		});
		const fullServiceObjects = services.map((h, i) =>
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
			nodes: fullServiceObjects,
			edges: fullEdgeObjects
		};
	}


	public static async getTier2Services(files: GitHubFileEntry[], commitName?: string, centerX?: number): Promise<{ nodes: WillowNode[], edges: WillowEdge[]; }>
	{

		const services: ({ id: string, name: string, color?: string; })[] = [];
		const edges: ({ source: string, target: string; })[] = [];
		const alreadyEdged: string[] = [];
		const alreadyFoldered: string[] = [];
		for(const n of files)
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

		for(const n of files)
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

		const fullEdgeObjects = edges.map((h, i) =>
		{
			return ({
				source: h.source,
				target: h.target,
				// color: h.color
				color: '#cbd5e1',
				// size: 1
			});
		});
		const fullServiceObjects = services.map((h, i) =>
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
			nodes: fullServiceObjects,
			edges: fullEdgeObjects
		};
	}




	public static async getTier3Files(files: GitHubFileEntry[], commitName?: string, centerX?: number): Promise<{ nodes: WillowNode[], edges: WillowEdge[]; }>
	{

		const services: ({ id: string, name: string, color?: string; })[] = [];
		const edges: ({ source: string, target: string; })[] = [];
		const alreadyEdged: string[] = [];
		const alreadyFiled: string[] = [];
		for(const n of files)
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


		const fullEdgeObjects = edges.map((h, i) =>
		{
			return ({
				source: h.source,
				target: h.target,
				// color: h.color
				color: '#cbd5e1',
				// size: 0.8
			});
		});
		const fullFileObjects = services.map((h, i) =>
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
			nodes: fullFileObjects,
			edges: fullEdgeObjects
		};
	}



	public static appendGraph(nodes: WillowNode[], lookup: Map<string, string[]>, children: WillowNode[], totalServices: number, grouped: Map<string, string[]>, graph: Graph, factor: number)
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

				if(!graph.hasNode(childId))
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
					graph.addNode(childId, {
						tier: childNodeData.tier,
						label: childNodeData.name || childId,
						x: childX,
						y: childY,
						size: this.getScaledSize(childNodeData, (grouped.get(childNodeData.id) ?? []).length, graph),
						color: color,
						service: serviceNode.name
					});
				}
			});
		});

	}



	public static getScaledSize(nodeData: WillowNode, groupCount: number, graph: Graph): number
	{
		return 5;
		const totalNodes = graph.order || 1;

		// Base size that scales sub-linearly with graph size (using log scale)
		// This ensures large graphs don't crush nodes into tiny pixels, and small graphs don't look sparse
		const dynamicSize = 4 + (6 * Math.log10(totalNodes + 1));

		// Optional: Boost size slightly if the node has a high group/connection count
		const groupBonus = Math.min(4, groupCount * 0.5);

		// Clamp between a safe min and max pixel radius (e.g., 5px to 16px)
		return Math.max(5, Math.min(16, dynamicSize + groupBonus));
	}



	// public static getScaledSize(node: WillowNode, children: number, factor: number)
	// {
	// 	// const units = (this._graph?.nodes().length ?? 0) / SCALE_FACTOR;
	// 	return (Math.max(1, factor) - ((node.tier ?? 0) + 1) / 4 * Math.max(1, factor))
	// 		* (SCALE_FACTOR / SCALE_NODES) + Math.max(SCALE_FACTOR / SCALE_NODES, Math.min(0, children / SCALE_FACTOR));
	// }

	public static getScaledEdge(node: WillowNode, factor: number)
	{
		// const units = (this._graph?.nodes().length ?? 0) / SCALE_FACTOR;
		return Math.max(1, factor) - ((node.tier ?? 0) + 1) / 4 * Math.max(1, factor);
	}




	public static generateAlienRingGraph(
		nodes: WillowNode[],
		lookup: Map<string, string[]>,
		children: WillowNode[],
		totalServices: number,
		grouped: Map<string, string[]>,
		forcedGraph: Graph,
		factor: number,
		centerX: number = 0,
		centerY: number = 0,
		baseRadius: number = 150,     // Increased base radius to push rings outward
		layerSpacing: number = 20     // Wider spacing between concentric layers
	): Graph
	{
		const newGraph = new Graph();

		// 1. EXPANSIVE SCALING: Scale outward dynamically based on service count to fill the viewport
		// const serviceCount = Math.max(1, nodes.length);
		// const adaptiveBaseRadius = Math.max(baseRadius, 250 + (serviceCount * 12));
		// const adaptiveLayerSpacing = Math.max(layerSpacing, 40 + (serviceCount * 2));
		const adaptiveBaseRadius = baseRadius;
		const adaptiveLayerSpacing = layerSpacing;

		// Generous maximum boundary to allow rings to fill out the screen edges
		const maxAllowedRadius = 400;

		interface TargetSlot
		{
			x: number;
			y: number;
			serviceNode: WillowNode;
			serviceIndex: number;
			childNodeData: WillowNode | any;
			childId: string;
		}

		const targetSlots: TargetSlot[] = [];

		nodes.forEach((serviceNode: WillowNode, sIndex: number) =>
		{
			const childIds = lookup.get(serviceNode.id) || [];
			if(childIds.length === 0) return;

			// Expand outward per service layer
			let serviceRadius = adaptiveBaseRadius + (sIndex * adaptiveLayerSpacing);
			serviceRadius = Math.min(serviceRadius, maxAllowedRadius);

			const serviceAngleOffset = sIndex * 0.35;

			childIds.forEach((childId, j) =>
			{
				const childNodeData = children.find(n => n.id === childId);
				if(!childNodeData) return;

				const angle = serviceAngleOffset + (2 * Math.PI * j) / childIds.length;
				const slotX = centerX + Math.cos(angle) * serviceRadius;
				const slotY = centerY + Math.sin(angle) * serviceRadius;

				targetSlots.push({
					x: slotX,
					y: slotY,
					serviceNode,
					serviceIndex: sIndex,
					childNodeData,
					childId
				});
			});
		});

		// 2. Gather ALL unique child nodes
		const targetSlotNodeIds = new Set(targetSlots.map(s => s.childId));
		const allTargetChildIds = Array.from(new Set([
			...targetSlotNodeIds,
			...children.map(c => c.id)
		]));

		const nodeCurrentPositions = new Map<string, { x: number; y: number; }>();
		const totalFallbackNodes = allTargetChildIds.length;

		allTargetChildIds.forEach((id, index) =>
		{
			let fx, fy;
			if(forcedGraph.hasNode(id))
			{
				fx = forcedGraph.getNodeAttribute(id, 'x') ?? centerX;
				fy = forcedGraph.getNodeAttribute(id, 'y') ?? centerY;
			}
			else
			{
				// FIX: Scatter missing/Tier 0 nodes evenly on an outer perimeter ring
				// instead of collapsing them to dead center (0,0)
				const scatterAngle = (2 * Math.PI * index) / totalFallbackNodes;
				const scatterRadius = adaptiveBaseRadius * 1.5;
				fx = centerX + Math.cos(scatterAngle) * scatterRadius;
				fy = centerY + Math.sin(scatterAngle) * scatterRadius;
			}
			nodeCurrentPositions.set(id, { x: fx, y: fy });
		});

		// 3. Shortest-Path Selection & Sorting Algorithm
		interface DistancePair
		{
			nodeId: string;
			slotIndex: number;
			distance: number;
		}

		const pairs: DistancePair[] = [];
		allTargetChildIds.forEach(nodeId =>
		{
			const pos = nodeCurrentPositions.get(nodeId)!;
			targetSlots.forEach((slot, slotIndex) =>
			{
				const dx = slot.x - pos.x;
				const dy = slot.y - pos.y;
				pairs.push({ nodeId, slotIndex, distance: Math.sqrt(dx * dx + dy * dy) });
			});
		});

		pairs.sort((a, b) => a.distance - b.distance);

		const assignedSlots = new Map<string, TargetSlot>();
		const usedSlots = new Set<number>();
		const assignedNodes = new Set<string>();

		for(const pair of pairs)
		{
			if(!assignedNodes.has(pair.nodeId) && !usedSlots.has(pair.slotIndex))
			{
				assignedNodes.add(pair.nodeId);
				usedSlots.add(pair.slotIndex);
				assignedSlots.set(pair.nodeId, targetSlots[pair.slotIndex]);
			}
		}

		// 4. FALLBACK PASS: Ensure zero nodes are dropped
		allTargetChildIds.forEach((nodeId, idx) =>
		{
			if(!assignedSlots.has(nodeId))
			{
				const openSlotIndex = targetSlots.findIndex((_, sIdx) => !usedSlots.has(sIdx));
				if(openSlotIndex !== -1)
				{
					usedSlots.add(openSlotIndex);
					assignedSlots.set(nodeId, targetSlots[openSlotIndex]);
				}
				else
				{
					const fallbackAngle = (2 * Math.PI * idx) / allTargetChildIds.length;
					const fallbackRadius = Math.min(maxAllowedRadius, adaptiveBaseRadius * 1.2);
					assignedSlots.set(nodeId, {
						x: centerX + Math.cos(fallbackAngle) * fallbackRadius,
						y: centerY + Math.sin(fallbackAngle) * fallbackRadius,
						serviceNode: nodes[0] || { id: 'default', name: 'Default', color: '#3b82f6' },
						serviceIndex: 0,
						childNodeData: children.find(c => c.id === nodeId) || { id: nodeId, tier: 0, name: nodeId },
						childId: nodeId
					});
				}
			}
		});

		// 5. Populate and return the new Graph
		assignedSlots.forEach((slot, childId) =>
		{
			const { childNodeData, serviceNode, x, y } = slot;
			const groupCount = (grouped.get(childNodeData.id) ?? []).length;

			const targetColor = d3RGB(serviceNode.color || '#3b82f6');
			const targetTier = childNodeData.tier ?? 0;
			const alpha = Math.max(0.2, 0.9 - (targetTier * 0.15));
			const color = `rgba(${Math.round(targetColor.r)}, ${Math.round(targetColor.g)}, ${Math.round(targetColor.b)}, ${alpha})`;

			if(!newGraph.hasNode(childId))
			{
				newGraph.addNode(childId, {
					tier: childNodeData.tier,
					label: childNodeData.name || childId,
					x: x,
					y: y,
					size: this.getScaledSize(childNodeData, groupCount, forcedGraph),
					color: color,
					service: serviceNode.name
				});
			}
		});

		return newGraph;
	}
}
