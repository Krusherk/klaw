import { describe, expect, it } from "vitest";

import {
  isValidSolanaWallet,
  isValidXStatusUrl,
  storyListQuerySchema,
  xUsernameSchema,
} from "@/lib/validators";

describe("validators", () => {
  it("normalizes x username", () => {
    const value = xUsernameSchema.parse("@Example_Name");
    expect(value).toBe("example_name");
  });

  it("rejects invalid x username", () => {
    expect(() => xUsernameSchema.parse("bad-name!"))
      .toThrowError();
  });

  it("accepts valid status url", () => {
    expect(isValidXStatusUrl("https://x.com/example/status/1234567890")).toBe(true);
    expect(isValidXStatusUrl("https://twitter.com/example/status/1234567890")).toBe(true);
  });

  it("rejects invalid status url", () => {
    expect(isValidXStatusUrl("https://x.com/example/likes")).toBe(false);
    expect(isValidXStatusUrl("https://example.com/example/status/1234567890")).toBe(false);
  });

  it("validates solana wallet", () => {
    expect(isValidSolanaWallet("11111111111111111111111111111111")).toBe(true);
    expect(isValidSolanaWallet("not-a-wallet")).toBe(false);
  });

  it("applies query defaults", () => {
    const parsed = storyListQuerySchema.parse({});
    expect(parsed.status).toBe("all");
    expect(parsed.page).toBe(1);
    expect(parsed.pageSize).toBe(20);
  });
});
