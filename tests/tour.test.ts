import { describe, expect, it } from "vitest";
import {
  KEYFRAMES,
  ROOMS,
  STOPS,
  activeStop,
  scrollToCurve,
  wrapAngle,
} from "@/components/three/tour/plan";

describe("home page walkthrough plan", () => {
  it("maps the scroll range onto the whole camera curve", () => {
    expect(scrollToCurve(0)).toBe(0);
    expect(scrollToCurve(1)).toBe(1);
    expect(scrollToCurve(-0.5)).toBe(0);
    expect(scrollToCurve(4)).toBe(1);
  });

  it("never moves the camera backwards as the page scrolls down", () => {
    let previous = -1;
    for (let i = 0; i <= 400; i++) {
      const value = scrollToCurve(i / 400);
      expect(value).toBeGreaterThanOrEqual(previous);
      previous = value;
    }
  });

  it("rests the camera on each stop's keyframe", () => {
    const last = KEYFRAMES.length - 1;
    for (const stop of STOPS) {
      expect(stop.keyframe).toBeLessThanOrEqual(last);
      expect(scrollToCurve(stop.at)).toBeCloseTo(stop.keyframe / last, 6);
    }
  });

  it("orders the stops along the scroll range", () => {
    expect(STOPS[0].at).toBe(0);
    expect(STOPS[STOPS.length - 1].at).toBe(1);
    for (let i = 1; i < STOPS.length; i++) {
      expect(STOPS[i].at).toBeGreaterThan(STOPS[i - 1].at);
      expect(STOPS[i].keyframe).toBeGreaterThan(STOPS[i - 1].keyframe);
    }
  });

  it("shows a caption at each stop and none halfway between two rooms", () => {
    STOPS.forEach((stop, index) => expect(activeStop(stop.at)).toBe(index));
    for (let i = 1; i < STOPS.length; i++) {
      expect(activeStop((STOPS[i - 1].at + STOPS[i].at) / 2)).toBe(-1);
    }
  });

  it("lines up the doorways of neighbouring rooms", () => {
    const row = ROOMS.filter((room) => room.id !== "foyer");
    for (let i = 0; i < row.length - 1; i++) {
      expect(row[i].openings.east).toEqual(row[i + 1].openings.west);
    }
    const foyer = ROOMS.find((room) => room.id === "foyer");
    const living = ROOMS.find((room) => room.id === "living");
    expect(foyer?.openings.north).toEqual(living?.openings.south);
  });

  it("wraps a look angle so easing back to the route takes the short way round", () => {
    expect(wrapAngle(0)).toBe(0);
    expect(wrapAngle(Math.PI * 2 + 0.5)).toBeCloseTo(0.5, 9);
    expect(wrapAngle(-Math.PI * 2 - 0.5)).toBeCloseTo(-0.5, 9);
    expect(wrapAngle(Math.PI * 1.5)).toBeCloseTo(-Math.PI / 2, 9);
    expect(Math.abs(wrapAngle(17.3))).toBeLessThanOrEqual(Math.PI);
  });
});
