// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

export function getAsciiString(view: DataView, byteOffset: number, byteLength: number, encoding?: string) {
  const result = readStringASCII(view, byteOffset, byteLength);

  return result.str;
}

export function readStringASCII(buf: DataView, byteOffset: number, bytesToRead: number) {
  var str = "";
  var byteLength = 0;
  byteOffset = byteOffset || 0;
  var nullTerm = false;

  if (typeof bytesToRead === "undefined") {
    nullTerm = true;
    bytesToRead = buf.byteLength - buf.byteOffset;
  }

  var charCode;

  for (var i = 0; i < bytesToRead; i++) {
    charCode = buf.getUint8(i + byteOffset);
    if (charCode === 0 && nullTerm) {
      break;
    }

    str += String.fromCharCode(charCode);
    byteLength++;
  }

  return {
    str: str,
    byteLength: byteLength + (nullTerm ? 1 : 0),
  };
}

export function getAsciiStringFromUint8Array(bytes: Uint8Array) {
  let str = "";

  for (let i = 0; i < bytes.length; i++) {
    str += String.fromCharCode(bytes[i]);
  }

  return str;
}
