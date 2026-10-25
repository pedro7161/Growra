import { existsSync } from 'fs';
import { COMPANIONS } from '../src/utils/companions';
import { getPetImage } from '../src/constants/petImages';

describe('companion art', () => {
  it('every companion, Lumen included, has its three growth stages on disk', () => {
    for (const { templateId } of COMPANIONS) {
      for (const stage of ['base', 'evo1', 'evo2', 'variants/default']) {
        expect(existsSync(`assets/pets/${templateId}/${stage}.png`)).toBe(true);
      }
    }
  });
});

describe('seasonal companion art', () => {
  const october = new Date(2026, 9, 15).getTime();
  const december = new Date(2026, 11, 15).getTime();
  const june = new Date(2026, 5, 15).getTime();
  const hatted = COMPANIONS.map(({ templateId }) => templateId).filter((id) => id !== 'gloam' && id !== 'holly');

  it('every companion but Gloam and Holly has its Halloween hat art on disk', () => {
    for (const templateId of hatted) {
      for (const stage of ['base', 'evo1', 'evo2']) {
        expect(existsSync(`assets/seasonal/halloween/pets/${templateId}/${stage}.png`)).toBe(true);
      }
    }
  });

  it('shows the hatted art during Halloween and the normal art otherwise', () => {
    expect(getPetImage('astra', 1, 'default', october)).toBe('assets/seasonal/halloween/pets/astra/evo1.png');
    expect(getPetImage('astra', 1, 'default', june)).toBe('assets/pets/astra/evo1.png');
    expect(getPetImage('gloam', 0, 'default', october)).toBe('assets/pets/gloam/base.png');
  });

  it('keeps the normal art at Christmas until its hats are drawn', () => {
    expect(getPetImage('astra', 2, 'default', december)).toBe('assets/pets/astra/evo2.png');
  });
});
