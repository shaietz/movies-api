import { calculateRatingStats } from '../../../src/modules/reviews/reviews.service';

describe('calculateRatingStats', () => {
  it('returns { ratingAverage: 0, reviewCount: 0 } for no ratings', () => {
    expect(calculateRatingStats([])).toEqual({ ratingAverage: 0, reviewCount: 0 });
  });

  it('returns the single rating for one review', () => {
    expect(calculateRatingStats([8])).toEqual({ ratingAverage: 8, reviewCount: 1 });
  });

  it('averages several ratings', () => {
    expect(calculateRatingStats([6, 8, 10])).toEqual({ ratingAverage: 8, reviewCount: 3 });
  });

  it('rounds the average to one decimal (e.g. [7, 8, 8] -> 7.7)', () => {
    expect(calculateRatingStats([7, 8, 8])).toEqual({ ratingAverage: 7.7, reviewCount: 3 });
  });

  it('rounds halves up (e.g. [1, 10] -> 5.5, [7, 8, 8, 8] -> 7.8)', () => {
    expect(calculateRatingStats([1, 10]).ratingAverage).toBe(5.5);
    expect(calculateRatingStats([7, 8, 8, 8]).ratingAverage).toBe(7.8);
  });
});
