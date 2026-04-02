require("dotenv").config();
jest.setTimeout(20000);

const request = require("supertest");
const app = require("../src/app");
jest.setTimeout(10000);
describe("Transaction API", () => {
  it("should fail without token", async () => {
    const res = await request(app)
      .get("/api/transactions");

    expect(res.statusCode).toBe(401); // auth middleware
  });
});