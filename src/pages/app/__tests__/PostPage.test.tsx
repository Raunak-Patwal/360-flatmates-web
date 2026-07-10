import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import { render, screen, fireEvent } from "@/test-utils";
import { waitFor } from "@testing-library/react";
import { PostPage } from "../PostPage";
import { LISTING_DRAFT_STORAGE_KEY } from "@/lib/schemas/listing-builder";

const mockUseCreateProperty = vi.fn();
const mockUseUploadPropertyImage = vi.fn();
const mockUseImageUpload = vi.fn();

vi.mock("@/hooks/queries", () => ({
  useCreateProperty: () => mockUseCreateProperty(),
  useUploadPropertyImage: () => mockUseUploadPropertyImage(),
}));

vi.mock("@/hooks/useImageUpload", () => ({
  useImageUpload: () => mockUseImageUpload(),
}));

vi.mock("@/hooks/useDirtyFormGuard", () => ({
  useDirtyFormGuard: () => ({ state: "unblocked", reset: vi.fn(), proceed: vi.fn() }),
}));

const mockNavigate = vi.fn();
vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useBlocker: () => ({ state: "unblocked" }),
  };
});

vi.mock("@/lib/seo", () => ({
  SeoHelmet: () => null,
  SITE_URL: "https://test.local",
}));

describe("PostPage - Post-Publish Navigation (BUG-09)", () => {
  let mockMutate: Mock;

  beforeEach(() => {
    mockNavigate.mockReset();
    mockMutate = vi.fn();

    mockUseCreateProperty.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });

    mockUseUploadPropertyImage.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    mockUseImageUpload.mockReturnValue({
      upload: vi.fn(),
      isUploading: false,
    });

    window.localStorage.removeItem(LISTING_DRAFT_STORAGE_KEY);
  });

  it("navigates to my-listings detail page when listing is approved immediately", async () => {
    // Mock draft state to start at review step
    window.localStorage.setItem(
      LISTING_DRAFT_STORAGE_KEY,
      JSON.stringify({
        currentStep: 7, // Step 8: Review & Publish
        form: {
          title: "Approved Penthouse",
          city: "Bangalore",
          locality: "Indiranagar",
          monthly_rent: 50000,
          bedrooms: 3,
          sharing_type: "private",
          gender_preference: "any",
        },
      })
    );

    mockMutate.mockImplementation((_payload: unknown, options: unknown) => {
      const opt = options as { onSuccess?: (data: unknown) => void };
      opt.onSuccess?.({
        id: 456,
        property_status: "approved",
        status: "active",
      });
    });

    render(<PostPage />);

    const publishButton = screen.getByRole("button", { name: /Publish Listing/i });
    fireEvent.click(publishButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/my-listings/456");
    });
  });

  it("navigates to post review page when listing is pending moderation review", async () => {
    window.localStorage.setItem(
      LISTING_DRAFT_STORAGE_KEY,
      JSON.stringify({
        currentStep: 7, // Step 8: Review & Publish
        form: {
          title: "Unapproved Flat",
          city: "Bangalore",
          locality: "HSR Layout",
          monthly_rent: 20000,
          bedrooms: 2,
          sharing_type: "private",
          gender_preference: "any",
        },
      })
    );

    mockMutate.mockImplementation((_payload: unknown, options: unknown) => {
      const opt = options as { onSuccess?: (data: unknown) => void };
      opt.onSuccess?.({
        id: 789,
        property_status: "pending_review",
        status: "draft",
      });
    });

    render(<PostPage />);

    const publishButton = screen.getByRole("button", { name: /Publish Listing/i });
    fireEvent.click(publishButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/post/review/789", {
        state: { listingId: 789 },
      });
    });
  });
});
