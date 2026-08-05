import { describe, it, expect } from 'vitest';
import * as duri from '../../src/core/datauri.js';

describe('datauri core', () => {
  it('bytes -> data URI -> bytes round-trip', () => {
    const bytes = new Uint8Array([0, 137, 80, 78, 71, 255]);
    const uri = duri.bytesToDataUri(bytes, 'image/png');
    expect(uri.startsWith('data:image/png;base64,')).toBe(true);
    const parsed = duri.parseDataUri(uri);
    expect(parsed.mime).toBe('image/png');
    expect(parsed.encoding).toBe('base64');
    expect(parsed.bytes).toEqual(bytes);
  });

  it('parses percent-encoded payloads', () => {
    const parsed = duri.parseDataUri('data:text/plain,hello%20world');
    expect(parsed.mime).toBe('text/plain');
    expect(new TextDecoder().decode(parsed.bytes)).toBe('hello world');
  });

  it('empty mime defaults to text/plain for plain payloads', () => {
    expect(duri.parseDataUri('data:,abc').mime).toBe('text/plain');
  });

  it('rejects non-data URIs', () => {
    expect(() => duri.parseDataUri('https://example.com')).toThrow('Invalid data URI');
  });

  it('rejects bad base64 payload', () => {
    expect(() => duri.parseDataUri('data:image/png;base64,!!!')).toThrow('Invalid base64 payload');
  });

  it('infers mime from extension (web map)', () => {
    expect(duri.inferMimeType('photo.JPG')).toBe('image/jpeg');
    expect(duri.inferMimeType('icon.svg')).toBe('image/svg+xml');
    expect(duri.inferMimeType('data.json')).toBe('application/json');
    expect(duri.inferMimeType('weird.zzz')).toBe('application/octet-stream');
    expect(duri.inferMimeType('noext')).toBe('application/octet-stream');
  });
});
