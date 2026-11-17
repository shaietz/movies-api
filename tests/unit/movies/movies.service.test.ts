describe('moviesService (unit)', () => {
  describe('search', () => {
    it.todo('builds a case-insensitive partial-match filter from q');
    it.todo('builds a year range filter from yearFrom/yearTo');
    it.todo('filters by minRating on ratingAverage');
    it.todo('applies sort, skip and limit from the query');
  });

  describe('create', () => {
    it.todo('stores createdBy = the admin id');
  });

  describe('remove', () => {
    it.todo('throws 404 when the movie does not exist');
    it.todo('deletes the reviews of the movie');
  });
});
