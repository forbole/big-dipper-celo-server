import assert from 'assert';

describe('bd-celo', () => {
  it('package.json has correct name', async () => {
    const { name } = await import('../package.json');
    assert.strictEqual(name, 'bd-celo');
  });

  if (Meteor.isClient) {
    it('client is not server', () => {
      assert.strictEqual(Meteor.isServer, false);
    });
  }

  if (Meteor.isServer) {
    it('server is not client', () => {
      assert.strictEqual(Meteor.isClient, false);
    });
  }
});
