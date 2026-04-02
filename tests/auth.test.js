require("dotenv").config();

const mongoose = require("mongoose");
const request = require("supertest");
const app = require("../src/app");

jest.setTimeout(15000); // ⏱️ prevent timeout

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("Auth API", () => {
  it("should login successfully", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "admin@finance.dev",
        password: "admin123",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});