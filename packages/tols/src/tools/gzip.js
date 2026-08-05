import * as core from '../core/gzip.js';

export default {
  name: 'gzip',
  aliases: ['gz'],
  defaultAction: 'comp',
  actions: {
    comp: {
      description: 'gzip text, print base64 of the compressed bytes (--json adds sizes/ratio)',
      run: async (input) => {
        const bytes = await core.gzip(input);
        const b64 = core.bytesToBase64(bytes);
        const originalBytes = new TextEncoder().encode(input).length;
        return {
          text: b64,
          json: {
            base64: b64,
            originalBytes,
            compressedBytes: bytes.length,
            ratio: core.ratio(originalBytes, bytes.length),
          },
        };
      },
    },
    decomp: {
      description: 'decompress base64-encoded gzip data to text',
      run: async (input) => {
        const bytes = await core.gunzip(core.base64ToBytes(input));
        return core.toText(bytes);
      },
    },
  },
};
