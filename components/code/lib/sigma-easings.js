const ANIMATE_DEFAULTS = {
	easing: "quadraticInOut",
	duration: 150,
};

easings_1 = {};
easings_1.cubicInOut = easings_1.cubicOut = easings_1.cubicIn = easings_1.quadraticInOut = easings_1.quadraticOut = easings_1.quadraticIn = easings_1.linear = void 0;
/**
 * Sigma.js Easings
 * =================
 *
 * Handy collection of easing functions.
 * @module
 */
var linear = function (k) { return k; };
easings_1.linear = linear;
var quadraticIn = function (k) { return k * k; };
easings_1.quadraticIn = quadraticIn;
var quadraticOut = function (k) { return k * (2 - k); };
easings_1.quadraticOut = quadraticOut;
var quadraticInOut = function (k)
{
	if((k *= 2) < 1)
		return 0.5 * k * k;
	return -0.5 * (--k * (k - 2) - 1);
};
easings_1.quadraticInOut = quadraticInOut;
var cubicIn = function (k) { return k * k * k; };
easings_1.cubicIn = cubicIn;
var cubicOut = function (k) { return --k * k * k + 1; };
easings_1.cubicOut = cubicOut;
var cubicInOut = function (k)
{
	if((k *= 2) < 1)
		return 0.5 * k * k * k;
	return 0.5 * ((k -= 2) * k * k + 2);
};
easings_1.cubicInOut = cubicInOut;
var easings = {
	linear: easings_1.linear,
	quadraticIn: easings_1.quadraticIn,
	quadraticOut: easings_1.quadraticOut,
	quadraticInOut: easings_1.quadraticInOut,
	cubicIn: easings_1.cubicIn,
	cubicOut: easings_1.cubicOut,
	cubicInOut: easings_1.cubicInOut,
};
easings_1.default = easings;


const index_1 = {};
index_1.requestFrame = typeof requestAnimationFrame !== "undefined"
	? function (callback) { return requestAnimationFrame(callback); }
	: function (callback) { return setTimeout(callback, 0); };
index_1.cancelFrame = typeof cancelAnimationFrame !== "undefined"
	? function (requestID) { return cancelAnimationFrame(requestID); }
	: function (requestID) { return clearTimeout(requestID); };


/**
 * Function used to animate the nodes.
 */
function animateNodes(graph, targets, opts, callback)
{
	var options = Object.assign({}, ANIMATE_DEFAULTS, opts);
	var easing = typeof options.easing === "function" ? options.easing : easings_1.default[options.easing];
	var start = Date.now();
	var startPositions = {};
	for(var node in targets)
	{
		var attrs = targets[node];
		startPositions[node] = {};
		for(var k in attrs)
			startPositions[node][k] = graph.getNodeAttribute(node, k);
	}
	var frame = null;
	var step = function ()
	{
		var p = (Date.now() - start) / options.duration;
		if(p >= 1)
		{
			// Animation is done
			for(var node in targets)
			{
				var attrs = targets[node];
				for(var k in attrs)
					graph.setNodeAttribute(node, k, attrs[k]);
			}
			if(typeof callback === "function")
				callback();
			return;
		}
		p = easing(p);
		for(var node in targets)
		{
			var attrs = targets[node];
			var s = startPositions[node];
			for(var k in attrs)
			{
				if(k === 'color')
				{
					let hex1 = hexToRgb(s[k]);
					let hex2 = hexToRgb(attrs[k]);
					if(hex1 && hex2)
					{
						let { r, g, b } = hex1;
						let { r: r2, g: g2, b: b2 } = hex2;
						const hsl1 = rgbToHsl(r, g, b);
						const hsl2 = rgbToHsl(r2, g2, b2);
						const interpolatedHSL = interpolateHSL(hsl1, hsl2, p);
						const interpolatedRGB = hslToRgb(...interpolatedHSL);
						const rgbInt = rgbToInt(...interpolatedRGB);
						graph.setNodeAttribute(node, k, '#' + rgbInt.toString(16));
					}

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
