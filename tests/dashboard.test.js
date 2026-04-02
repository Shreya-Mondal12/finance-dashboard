require("dotenv").config();

const mongoose = require("mongoose");
const request = require("supertest");
const app = require("../src/app");

jest.setTimeout(20000); // increase timeout

let token;

beforeAll(async () => {
  // ✅ connect DB first
  await mongoose.connect(process.env.MONGO_URI);

  // ✅ login
  const res = await request(app)
    .post("/api/auth/login")
    .send({
      email: "admin@finance.dev",
      password: "admin123",
    });

  // 🔥 IMPORTANT: check token exists
  token = res.body?.data?.token;

  if (!token) {
    throw new Error("Token not received in test");
  }
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("Dashboard API", () => {
  it("should fetch summary", async () => {
    const res = await request(app)
      .get("/api/dashboard/summary")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
  });
});