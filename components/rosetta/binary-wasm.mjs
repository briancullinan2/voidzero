
// @ts-check


/**
 * Unpacks variable-length LEB128 unsigned integers from byte streams.
 * Crucial for avoiding pointer-drift caused by 5-byte compiler padding.
 * @param {Uint8Array} uint8Array
 * @param {number} offset
 * @returns
 */
export function decodeLEB128(uint8Array, offset)
{
	let result = 0;
	let shift = 0;
	let bytesRead = 0;
	while(offset + bytesRead < uint8Array.length)
	{
		const byte = uint8Array[offset + bytesRead];
		result |= (byte & 0x7f) << shift;
		bytesRead++;
		if((byte & 0x80) === 0) break;
		shift += 7;
	}
	return { value: result, bytes: bytesRead };
}


/**
 * Extracts comprehensive WebAssembly layout metrics and diagnostic symbols
 * to map a decorative, high-density telemetry header block.
 */
/**
 *
 * @param {Buffer} sampleBytes
 * @param {Buffer} content
 * @param {string} filePath
 * @returns
 */
export function getWasmObjectHeader(sampleBytes, content, filePath)
{
	const isWasm = sampleBytes[0] === 0x00 && sampleBytes[1] === 0x61 && sampleBytes[2] === 0x73 && sampleBytes[3] === 0x6D;

	let infoStack = `WASM Architecture Blueprint (${content.length} bytes)\n`;
	infoStack += `========================================================================\n`;

	if(isWasm && sampleBytes.length >= 8)
	{
		const view = new DataView(sampleBytes.buffer, sampleBytes.byteOffset, sampleBytes.byteLength);
		const wasmVersion = view.getUint32(4, true);

		// Core Layout Size Registries (Bytes)
		let typeLength = 0;
		let importLength = 0;
		let funcSignaturesLength = 0;
		let tableLength = 0;
		let memoryLength = 0;
		let globalLength = 0;
		let exportLength = 0;
		let elementLength = 0;
		let codeLength = 0;
		let dataLength = 0;
		let dataCountLength = 0;
		let customLength = 0;

		// Structured Symbol & Relocation Telemetry
		let totalTypesCount = 0;
		let importedSymbolsCount = 0;
		let exportedSymbolsCount = 0;
		let compiledFunctionsCount = 0;
		let objectSymbolsCount = -1; // -1 indicates symbol table absent
		let codeRelocationsCount = 0;
		let dataRelocationsCount = 0;
		let isRelocatable = false;

		// Data collector registries
		const localFunctionNames = [];
		const requestedFunctions = [];
		const exportedSymbols = [];
		const dataStrings = [];

		let ptr = 8;
		const totalBytes = sampleBytes.length;

		// Linear Object Layout Scanning Engine
		while(ptr < totalBytes)
		{
			if(ptr + 1 > totalBytes) break;

			const sectionId = sampleBytes[ptr];
			ptr += 1;

			const lengthDecode = decodeLEB128(sampleBytes, ptr);
			const sectionLength = lengthDecode.value;
			ptr += lengthDecode.bytes;

			const sectionEnd = ptr + sectionLength;
			if(sectionEnd > totalBytes) break;

			switch(sectionId)
			{
				case 0: // Custom Section Engine
					customLength += sectionLength;
					{
						const nameLenDec = decodeLEB128(sampleBytes, ptr);
						let namePtr = ptr + nameLenDec.bytes;
						let sectionName = "";
						for(let i = 0; i < Math.min(nameLenDec.value, 64); i++)
						{
							sectionName += String.fromCharCode(sampleBytes[namePtr + i]);
						}

						if(sectionName === "linking")
						{
							isRelocatable = true;
							let linkPtr = namePtr + nameLenDec.value;
							if(linkPtr < sectionEnd)
							{
								linkPtr += 1; // skip linking version
								while(linkPtr < sectionEnd)
								{
									const subId = sampleBytes[linkPtr];
									linkPtr += 1;
									const subLenDec = decodeLEB128(sampleBytes, linkPtr);
									linkPtr += subLenDec.bytes;
									if(subId === 8)
									{ // Symbol Table SubID
										objectSymbolsCount = decodeLEB128(sampleBytes, linkPtr).value;
									}
									linkPtr += subLenDec.value;
								}
							}
						}
						else if(sectionName === "reloc.CODE")
						{
							isRelocatable = true;
							codeRelocationsCount = decodeLEB128(sampleBytes, namePtr + nameLenDec.value).value;
						}
						else if(sectionName === "reloc.DATA")
						{
							isRelocatable = true;
							dataRelocationsCount = decodeLEB128(sampleBytes, namePtr + nameLenDec.value).value;
						}
						else if(sectionName === "name")
						{
							// --- PARSE EXTENDED DEBUG FUNCTION LABELS ---
							let nameSubPtr = namePtr + nameLenDec.value;
							while(nameSubPtr < sectionEnd)
							{
								const subId = sampleBytes[nameSubPtr];
								nameSubPtr += 1;
								const subLenDec = decodeLEB128(sampleBytes, nameSubPtr);
								nameSubPtr += subLenDec.bytes;
								const subEnd = nameSubPtr + subLenDec.value;

								if(subId === 1)
								{ // Function Names Sub-subsection
									const numNamesDec = decodeLEB128(sampleBytes, nameSubPtr);
									nameSubPtr += numNamesDec.bytes;
									for(let k = 0; k < Math.min(numNamesDec.value, 30); k++)
									{
										if(nameSubPtr >= subEnd) break;
										const fnIdxDec = decodeLEB128(sampleBytes, nameSubPtr);
										nameSubPtr += fnIdxDec.bytes;
										const fnNameLenDec = decodeLEB128(sampleBytes, nameSubPtr);
										nameSubPtr += fnNameLenDec.bytes;

										let fnName = "";
										for(let n = 0; n < fnNameLenDec.value; n++)
										{
											fnName += String.fromCharCode(sampleBytes[nameSubPtr + n]);
										}
										nameSubPtr += fnNameLenDec.value;
										localFunctionNames.push(`Index ${fnIdxDec.value} -> "${fnName}"`);
									}
								}
								nameSubPtr = subEnd;
							}
						}
					}
					break;

				case 1: // Type definitions
					typeLength += sectionLength;
					totalTypesCount = decodeLEB128(sampleBytes, ptr).value;
					break;

				case 2: // Imports Section (FIXED POINTER DESYNC)
					importLength += sectionLength;
					{
						let sPtr = ptr;
						const countDecode = decodeLEB128(sampleBytes, sPtr);
						importedSymbolsCount = countDecode.value;
						sPtr += countDecode.bytes;

						for(let i = 0; i < importedSymbolsCount; i++)
						{
							const modLenDec = decodeLEB128(sampleBytes, sPtr);
							sPtr += modLenDec.bytes;
							let modName = "";
							for(let j = 0; j < modLenDec.value; j++) modName += String.fromCharCode(sampleBytes[sPtr + j]);
							sPtr += modLenDec.value;

							const fieldLenDec = decodeLEB128(sampleBytes, sPtr);
							sPtr += fieldLenDec.bytes;
							let fieldName = "";
							for(let j = 0; j < fieldLenDec.value; j++) fieldName += String.fromCharCode(sampleBytes[sPtr + j]);
							sPtr += fieldLenDec.value;

							const importKind = sampleBytes[sPtr];
							sPtr += 1;

							if(importKind === 0x00)
							{ // Function
								const typeIdxDec = decodeLEB128(sampleBytes, sPtr);
								requestedFunctions.push(`${modName}.${fieldName} (Func Sig Index: ${typeIdxDec.value})`);
								sPtr += typeIdxDec.bytes;
							} else if(importKind === 0x01)
							{ // Table
								sPtr += 1; // element type
								const limitsDec = decodeLEB128(sampleBytes, sPtr); // flags
								sPtr += limitsDec.bytes;
								const initialDec = decodeLEB128(sampleBytes, sPtr);
								sPtr += initialDec.bytes;
							} else if(importKind === 0x02)
							{ // Memory
								const limitsDec = decodeLEB128(sampleBytes, sPtr);
								sPtr += limitsDec.bytes;
								const initialDec = decodeLEB128(sampleBytes, sPtr);
								sPtr += initialDec.bytes;
							} else if(importKind === 0x03)
							{ // Global
								sPtr += 2; // content type + mutability byte
								requestedFunctions.push(`${modName}.${fieldName} (Global Descriptor)`);
							}
						}
					}
					break;

				case 3: // Function Signatures Index
					funcSignaturesLength += sectionLength;
					compiledFunctionsCount = decodeLEB128(sampleBytes, ptr).value;
					break;
				case 4: tableLength += sectionLength; break;
				case 5: memoryLength += sectionLength; break;
				case 6: globalLength += sectionLength; break;

				case 7: // Exports Section
					exportLength += sectionLength;
					{
						let sPtr = ptr;
						const countDecode = decodeLEB128(sampleBytes, sPtr);
						exportedSymbolsCount = countDecode.value;
						sPtr += countDecode.bytes;

						for(let i = 0; i < exportedSymbolsCount; i++)
						{
							const nameLenDec = decodeLEB128(sampleBytes, sPtr);
							sPtr += nameLenDec.bytes;
							let expName = "";
							for(let j = 0; j < nameLenDec.value; j++) expName += String.fromCharCode(sampleBytes[sPtr + j]);
							sPtr += nameLenDec.value;

							const kind = sampleBytes[sPtr];
							sPtr += 1;
							const idxDec = decodeLEB128(sampleBytes, sPtr);
							sPtr += idxDec.bytes;

							const kindLabel = kind === 0 ? "Fn" : kind === 1 ? "Table" : kind === 2 ? "Mem" : "Global";
							exportedSymbols.push(`${expName} [Index ${idxDec.value} - ${kindLabel}]`);
						}
					}
					break;

				case 9: elementLength += sectionLength; break;
				case 10: codeLength += sectionLength; break;

				case 11: // Linear Data Strings Section
					dataLength += sectionLength;
					{
						let sPtr = ptr;
						const countDecode = decodeLEB128(sampleBytes, sPtr);
						let segmentCount = countDecode.value;
						sPtr += countDecode.bytes;

						for(let i = 0; i < segmentCount; i++)
						{
							if(sampleBytes[sPtr] === 0 || sampleBytes[sPtr] === 1 || sampleBytes[sPtr] === 2) sPtr += 1;
							while(sampleBytes[sPtr] !== 0x0B && sPtr < sectionEnd) sPtr++;
							sPtr += 1; // skip past end instruction wrapper

							const sizeDec = decodeLEB128(sampleBytes, sPtr);
							sPtr += sizeDec.bytes;

							let strAccumulator = "";
							for(let j = 0; j < sizeDec.value; j++)
							{
								const charCode = sampleBytes[sPtr + j];
								if(charCode >= 32 && charCode <= 126)
								{
									strAccumulator += String.fromCharCode(charCode);
								}
							}
							if(strAccumulator.trim().length > 2)
							{
								dataStrings.push(strAccumulator.trim());
							}
							sPtr += sizeDec.value;
						}
					}
					break;
				case 14: dataCountLength += sectionLength; break;
			}

			ptr = sectionEnd; // Leap cleanly directly to the next section block boundary
		}

		// Construct high-density report matrix
		infoStack += `Output Filename:     ${filePath}\n`;
		infoStack += `Binary File Profile: WASM v${wasmVersion} (${isRelocatable ? "Relocatable Object Binary" : "Executable Module"})\n`;
		infoStack += `Compiler Toolchain:  Clang LLVM WebAssembly Execution Platform\n`;
		infoStack += `------------------------------------------------------------------------\n`;
		infoStack += `Code Segment size:    ${codeLength.toString().padEnd(10)} bytes (${compiledFunctionsCount} internal blocks)\n`;
		infoStack += `Data Segment size:    ${dataLength.toString().padEnd(10)} bytes (Linear constants layout)\n`;
		infoStack += `Type Register size:   ${typeLength.toString().padEnd(10)} bytes (${totalTypesCount} unique signatures)\n`;
		infoStack += `Import Payload size:  ${importLength.toString().padEnd(10)} bytes (${importedSymbolsCount} external dependencies)\n`;
		infoStack += `Export Payload size:  ${exportLength.toString().padEnd(10)} bytes (${exportedSymbolsCount} mapped exit symbols)\n`;
		infoStack += `Global Memory size:   ${globalLength.toString().padEnd(10)} bytes\n`;
		infoStack += `Custom Metadata size: ${customLength.toString().padEnd(10)} bytes\n`;

		if(isRelocatable)
		{
			infoStack += `------------------------------------------------------------------------\n`;
			infoStack += `Object Symbol Table:  ${(objectSymbolsCount !== -1 ? objectSymbolsCount : "0").toString().padEnd(10)} linkage identifiers loaded\n`;
			infoStack += `Code Relocations:     ${codeRelocationsCount.toString().padEnd(10)} instruction fixup coordinates\n`;
			infoStack += `Data Relocations:     ${dataRelocationsCount.toString().padEnd(10)} variable offset fixup addresses\n`;
		}

		infoStack += `------------------------------------------------------------------------\n`;


		// 1. Output Import Dependencies table
		infoStack += `REQUESTED SYS-FUNCTIONS & ENVIRONMENT IMPORTS:\n`;
		if(requestedFunctions.length > 0)
		{
			requestedFunctions.forEach(f => infoStack += `  -> import: ${f}\n`);
		} else
		{
			infoStack += `  (No external platform dependencies requested)\n`;
		}
		infoStack += `------------------------------------------------------------------------\n`;

		infoStack += `FUNCTION INDEX:\n`;
		if(localFunctionNames.length > 0)
		{
			localFunctionNames.forEach(f => infoStack += `  -> extended: ${f}\n`);
		} else
		{
			infoStack += `  (No extended functions names from embedded debug symbols)\n`;
		}
		infoStack += `------------------------------------------------------------------------\n`;

		// 2. Output Export Registry mappings
		infoStack += `EXPORTED MODULE INTERFACE SYMBOLS:\n`;
		if(exportedSymbols.length > 0)
		{
			exportedSymbols.forEach(e => infoStack += `  => export: ${e}\n`);
		} else
		{
			infoStack += `  (No functions or bounds exported to runtime host)\n`;
		}

		// 3. Output extracted Data String Literals pool
		if(dataStrings.length > 0)
		{
			infoStack += `------------------------------------------------------------------------\n`;
			infoStack += `EMBEDDED LINEAR DATA STRINGS & CONSTANTS:\n`;
			dataStrings.slice(0, 10).forEach(str => infoStack += `  " ${str} "\n`);
			if(dataStrings.length > 10) infoStack += `  ... and ${dataStrings.length - 10} other text literals.\n`;
		}

		infoStack += `========================================================================\n`;
		infoStack += `Status:               Successfully isolated object compilation tables.\n`;
	} else
	{
		infoStack += `Format:               Unknown Raw Non-WASM Binary Payload\n`;
	}

	return infoStack;
}

/**
 * Consolidated WebAssembly Binary Analysis & Side-by-Side Disassembly Suite
 * Parses module headers internally and generates an adjustable multi-byte row matrix view.
 *
 * @param {Uint8Array} sampleBytes - Raw application binary array buffer workspace
 * @param {number} globalOffset
 * @param {number} rowWidth - Display column byte grouping threshold (typically 8 or 16)
 * @param {number|null} viewportStart - Optional custom byte offset to target; defaults to Code Start
 * @param {number|null} viewportLength - Total size slice boundary to dump into the active view pane
 */
export function renderWasmDisassemblySuite(sampleBytes, globalOffset, rowWidth = 16, viewportStart = null, viewportLength = null, codeStart = null, codeLength = null, dataStart = null, dataLength = null)
{
	const isWasm = sampleBytes[0] === 0x00 && sampleBytes[1] === 0x61 && sampleBytes[2] === 0x73 && sampleBytes[3] === 0x6D;
	if(!isWasm)
	{
		return "Error: Targeted stream does not contain a valid WebAssembly magic header.";
	}

	// =========================================================================
	// STEP 1: INTERNAL CORE STRUCTURAL PASS (LOCATING BOUNDARIES & OFFSETS)
	// =========================================================================
	let wasmVersion = 1;
	if(sampleBytes.length >= 8)
	{
		const view = new DataView(sampleBytes.buffer, sampleBytes.byteOffset, sampleBytes.byteLength);
		wasmVersion = view.getUint32(4, true);
	}

	// Layout pointer targets
	let codeSectionStart = codeStart !== undefined ? codeStart : -1;
	let codeSectionLength = codeLength || 0;
	let dataSectionStart = dataStart !== undefined ? dataStart : -1;
	let dataSectionLength = dataLength || 0;

	// 2. Only run internal scanning pass if we are in 'auto' mode and haven't passed presets
	if(codeStart === -1)
	{
		let ptr = 8;
		while(ptr < sampleBytes.length)
		{
			if(ptr + 1 > sampleBytes.length) break;
			const sectionId = sampleBytes[ptr];
			ptr += 1;
			const lengthDecode = decodeLEB128(sampleBytes, ptr);
			const sectionLength = lengthDecode.value;
			ptr += lengthDecode.bytes;

			if(sectionId === 10)
			{
				codeSectionStart = ptr + globalOffset;
				codeSectionLength = sectionLength;
			} else if(sectionId === 11)
			{
				dataSectionStart = ptr + globalOffset;
				dataSectionLength = sectionLength;
			}
			ptr += sectionLength;
		}
	}


	// Metric registries
	let typeSignaturesCount = 0;
	let importedGlobalsCount = 0;
	let importedFunctionsCount = 0;
	let compiledFunctionsCount = 0;
	let exportedSymbolsCount = 0;
	let isRelocatableObject = false;

	let ptr = 8;
	const totalBytes = sampleBytes.length;

	while(ptr < totalBytes)
	{
		if(ptr + 1 > totalBytes) break;
		const sectionId = sampleBytes[ptr];
		ptr += 1;

		// Use your existing decodeLEB128 utility to safely jump sections
		const lengthDecode = decodeLEB128(sampleBytes, ptr);
		const sectionLength = lengthDecode.value;
		ptr += lengthDecode.bytes;

		const sectionEnd = ptr + sectionLength;
		if(sectionEnd > totalBytes) break;

		switch(sectionId)
		{
			case 0: // Custom Section Analysis (Checks for Clang Linker Tables)
				const nameLenDec = decodeLEB128(sampleBytes, ptr);
				let namePtr = ptr + nameLenDec.bytes;
				let sectionName = "";
				for(let i = 0; i < Math.min(nameLenDec.value, 12); i++)
				{
					sectionName += String.fromCharCode(sampleBytes[namePtr + i]);
				}
				if(sectionName === "linking" || sectionName.startsWith("reloc."))
				{
					isRelocatableObject = true;
				}
				break;
			case 1: // Types
				typeSignaturesCount = decodeLEB128(sampleBytes, ptr).value;
				break;
			case 2: // Imports (Count function hooks vs global state variables)
				let impPtr = ptr;
				const impCountDec = decodeLEB128(sampleBytes, impPtr);
				impPtr += impCountDec.bytes;
				for(let i = 0; i < impCountDec.value; i++)
				{
					const modLen = decodeLEB128(sampleBytes, impPtr); impPtr += modLen.bytes + modLen.value;
					const fldLen = decodeLEB128(sampleBytes, impPtr); impPtr += fldLen.bytes + fldLen.value;
					const kind = sampleBytes[impPtr]; impPtr += 1;
					if(kind === 0x00) importedFunctionsCount++;
					else if(kind === 0x03) importedGlobalsCount++;
					else
					{
						const lim = decodeLEB128(sampleBytes, impPtr); impPtr += lim.bytes;
						const init = decodeLEB128(sampleBytes, impPtr); impPtr += init.bytes;
					}
				}
				break;
			case 3: // Function Signatures Mappings
				compiledFunctionsCount = decodeLEB128(sampleBytes, ptr).value;
				break;
			case 7: // Exports Table Mappings
				exportedSymbolsCount = decodeLEB128(sampleBytes, ptr).value;
				break;
			case 10: // CODE SECTION (The Program Target)
				codeSectionStart = ptr;
				codeSectionLength = sectionLength;
				break;
			case 11: // DATA SECTION (Linear Storage Pool)
				dataSectionStart = ptr;
				dataSectionLength = sectionLength;
				break;
		}
		ptr = sectionEnd;
	}

	// =========================================================================
	// STEP 2: CONSTRUCT TELEMETRY INFRASTRUCTURE HEADER
	// =========================================================================
	let outputBuffer = `WASM Executable Map Summary\n`;
	outputBuffer += `========================================================================\n`;
	outputBuffer += `Binary Profile:       WASM v${wasmVersion} (${isRelocatableObject ? "Relocatable Object File" : "Linked Executable Module"})\n`;
	outputBuffer += `Program Core Bounds:  ${typeof codeSectionStart === 'undefined' || !codeSectionStart
		? 'Not found'
		: ('Offset Address: 0x' + codeSectionStart.toString(16).toUpperCase().padStart(4, '0'))} (${codeSectionLength} raw payload bytes)\n`;
	outputBuffer += `Instruction Matrix:  ${compiledFunctionsCount} compiled structural function blocks context\n`;
	outputBuffer += `Import Assertions:   ${importedFunctionsCount} dynamic external calls, ${importedGlobalsCount} global memory offsets\n`;
	outputBuffer += `Export Accessors:    ${exportedSymbolsCount} mapped system interface entry gates\n`;
	outputBuffer += `========================================================================\n\n`;
	outputBuffer += `Side-by-Side Unified Hex & Instruction Disassembly Window:\n`;
	outputBuffer += `------------------------------------------------------------------------\n`;

	// =========================================================================
	// STEP 3: VIEWPORT WINDOWING INITIALIZATION
	// =========================================================================
	// Default the scroll track focus straight to where the executable program code starts
	let startIdx = (viewportStart !== null) ? viewportStart : (codeSectionStart !== -1 ? codeSectionStart : 0) ?? 0;
	let endIdx = Math.min(sampleBytes.length, startIdx + (viewportLength !== null ? viewportLength : sampleBytes.length));

	// Ground loop alignment to your configured rowWidth layout threshold boundary
	startIdx = Math.floor(startIdx / rowWidth) * rowWidth;


	// =========================================================================
	// STEP 4: ADJUSTABLE MULTI-BYTE ROW PRINTING LOOP
	// =========================================================================
	for(let rowAddr = startIdx; rowAddr < endIdx; rowAddr += rowWidth)
	{
		let chunkBytes = [];
		for(let offset = 0; offset < rowWidth; offset++)
		{
			if(rowAddr + offset < sampleBytes.length)
			{
				chunkBytes.push(sampleBytes[rowAddr + offset]);
			}
		}

		// Format the global memory address marker label (e.g., 0x01A0)
		let addrLabel = `0x${rowAddr.toString(16).padStart(4, '0').toUpperCase()}`;

		// Map raw hexadecimal byte representations cleanly
		let hexString = chunkBytes.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(" ");
		let expectedHexLength = (rowWidth * 3) - 1;
		let paddedHexColumn = hexString.padEnd(expectedHexLength, ' ');

		// Generate an alternative real-time side-by-side standard ASCII text representation map
		let asciiPreview = chunkBytes.map(b => (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.').join("");

		let annotation = "";
		const isRowInCode = (codeSectionStart && rowAddr >= codeSectionStart && rowAddr < (codeSectionStart + codeSectionLength));
		const isRowInData = (dataSectionStart && rowAddr >= dataSectionStart && rowAddr < (dataSectionStart + dataSectionLength));

		// ─── CONTEXT LAYOUT A: EXECUTABLE CODE MATRIX ───
		if(isRowInCode)
		{
			let rowInstructions = [];
			let i = 0;

			while(i < chunkBytes.length)
			{
				let byteVal = chunkBytes[i];
				if(WASM_OPCODES[byteVal] !== undefined)
				{
					let mnemonics = WASM_OPCODES[byteVal];

					// Lookahead argument tracker to bind immediate values cleanly: "local.get 0x02"
					if(byteVal === 0x41 || byteVal === 0x20 || byteVal === 0x21 || byteVal === 0x10)
					{
						if(i + 1 < chunkBytes.length)
						{
							let immediateVal = chunkBytes[i + 1];
							mnemonics += ` 0x${immediateVal.toString(16).toUpperCase()}`;
							i += 1; // Step past consumed argument
						}
					}
					rowInstructions.push(mnemonics);
				} else
				{
					// Display unmapped operational codes compactly
					rowInstructions.push(`0x${byteVal.toString(16).toUpperCase()}`);
				}
				i++;
			}
			annotation = `ASM: ${rowInstructions.join(" -> ")}`;
		}
		// ─── CONTEXT LAYOUT B: LINEAR CONSTANT POOLS ───
		else if(isRowInData)
		{
			annotation = `STR: "${asciiPreview.replace(/\.+/g, ' ').trim()}"`;
		}
		// ─── CONTEXT LAYOUT C: CLEAN SYNC STRUCTURAL METADATA ───
		else
		{
			let segmentLabel = "STRUCT";
			if(rowAddr === 0) segmentLabel = "HEADER";
			else if(codeSectionStart && rowAddr < codeSectionStart) segmentLabel = "METADATA";
			else segmentLabel = "LINK-TABLE";

			annotation = `${segmentLabel}: [ ${asciiPreview} ]`;
		}

		// Print final perfectly padded, symmetric screen lines matrix row
		outputBuffer += `${addrLabel}:  ${paddedHexColumn} | ${asciiPreview} | ; ${annotation}\n`;
	}


	return outputBuffer;
}


/**
 * Advanced Stream-Safe WebAssembly Disassembler & Hex Matrix
 *
 * @param {Uint8Array} sampleBytes - The active chunk of bytes loaded into memory
 * @param {number} rowWidth - Display width layout grid columns (8 or 16)
 * @param {import('./rosetta-types.d').DisassemblyOptions} options - Configuration adjustments for windowing and overrides
 */
export function renderWasmDisassemblyPrintout(sampleBytes, rowWidth = 16, options = {})
{
	// 1. Default fallback parameters for stream synchronization
	const globalOffset = options.globalOffset || 0;
	const forceMode = options.forceMode || 'auto';

	let codeSectionStart = options.codeStart !== undefined ? options.codeStart : -1;
	let codeSectionLength = options.codeLength || 0;
	let dataSectionStart = options.dataStart !== undefined ? options.dataStart : -1;
	let dataSectionLength = options.dataLength || 0;

	// 2. Only run internal scanning pass if we are in 'auto' mode and haven't passed presets
	if(forceMode === 'auto' && codeSectionStart === -1)
	{
		let ptr = 8;
		while(ptr < sampleBytes.length)
		{
			if(ptr + 1 > sampleBytes.length) break;
			const sectionId = sampleBytes[ptr];
			ptr += 1;
			const lengthDecode = decodeLEB128(sampleBytes, ptr);
			const sectionLength = lengthDecode.value;
			ptr += lengthDecode.bytes;

			if(sectionId === 10)
			{
				codeSectionStart = ptr + globalOffset;
				codeSectionLength = sectionLength;
			} else if(sectionId === 11)
			{
				dataSectionStart = ptr + globalOffset;
				dataSectionLength = sectionLength;
			}
			ptr += sectionLength;
		}
	}

	let outputBuffer = "";

	// =========================================================================
	// STEP 4: ADJUSTABLE MULTI-BYTE ROW PRINTING LOOP
	// =========================================================================
	for(let rowAddr = 0; rowAddr < sampleBytes.length; rowAddr += rowWidth)
	{
		let chunkBytes = [];
		for(let offset = 0; offset < rowWidth; offset++)
		{
			if(rowAddr + offset < sampleBytes.length)
			{
				chunkBytes.push(sampleBytes[rowAddr + offset]);
			}
		}

		// Calculate the TRUE global file address instead of local array address
		let trueGlobalRowAddress = globalOffset + rowAddr;
		let addrLabel = `0x${trueGlobalRowAddress.toString(16).padStart(4, '0').toUpperCase()}`;

		let hexString = chunkBytes.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(" ");
		let paddedHexColumn = hexString.padEnd((rowWidth * 3) - 1, ' ');
		let asciiPreview = chunkBytes.map(b => (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.').join("");

		let annotation = "";

		// Determine context layout profile by resolving manual flags vs dynamic memory ranges
		let currentMode = forceMode;
		if(currentMode === 'auto')
		{
			if(trueGlobalRowAddress >= codeSectionStart && trueGlobalRowAddress < (codeSectionStart + codeSectionLength))
			{
				currentMode = 'asm';
			} else if(trueGlobalRowAddress >= dataSectionStart && trueGlobalRowAddress < (dataSectionStart + dataSectionLength))
			{
				currentMode = 'data';
			} else
			{
				currentMode = 'metadata';
			}
		}

		// ─── RENDERING EXECUTION PIPELINES ───
		if(currentMode === 'asm')
		{
			let rowInstructions = [];
			let i = 0;
			while(i < chunkBytes.length)
			{
				let byteVal = chunkBytes[i];
				if(WASM_OPCODES[byteVal] !== undefined)
				{
					let mnemonics = WASM_OPCODES[byteVal];
					if(byteVal === 0x41 || byteVal === 0x20 || byteVal === 0x21 || byteVal === 0x10)
					{
						if(i + 1 < chunkBytes.length)
						{
							mnemonics += ` 0x${chunkBytes[i + 1].toString(16).toUpperCase()}`;
							i += 1;
						}
					}
					rowInstructions.push(mnemonics);
				} else
				{
					rowInstructions.push(`0x${byteVal.toString(16).toUpperCase()}`);
				}
				i++;
			}
			annotation = `ASM: ${rowInstructions.join(" -> ")}`;
		}
		else if(currentMode === 'data')
		{
			annotation = `STR: "${asciiPreview.replace(/\.+/g, ' ').trim()}"`;
		}
		else
		{
			annotation = `METADATA: [ ${asciiPreview} ]`;
		}

		outputBuffer += `${addrLabel}:  ${paddedHexColumn} | ${asciiPreview} | ; ${annotation}\n`;
	}

	return outputBuffer;
}


/**
 * Extracts comprehensive WebAssembly structural execution metrics and
 * instantiation maps to output a high-density runtime telemetry header block.
 * Optimized for production/final compiled executables.
 *
 * @param {Uint8Array} sampleBytes - Raw application binary array buffer workspace.
 * @param {string|Uint8Array} content - The file context stream data wrapper.
 * @param {string} filePath - Path identifier of the active workspace file.
 */
export function getWasmFinalHeader(sampleBytes, content, filePath)
{
	const isWasm = sampleBytes[0] === 0x00 && sampleBytes[1] === 0x61 && sampleBytes[2] === 0x73 && sampleBytes[3] === 0x6D;

	let infoStack = `WASM Production Executable Blueprint (${content.length} bytes)\n`;
	infoStack += `========================================================================\n`;

	if(isWasm && sampleBytes.length >= 8)
	{
		const view = new DataView(sampleBytes.buffer, sampleBytes.byteOffset, sampleBytes.byteLength);
		const wasmVersion = view.getUint32(4, true);

		// Core Architectural Section Sizes (Bytes)
		let typeLength = 0;
		let importLength = 0;
		let funcSignaturesLength = 0;
		let tableLength = 0;
		let memoryLength = 0;
		let globalLength = 0;
		let exportLength = 0;
		let startLength = 0;
		let elementLength = 0;
		let codeLength = 0;
		let dataLength = 0;
		let dataCountLength = 0;
		let customLength = 0;

		// Runtime Instantiation Telemetry
		let totalTypesCount = 0;
		let importedSymbolsCount = 0;
		let exportedSymbolsCount = 0;
		let compiledFunctionsCount = 0;
		let tableElementsCount = 0;
		let globalVariablesCount = 0;
		let dataSegmentsCount = 0;

		// Final Binary Entry Target (-1 indicates instantiation-only module)
		let executionEntryPointIdx = -1;

		// Telemetry List Registries
		const requestedImports = [];
		const exportedSymbols = [];
		const localFunctionNames = [];
		const dataStrings = [];

		let ptr = 8;
		const totalBytes = sampleBytes.length;

		// Linear Executable Stream Parsing Loop
		while(ptr < totalBytes)
		{
			if(ptr + 1 > totalBytes) break;

			const sectionId = sampleBytes[ptr];
			ptr += 1;

			const lengthDecode = decodeLEB128(sampleBytes, ptr);
			const sectionLength = lengthDecode.value;
			ptr += lengthDecode.bytes;

			const sectionEnd = ptr + sectionLength;
			if(sectionEnd > totalBytes) break;

			switch(sectionId)
			{
				case 0: // Custom Section Engine (Preserves debug names if unstripped)
					customLength += sectionLength;
					{
						const nameLenDec = decodeLEB128(sampleBytes, ptr);
						let namePtr = ptr + nameLenDec.bytes;
						let sectionName = "";
						for(let i = 0; i < Math.min(nameLenDec.value, 64); i++)
						{
							sectionName += String.fromCharCode(sampleBytes[namePtr + i]);
						}

						if(sectionName === "name")
						{
							let nameSubPtr = namePtr + nameLenDec.value;
							while(nameSubPtr < sectionEnd)
							{
								const subId = sampleBytes[nameSubPtr];
								nameSubPtr += 1;
								const subLenDec = decodeLEB128(sampleBytes, nameSubPtr);
								nameSubPtr += subLenDec.bytes;
								const subEnd = nameSubPtr + subLenDec.value;

								if(subId === 1)
								{ // Function Names Sub-subsection
									const numNamesDec = decodeLEB128(sampleBytes, nameSubPtr);
									nameSubPtr += numNamesDec.bytes;
									for(let k = 0; k < Math.min(numNamesDec.value, 15); k++)
									{
										if(nameSubPtr >= subEnd) break;
										const fnIdxDec = decodeLEB128(sampleBytes, nameSubPtr);
										nameSubPtr += fnIdxDec.bytes;
										const fnNameLenDec = decodeLEB128(sampleBytes, nameSubPtr);
										nameSubPtr += fnNameLenDec.bytes;

										let fnName = "";
										for(let n = 0; n < fnNameLenDec.value; n++)
										{
											fnName += String.fromCharCode(sampleBytes[nameSubPtr + n]);
										}
										nameSubPtr += fnNameLenDec.value;
										localFunctionNames.push(`Index ${fnIdxDec.value} -> "${fnName}"`);
									}
								}
								nameSubPtr = subEnd;
							}
						}
					}
					break;

				case 1: // Type definitions
					typeLength += sectionLength;
					totalTypesCount = decodeLEB128(sampleBytes, ptr).value;
					break;

				case 2: // Imports Section (FIXED LIMITS DESERIALIZER)
					importLength += sectionLength;
					{
						let sPtr = ptr;
						const countDecode = decodeLEB128(sampleBytes, sPtr);
						importedSymbolsCount = countDecode.value;
						sPtr += countDecode.bytes;

						for(let i = 0; i < importedSymbolsCount; i++)
						{
							const modLenDec = decodeLEB128(sampleBytes, sPtr); sPtr += modLenDec.bytes;
							let modName = "";
							for(let j = 0; j < modLenDec.value; j++) modName += String.fromCharCode(sampleBytes[sPtr + j]);
							sPtr += modLenDec.value;

							const fieldLenDec = decodeLEB128(sampleBytes, sPtr); sPtr += fieldLenDec.bytes;
							let fieldName = "";
							for(let j = 0; j < fieldLenDec.value; j++) fieldName += String.fromCharCode(sampleBytes[sPtr + j]);
							sPtr += fieldLenDec.value;

							const importKind = sampleBytes[sPtr]; sPtr += 1;
							const kindLabel = importKind === 0x00 ? "Fn" : importKind === 0x01 ? "Table" : importKind === 0x02 ? "Mem" : "Global";

							requestedImports.push(`${modName}.${fieldName} (${kindLabel})`);

							if(importKind === 0x00)
							{
								const idxDec = decodeLEB128(sampleBytes, sPtr); sPtr += idxDec.bytes;
							} else if(importKind === 0x03)
							{
								const idxDec = decodeLEB128(sampleBytes, sPtr); sPtr += idxDec.bytes;
								sPtr += 1; // Mutability byte
							} else if(importKind === 0x01 || importKind === 0x02)
							{
								if(importKind === 0x01) sPtr += 1; // Element Type
								const flags = sampleBytes[sPtr]; sPtr += 1;
								const initialDec = decodeLEB128(sampleBytes, sPtr); sPtr += initialDec.bytes;
								if((flags & 1) === 1)
								{
									const maxDec = decodeLEB128(sampleBytes, sPtr); sPtr += maxDec.bytes;
								}
							}
						}
					}
					break;

				case 3: // Function Signatures Index
					funcSignaturesLength += sectionLength;
					compiledFunctionsCount = decodeLEB128(sampleBytes, ptr).value;
					break;

				case 4: tableLength += sectionLength; break;
				case 5: memoryLength += sectionLength; break;

				case 6: // Global Section (FIXED EXPRESSION PARSER)
					globalLength += sectionLength;
					{
						let sPtr = ptr;
						const countDecode = decodeLEB128(sampleBytes, sPtr);
						globalVariablesCount = countDecode.value;
						sPtr += countDecode.bytes;

						// Safely step over initialization vector bytecode structures
						for(let i = 0; i < globalVariablesCount; i++)
						{
							sPtr += 2; // Step past Content Value Type and Mutability flag bytes
							while(sampleBytes[sPtr] !== 0x0B && sPtr < sectionEnd)
							{
								sPtr++;
							}
							sPtr += 1; // Leap past explicit 0x0B initialization termination marker
						}
					}
					break;

				case 7: // Exports Section (STABILIZED STRUCTURAL ROUTING)
					exportLength += sectionLength;
					{
						let sPtr = ptr;
						const countDecode = decodeLEB128(sampleBytes, sPtr);
						exportedSymbolsCount = countDecode.value;
						sPtr += countDecode.bytes;

						for(let i = 0; i < exportedSymbolsCount; i++)
						{
							const nameLenDec = decodeLEB128(sampleBytes, sPtr); sPtr += nameLenDec.bytes;
							let expName = "";
							for(let j = 0; j < nameLenDec.value; j++) expName += String.fromCharCode(sampleBytes[sPtr + j]);
							sPtr += nameLenDec.value;

							const kind = sampleBytes[sPtr]; sPtr += 1;
							const idxDec = decodeLEB128(sampleBytes, sPtr); sPtr += idxDec.bytes;

							const kindLabel = kind === 0 ? "Fn" : kind === 1 ? "Table" : kind === 2 ? "Mem" : "Global";

							if(expName === "vmMain" || expName === "dllEntry")
							{
								exportedSymbols.push(`\x1b[33m${expName}\x1b[0m [Index ${idxDec.value} - ${kindLabel}]`);
							} else
							{
								exportedSymbols.push(`${expName} [Index ${idxDec.value} - ${kindLabel}]`);
							}
						}
					}
					break;

				case 8: // START SECTION (CRITICAL ENTRY POINT REGISTER FOR EXECUTABLES)
					startLength += sectionLength;
					executionEntryPointIdx = decodeLEB128(sampleBytes, ptr).value;
					break;

				case 9: // Element Table Segments (Indirect Call Vector Tables)
					elementLength += sectionLength;
					tableElementsCount = decodeLEB128(sampleBytes, ptr).value;
					break;

				case 10: // Code Execution Section
					codeLength += sectionLength;
					break;

				case 11: // Linear Data Strings Section
					dataLength += sectionLength;
					{
						let sPtr = ptr;
						const countDecode = decodeLEB128(sampleBytes, sPtr);
						dataSegmentsCount = countDecode.value;
						sPtr += countDecode.bytes;

						for(let i = 0; i < dataSegmentsCount; i++)
						{
							if(sampleBytes[sPtr] <= 2) sPtr += 1; // Flags byte
							while(sampleBytes[sPtr] !== 0x0B && sPtr < sectionEnd) sPtr++;
							sPtr += 1; // Leap past execution break byte

							const sizeDec = decodeLEB128(sampleBytes, sPtr);
							sPtr += sizeDec.bytes;

							let strAccumulator = "";
							for(let j = 0; j < sizeDec.value; j++)
							{
								const charCode = sampleBytes[sPtr + j];
								if(charCode >= 32 && charCode <= 126)
								{
									strAccumulator += String.fromCharCode(charCode);
								}
							}
							if(strAccumulator.trim().length > 2)
							{
								dataStrings.push(strAccumulator.trim());
							}
							sPtr += sizeDec.value;
						}
					}
					break;
				case 14: dataCountLength += sectionLength; break;
			}

			ptr = sectionEnd;
		}

		// =========================================================================
		// COMPILING GRAPHICAL HIGH-DENSITY SCANNABLE SYMBOLS OUTPUT
		// =========================================================================
		infoStack += `Output Filename:     ${filePath}\n`;
		infoStack += `Binary File Profile: WASM v${wasmVersion} (Instantiated Production Executable Module)\n`;
		infoStack += `Execution Blueprint: Fully Bound Machine Environment Pipeline\n`;
		infoStack += `------------------------------------------------------------------------\n`;
		infoStack += `Code Segment size:    ${codeLength.toString().padEnd(10)} bytes (${compiledFunctionsCount} execution routine tracks)\n`;
		infoStack += `Data Segment size:    ${dataLength.toString().padEnd(10)} bytes (${dataSegmentsCount} linear segment data tables)\n`;
		infoStack += `Type Register size:   ${typeLength.toString().padEnd(10)} bytes (${totalTypesCount} explicit parameter validation signatures)\n`;
		infoStack += `Import Payload size:  ${importLength.toString().padEnd(10)} bytes (${importedSymbolsCount} host infrastructure hooks)\n`;
		infoStack += `Export Payload size:  ${exportLength.toString().padEnd(10)} bytes (${exportedSymbolsCount} mapped API entrance gates)\n`;
		infoStack += `Global Space size:    ${globalLength.toString().padEnd(10)} bytes (${globalVariablesCount} internal program variables)\n`;
		infoStack += `Indirect Call Tables: ${elementLength.toString().padEnd(10)} bytes (${tableElementsCount} dynamic call dispatch vectors)\n`;

		infoStack += `------------------------------------------------------------------------\n`;

		// Explicit Entry Point Reporting
		infoStack += `MODULE RUNTIME INITIALIZATION TARGET:\n`;
		if(executionEntryPointIdx !== -1)
		{
			infoStack += `  >> entry-point: function code registry index [ ${executionEntryPointIdx} ] (Auto-executes on instantiation)\n`;
		} else
		{
			infoStack += `  (No manual entry block; module initializes state allocations selectively)\n`;
		}
		infoStack += `------------------------------------------------------------------------\n`;

		// Imports Mapping Block
		infoStack += `IMPORTED ATTACHMENT HOOKS (ENVIRONMENT DEPENDENCIES):\n`;
		if(requestedImports.length > 0)
		{
			requestedImports.forEach(imp => infoStack += `  -> link: ${imp}\n`);
		} else
		{
			infoStack += `  (Self-contained application context; zero host imports verified)\n`;
		}
		infoStack += `------------------------------------------------------------------------\n`;

		// Exports Mapping Block (OPTIMIZED WITH Q3 BOUNDARY CHECK)
		infoStack += `EXPORTED ACCESS SYMBOLS (PUBLIC INTERFACE HOOKS):\n`;
		if(exportedSymbols.length > 0)
		{
			const hasVmMain = exportedSymbols.some(e => e.includes("vmMain"));
			const hasDllEntry = exportedSymbols.some(e => e.includes("dllEntry"));

			infoStack += `  [ Q3 INTERFACE STATUS: vmMain -> ${hasVmMain ? "✔ FOUND" : "✘ MISSING"} | dllEntry -> ${hasDllEntry ? "✔ FOUND" : "✘ MISSING"} ]\n`;

			const engineHooks = exportedSymbols.filter(e => e.includes("vmMain") || e.includes("dllEntry"));
			const standardHooks = exportedSymbols.filter(e => !e.includes("vmMain") && !e.includes("dllEntry"));

			// Put critical logic entries right at the top
			engineHooks.forEach(exp => infoStack += `  ★ export: ${exp}\n`);

			// Render a subset of standard entries so your console doesn't crawl
			standardHooks.slice(0, 10).forEach(exp => infoStack += `  => export: ${exp}\n`);
			if(standardHooks.length > 10)
			{
				infoStack += `  ... and ${standardHooks.length - 10} other structural system interface gates.\n`;
			}
		} else
		{
			infoStack += `  (Encapsulated context binary; structural access signatures hidden)\n`;
		}

		// Local Function Names Debug Maps
		if(localFunctionNames.length > 0)
		{
			infoStack += `------------------------------------------------------------------------\n`;
			infoStack += `PRESERVED COMPILED FUNCTION STRINGS (DEBUG SYMBOLS):\n`;
			localFunctionNames.forEach(lbl => infoStack += `  :: symbol: ${lbl}\n`);
			if(localFunctionNames.length >= 15) infoStack += `  ... and trailing unstripped functional string entries.\n`;
		}

		// Data Table String Literals
		if(dataStrings.length > 0)
		{
			infoStack += `------------------------------------------------------------------------\n`;
			infoStack += `EXTRACTED HARDCODED CONSTANT LITERAL POOLS:\n`;
			dataStrings.slice(0, 10).forEach(str => infoStack += `  " ${str} "\n`);
			if(dataStrings.length > 10) infoStack += `  ... and ${dataStrings.length - 10} other memory pool literals.\n`;
		}

		infoStack += `========================================================================\n`;
		infoStack += `Status:               Successfully compiled standalone runtime layout map.\n`;
	} else
	{
		infoStack += `Format:               Unknown Raw Non-WASM Binary Payload\n`;
	}

	return infoStack;
}


/**
 * Core WebAssembly Opcode Dictionary
 * Maps binary bytecode values directly to standard instruction text mnemonics.
 * @type {Record<number, string>}
 */
const WASM_OPCODES = {
	0x00: "unreachable", 0x01: "nop", 0x02: "block", 0x03: "loop", 0x04: "if", 0x05: "else",
	0x0B: "end", 0x0C: "br", 0x0D: "br_if", 0x0E: "br_table", 0x0F: "return", 0x10: "call",
	0x11: "call_indirect", 0x1A: "drop", 0x1B: "select",
	0x20: "local.get", 0x21: "local.set", 0x22: "local.tee", 0x23: "global.get", 0x24: "global.set",
	0x28: "i32.load", 0x29: "i64.load", 0x2A: "f32.load", 0x2B: "f64.load",
	0x2C: "i32.load8_s", 0x2D: "i32.load8_u", 0x2E: "i32.load16_s", 0x2F: "i32.load16_u",
	0x36: "i32.store", 0x37: "i64.store", 0x3A: "i32.store8", 0x3B: "i32.store16",
	0x3C: "i64.store8", 0x41: "i32.const", 0x42: "i64.const", 0x43: "f32.const", 0x44: "f64.const",
	0x45: "i32.eqz", 0x46: "i32.eq", 0x47: "i32.ne", 0x48: "i32.lt_s", 0x49: "i32.lt_u",
	0x4A: "i32.gt_s", 0x4B: "i32.gt_u", 0x4C: "i32.le_s", 0x4D: "i32.le_u",
	0x6A: "i32.add", 0x6B: "i32.sub", 0x6C: "i32.mul", 0x6D: "i32.div_s", 0x6E: "i32.div_u",
	0x70: "i32.rem_u", 0x71: "i32.and", 0x72: "i32.or", 0x73: "i32.xor", 0x74: "i32.shl",
	0x75: "i32.shr_s", 0x76: "i32.shr_u", 0x7F: "i32", 0x7E: "i64", 0x7D: "f32", 0x7C: "f64"
};

/**
 * Sweeps a 16-byte buffer and returns a side-by-side disassembly text string map.
 * @param {Buffer} bytes
 * @param {number} globalOffset
 * @returns
 */
export function disassembleWasmRow(bytes, globalOffset)
{
	let outputLines = [];
	let i = 0;

	while(i < bytes.length)
	{
		let byteVal = bytes[i];
		let currentAddr = globalOffset + i;
		let addrStr = `0x${currentAddr.toString(16).padStart(4, '0').toUpperCase()}`;

		// Build raw hexadecimal byte representation
		let hexByte = byteVal.toString(16).padStart(2, '0').toUpperCase();

		let interpretation = "";

		// 1. Check if the opcode is a recognized stack instruction mnemonic
		if(WASM_OPCODES[byteVal] !== undefined)
		{
			interpretation = `; asm: ${WASM_OPCODES[byteVal]}`;

			// Read parameter contexts out of variable length blocks if applicable
			if(byteVal === 0x41 || byteVal === 0x20 || byteVal === 0x21 || byteVal === 0x10)
			{
				if(i + 1 < bytes.length)
				{
					let nextByte = bytes[i + 1];
					// Lookahead tracking for indices or numerical values
					interpretation += ` [imm: 0x${nextByte.toString(16).toUpperCase()}]`;
				}
			}
		}
		// 2. Fall back to evaluating if it's printable standard ASCII data
		else if(byteVal >= 32 && byteVal <= 126)
		{
			interpretation = `; str: "${String.fromCharCode(byteVal)}"`;
		}
		// 3. Low level system padding or structural section formatting definitions
		else if(byteVal === 0x80 || byteVal === 0x82 || byteVal === 0x88 || byteVal === 0x00)
		{
			interpretation = "; sys: padding/leb128";
		}

		// Pad the hex byte out cleanly to match column grid gutters
		let rawHexColumn = `${hexByte}`.padEnd(6, ' ');
		outputLines.push(`${addrStr}:  ${rawHexColumn} ${interpretation}`);
		i++;
	}

	return outputLines.join("\n");
}

/**
 * Consolidated WebAssembly Binary Analysis & Side-by-Side Disassembly Suite
 * Fully optimized to handle streaming chunk truncations on large final production binaries.
 */
/**
 *
 * @param {Buffer} sampleBytes
 * @param {number} rowWidth
 * @param {number|null} viewportStart
 * @param {number|null} viewportLength
 * @param {number|null} codeStart
 * @param {number|null} codeLength
 * @param {number|null} dataStart
 * @param {number|null} dataLength
 * @returns
 */
export function renderWasmDisassembly(sampleBytes, rowWidth = 16, viewportStart = null, viewportLength = null, codeStart = null, codeLength = null, dataStart = null, dataLength = null)
{
	const isWasm = sampleBytes[0] === 0x00 && sampleBytes[1] === 0x61 && sampleBytes[2] === 0x73 && sampleBytes[3] === 0x6D;
	if(!isWasm)
	{
		return "Error: Targeted stream does not contain a valid WebAssembly magic header.";
	}

	let wasmVersion = 1;
	if(sampleBytes.length >= 8)
	{
		const view = new DataView(sampleBytes.buffer, sampleBytes.byteOffset, sampleBytes.byteLength);
		wasmVersion = view.getUint32(4, true);
	}

	// Initialize layout positions using passed presets or default floors
	let codeSectionStart = (codeStart !== null && codeStart !== undefined) ? codeStart : -1;
	let codeSectionLength = codeLength || 0;
	let dataSectionStart = (dataStart !== null && dataStart !== undefined) ? dataStart : -1;
	let dataSectionLength = dataLength || 0;

	// Structural metric registries
	let typeSignaturesCount = 0;
	let importedGlobalsCount = 0;
	let importedFunctionsCount = 0;
	let compiledFunctionsCount = 0;
	let exportedSymbolsCount = 0;
	let isRelocatableObject = false;

	// =========================================================================
	// STEP 1: SINGLE RESILIENT STRUCTURAL SCAN PASS
	// =========================================================================
	let ptr = 8;
	const totalBytes = sampleBytes.length;

	while(ptr < totalBytes)
	{
		if(ptr + 1 > totalBytes) break;
		const sectionId = sampleBytes[ptr];
		ptr += 1;

		const lengthDecode = decodeLEB128(sampleBytes, ptr);
		if(!lengthDecode || (ptr + lengthDecode.bytes) > totalBytes) break;

		const sectionLength = lengthDecode.value;
		ptr += lengthDecode.bytes;

		// CRITICAL: Register the section coordinates FIRST before checking chunk truncation boundaries!
		switch(sectionId)
		{
			case 0:
				const nameLenDec = decodeLEB128(sampleBytes, ptr);
				if(nameLenDec && (ptr + nameLenDec.bytes <= totalBytes))
				{
					let namePtr = ptr + nameLenDec.bytes;
					let sectionName = "";
					for(let i = 0; i < Math.min(nameLenDec.value, 12); i++)
					{
						if(namePtr + i < totalBytes) sectionName += String.fromCharCode(sampleBytes[namePtr + i]);
					}
					if(sectionName === "linking" || sectionName.startsWith("reloc."))
					{
						isRelocatableObject = true;
					}
				}
				break;
			case 1:
				typeSignaturesCount = sectionLength > 0 ? decodeLEB128(sampleBytes, ptr).value : 0;
				break;
			case 2:
				if(sectionLength > 0)
				{
					let impPtr = ptr;
					const impCountDec = decodeLEB128(sampleBytes, impPtr);
					if(impCountDec)
					{
						impPtr += impCountDec.bytes;
						for(let i = 0; i < impCountDec.value; i++)
						{
							if(impPtr >= totalBytes) break;
							const modLen = decodeLEB128(sampleBytes, impPtr); if(!modLen) break; impPtr += modLen.bytes + modLen.value;
							const fldLen = decodeLEB128(sampleBytes, impPtr); if(!fldLen) break; impPtr += fldLen.bytes + fldLen.value;
							if(impPtr >= totalBytes) break;
							const kind = sampleBytes[impPtr]; impPtr += 1;
							if(kind === 0x00) importedFunctionsCount++;
							else if(kind === 0x03) importedGlobalsCount++;
							else
							{
								const lim = decodeLEB128(sampleBytes, impPtr); if(lim) impPtr += lim.bytes;
								const init = decodeLEB128(sampleBytes, impPtr); if(init) impPtr += init.bytes;
							}
						}
					}
				}
				break;
			case 3:
				compiledFunctionsCount = sectionLength > 0 ? decodeLEB128(sampleBytes, ptr).value : 0;
				break;
			case 7:
				exportedSymbolsCount = sectionLength > 0 ? decodeLEB128(sampleBytes, ptr).value : 0;
				break;
			case 10: // CODE
				if(codeSectionStart === -1)
				{
					codeSectionStart = ptr;
					codeSectionLength = sectionLength;
				}
				break;
			case 11: // DATA
				if(dataSectionStart === -1)
				{
					dataSectionStart = ptr;
					dataSectionLength = sectionLength;
				}
				break;
		}

		// Safe leap checking: If this section trails past our current streaming window chunk,
		// we have already saved its coordinates, so we can cleanly break safely.
		const sectionEnd = ptr + sectionLength;
		if(sectionEnd > totalBytes)
		{
			break;
		}
		ptr = sectionEnd;
	}

	// =========================================================================
	// STEP 2: METADATA SUMMARY HEADER GENERATION
	// =========================================================================
	let outputBuffer = `WASM Executable Map Summary\n`;
	outputBuffer += `========================================================================\n`;
	outputBuffer += `Binary Profile:       WASM v${wasmVersion} (${isRelocatableObject ? "Relocatable Object File" : "Linked Executable Module"})\n`;
	outputBuffer += `Program Core Bounds:  Offset Address: 0x${codeSectionStart !== -1 ? codeSectionStart.toString(16).toUpperCase().padStart(4, '0') : "UNKNOWN"} (${codeSectionLength} raw payload bytes)\n`;
	outputBuffer += `Instruction Matrix:  ${compiledFunctionsCount} compiled structural function blocks context\n`;
	outputBuffer += `Import Assertions:   ${importedFunctionsCount} dynamic external calls, ${importedGlobalsCount} global memory offsets\n`;
	outputBuffer += `Export Accessors:    ${exportedSymbolsCount} mapped system interface entry gates\n`;
	outputBuffer += `========================================================================\n\n`;
	outputBuffer += `Side-by-Side Unified Hex & Instruction Disassembly Window:\n`;
	outputBuffer += `------------------------------------------------------------------------\n`;

	// =========================================================================
	// STEP 3: VIEWPORT LIMIT ALIGNMENTS
	// =========================================================================
	let startIdx = (viewportStart !== null) ? viewportStart : (codeSectionStart !== -1 ? codeSectionStart : 0);
	let calculatedLength = (viewportLength !== null) ? viewportLength : sampleBytes.length;
	let endIdx = Math.min(sampleBytes.length, startIdx + calculatedLength);

	startIdx = Math.floor(startIdx / rowWidth) * rowWidth;

	// =========================================================================
	// STEP 4: ADJUSTABLE MULTI-BYTE ROW PRINTING LOOP (PER-BYTE CONTEXT EVAL)
	// =========================================================================
	for(let rowAddr = startIdx; rowAddr < endIdx; rowAddr += rowWidth)
	{
		let chunkBytes = [];
		for(let offset = 0; offset < rowWidth; offset++)
		{
			if(rowAddr + offset < sampleBytes.length)
			{
				chunkBytes.push(sampleBytes[rowAddr + offset]);
			}
		}

		let addrLabel = `0x${rowAddr.toString(16).padStart(4, '0').toUpperCase()}`;
		let hexString = chunkBytes.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(" ");
		let paddedHexColumn = hexString.padEnd((rowWidth * 3) - 1, ' ');
		let asciiPreview = chunkBytes.map(b => (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.').join("");

		let rowInterpretations = [];
		let rowTypeTag = "META"; // Baseline line classification symbol
		let i = 0;

		while(i < chunkBytes.length)
		{
			let globalByteAddr = rowAddr + i;
			let byteVal = chunkBytes[i];

			const isByteInCode = (globalByteAddr >= codeSectionStart && globalByteAddr < (codeSectionStart + codeSectionLength));
			const isByteInData = (globalByteAddr >= dataSectionStart && globalByteAddr < (dataSectionStart + dataSectionLength));

			if(isByteInCode)
			{
				rowTypeTag = "ASM"; // Promote line tag classification if instructions are active
				if(WASM_OPCODES[byteVal] !== undefined)
				{
					let mnemonic = WASM_OPCODES[byteVal];
					if(byteVal === 0x41 || byteVal === 0x20 || byteVal === 0x21 || byteVal === 0x10)
					{
						if(i + 1 < chunkBytes.length)
						{
							mnemonic += ` 0x${chunkBytes[i + 1].toString(16).toUpperCase()}`;
							i += 1; // Step past consumed immediate parameter argument byte
						}
					}
					rowInterpretations.push(mnemonic);
				} else
				{
					rowInterpretations.push(`0x${byteVal.toString(16).toUpperCase()}`);
				}
			} else if(isByteInData)
			{
				if(rowTypeTag !== "ASM") rowTypeTag = "STR"; // Set data pool view tag classification
				rowInterpretations.push(byteVal >= 32 && byteVal <= 126 ? `"${String.fromCharCode(byteVal)}"` : '.');
			} else
			{
				let segmentLabel = "STRUCT";
				if(globalByteAddr < 8) segmentLabel = "HEADER";
				else if(globalByteAddr < codeSectionStart) segmentLabel = "META";
				else segmentLabel = "LINK";

				rowInterpretations.push(`${segmentLabel}:0x${byteVal.toString(16).toUpperCase()}`);
			}
			i++;
		}

		// Outputs a uniform layout block complete with symbol classification tags
		outputBuffer += `${addrLabel}:  ${paddedHexColumn} | ${asciiPreview} | ; ${rowTypeTag}: [ ${rowInterpretations.join(" -> ")} ]\n`;
	}

	return outputBuffer;
}
