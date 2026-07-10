import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@/test-utils";
import { VisitDetailPage } from "../VisitDetailPage";

const mockUseVisit = vi.fn();
const mockUseCancelVisit = vi.fn();
const mockUseUpdateVisit = vi.fn();

vi.mock("@/hooks/queries", () => ({
  useVisit: (id: number) => mockUseVisit(id),
  useCancelVisit: (id: number) => mockUseCancelVisit(id),
  useUpdateVisit: (id: number) => mockUseUpdateVisit(id),
}));

vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router")>();
  return {
    ...actual,
    useParams: () => ({ id: "10" }),
    useNavigate: () => vi.fn(),
  };
});

vi.mock("@/lib/seo", () => ({
  SeoHelmet: () => null,
  SITE_URL: "https://test.local",
}));

describe("VisitDetailPage - Feedback Recap (BUG-07)", () => {
  beforeEach(() => {
    mockUseVisit.mockReset();
    mockUseCancelVisit.mockReset();
    mockUseUpdateVisit.mockReset();

    mockUseCancelVisit.mockReturnValue({ isPending: false });
    mockUseUpdateVisit.mockReturnValue({ isPending: false });
  });

  it("renders loading state", () => {
    mockUseVisit.mockReturnValue({ isLoading: true });
    render(<VisitDetailPage />);
    expect(screen.queryByText("Your Feedback")).toBeNull();
  });

  it("renders feedback recap card when feedback is already submitted", () => {
    mockUseVisit.mockReturnValue({
      isLoading: false,
      data: {
        id: 10,
        status: "completed",
        interest_level: "high",
        visitor_feedback: "Great property and host!",
        scheduled_date: "2026-07-10T10:00:00Z",
        visit_context: "property_tour",
        property_id: 1,
      },
    });

    render(<VisitDetailPage />);

    expect(screen.getByText("Your Feedback")).toBeDefined();
    expect(screen.getByText("Great property and host!")).toBeDefined();
    expect(screen.getByText("Rating Given")).toBeDefined();

    // The rating is 'high', which maps to 5 stars.
    // The StarRating should render 5 buttons with checked/filled state.
    const stars = screen.getAllByRole("radio");
    expect(stars).toHaveLength(5);
    stars.forEach((star) => {
      expect(star.getAttribute("disabled")).toBe("");
    });
  });

  it("renders without feedback recap card when feedback is not submitted", () => {
    mockUseVisit.mockReturnValue({
      isLoading: false,
      data: {
        id: 10,
        status: "completed",
        interest_level: null,
        visitor_feedback: null,
        scheduled_date: "2026-07-10T10:00:00Z",
        visit_context: "property_tour",
        property_id: 1,
      },
    });

    render(<VisitDetailPage />);

    expect(screen.queryByText("Your Feedback")).toBeNull();
    expect(screen.getByText("Leave Feedback")).toBeDefined();
  });
});
