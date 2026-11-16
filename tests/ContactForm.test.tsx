import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ContactForm } from "@/components/forms/ContactForm";

const submitContact = vi.fn();
vi.mock("@/app/actions", () => ({ submitContact: (...args: unknown[]) => submitContact(...args) }));

async function fill(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/^name/i), "Rahul Mehta");
  await user.type(screen.getByLabelText(/^email/i), "rahul@example.com");
  await user.type(screen.getByLabelText(/^subject/i), "Press enquiry");
  await user.type(
    screen.getByLabelText(/^message/i),
    "I would like to feature one of your projects in our next issue.",
  );
}

describe("ContactForm", () => {
  beforeEach(() => submitContact.mockReset());

  it("shows validation errors and does not submit an empty form", async () => {
    const user = userEvent.setup();
    render(<ContactForm />);
    await user.click(screen.getByRole("button", { name: /send message/i }));

    expect(await screen.findByText(/enter your full name/i)).toBeInTheDocument();
    expect(screen.getByText(/valid email/i)).toBeInTheDocument();
    expect(screen.getByText(/at least 20 characters/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^name/i)).toHaveAttribute("aria-invalid", "true");
    expect(submitContact).not.toHaveBeenCalled();
  });

  it("submits valid values and shows a confirmation", async () => {
    submitContact.mockResolvedValue({ ok: true, data: { emailSent: true } });
    const user = userEvent.setup();
    render(<ContactForm />);
    await fill(user);
    await user.click(screen.getByRole("button", { name: /send message/i }));

    await waitFor(() => expect(submitContact).toHaveBeenCalledTimes(1));
    expect(submitContact.mock.calls[0][0]).toMatchObject({
      values: { name: "Rahul Mehta", email: "rahul@example.com", subject: "Press enquiry" },
      company: "",
    });
    expect(await screen.findByText(/thank you, rahul/i)).toBeInTheDocument();
    expect(screen.getByText(/copy is on its way/i)).toBeInTheDocument();
  });

  it("surfaces server-side errors next to the field", async () => {
    submitContact.mockResolvedValue({
      ok: false,
      error: "Please check the highlighted fields.",
      fieldErrors: { email: "This address cannot receive mail" },
    });
    const user = userEvent.setup();
    render(<ContactForm />);
    await fill(user);
    await user.click(screen.getByRole("button", { name: /send message/i }));

    expect(await screen.findByText(/cannot receive mail/i)).toBeInTheDocument();
    expect(screen.getByText(/check the highlighted fields/i)).toBeInTheDocument();
    expect(screen.queryByText(/thank you/i)).not.toBeInTheDocument();
  });
});
