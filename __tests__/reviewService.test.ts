jest.mock('expo-store-review', () => ({ hasAction: jest.fn(async () => true), requestReview: jest.fn(async () => undefined) }));
import { reachedCamp } from '../src/services/reviewService';

describe('reachedCamp', () => {
  it('is true only on the completion that reaches a 7th active day', () => {
    expect(reachedCamp(6, 7)).toBe(true);
    expect(reachedCamp(13, 14)).toBe(true);
    expect(reachedCamp(7, 7)).toBe(false);
    expect(reachedCamp(5, 6)).toBe(false);
    expect(reachedCamp(0, 0)).toBe(false);
  });
});
