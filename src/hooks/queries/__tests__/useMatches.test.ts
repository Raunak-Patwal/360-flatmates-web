import { describe, it, expect, vi, beforeEach } from "vitest";

const requestMock = vi.fn();

vi.mock("@/lib/api", () => ({
  get apiClient() {
    return { request: requestMock };
  }
}));

import { outgoingLikesInfiniteOptions } from "../useMatches";

describe("BUG-01: outgoingLikesInfiniteOptions", () => {
  beforeEach(() => {
    requestMock.mockReset();
  });

  it("calls the correct endpoint for outgoing likes", async () => {
    requestMock.mockResolvedValue({ items: [] });
    await outgoingLikesInfiniteOptions().queryFn({
      pageParam: undefined,
      signal: new AbortController().signal,
      queryKey: ["matches", "outgoing"] as const
    } as unknown as Parameters<ReturnType<typeof outgoingLikesInfiniteOptions>["queryFn"]>[0]);
    expect(requestMock).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "GET",
        path: "/flatmates/outgoing-likes"
      })
    );
  });
});
