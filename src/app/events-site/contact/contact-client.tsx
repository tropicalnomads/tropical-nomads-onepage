"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { sendEventsContactEmail } from "./actions";

const ContactSchema = z.object({
  name: z.string().min(2, "Please enter your name."),
  email: z.string().email("Please enter a valid email."),
  message: z.string().min(10, "Please include at least 10 characters."),
});

type ContactValues = z.infer<typeof ContactSchema>;

export function EventsContactClient() {
  const [result, setResult] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const form = useForm<ContactValues>({
    resolver: zodResolver(ContactSchema),
    defaultValues: { name: "", email: "", message: "" },
  });

  const onSubmit = (values: ContactValues) => {
    setResult("");
    startTransition(async () => {
      const response = await sendEventsContactEmail(values);
      if (response.ok) {
        setResult("Your message was sent.");
        form.reset();
      } else {
        setResult("We could not send your message. Please try again.");
      }
    });
  };

  return (
    <form className="space-y-4 rounded-xl border border-border bg-card p-6" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span>Name</span>
          <input className="w-full rounded-md border border-border bg-background px-3 py-2" {...form.register("name")} />
          {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
        </label>
        <label className="space-y-1 text-sm">
          <span>Email</span>
          <input className="w-full rounded-md border border-border bg-background px-3 py-2" {...form.register("email")} />
          {form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}
        </label>
      </div>
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
        {isPending ? "Sending..." : "Send message"}
      </button>
      {result && <p className="text-sm text-muted-foreground">{result}</p>}
    </form>
  );
}

