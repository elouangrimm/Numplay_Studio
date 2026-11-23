#!/usr/bin/env node
'use strict';

function fnv(bytes, length) {
  let value = 2166136261;
  for (let i = 0; i < length; i++)
    value = Math.imul(value ^ bytes[i], 16777619) >>> 0;
  return value;
}

function layout(version) {
  if (version === 1) return { size: 1552, checksum: 1544 };
  if (version === 2) return { size: 1680, checksum: 1676 };
  if (version === 3) return { size: 1688, checksum: 1684 };
  throw new Error('Unsupported Celeste save version');
}

function makeSave(version) {
  const spec = layout(version);
  const bytes = new Uint8Array(spec.size);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, 0x43454c53, true);
  view.setUint16(4, version, true);
  view.setUint16(6, spec.size, true);
  view.setUint32(1076, 42, true);
  view.setUint32(1080, 7, true);
  view.setUint32(1096, 3660, true);
  view.setUint32(spec.checksum, fnv(bytes, spec.checksum), true);
  return bytes;
}

for (const version of [1, 2, 3]) {
  const bytes = makeSave(version);
  const spec = layout(version);
  const view = new DataView(bytes.buffer);
  if (bytes.length !== spec.size) throw new Error(`v${version}: wrong save size`);
  if (view.getUint32(0, true) !== 0x43454c53) throw new Error(`v${version}: wrong magic`);
  if (view.getUint16(4, true) !== version) throw new Error(`v${version}: wrong version`);
  if (view.getUint16(6, true) !== spec.size) throw new Error(`v${version}: wrong size field`);
  if (view.getUint32(spec.checksum, true) !== fnv(bytes, spec.checksum))
    throw new Error(`v${version}: wrong checksum`);
  if (view.getUint32(1076, true) !== 42)
    throw new Error(`v${version}: total deaths offset changed`);
  if (view.getUint32(1080, true) !== 7)
    throw new Error(`v${version}: golden strawberries offset changed`);
  if (view.getUint32(1096, true) !== 3660)
    throw new Error(`v${version}: play time offset changed`);
}

console.log('Celeste save layouts v1/v2/v3 passed');
