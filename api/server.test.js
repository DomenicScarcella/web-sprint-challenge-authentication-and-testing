const request = require("supertest");
const db = require("../data/dbConfig.js");
const server = require("./server.js");

beforeAll(async () => {
  await db.migrate.rollback();
  await db.migrate.latest();
});
beforeEach(async () => {
  await db("jokes").truncate();
});
afterAll(async () => {
  await db.destroy();
});

const mockuser = { username: 'Frodo', password: 'Sam' };

// Write your tests here
test('sanity', () => {
  expect(false).toBe(false);
});

// api/jokes endpoint
describe('[GET] jokes', () => {
  test('1. responds with 200 ok', async () => {
    const res = await request(server).get("/api/jokes");
    expect(res.status).toBe(200);
  });

  test('2. responds with object', async () => {
    const res = await request(server).get("/api/jokes");
    expect(res.body[0]).toMatchObject({ id: '0189hNRf2g', joke: `I'm tired of following my dreams. I'm just going to ask them where they are going and meet up with them later.` });
  });
});

// api/auth/register endpoint
describe('Add user', () => {
  test('3. adds user', async () => {
    let res;
    res = await (await request(server).post('/api/auth/register')).send(mockuser);
    expect(res.body).toMatchObject({id: 1, ...mockuser});
  });
});

// api/auth/login endpoint
describe('Login user', () => {
  test('4. logs in user', async () => {
    let res;
    res = await (await request(server).post('/api/auth/login')).send(mockuser);
    expect(res.body).toMatchObject({id: 1, ...mockuser});
  });
});

