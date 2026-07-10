import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@/test-utils";
import { ManagePage } from "../ManagePage";

const mockUseMyProperties = vi.fn();

vi.mock("@/hooks/queries", () => ({
  useMyProperties: () => mockUseMyProperties(),
}));

vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router")>();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe("ManagePage - Status Filtering (BUG-08)", () => {
  beforeEach(() => {
    mockUseMyProperties.mockReset();
  });

  const mockProperties = [
    {
      id: 1,
      title: "Draft Property",
      status: "draft",
      property_status: "pending_review",
      locality: "Indiranagar",
      monthly_rent: 20000,
    },
    {
      id: 2,
      title: "Published Property",
      status: "active",
      property_status: "approved",
      locality: "HSR Layout",
      monthly_rent: 30000,
    },
    {
      id: 3,
      title: "Expired Property",
      status: "expired",
      property_status: "approved",
      locality: "Koramangala",
      monthly_rent: 40000,
    },
  ];

  it("renders all properties by default", () => {
    mockUseMyProperties.mockReturnValue({
      isLoading: false,
      data: mockProperties,
    });

    render(<ManagePage />);

    expect(screen.getByText("Draft Property")).toBeDefined();
    expect(screen.getByText("Published Property")).toBeDefined();
    expect(screen.getByText("Expired Property")).toBeDefined();
  });

  it("filters correctly by moderation status (Published)", () => {
    mockUseMyProperties.mockReturnValue({
      isLoading: false,
      data: mockProperties,
    });

    render(<ManagePage />);

    // Click "Published" chip
    const publishedChip = screen.getByRole("checkbox", { name: "Published" });
    fireEvent.click(publishedChip);

    // Published property should be there (approved)
    expect(screen.getByText("Published Property")).toBeDefined();
    expect(screen.getByText("Expired Property")).toBeDefined(); // Also approved, but expired
    expect(screen.queryByText("Draft Property")).toBeNull(); // Pending review, not approved
  });

  it("filters correctly by lifecycle status (Draft)", () => {
    mockUseMyProperties.mockReturnValue({
      isLoading: false,
      data: mockProperties,
    });

    render(<ManagePage />);

    // Click "Draft" chip
    const draftChip = screen.getByRole("checkbox", { name: "Draft" });
    fireEvent.click(draftChip);

    // Only draft property should be there
    expect(screen.getByText("Draft Property")).toBeDefined();
    expect(screen.queryByText("Published Property")).toBeNull();
    expect(screen.queryByText("Expired Property")).toBeNull();
  });

  it("filters correctly by lifecycle status (Expired)", () => {
    mockUseMyProperties.mockReturnValue({
      isLoading: false,
      data: mockProperties,
    });

    render(<ManagePage />);

    // Click "Expired" chip
    const expiredChip = screen.getByRole("checkbox", { name: "Expired" });
    fireEvent.click(expiredChip);

    // Only expired property should be there
    expect(screen.getByText("Expired Property")).toBeDefined();
    expect(screen.queryByText("Draft Property")).toBeNull();
    expect(screen.queryByText("Published Property")).toBeNull();
  });
});
