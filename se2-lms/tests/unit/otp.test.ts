import { describe, it, expect } from "vitest";
import { generateOtp, hashOtp } from "@/lib/auth/common";
import crypto from "crypto";

describe("generateOtp", () => {
  it("always returns a 6-digit zero-padded string", () => {
    for (let i = 0; i < 200; i++) {
      const code = generateOtp();
      expect(code).toMatch(/^\d{6}$/);
    }
  });
});

describe("hashOtp", () => {
  it("matches sha256 hex", () => {
    expect(hashOtp("123456")).toBe(crypto.createHash("sha256").update("123456").digest("hex"));
  });
});
