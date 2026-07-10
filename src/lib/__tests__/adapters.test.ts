import { describe, it, expect } from "vitest";
import {
  propertyToListingCardProps,
  profileToProfileGridCardProps,
  visitToVisitCardProps,
  notificationToNotificationCardProps,
  messageToChatBubbleProps
} from "@/lib/api/adapters";
import type {
  Property,
  FlatmatesPeer,
  Visit as ApiVisit,
  FlatmatesNotification,
  MessageOut
} from "@/lib/api/types";

describe("propertyToListingCardProps", () => {
  it("converts number ID to string", () => {
    const property = {
      id: 42,
      property_type: "flatmate",
      purpose: "rent",
      title: "Test Room",
      city: "Bangalore",
      locality: "Indiranagar",
      monthly_rent: 28500,
      bedrooms: 3,
      bathrooms: 2,
      area_sqft: 1250,
      main_image_url: "https://example.com/image.jpg",
      features: ["wifi", "balcony"],
      interest_count: 10
    } as Property;

    const result = propertyToListingCardProps(property);
    expect(result.id).toBe("42");
    expect(typeof result.id).toBe("string");
  });

  it("maps snake_case fields to camelCase", () => {
    const property = {
      id: 1,
      property_type: "flatmate",
      purpose: "rent",
      title: "Sunny Room",
      city: "Bangalore",
      locality: "HSR",
      monthly_rent: 25000,
      bedrooms: 2,
      bathrooms: 1,
      area_sqft: 800,
      main_image_url: "https://example.com/img.jpg",
      features: ["wifi"],
      interest_count: 5,
      owner_name: "Rohan"
    } as Property;

    const result = propertyToListingCardProps(property);
    expect(result.price).toBe(25000);
    expect(result.areaSqFt).toBe(800);
    expect(result.interestCount).toBe(5);
    expect(result.imageUrl).toBe("https://example.com/img.jpg");
  });

  it("maps owner object when present", () => {
    const property = {
      id: 1,
      property_type: "flatmate",
      purpose: "rent",
      title: "Room",
      city: "Bangalore",
      locality: "HSR",
      monthly_rent: 20000,
      owner: {
        id: 10,
        full_name: "Rohan Mehta",
        profile_image_url: "https://example.com/avatar.jpg"
      }
    } as Property;

    const result = propertyToListingCardProps(property);
    expect(result.owner).toEqual({
      name: "Rohan Mehta",
      avatarUrl: "https://example.com/avatar.jpg"
    });
  });

  it("maps base_price and daily_rate dynamically for non-rent purposes", () => {
    const buyProperty = {
      id: 101,
      property_type: "flat",
      purpose: "buy",
      title: "Luxury Apartment",
      city: "Bangalore",
      locality: "Indiranagar",
      base_price: 15000000,
      monthly_rent: 0,
    } as Property;

    const shortStayProperty = {
      id: 102,
      property_type: "room",
      purpose: "short_stay",
      title: "Cozy Room",
      city: "Bangalore",
      locality: "HSR",
      base_price: 1200,
      daily_rate: 1500,
    } as Property;

    const buyResult = propertyToListingCardProps(buyProperty);
    expect(buyResult.price).toBe(15000000);
    expect(buyResult.priceSuffix).toBe("");

    const shortStayResult = propertyToListingCardProps(shortStayProperty);
    expect(shortStayResult.price).toBe(1200);
    expect(shortStayResult.priceSuffix).toBe("/day");
  });
});

describe("profileToProfileGridCardProps", () => {
  it("converts number ID to string", () => {
    const profile = {
      id: 202,
      full_name: "Aditi Rao",
      mode: "open_to_both",
      city: "Bangalore",
      locality: "HSR Layout",
      age: 27,
      profession: "Designer",
      profile_image_url: "https://example.com/photo.jpg",
      match_percentage: 85
    } as FlatmatesPeer;

    const result = profileToProfileGridCardProps(profile);
    expect(result.id).toBe("202");
    expect(typeof result.id).toBe("string");
  });

  it("combines locality and city into location", () => {
    const profile = {
      id: 1,
      full_name: "Test User",
      mode: "co_hunter",
      city: "Bangalore",
      locality: "HSR Layout"
    } as FlatmatesPeer;

    const result = profileToProfileGridCardProps(profile);
    expect(result.location).toBe("HSR Layout, Bangalore");
  });

  it("uses match_percentage for matchScore", () => {
    const profile = {
      id: 1,
      full_name: "Test",
      mode: "co_hunter",
      match_percentage: 73
    } as FlatmatesPeer;

    const result = profileToProfileGridCardProps(profile);
    expect(result.matchScore).toBe(73);
  });
});

describe("visitToVisitCardProps", () => {
  it("converts number ID to string", () => {
    const visit = {
      id: 10,
      property_id: 301,
      visit_context: "property_tour",
      scheduled_date: "2026-06-01",
      status: "confirmed"
    } as ApiVisit;

    const result = visitToVisitCardProps(visit);
    expect(result.id).toBe("10");
    expect(typeof result.id).toBe("string");
  });

  it("maps status correctly", () => {
    const confirmed = { id: 1, property_id: 1, visit_context: "property_tour", scheduled_date: "2026-06-01", status: "confirmed" } as ApiVisit;
    expect(visitToVisitCardProps(confirmed).status).toBe("confirmed");

    const requested = { id: 2, property_id: 1, visit_context: "property_tour", scheduled_date: "2026-06-01", status: "requested" } as ApiVisit;
    expect(visitToVisitCardProps(requested).status).toBe("pending");

    const cancelled = { id: 3, property_id: 1, visit_context: "property_tour", scheduled_date: "2026-06-01", status: "cancelled" } as ApiVisit;
    expect(visitToVisitCardProps(cancelled).status).toBe("cancelled");

    const completed = { id: 4, property_id: 1, visit_context: "property_tour", scheduled_date: "2026-06-01", status: "completed" } as ApiVisit;
    expect(visitToVisitCardProps(completed).status).toBe("completed");

    const reschedule = { id: 5, property_id: 1, visit_context: "property_tour", scheduled_date: "2026-06-01", status: "reschedule_suggested" } as ApiVisit;
    expect(visitToVisitCardProps(reschedule).status).toBe("pending");
  });

  it("maps visit_context to type", () => {
    const tour = { id: 1, property_id: 1, visit_context: "property_tour", scheduled_date: "2026-06-01", status: "confirmed" } as ApiVisit;
    expect(visitToVisitCardProps(tour).type).toBe("Property Tour");

    const meet = { id: 2, property_id: 1, visit_context: "flatmate_meet", scheduled_date: "2026-06-01", status: "confirmed" } as ApiVisit;
    expect(visitToVisitCardProps(meet).type).toBe("Flatmate Meet");
  });
});

describe("notificationToNotificationCardProps", () => {
  it("converts number ID to string", () => {
    const notification = {
      id: "notif-1",
      type: "new_match",
      title: "New Match!",
      body: "You matched with Aditi",
      is_read: false,
      created_at: "2026-05-16T10:00:00Z"
    } as FlatmatesNotification;

    const result = notificationToNotificationCardProps(notification);
    expect(result.id).toBe("notif-1");
  });

  it("maps type correctly", () => {
    const match = { id: "1", type: "new_match", title: "Match", body: "", is_read: false } as FlatmatesNotification;
    expect(notificationToNotificationCardProps(match).type).toBe("new_match");

    const message = { id: "2", type: "new_message", title: "Message", body: "", is_read: false } as FlatmatesNotification;
    expect(notificationToNotificationCardProps(message).type).toBe("new_message");

    const listing = { id: "3", type: "listing_approved", title: "Approved", body: "", is_read: false } as FlatmatesNotification;
    expect(notificationToNotificationCardProps(listing).type).toBe("listing_approved");

    const unknown = { id: "4", type: "unknown_type", title: "Unknown", body: "", is_read: false } as FlatmatesNotification;
    expect(notificationToNotificationCardProps(unknown).type).toBe("general");
  });

  it("maps is_read to unread (inverted)", () => {
    const read = { id: "1", type: "new_match", title: "Read", body: "", is_read: true } as FlatmatesNotification;
    expect(notificationToNotificationCardProps(read).unread).toBe(false);

    const unread = { id: "2", type: "new_match", title: "Unread", body: "", is_read: false } as FlatmatesNotification;
    expect(notificationToNotificationCardProps(unread).unread).toBe(true);
  });
});

describe("messageToChatBubbleProps", () => {
  it("detects own messages when sender_id matches currentUserId", () => {
    const message = {
      id: 100,
      conversation_id: 5,
      sender_id: 101,
      body: "Hello",
      message_type: "text",
      created_at: "2026-05-16T10:00:00Z"
    } as MessageOut;

    const result = messageToChatBubbleProps(message, 101);
    expect(result.sender).toBe("me");
    expect(result.status).toBe("sent");
  });

  it("detects peer messages when sender_id differs", () => {
    const message = {
      id: 101,
      conversation_id: 5,
      sender_id: 202,
      body: "Hi there",
      message_type: "text",
      created_at: "2026-05-16T10:01:00Z"
    } as MessageOut;

    const result = messageToChatBubbleProps(message, 101);
    expect(result.sender).toBe("them");
    expect(result.status).toBeUndefined();
  });

  it("sets status to read for own messages with read_at", () => {
    const message = {
      id: 102,
      conversation_id: 5,
      sender_id: 101,
      body: "Read message",
      message_type: "text",
      read_at: "2026-05-16T11:00:00Z",
      created_at: "2026-05-16T10:00:00Z"
    } as MessageOut;

    const result = messageToChatBubbleProps(message, 101);
    expect(result.status).toBe("read");
  });

  it("converts number ID to string", () => {
    const message = {
      id: 999,
      conversation_id: 5,
      sender_id: 202,
      body: "Test",
      message_type: "text",
      created_at: "2026-05-16T10:00:00Z"
    } as MessageOut;

    const result = messageToChatBubbleProps(message, 101);
    expect(result.id).toBe("999");
    expect(typeof result.id).toBe("string");
  });
});
