
// @ts-check


/**
 * Standalone Q3 Font DAT Parser
 *
 * Parses Quake 3 / ioquake3 generated font dat files (e.g., fontImage_12.dat)
 * Extracts all 256 glyph boundaries, texture coordinates, and scaling data.
 *
 * @param {Uint8Array} bytes - Raw DAT binary
 * @returns {string} Plain text diagnostic console log
 */
export function parseQ3FontDat(bytes)
{
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

	// Standard Quake 3 / idTech 3 Engine Constants
	const GLYPHS_PER_FONT = 256;
	const SHADER_NAME_LENGTH = 32;
	const MAX_QPATH = 64;

	let offset = 0;

	// Helper functions to simulate the C readInt() and readFloat()
	function readInt()
	{
		if(offset + 4 > bytes.length) return 0;
		const val = view.getInt32(offset, true); // Little Endian
		offset += 4;
		return val;
	}

	function readFloat()
	{
		if(offset + 4 > bytes.length) return 0;
		const val = view.getFloat32(offset, true); // Little Endian
		offset += 4;
		return val;
	}

	/** @param {number} length */
	function readString(length)
	{
		let str = "";
		for(let i = 0; i < length; i++)
		{
			if(offset >= bytes.length) break;
			const charCode = view.getUint8(offset++);
			// Stop appending on null terminator, but we must advance the offset
			// by the full 'length' to maintain structure alignment
			if(charCode !== 0 && str.length === i)
			{
				str += String.fromCharCode(charCode);
			}
		}
		return str;
	}

	let report = `========================================================================\n`;
	report += ` Q3 FONT DAT PARSER\n`;
	report += `========================================================================\n\n`;

	/** @type {import('./rosetta-types.d').Q3Font} */
	const font = {
		glyphs: [],
		glyphScale: 0,
		name: ""
	};

	let populatedGlyphsCount = 0;

	report += `GLYPH METRICS:\n`;
	report += `---------------------------------------------------------------------------------\n`;
	report += `Char | Idx | Size (WxH) | Image (WxH) | UVs (S, T) -> (S2, T2)     | Shader\n`;
	report += `---------------------------------------------------------------------------------\n`;

	// 1. Read all 256 glyph structures
	for(let i = 0; i < GLYPHS_PER_FONT; i++)
	{
		/** @type {import('./rosetta-types.d').FontGlyph} */
		const glyph = {
			index: i,
			char: String.fromCharCode(i),
			height: readInt(),
			top: readInt(),
			bottom: readInt(),
			pitch: readInt(),
			xSkip: readInt(),
			imageWidth: readInt(),
			imageHeight: readInt(),
			s: readFloat(),
			t: readFloat(),
			s2: readFloat(),
			t2: readFloat(),
			glyphHandle: readInt(), // OpenGL handle, usually useless offline
			shaderName: readString(SHADER_NAME_LENGTH)
		};

		font.glyphs.push(glyph);

		// Only print glyphs that actually have data (filtering out unprintable/empty blocks)
		if(glyph.imageWidth > 0 || glyph.imageHeight > 0 || glyph.xSkip > 0)
		{
			// Escape special chars for terminal printing
			let displayChar = glyph.char;
			if(i < 32 || i === 127 || i === 255) displayChar = `\\${i}`;

			const size = `${glyph.pitch}x${glyph.height}`.padEnd(10, ' ');
			const imgSize = `${glyph.imageWidth}x${glyph.imageHeight}`.padEnd(11, ' ');

			const s = glyph.s.toFixed(3);
			const t = glyph.t.toFixed(3);
			const s2 = glyph.s2.toFixed(3);
			const t2 = glyph.t2.toFixed(3);
			const uvs = `(${s}, ${t}) -> (${s2}, ${t2})`.padEnd(26, ' ');

			const shader = glyph.shaderName || "N/A";

			report += ` ${displayChar.padStart(3, ' ')} | ${i.toString().padStart(3, ' ')} | ${size} | ${imgSize} | ${uvs} | ${shader}\n`;
			populatedGlyphsCount++;
		}
	}

	// 2. Read the global Font metrics appended to the end of the file
	font.glyphScale = readFloat();
	font.name = readString(MAX_QPATH);

	report += `---------------------------------------------------------------------------------\n\n`;

	report += `FONT SUMMARY:\n`;
	report += `  Name                 : ${font.name || "Unknown/Embedded"}\n`;
	report += `  Total Glyphs Populated: ${populatedGlyphsCount} / ${GLYPHS_PER_FONT}\n`;
	report += `  Global Glyph Scale   : ${font.glyphScale.toFixed(4)}\n`;
	report += `  Final Byte Offset    : 0x${offset.toString(16)} / 0x${bytes.length.toString(16)}\n`;
	report += `========================================================================\n`;

	// You can also return 'font' as an object if you want to use the JSON data downstream.
	// For now, we print the diagnostic text.
	return report;
}





/**
 * Advanced Q3 MD3 Model Binary Analysis & Disassembly Suite
 * Parses Quake 3 engine mesh files and produces a comprehensive structural blueprint dump.
 *
 * @param {Uint8Array|ArrayBuffer} sampleBytes - Raw model binary array buffer workspace
 * @param {string} filePath - Input path or label identifier for telemetry reporting
 * @returns {string} High-density diagnostic blueprint report
 */
export function renderMd3DisassemblySuite(sampleBytes, filePath = "model.md3")
{
	const bytes = sampleBytes instanceof Uint8Array ? sampleBytes : new Uint8Array(sampleBytes);

	if(bytes.length < 108)
	{
		return "Error: Invalid MD3 payload size (Below minimal 108-byte header threshold).";
	}

	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

	// Primitive Little-Endian Readers
	/** @param {number} offset */
	const readU4 = (offset) => view.getUint32(offset, true);
	/** @param {number} offset */
	const readI4 = (offset) => view.getInt32(offset, true);
	/** @param {number} offset */
	const readF4 = (offset) => view.getFloat32(offset, true);
	/** @param {number} offset */
	const readI2 = (offset) => view.getInt16(offset, true);

	/**
	 * @param {number} offset
	 * @param {number} maxLen
	 */
	const readString = (offset, maxLen) =>
	{
		let str = "";
		for(let i = 0; i < maxLen; i++)
		{
			const charCode = bytes[offset + i];
			if(charCode === 0) break;
			str += String.fromCharCode(charCode);
		}
		return str.trim();
	};

	// =========================================================================
	// STEP 1: PARSE THE MD3 MAIN FILE HEADER
	// =========================================================================
	const magic = readString(0, 4); // Expected: "IDP3"
	if(magic !== "IDP3")
	{
		return `Error: Invalid MD3 file format profile signature (Got: '${magic}', expected 'IDP3').`;
	}

	const header = {
		version: readI4(4),           // Expected: 15
		name: readString(8, 64),
		flags: readI4(72),
		numFrames: readI4(76),
		numTags: readI4(80),
		numSurfaces: readI4(84),
		numSkins: readI4(88),
		ofsFrames: readI4(92),
		ofsTags: readI4(96),
		ofsSurfaces: readI4(100),
		ofsEnd: readI4(104)           // Total file size / EOF marker
	};

	// =========================================================================
	// STEP 2: CONSTRUCT FILE METADATA ARCHITECTURE BLOCK
	// =========================================================================
	let report = `Q3 MD3 Skeletal/Vertex Model Map Blueprint Summary\n`;
	report += `========================================================================\n`;
	report += `Output Filename:      ${filePath}\n`;
	report += `Binary File Profile:  MD3 v${header.version} (Quake III Arena Model Component Data)\n`;
	report += `Internal Model Name:  ${header.name || "(Unspecified Model Path Reference)"}\n`;
	report += `------------------------------------------------------------------------\n`;
	report += `Animation Frames:     ${header.numFrames.toString().padEnd(10)} records  (Offset pointer: 0x${header.ofsFrames.toString(16).toUpperCase().padStart(4, '0')})\n`;
	report += `Skeletal Tags:        ${header.numTags.toString().padEnd(10)} anchor vectors (Offset pointer: 0x${header.ofsTags.toString(16).toUpperCase().padStart(4, '0')})\n`;
	report += `Mesh Surface Soup:    ${header.numSurfaces.toString().padEnd(10)} subdivisions   (Offset pointer: 0x${header.ofsSurfaces.toString(16).toUpperCase().padStart(4, '0')})\n`;
	report += `Skin Target Tables:   ${header.numSkins.toString().padEnd(10)} references     (Total file boundary: ${header.ofsEnd} bytes)\n`;
	report += `------------------------------------------------------------------------\n\n`;

	// =========================================================================
	// STEP 3: PARSE AND EXTRACT ANIMATION FRAMES DIAGNOSTICS (56 Bytes / Frame)
	// =========================================================================
	report += `EXTRACTED ANIMATION AND BOUNDING BOX FRAMES:\n`;
	let framePtr = header.ofsFrames;

	for(let f = 0; f < header.numFrames; f++)
	{
		if(framePtr + 56 > bytes.length) break;

		const minX = readF4(framePtr + 0), minY = readF4(framePtr + 4), minZ = readF4(framePtr + 8);
		const maxX = readF4(framePtr + 12), maxY = readF4(framePtr + 16), maxZ = readF4(framePtr + 20);
		const originX = readF4(framePtr + 24), originY = readF4(framePtr + 28), originZ = readF4(framePtr + 32);
		const radius = readF4(framePtr + 36);
		const frameName = readString(framePtr + 40, 16);

		report += `  -> frame [Idx ${f.toString().padStart(2, '0')}]: "${frameName.padEnd(12)}"` +
			` | Box Min: [${minX.toFixed(2)}, ${minY.toFixed(2)}, ${minZ.toFixed(2)}]` +
			` | Box Max: [${maxX.toFixed(2)}, ${maxY.toFixed(2)}, ${maxZ.toFixed(2)}]` +
			` | Origin: [${originX.toFixed(2)}, ${originY.toFixed(2)}, ${originZ.toFixed(2)}]` +
			` | Radius: ${radius.toFixed(2)}\n`;

		framePtr += 56;
	}

	// =========================================================================
	// STEP 4: PARSE AND EXTRACT SURFACE GEOMETRY SUBDIVISIONS
	// =========================================================================
	let surfPtr = header.ofsSurfaces;
	for(let s = 0; s < header.numSurfaces; s++)
	{
		if(surfPtr + 140 > bytes.length) break;

		const surfMagic = readString(surfPtr, 4); // Expected: "MD3S"
		const surfName = readString(surfPtr + 4, 64);
		const surfFlags = readI4(surfPtr + 68);
		const surfNumFrames = readI4(surfPtr + 72);
		const surfNumShaders = readI4(surfPtr + 76);
		const surfNumVerts = readI4(surfPtr + 80);
		const surfNumTriangles = readI4(surfPtr + 84);

		const ofsTriangles = readI4(surfPtr + 88);
		const ofsShaders = readI4(surfPtr + 92);
		const ofsSt = readI4(surfPtr + 96);
		const ofsXyzNormal = readI4(surfPtr + 100);
		const ofsSurfEnd = readI4(surfPtr + 104);

		report += `------------------------------------------------------------------------\n`;
		report += `SURFACE OBJECT DETECTED [Idx ${s}]: "${surfName}" (Magic Verify: ${surfMagic})\n`;
		report += `  - Triangles Count:  ${surfNumTriangles.toString().padEnd(6)} | Vertices Count:   ${surfNumVerts}\n`;
		report += `  - Shader Reference: ${surfNumShaders.toString().padEnd(6)} | Tracked Frames:   ${surfNumFrames}\n`;
		report += `  - Topology Memory:  ${(ofsSurfEnd - ofsTriangles)} raw payload bytes\n`;

		// ─── Extract Shaders Assigned to this Mesh Surface ───
		if(surfNumShaders > 0)
		{
			report += `  - Active Material Pipeline Hooks:\n`;
			for(let sh = 0; sh < surfNumShaders; sh++)
			{
				const shaderPathOffset = surfPtr + ofsShaders + (sh * 68);
				const shaderName = readString(shaderPathOffset, 64);
				const shaderIndex = readI4(shaderPathOffset + 64);
				report += `     => material: "${shaderName}" [ID: ${shaderIndex}]\n`;
			}
		}

		// ─── Extract Triangle Index Buffer Soup ───
		report += `  - Triangle Mesh Index Connectivity Soup (First 5 Polygon Paths Layout):\n`;
		let triPtr = surfPtr + ofsTriangles;
		for(let tIdx = 0; tIdx < Math.min(surfNumTriangles, 5); tIdx++)
		{
			const v0 = readI4(triPtr + 0);
			const v1 = readI4(triPtr + 4);
			const v2 = readI4(triPtr + 8);
			report += `     => poly [Idx ${tIdx.toString().padStart(3, '0')}]: Vertices Indices Map Cluster -> (${v0}, ${v1}, ${v2})\n`;
			triPtr += 12;
		}
		if(surfNumTriangles > 5) report += `     ... and ${surfNumTriangles - 5} remaining index soup faces paths.\n`;

		// ─── Extract Local Vertex Coordinates (XYZ + Packed Normal Vectors) ───
		report += `  - Frame 0 Vertex Coordinates Sample (First 4 Spatial Grid Positions):\n`;
		let vertPtr = surfPtr + ofsXyzNormal; // Frame 0 positions start exactly here
		for(let vIdx = 0; vIdx < Math.min(surfNumVerts, 4); vIdx++)
		{
			// MD3 standard packs spatial offsets via a scaling integer constant 1/64
			const x = readI2(vertPtr + 0) * (1.0 / 64.0);
			const y = readI2(vertPtr + 2) * (1.0 / 64.0);
			const z = readI2(vertPtr + 4) * (1.0 / 64.0);

			// Unpack spherical normal angles encoded into the high 2 bytes
			const latEnc = bytes[vertPtr + 6];
			const lngEnc = bytes[vertPtr + 7];
			const lat = latEnc * (2.0 * Math.PI) / 255.0;
			const lng = lngEnc * (2.0 * Math.PI) / 255.0;

			const nx = Math.cos(lat) * Math.sin(lng);
			const ny = Math.sin(lat) * Math.sin(lng);
			const nz = Math.cos(lng);

			report += `     => vTX [Idx ${vIdx.toString().padStart(3, '0')}]: Pos: [${x.toFixed(4)}, ${y.toFixed(4)}, ${z.toFixed(4)}]` +
				` | Normal Vector Direction: [${nx.toFixed(2)}, ${ny.toFixed(2)}, ${nz.toFixed(2)}]\n`;

			vertPtr += 8; // Each MD3 internal vertex structure is precisely 8 bytes
		}
		if(surfNumVerts > 4) report += `     ... and ${surfNumVerts - 4} alternate positioning coordinates tables for frame structures.\n`;

		surfPtr += ofsSurfEnd; // Jump straight through to next relative surface structure offset
	}

	report += `========================================================================\n`;
	report += `Status:               Successfully isolated model compilation tables.\n`;

	return report;
}

/**
 * Advanced Q3 BSP Map Binary Analysis & Disassembly Suite
 * Parses Quake 3 engine compiled map files and dumps structural lumps topology data.
 *
 * @param {Uint8Array|ArrayBuffer} sampleBytes - Raw BSP binary array buffer workspace
 * @param {string} filePath - Input path or label identifier for telemetry reporting
 * @returns {string} High-density diagnostic map blueprint report
 */
export function renderBspDisassemblySuite(sampleBytes, filePath = "map.bsp")
{
	const bytes = sampleBytes instanceof Uint8Array ? sampleBytes : new Uint8Array(sampleBytes);

	// Initial minimal footprint check (Header + 17 Directory Lumps = 8 + 17 * 8 = 144 bytes)
	if(bytes.length < 144)
	{
		return "Error: Invalid BSP payload size (Below structural 144-byte directory boundary threshold).";
	}

	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

	// Primitive Little-Endian Readers
	/** @param {number} offset */
	const readU4 = (offset) => view.getUint32(offset, true);
	/** @param {number} offset */
	const readI4 = (offset) => view.getInt32(offset, true);
	/** @param {number} offset */
	const readF4 = (offset) => view.getFloat32(offset, true);
	/**
	 * @param {number} offset
	 * @param {number} maxLen
	 */
	const readString = (offset, maxLen) =>
	{
		let str = "";
		for(let i = 0; i < maxLen; i++)
		{
			if(offset + i >= bytes.length) break;
			const charCode = bytes[offset + i];
			if(charCode === 0) break;
			str += String.fromCharCode(charCode);
		}
		return str.trim();
	};

	// =========================================================================
	// STEP 1: PARSE THE IBSP CORE HEADER
	// =========================================================================
	const magic = readString(0, 4); // Expected: "IBSP"
	if(magic !== "IBSP")
	{
		return `Error: Invalid BSP layout signature profile (Got: '${magic}', expected 'IBSP').`;
	}

	const bspVersion = readI4(4); // Expected: 46 for Quake 3 Arena
	if(bspVersion !== 46)
	{
		return `Warning: Alternative BSP compilation version detected (Got: v${bspVersion}, expected v46). Proceeding with structural fallback analysis...`;
	}

	// =========================================================================
	// STEP 2: EXTRACT LUMPS DIRECTORY OFFSET STRUCTS
	// =========================================================================
	const lumpNames = [
		"Entities", "Shaders", "Planes", "Nodes", "Leafs", "LeafFaces",
		"LeafBrushes", "Models", "Brushes", "BrushSides", "Vertices",
		"MeshVerts", "Effects", "Faces", "Lightmaps", "LightVols", "VisData"
	];

	const lumps = [];
	let lumpPtr = 8; // Lumps list immediately follows magic + version

	for(let i = 0; i < 17; i++)
	{
		lumps.push({
			id: i,
			name: lumpNames[i],
			offset: readI4(lumpPtr),
			length: readI4(lumpPtr + 4)
		});
		lumpPtr += 8;
	}

	// Direct lookups for needed datasets
	const entLump = lumps[0];
	const shdLump = lumps[1];
	const vertLump = lumps[10];
	const meshLump = lumps[11];
	const faceLump = lumps[13];

	// =========================================================================
	// STEP 3: INITIAL FILE DIAGNOSTIC AND DIRECTORY TELEMETRY
	// =========================================================================
	let report = `Q3 BSP Compiled Map Structural Topology blueprint Summary\n`;
	report += `========================================================================\n`;
	report += `Output Map Location:  ${filePath}\n`;
	report += `Binary Layout Spec:   ${magic} v${bspVersion} (Quake III Arena Map Data Matrix)\n`;
	report += `Total Payload Volume: ${bytes.length} bytes\n`;
	report += `------------------------------------------------------------------------\n`;
	report += `LUMP DIRECTORY SCHEMATIC MAP:\n`;
	report += `ID  | Lump Identifier       | Hex Offset   | Block Size\n`;
	report += `----|-----------------------|--------------|------------\n`;
	lumps.forEach(l =>
	{
		const hOffset = "0x" + l.offset.toString(16).toUpperCase().padStart(8, '0');
		const bSize = l.length.toString().padStart(10) + " bytes";
		report += `${l.id.toString().padStart(2, '0')}  | ${l.name.padEnd(21)} | ${hOffset}   | ${bSize}\n`;
	});
	report += `------------------------------------------------------------------------\n\n`;

	// =========================================================================
	// STEP 4: SHADER METADATA EXTRACTOR (72 Bytes / Shader record)
	// =========================================================================
	report += `EXTRACTED SHADER PIPELINE HOOKS RESOURCE LIST:\n`;
	if(shdLump.length > 0 && shdLump.offset + shdLump.length <= bytes.length)
	{
		const totalShaders = shdLump.length / 72;
		report += `Total Unique Shaders Registered: ${totalShaders}\n`;

		let shdCursor = shdLump.offset;
		for(let s = 0; s < totalShaders; s++)
		{
			const shaderPath = readString(shdCursor, 64);
			const surfaceFlags = readI4(shdCursor + 64);
			const contentFlags = readI4(shdCursor + 68);

			report += `  -> Shader [Idx ${s.toString().padStart(3, '0')}]: "${shaderPath.padEnd(45)}" | Surf: 0x${surfaceFlags.toString(16).toUpperCase().padStart(8, '0')} | Content: 0x${contentFlags.toString(16).toUpperCase().padStart(8, '0')}\n`;
			shdCursor += 72;
		}
	} else
	{
		report += `  No valid shader reference records found or target lump out of bounds.\n`;
	}
	report += `------------------------------------------------------------------------\n\n`;

	// =========================================================================
	// STEP 5: POLYGON AND TRIANGLE TOPOLOGY EVALUATOR (104 Bytes / Face record)
	// =========================================================================
	report += `GEOMETRIC MESH SOUP AND TRIANGLE LAYOUT METRICS:\n`;
	if(faceLump.length > 0 && faceLump.offset + faceLump.length <= bytes.length)
	{
		const totalFaces = faceLump.length / 104;
		let totalMeshTriangles = 0;
		let polyFaces = 0, patchFaces = 0, meshFaces = 0, billboardFaces = 0;

		let faceCursor = faceLump.offset;
		for(let f = 0; f < totalFaces; f++)
		{
			const type = readI4(faceCursor + 8);
			const numMeshVerts = readI4(faceCursor + 24);

			if(type === 1) polyFaces++;
			if(type === 2) patchFaces++;
			if(type === 3)
			{
				meshFaces++;
				totalMeshTriangles += (numMeshVerts / 3); // Type 3 uses explicit index soup listings
			}
			if(type === 4) billboardFaces++;

			faceCursor += 104;
		}

		// Calculations for structural raw index counts
		const totalIndices = meshLump.length / 4;

		report += `Structural Faces Elements:  ${totalFaces} records calculated\n`;
		report += `  - Type 1 (Standard Polygons):  ${polyFaces}\n`;
		report += `  - Type 2 (Bézier Patches):     ${patchFaces}\n`;
		report += `  - Type 3 (Explicit Type Meshes): ${meshFaces}\n`;
		report += `  - Type 4 (Billboard Sprites):    ${billboardFaces}\n`;
		report += `Topology Indices Cluster:    ${totalIndices} elements registered inside MeshVerts array\n`;
		report += `Estimated Render Triangles:  ${Math.floor(totalIndices / 3)} implicit face partitions (Mesh Soup: ${totalMeshTriangles} discrete elements)\n`;
	} else
	{
		report += `  Unable to verify face arrays geometry boundaries. Target data block structural error.\n`;
	}
	report += `------------------------------------------------------------------------\n\n`;

	// =========================================================================
	// STEP 6: SAMPLE VECTOR AND SPACE COORDINATES (44 Bytes / Vertex record)
	// =========================================================================
	report += `VERTEX BUFFER ENTRY SAMPLE (First 5 Precise Vector Configurations):\n`;
	if(vertLump.length > 0 && vertLump.offset + vertLump.length <= bytes.length)
	{
		const totalVerts = vertLump.length / 44;
		report += `Total System Vertices: ${totalVerts} coordinates records available\n`;

		let vertCursor = vertLump.offset;
		const printSampleCount = Math.min(totalVerts, 5);

		for(let v = 0; v < printSampleCount; v++)
		{
			// XYZ Local Spatial Layout Positions
			const x = readF4(vertCursor + 0);
			const y = readF4(vertCursor + 4);
			const z = readF4(vertCursor + 8);

			// UV Material Texture coordinates mapping
			const u = readF4(vertCursor + 12);
			const t = readF4(vertCursor + 16);

			// Normal Vector Directions
			const nx = readF4(vertCursor + 28);
			const ny = readF4(vertCursor + 32);
			const nz = readF4(vertCursor + 36);

			report += `  => vTX [Idx ${v.toString().padStart(3, '0')}]: Pos: [${x.toFixed(3)}, ${y.toFixed(3)}, ${z.toFixed(3)}]` +
				` | TexUV: [${u.toFixed(4)}, ${t.toFixed(4)}]` +
				` | Normal Vector: [${nx.toFixed(2)}, ${ny.toFixed(2)}, ${nz.toFixed(2)}]\n`;

			vertCursor += 44;
		}
		if(totalVerts > 5) report += `     ... and ${totalVerts - 5} alternate vertex tracking array structures left unlisted.\n`;
	} else
	{
		report += `  Vertex structure sampling unavailable. Loop bounds match error.\n`;
	}
	report += `------------------------------------------------------------------------\n\n`;

	// =========================================================================
	// STEP 7: RAW ENTITIES META STRING DUMP
	// =========================================================================
	report += `EXTRACTED ENTITIES SYSTEM MANIFEST POOL:\n`;
	if(entLump.length > 0 && entLump.offset + entLump.length <= bytes.length)
	{
		const rawEntityText = readString(entLump.offset, entLump.length);
		report += rawEntityText.replace(/\r/g, "") + "\n";
	} else
	{
		report += `  Entity layout data parsing skipped due to invalid structural bounds or blank lump.\n`;
	}

	report += `========================================================================\n`;
	report += `Status: Successfully isolated target BSP compilation data sectors.\n`;

	return report;
}


/**
 * Advanced Q3 AAS Bot Navigation Binary Analysis & Disassembly Suite
 * Parses Quake 3 engine compiled Area Awareness System (.aas) files and dumps
 * structural AI routing topology data.
 *
 * @param {Uint8Array|ArrayBuffer} sampleBytes - Raw AAS binary array buffer workspace
 * @param {string} filePath - Input path or label identifier for telemetry reporting
 * @returns {string} High-density diagnostic navigation blueprint report
 */
export function renderAasDisassemblySuite(sampleBytes, filePath = "botnav.aas")
{
	const bytes = sampleBytes instanceof Uint8Array ? sampleBytes : new Uint8Array(sampleBytes);

	// Initial minimal footprint check (Header + 14 Directory Lumps = 8 + 14 * 8 = 120 bytes)
	if(bytes.length < 120)
	{
		return "Error: Invalid AAS payload size (Below structural 120-byte directory boundary threshold).";
	}

	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

	// Primitive Little-Endian Readers
	/** @param {number} offset */
	const readU4 = (offset) => view.getUint32(offset, true);
	/** @param {number} offset */
	const readU2 = (offset) => view.getUint16(offset, true);
	/** @param {number} offset */
	const readI4 = (offset) => view.getInt32(offset, true);
	/** @param {number} offset */
	const readI2 = (offset) => view.getInt16(offset, true);
	/** @param {number} offset */
	const readF4 = (offset) => view.getFloat32(offset, true);
	/**
	 * @param {number} offset
	 * @param {number} maxLen
	 */
	const readString = (offset, maxLen) =>
	{
		let str = "";
		for(let i = 0; i < maxLen; i++)
		{
			if(offset + i >= bytes.length) break;
			const charCode = bytes[offset + i];
			if(charCode === 0) break;
			str += String.fromCharCode(charCode);
		}
		return str.trim();
	};

	// =========================================================================
	// STEP 1: PARSE THE EAAS CORE HEADER
	// =========================================================================
	const magic = readString(0, 4); // Expected: "EAAS"
	if(magic !== "EAAS")
	{
		return `Error: Invalid AAS layout signature profile (Got: '${magic}', expected 'EAAS').`;
	}

	const aasVersion = readI4(4); // Expected: 4 or 5 for Quake 3 Arena
	if(aasVersion !== 4 && aasVersion !== 5)
	{
		return `Warning: Alternative AAS compilation version detected (Got: v${aasVersion}, expected v4 or v5). Proceeding with structural fallback analysis...`;
	}
	// =========================================================================
	// STEP 2: DECRYPT HEADER AND EXTRACT LUMPS DIRECTORY OFFSET STRUCTS
	// =========================================================================

	// If the version is 5, the header data from offset 8 onwards is XOR scrambled.
	// We must decrypt the bspChecksum (4 bytes) + 14 lumps (14 * 8 = 112 bytes) = 116 bytes total.
	if(aasVersion === 5)
	{
		const headerDataSize = 4 + (14 * 8);
		for(let i = 0; i < headerDataSize; i++)
		{
			const byteOffset = 8 + i;
			// Apply the id Tech 3 AAS_DData XOR cipher: data[i] ^= i * 119
			bytes[byteOffset] ^= (i * 119) & 0xFF;
		}
	}

	// Now we can safely read the 4-byte checksum that precedes the lumps
	const bspChecksum = readI4(8);

	const lumpNames = [
		"BBoxes", "Vertices", "Planes", "Edges", "EdgeIndex", "Faces",
		"FaceIndex", "Areas", "AreaSettings", "Reachability", "Nodes",
		"Portals", "PortalIndex", "Clusters"
	];

	const lumps = [];
	let lumpPtr = 12; // Lumps list immediately follows magic (4) + version (4) + bspChecksum (4)

	// AAS files strictly use 14 directory lumps
	for(let i = 0; i < 14; i++)
	{
		lumps.push({
			id: i,
			name: lumpNames[i],
			offset: readI4(lumpPtr),
			length: readI4(lumpPtr + 4)
		});
		lumpPtr += 8;
	}

	// Direct lookups for needed datasets
	const vertLump = lumps[1];
	const areaLump = lumps[7];
	const settingsLump = lumps[8];
	const reachLump = lumps[9];
	const nodeLump = lumps[10];
	// Ensure edgeLump is defined for Step 8
	const edgeLump = lumps[3];
	// =========================================================================
	// STEP 3: INITIAL FILE DIAGNOSTIC AND DIRECTORY TELEMETRY
	// =========================================================================
	let report = `Q3 AAS Bot Navigation Map Structural Topology Blueprint Summary\n`;
	report += `========================================================================\n`;
	report += `Output Map Location:  ${filePath}\n`;
	report += `Binary Layout Spec:   ${magic} v${aasVersion} (Area Awareness System Matrix)\n`;
	report += `BSP Link Checksum:    ${bspChecksum}\n`;
	report += `Total Payload Volume: ${bytes.length} bytes\n`;
	report += `------------------------------------------------------------------------\n`;
	report += `LUMP DIRECTORY SCHEMATIC MAP:\n`;
	report += `ID  | Lump Identifier       | Hex Offset   | Block Size\n`;
	report += `----|-----------------------|--------------|------------\n`;
	lumps.forEach(l =>
	{
		const hOffset = "0x" + l.offset.toString(16).toUpperCase().padStart(8, '0');
		const bSize = l.length.toString().padStart(10) + " bytes";
		report += `${l.id.toString().padStart(2, '0')}  | ${l.name.padEnd(21)} | ${hOffset}   | ${bSize}\n`;
	});
	report += `------------------------------------------------------------------------\n\n`;


	// =========================================================================
	// STEP 4: BOT NAVIGATION AREA SETTINGS EXTRACTOR (28 Bytes / Record)
	// =========================================================================
	report += `EXTRACTED AI AREA SETTINGS METADATA HOOKS:\n`;
	if(settingsLump.length > 0 && settingsLump.offset + settingsLump.length <= bytes.length)
	{
		const totalSettings = settingsLump.length / 28;
		report += `Total Navigable Areas Registered: ${totalSettings}\n`;

		let setCursor = settingsLump.offset;
		const printSampleCount = Math.min(totalSettings, 5); // Print first 5 for brevity

		for(let s = 0; s < printSampleCount; s++)
		{
			const contents = readI4(setCursor + 0);
			const areaFlags = readI4(setCursor + 4);
			const presenceType = readI4(setCursor + 8);
			const numReachable = readI4(setCursor + 20);
			const firstReachable = readI4(setCursor + 24);

			report += `  -> Area [Idx ${s.toString().padStart(3, '0')}]: Contents: 0x${contents.toString(16).toUpperCase().padStart(8, '0')} | Flags: 0x${areaFlags.toString(16).toUpperCase().padStart(4, '0')} | Presence: ${presenceType} | Reachabilities: ${numReachable} (Starts @ ${firstReachable})\n`;
			setCursor += 28;
		}
		if(totalSettings > 5) report += `     ... and ${totalSettings - 5} alternate area configurations unlisted.\n`;
	} else
	{
		report += `  No valid area settings records found or target lump out of bounds.\n`;
	}
	report += `------------------------------------------------------------------------\n\n`;

	// =========================================================================
	// STEP 5: REACHABILITY MOVEMENT GRAPH EVALUATOR (44 Bytes / Record)
	// =========================================================================
	report += `BOT REACHABILITY AND MOVEMENT GRAPH METRICS:\n`;
	if(reachLump.length > 0 && reachLump.offset + reachLump.length <= bytes.length)
	{
		const totalReach = reachLump.length / 44;

		// Match standard Q3 travel flags (1-15)
		let tCounts = { walk: 0, crouch: 0, barrierJump: 0, jump: 0, ladder: 0, walkOffLedge: 0, swim: 0, waterJump: 0, teleport: 0, elevator: 0, grapple: 0, rocketJump: 0, bfgJump: 0, jumpPad: 0, funcBob: 0, unknown: 0 };

		report += `Total Reachability Edges: ${totalReach}\n\n`;
		report += `EDGE SAMPLE ROUTING TABLE (First 10 Links):\n`;

		let reachCursor = reachLump.offset;
		const printSampleCount = Math.min(totalReach, 10);

		for(let r = 0; r < totalReach; r++)
		{
			// 1. Target Node Data
			const areaNum = readI4(reachCursor + 0);

			// 2. Spatial Vectors (12 bytes each)
			const startX = readF4(reachCursor + 12);
			const startY = readF4(reachCursor + 16);
			const startZ = readF4(reachCursor + 20);

			const endX = readF4(reachCursor + 24);
			const endY = readF4(reachCursor + 28);
			const endZ = readF4(reachCursor + 32);

			// 3. Movement Logistics
			// Note: Lower 16 bits hold the travel type, upper bits can hold team flags
			const travelType = readI4(reachCursor + 36) & 0x0000FFFF;
			const travelTime = readU2(reachCursor + 40); // Hundredths of a sec

			// Map travel types to metrics
			switch(travelType)
			{
				case 1: tCounts.walk++; break;
				case 2: tCounts.crouch++; break;
				case 3: tCounts.barrierJump++; break;
				case 4: tCounts.jump++; break;
				case 5: tCounts.ladder++; break;
				case 6: tCounts.walkOffLedge++; break;
				case 7: tCounts.swim++; break;
				case 8: tCounts.waterJump++; break;
				case 9: tCounts.teleport++; break;
				case 10: tCounts.elevator++; break;
				case 11: tCounts.grapple++; break;
				case 12: tCounts.rocketJump++; break;
				case 13: tCounts.bfgJump++; break;
				case 14: tCounts.jumpPad++; break;
				case 15: tCounts.funcBob++; break;
				default: tCounts.unknown++; break;
			}

			if(r < printSampleCount)
			{
				// Calculate physical geometric distance for validation
				const dx = endX - startX;
				const dy = endY - startY;
				const dz = endZ - startZ;
				const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

				report += `  -> Route [Idx ${r.toString().padStart(5, '0')}]: to Area ${areaNum.toString().padStart(4, ' ')} | Type: ${travelType.toString().padStart(2, ' ')} | Time Weight: ${travelTime.toString().padStart(4, ' ')}cs | Euclidean Dist: ${dist.toFixed(1)}\n`;
				report += `       Command Vector: Start [${startX.toFixed(1)}, ${startY.toFixed(1)}, ${startZ.toFixed(1)}] -> End [${endX.toFixed(1)}, ${endY.toFixed(1)}, ${endZ.toFixed(1)}]\n`;
			}

			reachCursor += 44;
		}

		report += `\nStructural Reachability Categorization:\n`;
		report += `  - Ground / Walk Routes:         ${tCounts.walk}\n`;
		report += `  - Ledge Drops / Falls:          ${tCounts.walkOffLedge}\n`;
		report += `  - Standard Jumps:               ${tCounts.jump}\n`;
		report += `  - Jump Pads / Boosters:         ${tCounts.jumpPad}\n`;
		report += `  - Weapon Jumps (RL/BFG):        ${tCounts.rocketJump + tCounts.bfgJump}\n`;
		report += `  - Specialty (Tele/Elevator):    ${tCounts.teleport + tCounts.elevator + tCounts.funcBob}\n`;
	} else
	{
		report += `  Unable to verify reachability graph geometry bounds. Data block structural error.\n`;
	}
	report += `------------------------------------------------------------------------\n\n`;


	// =========================================================================
	// STEP 6: SAMPLE VECTOR AND SPACE COORDINATES (12 Bytes / Vertex record)
	// =========================================================================
	report += `VERTEX BUFFER ENTRY SAMPLE (First 5 Precise Vector Configurations):\n`;
	if(vertLump && vertLump.length > 0 && vertLump.offset + vertLump.length <= bytes.length)
	{
		const totalVerts = vertLump.length / 12; // AAS vertices are 3x 32-bit floats
		report += `Total System Vertices: ${totalVerts} coordinate records available\n`;

		let vertCursor = vertLump.offset;
		const printSampleCount = Math.min(totalVerts, 5);

		for(let v = 0; v < printSampleCount; v++)
		{
			// XYZ Local Spatial Layout Positions (Z is UP in AAS/idTech3)
			const x = readF4(vertCursor + 0);
			const y = readF4(vertCursor + 4);
			const z = readF4(vertCursor + 8);

			report += `  => vTX [Idx ${v.toString().padStart(3, '0')}]: Pos: [${x.toFixed(3)}, ${y.toFixed(3)}, ${z.toFixed(3)}]\n`;

			vertCursor += 12;
		}
		if(totalVerts > 5) report += `     ... and ${totalVerts - 5} alternate vertex tracking array structures left unlisted.\n`;
	} else
	{
		report += `  Vertex structure sampling unavailable. Loop bounds match error or lump missing.\n`;
	}
	report += `------------------------------------------------------------------------\n\n`;

	// =========================================================================
	// STEP 7: BSP NODE TREE HEURISTICS (24 Bytes / Node)
	// =========================================================================
	report += `EXTRACTED ROUTING BSP NODE METRICS:\n`;
	if(nodeLump && nodeLump.length > 0 && nodeLump.offset + nodeLump.length <= bytes.length)
	{
		const totalNodes = nodeLump.length / 24;
		report += `Total Spatial Nodes Evaluated: ${totalNodes}\n`;
	} else
	{
		report += `  Node layout data parsing skipped due to invalid structural bounds or blank lump.\n`;
	}
	report += `------------------------------------------------------------------------\n\n`;

	// =========================================================================
	// STEP 8: EDGE DEFINITIONS (8 Bytes / Edge)
	// =========================================================================
	report += `AAS EDGE ROUTING DATA (Vertex Pairs):\n`;
	if(edgeLump && edgeLump.length > 0 && edgeLump.offset + edgeLump.length <= bytes.length)
	{
		const totalEdges = edgeLump.length / 8; // Two 32-bit integers
		report += `Total Spatial Edges Parsed: ${totalEdges}\n`;
		report += `  * Edges map 2D connections for face boundaries.\n`;
	} else
	{
		report += `  Edge mapping unavailable or uninitialized.\n`;
	}
	report += `========================================================================\n`;
	report += `Status: Successfully isolated target AAS bot route compilation data sectors.\n`;

	// =========================================================================
	// STEP 7: BSP NODE TREE HEURISTICS (24 Bytes / Node)
	// =========================================================================
	report += `EXTRACTED ROUTING BSP NODE METRICS:\n`;
	if(typeof nodeLump !== 'undefined' && nodeLump.length > 0 && nodeLump.offset + nodeLump.length <= bytes.length)
	{
		const totalNodes = nodeLump.length / 24;
		report += `Total Spatial Nodes Evaluated: ${totalNodes}\n`;
	} else
	{
		report += `  Node layout data parsing skipped due to invalid structural bounds or blank lump.\n`;
	}
	report += `------------------------------------------------------------------------\n\n`;

	// =========================================================================
	// STEP 8: EDGE DEFINITIONS (8 Bytes / Edge)
	// =========================================================================
	// Derived from aas_edge_t { int v[2]; } referenced in AAS_ShowFace
	report += `AAS EDGE ROUTING DATA (Vertex Pairs):\n`;
	if(typeof edgeLump !== 'undefined' && edgeLump.length > 0 && edgeLump.offset + edgeLump.length <= bytes.length)
	{
		const totalEdges = edgeLump.length / 8; // Two 32-bit integers
		report += `Total Spatial Edges Parsed: ${totalEdges}\n`;
		report += `  * Edges map 2D connections for face boundaries.\n`;
	} else
	{
		report += `  Edge mapping unavailable or uninitialized.\n`;
	}
	report += `------------------------------------------------------------------------\n\n`;

	// =========================================================================
	// STEP 9: AREA TOPOLOGY HEURISTICS
	// =========================================================================
	// Derived from aas_area_t & aas_areasettings_t referenced in AAS_ShowArea
	report += `AREA TOPOLOGY & CONVEX HULLS:\n`;
	if(typeof areaLump !== 'undefined' && areaLump.length > 0)
	{
		// Area structures vary by version but typically contain face limits/indices
		report += `Area Lump Size: ${areaLump.length} bytes extracted.\n`;
		report += `  * Areas dictate walkable zones and liquid boundaries.\n`;
		report += `  * Ready to extract face/edge indices for 3D reconstruction.\n`;
	} else
	{
		report += `  Area hull data parsing skipped.\n`;
	}
	report += `------------------------------------------------------------------------\n\n`;

	// =========================================================================
	// STEP 10: BOT REACHABILITY GRAPH
	// =========================================================================
	// Derived from aas_reachability_t and TRAVEL_* constants in AAS_PrintTravelType
	report += `BOT REACHABILITY AND TRAVEL GRAPH:\n`;
	if(typeof reachLump !== 'undefined' && reachLump.length > 0)
	{
		report += `Reachability Graph populated with ${reachLump.length} bytes.\n`;
		report += `  * Tracks TRAVEL_WALK, TRAVEL_JUMP, TRAVEL_ROCKETJUMP, TRAVEL_JUMPPAD, etc.\n`;
		report += `  * Includes embedded velocity/cmdmove predictions (Z-velocity jump parameters).\n`;
	} else
	{
		report += `  Reachability vector analysis unavailable.\n`;
	}
	report += `========================================================================\n\n`;

	// =========================================================================
	// STEP 7: BSP NODE TREE HEURISTICS (24 Bytes / Node)
	// =========================================================================
	report += `EXTRACTED ROUTING BSP NODE METRICS:\n`;
	if(nodeLump.length > 0 && nodeLump.offset + nodeLump.length <= bytes.length)
	{
		const totalNodes = nodeLump.length / 24;
		report += `Total Spatial Nodes Evaluated: ${totalNodes}\n`;
	} else
	{
		report += `  Node layout data parsing skipped due to invalid structural bounds or blank lump.\n`;
	}

	report += `========================================================================\n`;
	report += `Status: Successfully isolated target AAS bot route compilation data sectors.\n`;

	return report;
}



/**
 * Quick helper to evaluate header buffers using your existing magics
 * @param {Buffer} bytes
 * @returns
 */
export function isQuakeBinaryMagic(bytes)
{
	const magicStr = Array.from(bytes.subarray(0, 4)).map(b => String.fromCharCode(b)).join('');
	// "IBSP" = Map, "IDP3" = Mesh, "EAAS" = Bot AI navigation
	return ['IBSP', 'IDP3', 'EAAS'].includes(magicStr) ||
		(bytes[0] === 0x44 && bytes[1] === 0x14 && bytes[2] === 0x72 && bytes[3] === 0x12); // QVM
}



