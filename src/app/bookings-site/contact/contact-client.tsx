"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { sendBookingInquiryEmail } from "./actions";

const BookingSchema = z.object({
  artist: z.string().min(2, "Please enter an artist name."),
  date: z.string().min(2, "Please provide an event date."),
  location: z.string().min(2, "Please provide a location."),
  budget: z.string().min(1, "Please provide a budget range."),
  email: z.string().email("Please enter a valid email."),
  message: z.string().min(10, "Please include at least 10 characters."),
});

type BookingValues = z.infer<typeof BookingSchema>;

export function BookingContactClient() {
  const [result, setResult] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const form = useForm<BookingValues>({
    resolver: zodResolver(BookingSchema),
    defaultValues: {
      artist: "",
      date: "",
      location: "",
      budget: "",
      email: "",
      message: "",
    },
  });

  const onSubmit = (values: BookingValues) => {
    setResult("");
    startTransition(async () => {
      const response = await sendBookingInquiryEmail(values);
      if (response.ok) {
        setResult("Booking request sent.");
        form.reset();
      } else {
        setResult("We could not submit your request. Please try again.");
      }
    });
  };

  return (
    <form className="space-y-4 rounded-xl border border-border bg-card p-6" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span>Artist</span>
          <input className="w-full rounded-md border border-border bg-background px-3 py-2" {...form.register("artist")} />
          {form.formState.errors.artist && <p className="text-xs text-destructive">{form.formState.errors.artist.message}</p>}
        </label>
        <label className="space-y-1 text-sm">
          <span>Date</span>
          <input className="w-full rounded-md border border-border bg-background px-3 py-2" {...form.register("date")} />
          {form.formState.errors.date && <p className="text-xs text-destructive">{form.formState.errors.date.message}</p>}
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span>Location</span>
          <input className="w-full rounded-md border border-border bg-background px-3 py-2" {...form.register("location")} />
          {form.formState.errors.location && <p className="text-xs text-destructive">{form.formState.errors.location.message}</p>}
        </label>
        <label className="space-y-1 text-sm">
          <span>Budget</span>
          <input className="w-full rounded-md border border-border bg-background px-3 py-2" {...form.register("budget")} />
          {form.formState.errors.budget && <p className="text-xs text-destructive">{form.formState.errors.budget.message}</p>}
        </label>
      </div>
      <label className="space-y-1 text-sm">
        <span>Email</span>
        <input className="w-full rounded-md border border-border bg-background px-3 py-2" {...form.register("email")} />
        {form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}
      </label>
      <label className="space-y-1 text-sm">
        <span>Message</span>
        <textarea className="min-h-32 w-full rounded-md border border-border bg-background px-3 py-2" {...form.register("message")} />
        {form.formState.errors.message && <p className="text-xs text-destructive">{form.formState.errors.message.message}</p>}
      </label>
      <button
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-70"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Sending..." : "Request booking"}
      </button>
      {result && <p className="text-sm text-muted-foreground">{result}</p>}
    </form>
  );
}

