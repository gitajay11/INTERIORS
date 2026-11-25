import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BookingForm } from "@/components/forms/BookingForm";

const submitConsultation = vi.fn();
vi.mock("@/app/actions", () => ({
  submitConsultation: (...args: unknown[]) => submitConsultation(...args),
}));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

function renderForm() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <BookingForm />
    </QueryClientProvider>,
  );
}

describe("BookingForm", () => {
  beforeEach(() => {
    submitConsultation.mockReset();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
  });

  it("does not advance past step one until its fields are valid", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByRole("button", { name: /continue/i }));

    expect(await screen.findByText(/enter your full name/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /tell us about you/i })).toBeInTheDocument();
  });

  it("walks through the steps and validates each one", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/full name/i), "Ananya Rao");
    await user.type(screen.getByLabelText(/^email/i), "ananya@example.com");
    await user.type(screen.getByLabelText(/^phone/i), "9845012345");
    await user.type(screen.getByLabelText(/^city/i), "Chennai");
    await user.click(screen.getByRole("button", { name: /continue/i }));

    // Step 2: property
    expect(await screen.findByRole("heading", { name: /about the property/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /continue/i }));
    expect(await screen.findByText(/choose a property type/i)).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "Villa" }));
    await user.type(screen.getByLabelText(/approximate area/i), "3200");
    await user.click(screen.getByRole("radio", { name: /renovation/i }));
    await user.click(screen.getByRole("button", { name: /continue/i }));

    // Step 3: budget
    expect(await screen.findByRole("heading", { name: /budget/i })).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: /1 – 2 crore/ }));
    await user.click(screen.getByRole("button", { name: /continue/i }));

    // Step 4: style
    expect(await screen.findByRole("heading", { name: /style/i })).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: /japandi/i }));
    await user.click(screen.getByRole("button", { name: /continue/i }));

    // Step 5: an appointment needs a date and a time before review
    expect(await screen.findByRole("heading", { name: /date and time/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /continue/i }));
    expect(await screen.findByText("Choose a date")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /review/i })).not.toBeInTheDocument();
    expect(submitConsultation).not.toHaveBeenCalled();
  });
});
