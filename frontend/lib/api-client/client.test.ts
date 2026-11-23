import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiConflictError, ApiNotFoundError, ApiValidationError, apiFetch, apiFetchNoContent } from "./client";

// "server-only" throws when imported outside a Server Component: replace it with an empty module.
vi.mock("server-only", () => ({}));

function stubFetch(response: Response) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

describe("api client", () => {
  beforeEach(() => {
    vi.stubEnv("API_BASE_URL", "http://api.test");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("returns the parsed JSON body of a successful response", async () => {
    const fetchMock = stubFetch(jsonResponse([{ id: 1, name: "First" }]));

    const plots = await apiFetch<{ id: number; name: string }[]>("/api/plots");

    expect(plots).toEqual([{ id: 1, name: "First" }]);
    expect(fetchMock).toHaveBeenCalledWith("http://api.test/api/plots", expect.anything());
  });

  it("throws ApiNotFoundError on a 404", async () => {
    stubFetch(new Response(null, { status: 404 }));

    await expect(apiFetch("/api/harvests/42")).rejects.toBeInstanceOf(ApiNotFoundError);
  });

  it("throws ApiValidationError with camelCase field names on a 400", async () => {
    stubFetch(jsonResponse({ errors: { RiceKg: ["La quantité de riz est obligatoire."] } }, 400));

    const error = await apiFetch("/api/harvests").catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiValidationError);
    expect((error as ApiValidationError).fieldErrors).toEqual({ riceKg: ["La quantité de riz est obligatoire."] });
  });

  it("throws ApiConflictError with the message of the API on a 409", async () => {
    stubFetch(jsonResponse({ status: 409, title: "Saisie déjà existante", detail: "Une saisie existe déjà." }, 409));

    const error = await apiFetch("/api/harvests", { method: "POST" }).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiConflictError);
    expect((error as ApiConflictError).message).toBe("Une saisie existe déjà.");
  });

  it("throws a generic error on any other failure status", async () => {
    stubFetch(new Response(null, { status: 500 }));

    await expect(apiFetch("/api/harvests")).rejects.toThrow("status 500");
  });

  it("accepts an empty 204 response when no body is expected", async () => {
    stubFetch(new Response(null, { status: 204 }));

    await expect(apiFetchNoContent("/api/harvests/1", { method: "DELETE" })).resolves.toBeUndefined();
  });

  it("fails clearly when API_BASE_URL is not set", async () => {
    vi.stubEnv("API_BASE_URL", "");

    await expect(apiFetch("/api/harvests")).rejects.toThrow("API_BASE_URL is not set");
  });
});
