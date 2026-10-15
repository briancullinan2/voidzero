
// @ts-check

/** @type {Worker & import('./rosetta.d').RosettaWorker} */
const workerSelf = /** @type {any} */ (self);

export const hasSequentialBinaryRegex = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]{3,}/;

/**
 *
 * @param {Uint8Array} bytes
 * @param {number} offset
 * @param {number[]} pattern
 * @returns {boolean}
 */
export function checkMagic(bytes, offset, pattern)
{
	if(bytes.length < offset + pattern.length) return false;
	return pattern.every((byte, i) => bytes[offset + i] === byte);
};


/**
 * @type {Record<string, import('./rosetta.d').BinaryDetector>}
 */
export const BINARY_DETECTOR = {
	wasm: {
		description: "WebAssembly Binary / LLVM Wasm Object File",
		match: (b) => checkMagic(b, 0, [0x00, 0x61, 0x73, 0x6D])
	},
	qvm: {
		description: "Quake Virtual Machine (Quake 3)",
		match: (b) => checkMagic(b, 0, [0x44, 0x14, 0x72, 0x12])
	},
	bsp: {
		description: "Quake 3 BSP Compiled Map File",
		match: (b) => checkMagic(b, 0, [0x49, 0x42, 0x53, 0x50]) // "IBSP"
	},
	md3: {
		description: "Quake 3 MD3 Mesh Model File",
		match: (b) => checkMagic(b, 0, [0x49, 0x44, 0x50, 0x33]) // "IDP3"
	},
	aas: {
		description: "Quake 3 Bot Area Awareness System (AAS) File",
		match: (b) => checkMagic(b, 0, [0x45, 0x41, 0x41, 0x53]) // "EAAS"
	},
	dat: {
		description: "Quake 3 Team Arena Font Descriptor File",
		match: (b) => checkMagic(b, 0, [0x14, 0x00, 0x00, 0x00]) // 20 (fontInfo_t block size offset)
	},
	wav: {
		description: "Waveform Audio File Format",
		// WAV requires "RIFF" at byte 0 and "WAVE" at byte 8
		match: (b) => checkMagic(b, 0, [0x52, 0x49, 0x46, 0x46]) &&
			checkMagic(b, 8, [0x57, 0x41, 0x56, 0x45])
	},
	riff: {
		description: "Waveform Audio File",
		match: (b) => checkMagic(b, 0, [0x52, 0x49, 0x46, 0x46]) && checkMagic(b, 8, [0x57, 0x41, 0x56, 0x45]) // "RIFF" ... "WAVE"
	},
	mp3: {
		description: "MPEG Audio Layer III",
		match: (b) =>
		{
			if(b.length < 2) return false;
			// Catch ID3v2 header tag variant ("ID3")
			if(checkMagic(b, 0, [0x49, 0x44, 0x33])) return true;
			// Catch raw sync frames variant (0xFF + high bits 0xE0 set, like FF FB, FF F3, FF F2)
			return b[0] === 0xFF && (b[1] & 0xE0) === 0xE0;
		}
	},
	png: {
		description: "Portable Network Graphics Image",
		match: (b) => checkMagic(b, 0, [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])
	},
	jpeg: {
		description: "JPEG Image",
		match: (b) => checkMagic(b, 0, [0xFF, 0xD8, 0xFF])
	},
	gif: {
		description: "Graphics Interchange Format Image",
		match: (b) => checkMagic(b, 0, [0x47, 0x49, 0x46, 0x38]) // "GIF8"
	},
	webp: {
		description: "WebP Image",
		match: (b) => checkMagic(b, 0, [0x52, 0x49, 0x46, 0x46]) && checkMagic(b, 8, [0x57, 0x45, 0x42, 0x50]) // "RIFF" ... "WEBP"
	},
	dds: {
		description: "DirectDraw Surface Texture Container",
		match: (b) => checkMagic(b, 0, [0x44, 0x44, 0x53, 0x20]) // "DDS "
	},
	tga: {
		description: "Truevision TGA Image (Uncompressed Truecolor/Grayscale)",
		match: (b) => (checkMagic(b, 0, [0x00, 0x00, 0x02, 0x00]) || checkMagic(b, 0, [0x00, 0x00, 0x03, 0x00]))
	},
	pcx: {
		description: "ZSoft PCX Bitmap Image (Legacy Quake/Id formats)",
		match: (b) => checkMagic(b, 0, [0x0A]) && (b[1] === 0x00 || b[1] === 0x02 || b[1] === 0x03 || b[1] === 0x05) // Manufacturer byte + Version check
	},
	bmp: {
		description: "Windows Bitmap Image",
		match: (b) => checkMagic(b, 0, [0x42, 0x4D]) // "BM"
	},
	ttf: {
		description: "TrueType Font File",
		match: (b) => checkMagic(b, 0, [0x00, 0x01, 0x00, 0x00]) || checkMagic(b, 0, [0x74, 0x72, 0x75, 0x65]) // 0x00010000 or "true"
	},
	woff: {
		description: "Web Open Font Format",
		match: (b) => checkMagic(b, 0, [0x77, 0x4F, 0x46, 0x46]) // "wOFF"
	},
	ogg: {
		description: "Ogg Vorbis Audio Container",
		match: (b) => checkMagic(b, 0, [0x4F, 0x67, 0x67, 0x53]) // "OggS"
	},
	woff2: {
		description: "Web Open Font Format 2",
		match: (b) => checkMagic(b, 0, [0x77, 0x4F, 0x46, 0x32]) // "wOF2"
	},
	otf: {
		description: "OpenType Font File",
		match: (b) => checkMagic(b, 0, [0x4F, 0x54, 0x54, 0x4F]) // "OTTO"
	},
	// ─── EXTENDED BINARY FORMATS FOR APPENDING ───
	pk3: {
		description: "Quake 3 Archive Package (Zip Variant)",
		match: (b) => checkMagic(b, 0, [0x50, 0x4B, 0x03, 0x04]) // "PK\003\004"
	},
	mdl: {
		description: "Half-Life / Quake MDL Mesh Model File",
		match: (b) => checkMagic(b, 0, [0x49, 0x44, 0x53, 0x54]) // "IDST"
	},
	md2: {
		description: "Quake 2 MD2 Mesh Model File",
		match: (b) => checkMagic(b, 0, [0x49, 0x44, 0x50, 0x32]) // "IDP2"
	},
	ico: {
		description: "Windows Icon Container Image",
		match: (b) => checkMagic(b, 0, [0x00, 0x00, 0x01, 0x00])
	},
	flac: {
		description: "Free Lossless Audio Codec",
		match: (b) => checkMagic(b, 0, [0x66, 0x4C, 0x61, 0x43]) // "fLaC"
	},
	pdf: {
		description: "Adobe Portable Document Format",
		match: (b) => checkMagic(b, 0, [0x25, 0x50, 0x44, 0x46]) // "%PDF"
	}
};

/**
 * @type {Record<string, import('./rosetta.d').FileClassDetector>}
 */
export const AssetInspector = {
	isActuallyImage: (bytes, path) =>
	{
		const binType = detectBinaryType(bytes);
		if(binType !== 'unknown') return ['png', 'jpeg', 'gif', 'webp', 'dds', 'tga', 'pcx', 'bmp'].includes(binType);
		return /\.(png|jpe?g|gif|webp|tga|pcx|bmp|dds)$/i.test(path);
	},

	isActuallyAudio: (bytes, path) =>
	{
		const binType = detectBinaryType(bytes);
		if(binType !== 'unknown') return ['wav', 'mp3', 'ogg', 'flac', 'mid'].includes(binType);
		return /\.(wav|mp3|ogg|flac)$/i.test(path);
	},

	isActuallyMap: (bytes, path) =>
	{
		// Binary check
		if(detectBinaryType(bytes) === 'bsp' || path.endsWith('.bsp')) return true;

		// Text check against the waterfall registry keys
		const decoder = new TextDecoder();
		const sampleStr = decoder.decode(bytes);
		if(sampleStr)
		{
			const matched = workerSelf.TEXT_LANGUAGE_DETECTOR_WATERFALL
				.find(lang => lang.id.endsWith('map') && lang.match(sampleStr, bytes));
			if(matched) return true;
		}
		return /\.(map|vmf|mapx)$/i.test(path);
	},

	isActuallyFont: (bytes, path) =>
	{
		const binType = detectBinaryType(bytes);
		if(binType !== 'unknown') return ['ttf', 'woff', 'woff2', 'otf'].includes(binType);
		return /\.(ttf|woff|woff2|otf|eot)$/i.test(path);
	},

	isActuallyModel: (bytes, path) =>
	{
		const binType = detectBinaryType(bytes);
		if(binType !== 'unknown') return ['md3', 'mdl', 'md2'].includes(binType);
		return /\.(md3|mdl|md2|md5mesh|obj|fbx)$/i.test(path);
	}
};

workerSelf.BINARY_DETECTOR = BINARY_DETECTOR;

/**
 * Detects the real underlying binary format from an ArrayBuffer or Uint8Array
 * @param {ArrayBuffer|Uint8Array} sourceBuffer
 * @returns {string} The detected format key, or 'unknown'
 */
export function detectBinaryType(sourceBuffer)
{
	const bytes = sourceBuffer instanceof Uint8Array ? sourceBuffer : new Uint8Array(sourceBuffer);

	for(const [type, format] of Object.entries(BINARY_DETECTOR))
	{
		if(format.match(bytes))
		{
			return type;
		}
	}
	return "unknown";
}

workerSelf.detectBinaryType = detectBinaryType;
