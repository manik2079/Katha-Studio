const encoder = new TextEncoder();

function makeCrcTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c >>> 0;
  }
  return table;
}

const CRC_TABLE = makeCrcTable();

function crc32(bytes) {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function toUint8Array(input) {
  if (input instanceof Uint8Array) return input;
  if (input instanceof ArrayBuffer) return new Uint8Array(input);
  if (input instanceof Blob) {
    throw new Error("Blob inputs must be converted asynchronously before zipping.");
  }
  return encoder.encode(String(input));
}

function writeUInt16LE(view, offset, value) {
  view.setUint16(offset, value, true);
}

function writeUInt32LE(view, offset, value) {
  view.setUint32(offset, value, true);
}

function concatUint8Arrays(chunks) {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const output = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.length;
  }
  return output;
}

export async function createZipBlob(files) {
  const prepared = [];
  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const rawData =
      file.data instanceof Blob
        ? new Uint8Array(await file.data.arrayBuffer())
        : toUint8Array(file.data);
    prepared.push({
      name: file.name,
      nameBytes,
      data: rawData,
      crc: crc32(rawData),
    });
  }

  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const file of prepared) {
    const localHeader = new Uint8Array(30 + file.nameBytes.length);
    const localView = new DataView(localHeader.buffer);
    writeUInt32LE(localView, 0, 0x04034b50);
    writeUInt16LE(localView, 4, 20);
    writeUInt16LE(localView, 6, 0);
    writeUInt16LE(localView, 8, 0);
    writeUInt16LE(localView, 10, 0);
    writeUInt16LE(localView, 12, 0);
    writeUInt32LE(localView, 14, file.crc);
    writeUInt32LE(localView, 18, file.data.length);
    writeUInt32LE(localView, 22, file.data.length);
    writeUInt16LE(localView, 26, file.nameBytes.length);
    writeUInt16LE(localView, 28, 0);
    localHeader.set(file.nameBytes, 30);

    const centralHeader = new Uint8Array(46 + file.nameBytes.length);
    const centralView = new DataView(centralHeader.buffer);
    writeUInt32LE(centralView, 0, 0x02014b50);
    writeUInt16LE(centralView, 4, 20);
    writeUInt16LE(centralView, 6, 20);
    writeUInt16LE(centralView, 8, 0);
    writeUInt16LE(centralView, 10, 0);
    writeUInt16LE(centralView, 12, 0);
    writeUInt16LE(centralView, 14, 0);
    writeUInt32LE(centralView, 16, file.crc);
    writeUInt32LE(centralView, 20, file.data.length);
    writeUInt32LE(centralView, 24, file.data.length);
    writeUInt16LE(centralView, 28, file.nameBytes.length);
    writeUInt16LE(centralView, 30, 0);
    writeUInt16LE(centralView, 32, 0);
    writeUInt16LE(centralView, 34, 0);
    writeUInt16LE(centralView, 36, 0);
    writeUInt32LE(centralView, 38, 0);
    writeUInt32LE(centralView, 42, offset);
    centralHeader.set(file.nameBytes, 46);

    localParts.push(localHeader, file.data);
    centralParts.push(centralHeader);
    offset += localHeader.length + file.data.length;
  }

  const centralDirectory = concatUint8Arrays(centralParts);
  const endRecord = new Uint8Array(22);
  const endView = new DataView(endRecord.buffer);
  writeUInt32LE(endView, 0, 0x06054b50);
  writeUInt16LE(endView, 4, 0);
  writeUInt16LE(endView, 6, 0);
  writeUInt16LE(endView, 8, prepared.length);
  writeUInt16LE(endView, 10, prepared.length);
  writeUInt32LE(endView, 12, centralDirectory.length);
  writeUInt32LE(endView, 16, offset);
  writeUInt16LE(endView, 20, 0);

  const zipBytes = concatUint8Arrays([...localParts, centralDirectory, endRecord]);
  return new Blob([zipBytes], { type: "application/zip" });
}
