"use server";

import { revalidatePath } from "next/cache";

import { fail, ok, text, type ActionResult } from "@/lib/action-result";
import { prisma } from "@/lib/prisma";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Signing up twice is not an error the reader should see: the address is
 * already on the list, which is exactly what they asked for.
 */
export async function subscribeNewsletter(
  formData: FormData,
): Promise<ActionResult> {
  const email = text(formData, "email").toLowerCase();
  if (!EMAIL.test(email)) return fail("invalidEmail");

  const locale = text(formData, "locale") === "en" ? "en" : "ar";

  await prisma.newsletterSubscriber.upsert({
    where: { email },
    create: { email, locale },
    update: { locale },
  });

  revalidatePath("/admin/messages");
  return ok();
}

export async function sendContactMessage(
  formData: FormData,
): Promise<ActionResult> {
  const name = text(formData, "name");
  const email = text(formData, "email").toLowerCase();
  const subject = text(formData, "subject");
  const message = text(formData, "message");

  if (!name || !subject || !message) return fail("missingFields");
  if (!EMAIL.test(email)) return fail("invalidEmail");

  await prisma.contactMessage.create({
    data: { name, email, subject, message },
  });

  // The inbox, and the subscriber list beside it. (This named `/[locale]/admin`
  // until the locale segment went; the panel never heard about a message.)
  revalidatePath("/admin/messages");
  return ok();
}
