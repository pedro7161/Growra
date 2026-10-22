import { existsSync } from 'fs';
import { COMPANIONS } from '../src/utils/companions';

describe('companion art', () => {
  it('every companion, Lumen included, has its three growth stages on disk', () => {
    for (const { templateId } of COMPANIONS) {
      for (const stage of ['base', 'evo1', 'evo2', 'variants/default']) {
        expect(existsSync(`assets/pets/${templateId}/${stage}.png`)).toBe(true);
      }
    }
  });
});
