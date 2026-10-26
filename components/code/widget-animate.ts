import { Sigma } from "sigma";
import Graph from 'graphology';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import { hsl as d3HSL, rgb as d3RGB, HSLColor } from 'd3';
import { Attributes } from "graphology-types";

const ANIMATE_DEFAULTS = {
	easing: "quadraticInOut",
	duration: 150,
};
export type EasingFunction = (k: number) => number;

export const easings = {
	linear: (k: number): number => k,
	quadraticIn: (k: number): number => k * k,
	quadraticOut: (k: number): number => k * (2 - k),
	quadraticInOut: (k: number): number =>
	{
		if((k *= 2) < 1) return 0.5 * k * k;
		return -0.5 * (--k * (k - 2) - 1);
	},
	cubicIn: (k: number): number => k * k * k,
	cubicOut: (k: number): number => --k * k * k + 1,
	cubicInOut: (k: number): number =>
	{
		if((k *= 2) < 1) return 0.5 * k * k * k;
		return 0.5 * ((k -= 2) * k * k + 2);
	},
};

export const easings_1 = {
	linear: easings.linear,
	quadraticIn: easings.quadraticIn,
	quadraticOut: easings.quadraticOut,
	quadraticInOut: easings.quadraticInOut,
	cubicIn: easings.cubicIn,
	cubicOut: easings.cubicOut,
	cubicInOut: easings.cubicInOut,
	default: easings,
};

export const index_1 = {
	requestFrame: (typeof requestAnimationFrame !== "undefined"
		? (callback: FrameRequestCallback) => requestAnimationFrame(callback)
		: (callback: FrameRequestCallback) => setTimeout(callback, 0) as unknown as number) as (callback: FrameRequestCallback) => number,

	cancelFrame: (typeof cancelAnimationFrame !== "undefined"
		? (requestID: number) => cancelAnimationFrame(requestID)
		: (requestID: number) => clearTimeout(requestID as unknown as NodeJS.Timeout)) as (requestID: number) => void,
};


export class NodeAnimator
{
	static cancelAnimation: () => void;
	static cancelAnimation2: () => void;

	/**
	 * Function used to animate the nodes.
	 */
	public static animateNodes(graph: Graph, targets: Record<string, any>, opts: { duration: number, easing: keyof typeof easings; }, callback?: Function)
	{
		let options = Object.assign({}, ANIMATE_DEFAULTS, opts);
		let easing = typeof options.easing === "function" ? options.easing : easings_1.default[options.easing];
		let start = Date.now();
		let startPositions: Record<string, any> = {};
		for(let node in targets)
		{
			let attrs = targets[node];
			startPositions[node] = {};
			for(let k in attrs)
				startPositions[node][k] = graph.getNodeAttribute(node, k);
		}
		let frame: number | null = null;
		let step = function ()
		{
			let p = (Date.now() - start) / options.duration;
			if(p >= 1)
			{
				// Animation is done
				for(let node in targets)
				{
					let attrs = targets[node];
					for(let k in attrs)
						graph.setNodeAttribute(node, k, attrs[k]);
				}
				if(typeof callback === "function")
					callback();
				return;
			}
			p = easing(p);
			for(let node in targets)
			{
				let attrs = targets[node];
				let s = startPositions[node];
				for(let k in attrs)
				{
					if(k === 'color')
					{
						const hsl1 = d3HSL(s[k]);
						const hsl2 = d3HSL(attrs[k]);
						const interpolatedHSL = NodeAnimator.interpolateHSL(hsl1, hsl2, p);
						graph.setNodeAttribute(node, k, interpolatedHSL.formatRgb());

					} else
					{
						graph.setNodeAttribute(node, k, attrs[k] * p + s[k] * (1 - p));
					}
				}
			}
			frame = index_1.requestFrame(step);
		};
		step();
		return function ()
		{
			if(frame)
				index_1.cancelFrame(frame);
		};
	}


	public static interpolateHSL(hsl1: HSLColor, hsl2: HSLColor, percent: number): HSLColor
	{
		const { h: h1, s: s1, l: l1 } = hsl1;
		const { h: h2, s: s2, l: l2 } = hsl2;
		const h = this.interpolateHue(h1, h2, percent);
		const s = s1 + (s2 - s1) * percent;
		const l = l1 + (l2 - l1) * percent;
		return d3HSL(h, s, l);
	}


	public static interpolateHue(h1: number, h2: number, percent: number)
	{
		let diff = h2 - h1;
		if(diff > 180) diff -= 360;
		else if(diff < -180) diff += 360;
		return (h1 + diff * percent + 360) % 360; // add 360 to avoid negative hue wrap
	}



	public static projectNodePosition(nodeKey: string, attr: Attributes)
	{
		// if(!hasSelected || !layout[nodeKey]) return;
		// if(attr.isSelected) return;
		// const { x, y } = layout[nodeKey];
		// const angle = Math.atan2(y, x);
		// const distance = 1000;
		// subGraph.setNodeAttribute(nodeKey, 'x', Math.cos(angle) * distance);
		// subGraph.setNodeAttribute(nodeKey, 'y', Math.sin(angle) * distance);
	}


	public static getNodeColor(attr: Attributes, selected: Boolean)
	{
		const now = Date.now();
		if(attr.touched + 500 > now) return '#fff';
		if(attr.touched + 1000 > now) return '#000';
		if(attr.touched + 1500 > now) return '#fff';

		// TODO: pass right parameters
		// if(!selected) return serviceColors[attr.service];
		if(attr.isPrimary) return '#000';
		if(attr.isTarget) return '#6699cc';
		if(attr.isSource) return '#ff9966';
		return '#999';
	}



	public static reGraph(renderer: Sigma, subGraph: Graph, changed: Boolean, colored: Boolean, selected: Boolean)
	{
		const state = renderer.getCamera().getState();

		if(changed || selected)
		{
			subGraph.forEachNode((nodeKey, attr) => NodeAnimator.projectNodePosition(nodeKey, attr));
			changed = false;
		}

		if(colored)
		{
			const graph = renderer.getGraph();
			graph.forEachNode((nodeKey, attr) =>
			{
				subGraph.setNodeAttribute(nodeKey, 'color', NodeAnimator.getNodeColor(attr, selected));
			});
		}

		const settings = forceAtlas2.inferSettings(subGraph);
		forceAtlas2.assign(subGraph, {
			iterations: 2,
			settings: {
				...settings,
				gravity: selected ? 0.2 : 2,
				strongGravityMode: true,
				edgeWeightInfluence: 0.1,
				linLogMode: false
			}
		});

	}



	public static reTarget(renderer: Sigma, subGraph: Graph)
	{
		const graph = renderer.getGraph();
		const speed = 100;
		const targetPositions: Record<string, ({ x: number, y: number; })> = {};
		const targetColors: Record<string, ({ color: string; })> = {};

		subGraph.forEachNode((nodeKey, { x: tx, y: ty, color }) =>
		{
			if(!graph.hasNode(nodeKey)) return;
			const { x, y } = graph.getNodeAttributes(nodeKey);
			const dx = tx - x, dy = ty - y;
			const distSq = dx * dx + dy * dy;
			if(distSq === 0) return;
			const scale = Math.min(speed, Math.sqrt(distSq)) / Math.sqrt(distSq);

			targetPositions[nodeKey] = { x: x + dx * scale, y: y + dy * scale };
			targetColors[nodeKey] = { color };
		});

		NodeAnimator.cancelAnimation = NodeAnimator.animateNodes(graph, targetPositions, {
			duration: 200,
			easing: 'quadraticInOut'
		});
		// NodeAnimator.cancelAnimation2 = NodeAnimator.animateNodes(graph, targetColors, {
		// 	duration: 400,
		// 	easing: 'quadraticInOut'
		// });
	}

}
