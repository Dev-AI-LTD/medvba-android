/**
 * Verifies hosted/social/email session exchange calls the backend bridge route.
 */

jest.mock("@/lib/api-base-url", () => ({
  getApiBaseUrl: () => "http://api.test",
}));

import {
  exchangeEmailPasswordSession,
  exchangeKindeAccessToken,
  registerEmailPasswordSession,
} from "@/lib/exchange-medvba-session";

describe("exchange-medvba-session (identity token)", () => {
  const fetchMock = global.fetch as jest.Mock;

  beforeEach(() => {
    fetchMock.mockReset();
  });

  it("POST /api/auth/session with Bearer for identity access token", async () => {
    const body = JSON.stringify({
      access_token: "jwt-idp",
      profile_id: "00000000-0000-4000-8000-000000000002",
    });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => body,
    });

    const r = await exchangeKindeAccessToken("idp-access-token-xyz");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.access_token).toBe("jwt-idp");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("http://api.test/api/auth/session");
    expect(init?.method).toBe("POST");
    expect(init?.headers).toMatchObject({
      Authorization: "Bearer idp-access-token-xyz",
      Accept: "application/json",
    });
  });

  it("reports invalid JSON from backend clearly", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => "<html>not api</html>",
    });

    const r = await exchangeKindeAccessToken("token");
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toContain("Server returned HTML instead of JSON");
  });

  it("POST /api/auth/session with JSON email and password", async () => {
    const body = JSON.stringify({
      access_token: "medvba-jwt",
      profile_id: "00000000-0000-4000-8000-000000000003",
    });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => body,
    });

    const r = await exchangeEmailPasswordSession("user@example.com", "secret");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.access_token).toBe("medvba-jwt");

    const [, init] = fetchMock.mock.calls[0];
    expect(init?.method).toBe("POST");
    expect(init?.headers).toMatchObject({
      Accept: "application/json",
      "Content-Type": "application/json",
    });
    expect(init?.body).toBe(JSON.stringify({ email: "user@example.com", password: "secret" }));
  });

  it("retries email/password when backend reports transient Kinde gateway at token URL", async () => {
    const failBody = JSON.stringify({
      error: "Email/password login failed.",
      detail: "HTTP 502 https://devaieoodltd.kinde.com/oauth2/token. <html>",
      hint:
        "Kinde returned a server error (5xx) at the token URL — usually a temporary outage or gateway issue on Kinde's side, not wrong email/password.",
    });
    const okBody = JSON.stringify({
      access_token: "medvba-jwt",
      profile_id: "00000000-0000-4000-8000-000000000099",
    });
    fetchMock
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        text: async () => failBody,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => okBody,
      });

    const r = await exchangeEmailPasswordSession("user@example.com", "secret");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.access_token).toBe("medvba-jwt");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("email login HTTP 404 returns endpoint hint instead of invalid JSON", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: async () => "404 Not Found",
    });

    const r = await exchangeEmailPasswordSession("user@example.com", "secret");
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toContain("HTTP 404");
    expect(r.error).toContain("/api/auth/session");
    expect(r.error).toContain("http://api.test");
  });

  it("email register HTTP 404 returns endpoint hint", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: async () => "404 Not Found",
    });

    const r = await registerEmailPasswordSession("user@example.com", "secret1234", "Name");
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toContain("/api/auth/register");
  });
});
