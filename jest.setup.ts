// Optional: configure or set up a testing framework before each test.
import { server } from "@/mocks/server";
import "@testing-library/jest-dom";

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
