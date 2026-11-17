describe('usersService (unit)', () => {
  describe('updateRole', () => {
    it.todo('throws 404 when the user does not exist');
    it.todo('throws 400 when an admin tries to demote themselves');
  });

  describe('remove', () => {
    it.todo('throws 400 when an admin tries to delete themselves');
    it.todo("deletes the user's reviews and recalculates affected movies");
  });
});
