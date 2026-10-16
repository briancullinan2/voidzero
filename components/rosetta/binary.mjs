
// @ts-check
import mime from 'mime';
import
{
	getWasmObjectHeader, renderWasmDisassemblySuite,
	getWasmFinalHeader, renderWasmDisassembly
} from './binary-wasm';
import
{
	renderMd3DisassemblySuite,
	renderBspDisassemblySuite, renderAasDisassemblySuite,
	parseQ3FontDat
} from './binary-q3';
import { parseDM3Telemetry } from './binary-q3net';
import { getQVMHeader } from './binary-qvm';


/** @type {import('./rosetta-types.d').RosettaWorker} */
const workerSelf = /** @type {any} */ (self);
workerSelf.mime = mime;


/**
 *
 * @param {Buffer} sampleBytes
 * @param {Buffer} content
 * @param {string} filePath
 * @param {number} rowWidth
 * @returns
 */
export function hexDump(sampleBytes, content, filePath, rowWidth = 16)
{
	let infoStack;

	if(filePath.endsWith('.o'))
	{
		infoStack = getWasmObjectHeader(sampleBytes, content, filePath);

		infoStack += renderWasmDisassemblySuite(sampleBytes, rowWidth);

		return infoStack;
	} else if(filePath.endsWith('.wasm'))
	{
		infoStack = getWasmFinalHeader(sampleBytes, content, filePath);

		infoStack += renderWasmDisassembly(sampleBytes, rowWidth);

		return infoStack;
	} else if(filePath.endsWith('.qvm'))
	{
		infoStack = getQVMHeader(sampleBytes, content, filePath);
	} else if(filePath.endsWith('.md3'))
	{
		infoStack = renderMd3DisassemblySuite(content, filePath);
	} else if(filePath.endsWith('.bsp'))
	{
		infoStack = renderBspDisassemblySuite(content, filePath);
	} else if(filePath.endsWith('.aas'))
	{
		infoStack = renderAasDisassemblySuite(content, filePath);
	} else if(filePath.endsWith('.dm3') || filePath.endsWith('.dm68'))
	{
		infoStack = parseDM3Telemetry(sampleBytes);
	} else if(filePath.endsWith('.dat') || filePath.endsWith('.dm68'))
	{
		infoStack = parseQ3FontDat(content);
	} else
	{

		infoStack = `Binary file detected (${content.length} bytes)\n`;
	}

	infoStack += `========================================================================\n\n`;
	infoStack += `Raw Header Hex View (First ${sampleBytes.length} bytes):\n`;
	infoStack += `------------------------------------------------------------------------\n`;

	let hexRows = [];
	for(let i = 0; i < sampleBytes.length; i += 16)
	{
		let chunk = [];
		for(let j = 0; j < 16; j++)
		{
			if(i + j < sampleBytes.length)
			{
				let byteHex = sampleBytes[i + j].toString(16).padStart(2, '0').toUpperCase();
				chunk.push(byteHex);
			}
		}

		// Add visual split column delimiter at byte index 8
		if(chunk.length > 8)
		{
			chunk.splice(8, 0, "|");
		}

		// Pad out short rows at the end of the data chunk sample
		let hexLine = chunk.join(" ");
		let offset = i.toString(16).padStart(4, '0').toUpperCase();
		hexRows.push(`0x${offset}:  ${hexLine}`);
	}

	let str = infoStack + hexRows.join("\n");

	return str;
}



/**
 *
 * @param {Buffer} buffer
 * @param {string} filename
 * @returns
 */
export function arrayBufferToDataUri(buffer, filename)
{
	// Determine MIME type based on extension (fallback to png)
	let type = "image/png";
	if(filename.endsWith('.jpg') || filename.endsWith('.jpeg')) type = "image/jpeg";
	if(filename.endsWith('.gif')) type = "image/gif";
	if(filename.endsWith('.webp')) type = "image/webp";

	const bytes = new Uint8Array(buffer);
	let binary = '';
	for(let i = 0; i < bytes.byteLength; i++)
	{
		binary += String.fromCharCode(bytes[i]);
	}
	const base64 = btoa(binary);
	return `data:${type};base64,${base64}`;
}


