
// @ts-check

/**
 *
 * @param {Buffer} sampleBytes
 * @param {Buffer} content
 * @param {string} filePath
 * @returns
 */
export function getQVMHeader(sampleBytes, content, filePath)
{



	// 1. Read QVM Header Magic Number (0x12721444 or 'qvm\x12')
	// Standard QVM headers start with Magic (4 bytes), Instruction Count (4 bytes),
	// Code Offset/Length (4), Data Offset/Length (4), Lit Offset/Length (4), BSS Length (4)
	const isQVM = sampleBytes[0] === 0x44 && sampleBytes[1] === 0x14 && sampleBytes[2] === 0x72 && sampleBytes[3] === 0x12;

	let infoStack = `QVM file detected (${content.length} bytes)\n`;
	infoStack += `========================================================================\n`;

	if(isQVM && sampleBytes.length >= 24)
	{
		// Parse 32-bit Little Endian integers from the QVM header metadata
		const view = new DataView(sampleBytes.buffer, sampleBytes.byteOffset, sampleBytes.byteLength);
		const instructionCount = view.getUint32(4, true);
		const codeLength = view.getUint32(8, true);
		const dataLength = view.getUint32(12, true);
		const litLength = view.getUint32(16, true);
		const bssLength = view.getUint32(20, true);

		// Render the compilation metadata block
		infoStack += `Output filename:      ${filePath}\n`;
		infoStack += `Compiler Sequence:    pass #1: define -> pass #2: compile -> pass #3: define -> pass #4: compile\n`;
		infoStack += `------------------------------------------------------------------------\n`;
		infoStack += `Code Segment size:    ${codeLength.toString().padEnd(10)} bytes\n`;
		infoStack += `Data Segment size:    ${dataLength.toString().padEnd(10)} bytes\n`;
		infoStack += `Lit Segment size:     ${litLength.toString().padEnd(10)} bytes\n`;
		infoStack += `BSS Segment size:     ${bssLength.toString().padEnd(10)} bytes (Uninitialized Data)\n`;
		infoStack += `Instruction Count:    ${instructionCount.toString().padEnd(10)}\n`;
		infoStack += `------------------------------------------------------------------------\n`;
		infoStack += `Status:               Successfully mapped binary targets.\n`;
	} else
	{
		infoStack += `Format:               Unknown Raw Binary Data\n`;
	}

	//const hexRows = hexDump(sampleBytes, content, filePath)

	return infoStack;
}


/**
 * Advanced QVM Binary Analysis & Disassembly Stream Suite
 * Parses Quake VM headers and produces an adjustable multi-byte side-by-side view.
 *
 * @param {Uint8Array} sampleBytes - Raw application binary array buffer workspace
 * @param {number} rowWidth - Display column byte grouping threshold (typically 8 or 16)
 * @param {import('./rosetta-types.d').DisassemblyOptions} options - Configuration parameters for windowing and overrides
 */
export function renderQvmDisassemblySuite(sampleBytes, rowWidth = 16, options = {})
{
	const globalOffset = options.globalOffset || 0;
	const syscallMap = options.syscallMap || {};

	// QVM Magic Identifiers
	const VM_MAGIC_VER1 = 0x12721444;
	const VM_MAGIC_VER2 = 0x12721445;

	// =========================================================================
	// QVM OPCODES DEFINITION MATRIX
	// =========================================================================
	/** @type {import('./rosetta-types.d').DisassemblyOpcodes[]} */
	const QVM_OPCODES = [
		{ name: 'UNDEF', argLen: 0, type: 'none' }, // 0
		{ name: 'IGNORE', argLen: 0, type: 'none' }, // 1
		{ name: 'BREAK', argLen: 0, type: 'none' }, // 2
		{ name: 'ENTER', argLen: 4, type: 'u4' }, // 3
		{ name: 'LEAVE', argLen: 4, type: 'u4' }, // 4
		{ name: 'CALL', argLen: 0, type: 'none' }, // 5
		{ name: 'PUSH', argLen: 0, type: 'none' }, // 6
		{ name: 'POP', argLen: 0, type: 'none' }, // 7
		{ name: 'CONST', argLen: 4, type: 'u4' }, // 8
		{ name: 'LOCAL', argLen: 4, type: 'u4' }, // 9
		{ name: 'JUMP', argLen: 0, type: 'none' }, // 10
		{ name: 'EQ', argLen: 4, type: 'i4' }, // 11
		{ name: 'NE', argLen: 4, type: 'i4' }, // 12
		{ name: 'LTI', argLen: 4, type: 'i4' }, // 13
		{ name: 'LEI', argLen: 4, type: 'i4' }, // 14
		{ name: 'GTI', argLen: 4, type: 'i4' }, // 15
		{ name: 'GEI', argLen: 4, type: 'i4' }, // 16
		{ name: 'LTU', argLen: 4, type: 'u4' }, // 17
		{ name: 'LEU', argLen: 4, type: 'u4' }, // 18
		{ name: 'GTU', argLen: 4, type: 'u4' }, // 19
		{ name: 'GEU', argLen: 4, type: 'u4' }, // 20
		{ name: 'EQF', argLen: 4, type: 'f4' }, // 21
		{ name: 'NEF', argLen: 4, type: 'f4' }, // 22
		{ name: 'LTF', argLen: 4, type: 'f4' }, // 23
		{ name: 'LEF', argLen: 4, type: 'f4' }, // 24
		{ name: 'GTF', argLen: 4, type: 'f4' }, // 25
		{ name: 'GEF', argLen: 4, type: 'f4' }, // 26
		{ name: 'LOAD1', argLen: 0, type: 'none' }, // 27
		{ name: 'LOAD2', argLen: 0, type: 'none' }, // 28
		{ name: 'LOAD4', argLen: 0, type: 'none' }, // 29
		{ name: 'STORE1', argLen: 0, type: 'none' }, // 30
		{ name: 'STORE2', argLen: 0, type: 'none' }, // 31
		{ name: 'STORE4', argLen: 0, type: 'none' }, // 32
		{ name: 'ARG', argLen: 1, type: 'u1' }, // 33
		{ name: 'BLOCK_COPY', argLen: 4, type: 'u4' }, // 34
		{ name: 'SEX8', argLen: 0, type: 'none' }, // 35
		{ name: 'SEX16', argLen: 0, type: 'none' }, // 36
		{ name: 'NEGI', argLen: 0, type: 'none' }, // 37
		{ name: 'ADD', argLen: 0, type: 'none' }, // 38
		{ name: 'SUB', argLen: 0, type: 'none' }, // 39
		{ name: 'DIVI', argLen: 0, type: 'none' }, // 40
		{ name: 'DIVU', argLen: 0, type: 'none' }, // 41
		{ name: 'MODI', argLen: 0, type: 'none' }, // 42
		{ name: 'MODU', argLen: 0, type: 'none' }, // 43
		{ name: 'MULI', argLen: 0, type: 'none' }, // 44
		{ name: 'MULU', argLen: 0, type: 'none' }, // 45
		{ name: 'BAND', argLen: 0, type: 'none' }, // 46
		{ name: 'BOR', argLen: 0, type: 'none' }, // 47
		{ name: 'BXOR', argLen: 0, type: 'none' }, // 48
		{ name: 'BCOM', argLen: 0, type: 'none' }, // 49
		{ name: 'LSH', argLen: 0, type: 'none' }, // 50
		{ name: 'RSHI', argLen: 0, type: 'none' }, // 51
		{ name: 'RSHU', argLen: 0, type: 'none' }, // 52
		{ name: 'NEGF', argLen: 0, type: 'none' }, // 53
		{ name: 'ADDF', argLen: 0, type: 'none' }, // 54
		{ name: 'SUBF', argLen: 0, type: 'none' }, // 55
		{ name: 'DIVF', argLen: 0, type: 'none' }, // 56
		{ name: 'MULF', argLen: 0, type: 'none' }, // 57
		{ name: 'CVIF', argLen: 0, type: 'none' }, // 58
		{ name: 'CVFI', argLen: 0, type: 'none' }  // 59
	];

	if(sampleBytes.length < 32)
	{
		return "Error: Invalid QVM stream layout structure (Size payload bounds too small).";
	}

	// Binary Little-Endian Reader Primitives
	const view = new DataView(sampleBytes.buffer, sampleBytes.byteOffset, sampleBytes.byteLength);
	/** @param {number} offset */
	const readU1 = (offset) => sampleBytes[offset];
	/** @param {number} offset */
	const readU4 = (offset) => view.getUint32(offset, true);
	/** @param {number} offset */
	const readI4 = (offset) => view.getInt32(offset, true);
	/** @param {number} offset */
	const readF4 = (offset) => view.getFloat32(offset, true);

	// =========================================================================
	// STEP 1: PARSE THE QVM COMPILATION HEADER
	// =========================================================================
	/** @type {import('./rosetta-types.d').DisassemblyHeader} */
	const header = {
		magic: readU4(0),
		instructionCount: readU4(4),
		codeOffset: readU4(8),
		codeLength: readU4(12),
		dataOffset: readU4(16),
		dataLength: readU4(24), // Fixed offset error tracking out of standard build
		litLength: readU4(24),
		bssLength: readU4(28)
	};
	header.jtrgLength = (header.magic === VM_MAGIC_VER2) ? readU4(32) : 0;

	if(header.magic !== VM_MAGIC_VER1 && header.magic !== VM_MAGIC_VER2)
	{
		return `Error: Stream target does not contain a verified QVM specification signature (Got: 0x${header.magic.toString(16)}).`;
	}

	// Establish boundaries across linear runtime space mapping coordinates
	const codeStart = header.codeOffset;
	const codeEnd = codeStart + header.codeLength;
	const dataStart = header.dataOffset;
	const dataEnd = dataStart + header.dataLength;
	const litStart = dataEnd;
	const litEnd = litStart + header.litLength;

	// =========================================================================
	// STEP 2: GENERATE THE INSTRUCTION POINTER AND PROCEDURE DICTIONARY TRACKING
	// =========================================================================
	// Maps file absolute bytecode indices straight to clean Instruction Labels
	let instructionPointers = [];
	/** @type {Record<number, string>} */
	let procedureNamesMap = {}; // Key: Code Address Index -> Value: Sub-string label

	let pc = codeStart;
	while(pc < codeEnd && pc < sampleBytes.length)
	{
		instructionPointers.push(pc);
		let opcode = readU1(pc);
		if(opcode < QVM_OPCODES.length)
		{
			pc += QVM_OPCODES[opcode].argLen;
		}
		pc += 1;
	}

	// Trace procedures using standard entry tracking markers (Opcode 3: ENTER)
	for(let idx = 0; idx < instructionPointers.length; idx++)
	{
		let fileOffset = instructionPointers[idx];
		if(readU1(fileOffset) === 3)
		{ // ENTER
			procedureNamesMap[fileOffset] = `sub_${fileOffset.toString(16).toUpperCase().padStart(8, '0')}`;
		}
	}

	// =========================================================================
	// STEP 3: CONSTRUCT TELEMETRY INFRASTRUCTURE HEADER
	// =========================================================================
	let outputBuffer = `QVM Quake Virtual Machine Map Blueprint Summary\n`;
	outputBuffer += `========================================================================\n`;
	outputBuffer += `Binary Profile:       QVM v${header.magic === VM_MAGIC_VER2 ? '2' : '1'} (Quake III Compilation Segment)\n`;
	outputBuffer += `Program Core Bounds:  Offset Address: 0x${codeStart.toString(16).toUpperCase().padStart(4, '0')} (${header.codeLength} instruction bytes)\n`;
	outputBuffer += `Instruction Matrix:  ${header.instructionCount} structural program counter operations records\n`;
	outputBuffer += `Data Pool Bounds:     Linear Table Base: 0x${dataStart.toString(16).toUpperCase().padStart(4, '0')} (Data: ${header.dataLength} bytes, Literals: ${header.litLength} bytes)\n`;
	outputBuffer += `BSS Memory Segment:   Dynamic Uninitialized Allocation Pool: ${header.bssLength} bytes\n`;
	outputBuffer += `========================================================================\n\n`;
	outputBuffer += `Side-by-Side Unified Hex & Instruction Disassembly Window:\n`;
	outputBuffer += `------------------------------------------------------------------------\n`;

	// Initialize Viewport Windows
	let viewStart = (options.viewportStart !== null && options.viewportStart !== undefined) ? options.viewportStart : codeStart;
	let viewLength = options.viewportLength || 512;
	let endIdx = Math.min(sampleBytes.length, viewStart + viewLength);

	// Grid baseline synchronization
	viewStart = Math.floor(viewStart / rowWidth) * rowWidth;

	// =========================================================================
	// STEP 4: ADJUSTABLE MULTI-BYTE ROW PRINTING LOOP
	// =========================================================================
	for(let rowAddr = viewStart; rowAddr < endIdx; rowAddr += rowWidth)
	{
		let chunkBytes = [];
		for(let offset = 0; offset < rowWidth; offset++)
		{
			if(rowAddr + offset < sampleBytes.length)
			{
				chunkBytes.push(sampleBytes[rowAddr + offset]);
			}
		}

		let trueGlobalAddress = globalOffset + rowAddr;
		let addrLabel = `0x${trueGlobalAddress.toString(16).padStart(4, '0').toUpperCase()}`;

		let hexString = chunkBytes.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(" ");
		let paddedHexColumn = hexString.padEnd((rowWidth * 3) - 1, ' ');
		let asciiPreview = chunkBytes.map(b => (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.').join("");

		let annotation = "";

		// Check active layout target ranges
		const isRowInCode = (trueGlobalAddress >= codeStart && trueGlobalAddress < codeEnd);
		const isRowInLit = (trueGlobalAddress >= litStart && trueGlobalAddress < litEnd);

		if(isRowInCode)
		{
			let rowInstructions = [];
			let i = 0;

			while(i < chunkBytes.length)
			{
				let currentByteOffset = trueGlobalAddress + i;

				// Keep lookahead tracking synchronized cleanly with our compiled instruction registry pointer bounds
				if(!instructionPointers.includes(currentByteOffset))
				{
					i++;
					continue;
				}

				let opcode = chunkBytes[i];
				if(opcode < QVM_OPCODES.length)
				{
					let definition = QVM_OPCODES[opcode];
					let mnemonic = definition.name;
					let argumentText = "";

					// Decode active parameter blocks inside this row chunk window frame
					if(definition.argLen > 0 && (i + definition.argLen < chunkBytes.length))
					{
						let argFileOffset = currentByteOffset + 1;
						let rawArgValue = 0;

						if(definition.type === 'u4') rawArgValue = readU4(argFileOffset);
						else if(definition.type === 'i4') rawArgValue = readI4(argFileOffset);
						else if(definition.type === 'f4') rawArgValue = readF4(argFileOffset);
						else if(definition.type === 'u1') rawArgValue = readU1(argFileOffset);

						argumentText = ` 0x${rawArgValue.toString(16).toUpperCase()}`;

						// ─── RUNTIME CONTEXT RESOLUTION ───
						// Lookahead Evaluation A: If CONST instruction is tied to an exit CALL
						if(opcode === 8)
						{
							let nextInstructionOffset = currentByteOffset + 5;
							if(nextInstructionOffset < sampleBytes.length && readU1(nextInstructionOffset) === 5)
							{
								if(rawArgValue > 0x7FFFFFFF)
								{
									// Signed two's complement interpretation mapping to trap syscall boundaries
									let syscallNum = view.getInt32(argFileOffset, true);
									let callName = syscallMap[syscallNum] || `unknown_syscall_${syscallNum}`;
									argumentText += ` [${callName}]`;
								} else if(procedureNamesMap[rawArgValue])
								{
									argumentText += ` [${procedureNamesMap[rawArgValue]}]`;
								}
							}
							// Lookahead Evaluation B: Evaluate reference targets crossing inside our literal tables
							else if(rawArgValue >= header.dataLength && rawArgValue < (header.dataLength + header.litLength))
							{
								let literalStringOffset = rawArgValue - header.dataLength;
								let stringBuffer = [];
								for(let sIdx = literalStringOffset; sIdx < header.litLength; sIdx++)
								{
									let charByte = sampleBytes[litStart + sIdx];
									if(charByte === 0) break;
									stringBuffer.push(String.fromCharCode(charByte));
								}
								if(stringBuffer.length > 0)
								{
									argumentText += ` ["${stringBuffer.join("")}"]`;
								}
							}
						}

						i += definition.argLen; // Shift pointer path past structural parameter registers
					}

					// Append entry labels inside instruction view streams automatically
					if(procedureNamesMap[currentByteOffset])
					{
						mnemonic = `\n${procedureNamesMap[currentByteOffset]}:\n              ${mnemonic}`;
					}

					rowInstructions.push(`${mnemonic}${argumentText}`);
				} else
				{
					rowInstructions.push(`ILLEGAL_0x${opcode.toString(16).toUpperCase()}`);
				}
				i++;
			}
			annotation = `ASM: ${rowInstructions.join(" -> ")}`;
		}
		else if(isRowInLit)
		{
			annotation = `STR-LIT: "${asciiPreview.replace(/\.+/g, ' ').trim()}"`;
		}
		else
		{
			let layoutTag = "STRUCT";
			if(trueGlobalAddress === 0) layoutTag = "HEADER";
			else if(trueGlobalAddress >= dataStart && trueGlobalAddress < dataEnd) layoutTag = "DATA-SEG";

			annotation = `${layoutTag}: [ ${asciiPreview} ]`;
		}

		outputBuffer += `${addrLabel}:  ${paddedHexColumn} | ${asciiPreview} | ; ${annotation}\n`;
	}

	return outputBuffer;
}
