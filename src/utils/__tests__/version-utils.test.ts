import { normalizeVersion, denormalizeVersion } from '../version-utils.js';

describe('Version Utils', () => {
  describe('normalizeVersion', () => {
    it('should normalize basic versions', () => {
      expect(normalizeVersion('0.7.11')).toBe('00000.00007.00011');
      expect(normalizeVersion('0.7.7')).toBe('00000.00007.00007');
      expect(normalizeVersion('1.0.0')).toBe('00001.00000.00000');
      expect(normalizeVersion('12.345.6789')).toBe('00012.00345.06789');
    });

    it('should reject version with v prefix', () => {
      expect(normalizeVersion('v0.7.11')).toBe(null);
      expect(normalizeVersion('V1.2.3')).toBe(null);
    });

    it('should reject incomplete versions', () => {
      expect(normalizeVersion('0.7')).toBe(null);
      expect(normalizeVersion('1')).toBe(null);
    });

    it('should handle null/undefined', () => {
      expect(normalizeVersion(null)).toBe(null);
      expect(normalizeVersion(undefined)).toBe(null);
      expect(normalizeVersion('')).toBe(null);
    });

    it('should ensure correct ordering', () => {
      const v1 = normalizeVersion('0.7.7')!;
      const v2 = normalizeVersion('0.7.11')!;
      expect(v1 < v2).toBe(true);
      expect(v1).toBe('00000.00007.00007');
      expect(v2).toBe('00000.00007.00011');
    });
  });

  describe('denormalizeVersion', () => {
    it('should denormalize versions', () => {
      expect(denormalizeVersion('00000.00007.00011')).toBe('0.7.11');
      expect(denormalizeVersion('00001.00000.00000')).toBe('1.0.0');
      expect(denormalizeVersion('00012.00345.06789')).toBe('12.345.6789');
    });

    it('should handle null/undefined', () => {
      expect(denormalizeVersion(null)).toBe(null);
      expect(denormalizeVersion(undefined)).toBe(null);
    });

    it('should handle non-normalized input gracefully', () => {
      expect(denormalizeVersion('0.7.11')).toBe('0.7.11');
      expect(denormalizeVersion('invalid')).toBe('invalid');
    });
  });

  describe('round-trip conversion', () => {
    it('should maintain version through normalize/denormalize', () => {
      const versions = ['0.7.11', '1.0.0', '999.999.999', '0.0.1'];
      
      versions.forEach(version => {
        const normalized = normalizeVersion(version);
        const denormalized = denormalizeVersion(normalized);
        expect(denormalized).toBe(version);
      });
    });

    it('should reject versions exceeding max value', () => {
      expect(normalizeVersion('100000.0.0')).toBe(null);
      expect(normalizeVersion('0.100000.0')).toBe(null);
      expect(normalizeVersion('0.0.100000')).toBe(null);
    });

    it('should handle max valid version', () => {
      expect(normalizeVersion('99999.99999.99999')).toBe('99999.99999.99999');
    });
  });
});