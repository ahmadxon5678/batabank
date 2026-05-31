"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getNumber, getString } from "@/lib/format";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";
import type { InstitutionType, PickupStatus, Profile } from "@/lib/types";

const institutionTypes = new Set(["school", "university", "government", "other"]);
const pickupStatuses = new Set<PickupStatus>([
  "requested",
  "scheduled",
  "picked_up",
  "delivered_to_partner",
  "cancelled",
]);

const messages = {
  missingEnv: "Supabase sozlamalari hali kiritilmagan",
  loginFirst: "Avval tizimga kiring",
  adminRequired: "Admin ruxsati kerak",
  requiredFields: "Majburiy maydonlarni to'ldiring",
  registered: "Ro'yxatdan o'tish yakunlandi. Arizangiz admin tomonidan ko'rib chiqiladi.",
  badType: "Tashkilot turi noto'g'ri",
  profileSaved: "Profil yangilandi",
  notApproved: "Tashkilotingiz admin tomonidan tasdiqlangandan keyin so'rov yubora olasiz",
  submissionRequired: "To'lgan konteyner so'rovi ma'lumotlarini to'liq kiriting",
  pickupRequired: "Olib ketish kerak bo'lsa, manzil yoki izoh kiriting",
  submissionFailed: "So'rov yuborib bo'lmadi",
  submitted: "To'lgan konteyner so'rovi tekshiruvga yuborildi",
  badDecision: "Noto'g'ri qaror",
  decisionSaved: "Qaror saqlandi",
  institutionReviewed: "Tashkilot arizasi ko'rib chiqildi",
  pickupSaved: "Olib ketish holati yangilandi",
  badSecret: "Maxfiy parol noto'g'ri",
};

async function requireEnv() {
  if (!hasSupabaseEnv()) {
    redirect(`/login?error=${encodeURIComponent(messages.missingEnv)}`);
  }
}

async function requireUser() {
  await requireEnv();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?error=${encodeURIComponent(messages.loginFirst)}`);
  return { supabase, user };
}

async function requireAdmin() {
  const { supabase, user } = await requireUser();
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const profile = data as { role?: string } | null;

  if (profile?.role !== "admin") {
    redirect(`/dashboard?error=${encodeURIComponent(messages.adminRequired)}`);
  }

  return { supabase, user };
}

export async function registerInstitution(formData: FormData) {
  await requireEnv();
  const supabase = await createClient();
  const email = getString(formData, "email");
  const password = getString(formData, "password");
  const institutionType = getString(formData, "institution_type");

  if (!email || !password || !institutionTypes.has(institutionType)) {
    redirect(`/register?error=${encodeURIComponent(messages.requiredFields)}`);
  }

  const profileData = {
    institution_name: getString(formData, "institution_name"),
    institution_type: institutionType,
    region_city: getString(formData, "region_city"),
    contact_person: getString(formData, "contact_person"),
    contact: getString(formData, "contact"),
  };

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: profileData,
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3004"}/dashboard`,
    },
  });

  if (error) redirect(`/register?error=${encodeURIComponent(error.message)}`);

  if (data.user) {
    await supabase.from("profiles").upsert({
      id: data.user.id,
      ...profileData,
      institution_type: profileData.institution_type as InstitutionType,
      role: "institution",
      approval_status: "pending",
    });
  }

  redirect(`/dashboard?message=${encodeURIComponent(messages.registered)}`);
}

export async function loginInstitution(formData: FormData) {
  await requireEnv();
  const supabase = await createClient();
  const email = getString(formData, "email");
  const password = getString(formData, "password");

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);

  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function updateProfile(formData: FormData) {
  const { supabase, user } = await requireUser();
  const institutionType = getString(formData, "institution_type");

  if (!institutionTypes.has(institutionType)) {
    redirect(`/dashboard?error=${encodeURIComponent(messages.badType)}`);
  }

  const payload: Partial<Omit<Profile, "id" | "created_at" | "updated_at" | "role">> = {
    institution_name: getString(formData, "institution_name"),
    institution_type: institutionType as InstitutionType,
    region_city: getString(formData, "region_city"),
    contact_person: getString(formData, "contact_person"),
    contact: getString(formData, "contact"),
  };

  const { error } = await supabase.from("profiles").update(payload).eq("id", user.id);
  if (error) redirect(`/dashboard?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/dashboard");
  redirect(`/dashboard?message=${encodeURIComponent(messages.profileSaved)}`);
}

export async function createSubmission(formData: FormData) {
  const { supabase, user } = await requireUser();
  const { data: profileData } = await supabase
    .from("profiles")
    .select("approval_status")
    .eq("id", user.id)
    .single();
  const profile = profileData as Pick<Profile, "approval_status"> | null;

  if (profile?.approval_status !== "approved") {
    redirect(`/dashboard?error=${encodeURIComponent(messages.notApproved)}`);
  }

  const containers = getNumber(formData, "containers_count");
  const batteries = getNumber(formData, "estimated_battery_count");
  const weightRaw = getString(formData, "estimated_weight_kg");
  const collectionDate = getString(formData, "collection_date");
  const requestMessage = getString(formData, "message");
  const pickupRequested = formData.get("pickup_requested") === "on";
  const pickupAddress = getString(formData, "pickup_address");
  const pickupNote = getString(formData, "pickup_note");

  if (containers < 1 || batteries < 1 || !collectionDate) {
    redirect(`/dashboard?error=${encodeURIComponent(messages.submissionRequired)}`);
  }

  if (pickupRequested && !pickupAddress && !pickupNote) {
    redirect(`/dashboard?error=${encodeURIComponent(messages.pickupRequired)}`);
  }

  const { data: submission, error } = await supabase
    .from("submissions")
    .insert({
      profile_id: user.id,
      containers_count: containers,
      estimated_battery_count: batteries,
      estimated_weight_kg: weightRaw ? Number(weightRaw) : null,
      collection_date: collectionDate,
      message: requestMessage || null,
      pickup_requested: pickupRequested,
      pickup_status: pickupRequested ? "requested" : "not_requested",
      pickup_address: pickupAddress || null,
      pickup_note: pickupNote || null,
      pickup_updated_at: pickupRequested ? new Date().toISOString() : null,
    })
    .select("id")
    .single();

  if (error || !submission) {
    redirect(`/dashboard?error=${encodeURIComponent(error?.message ?? messages.submissionFailed)}`);
  }

  const files = formData
    .getAll("photos")
    .filter((value): value is File => value instanceof File && value.size > 0);

  for (const file of files.slice(0, 4)) {
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${user.id}/${submission.id}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("collection-photos")
      .upload(path, file, { contentType: file.type || "image/jpeg" });

    if (!uploadError) {
      await supabase.from("submission_photos").insert({
        submission_id: submission.id,
        profile_id: user.id,
        storage_path: path,
      });
    }
  }

  revalidatePath("/dashboard");
  redirect(`/dashboard?message=${encodeURIComponent(messages.submitted)}`);
}

export async function reviewSubmission(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const submissionId = getString(formData, "submission_id");
  const decision = getString(formData, "decision");
  const adminNote = getString(formData, "admin_note");

  if (!submissionId || !["approved", "rejected"].includes(decision)) {
    redirect(`/admin?error=${encodeURIComponent(messages.badDecision)}`);
  }

  const { error } = await supabase
    .from("submissions")
    .update({
      status: decision as "approved" | "rejected",
      admin_note: adminNote || null,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", submissionId);

  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/leaderboard");
  revalidatePath("/analytics");
  revalidatePath("/report");
  redirect(`/admin?message=${encodeURIComponent(messages.decisionSaved)}`);
}

export async function reviewInstitution(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const profileId = getString(formData, "profile_id");
  const decision = getString(formData, "decision");
  const approvalNote = getString(formData, "approval_note");

  if (!profileId || !["approved", "rejected"].includes(decision)) {
    redirect(`/admin?error=${encodeURIComponent(messages.badDecision)}`);
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("profiles")
    .update({
      approval_status: decision,
      approval_note: approvalNote || null,
      approved_by: decision === "approved" ? user.id : null,
      approved_at: decision === "approved" ? now : null,
      rejected_at: decision === "rejected" ? now : null,
    })
    .eq("id", profileId);

  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  redirect(`/admin?message=${encodeURIComponent(messages.institutionReviewed)}`);
}

export async function updatePickupStatus(formData: FormData) {
  const { supabase } = await requireAdmin();
  const submissionId = getString(formData, "submission_id");
  const pickupStatus = getString(formData, "pickup_status") as PickupStatus;

  if (!submissionId || !pickupStatuses.has(pickupStatus)) {
    redirect(`/admin?error=${encodeURIComponent(messages.badDecision)}`);
  }

  const { error } = await supabase
    .from("submissions")
    .update({
      pickup_status: pickupStatus,
      pickup_updated_at: new Date().toISOString(),
    })
    .eq("id", submissionId);

  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/analytics");
  redirect(`/admin?message=${encodeURIComponent(messages.pickupSaved)}`);
}

export async function unlockAdminGate(formData: FormData) {
  const secret = getString(formData, "secret");
  const expected = process.env.ADMIN_GATE_SECRET;

  if (!expected || secret !== expected) {
    redirect(`/dashboard?error=${encodeURIComponent(messages.badSecret)}`);
  }

  const cookieStore = await cookies();
  cookieStore.set("batabank-admin-gate", "unlocked", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 30,
    path: "/",
  });

  redirect("/admin");
}
