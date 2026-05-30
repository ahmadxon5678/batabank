"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { getNumber, getString } from "@/lib/format";
import { getLocale } from "@/lib/i18n";
import type { InstitutionType, Profile } from "@/lib/types";

const institutionTypes = new Set(["school", "university", "government", "other"]);

async function message(key: keyof typeof actionMessages.uz) {
  const locale = await getLocale();
  return actionMessages[locale][key];
}

const actionMessages = {
  uz: {
    missingEnv: "Supabase sozlamalari hali kiritilmagan",
    loginFirst: "Avval tizimga kiring",
    adminRequired: "Admin ruxsati kerak",
    requiredFields: "Majburiy maydonlarni to'ldiring",
    registered: "Ro'yxatdan o'tish yakunlandi",
    badType: "Tashkilot turi noto'g'ri",
    profileSaved: "Profil yangilandi",
    submissionRequired: "Yig'im ma'lumotlarini to'liq kiriting",
    submissionFailed: "Yuborib bo'lmadi",
    submitted: "Yig'im tekshiruvga yuborildi",
    badDecision: "Noto'g'ri qaror",
    decisionSaved: "Qaror saqlandi",
  },
  ru: {
    missingEnv: "Настройки Supabase еще не указаны",
    loginFirst: "Сначала войдите в систему",
    adminRequired: "Нужны права администратора",
    requiredFields: "Заполните обязательные поля",
    registered: "Регистрация завершена",
    badType: "Неверный тип учреждения",
    profileSaved: "Профиль обновлен",
    submissionRequired: "Заполните данные сбора",
    submissionFailed: "Не удалось отправить",
    submitted: "Сбор отправлен на проверку",
    badDecision: "Неверное решение",
    decisionSaved: "Решение сохранено",
  },
} as const;

async function requireEnv() {
  if (!hasSupabaseEnv()) {
    redirect(`/login?error=${encodeURIComponent(await message("missingEnv"))}`);
  }
}

async function requireUser() {
  await requireEnv();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?error=${encodeURIComponent(await message("loginFirst"))}`);
  return { supabase, user };
}

async function requireAdmin() {
  const { supabase, user } = await requireUser();
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const profile = data as { role?: string } | null;

  if (profile?.role !== "admin") redirect(`/dashboard?error=${encodeURIComponent(await message("adminRequired"))}`);
  return { supabase, user };
}

export async function registerInstitution(formData: FormData) {
  await requireEnv();
  const supabase = await createClient();
  const email = getString(formData, "email");
  const password = getString(formData, "password");
  const institutionType = getString(formData, "institution_type");

  if (!email || !password || !institutionTypes.has(institutionType)) {
    redirect(`/register?error=${encodeURIComponent(await message("requiredFields"))}`);
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
    });
  }

  redirect(`/dashboard?message=${encodeURIComponent(await message("registered"))}`);
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
    redirect(`/dashboard?error=${encodeURIComponent(await message("badType"))}`);
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
  redirect(`/dashboard?message=${encodeURIComponent(await message("profileSaved"))}`);
}

export async function createSubmission(formData: FormData) {
  const { supabase, user } = await requireUser();
  const containers = getNumber(formData, "containers_count");
  const batteries = getNumber(formData, "estimated_battery_count");
  const weightRaw = getString(formData, "estimated_weight_kg");
  const collectionDate = getString(formData, "collection_date");

  if (containers < 1 || batteries < 1 || !collectionDate) {
    redirect(`/dashboard?error=${encodeURIComponent(await message("submissionRequired"))}`);
  }

  const { data: submission, error } = await supabase
    .from("submissions")
    .insert({
      profile_id: user.id,
      containers_count: containers,
      estimated_battery_count: batteries,
      estimated_weight_kg: weightRaw ? Number(weightRaw) : null,
      collection_date: collectionDate,
    })
    .select("id")
    .single();

  if (error || !submission) {
    redirect(`/dashboard?error=${encodeURIComponent(error?.message ?? (await message("submissionFailed")))}`);
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
  redirect(`/dashboard?message=${encodeURIComponent(await message("submitted"))}`);
}

export async function reviewSubmission(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const submissionId = getString(formData, "submission_id");
  const decision = getString(formData, "decision");
  const adminNote = getString(formData, "admin_note");

  if (!submissionId || !["approved", "rejected"].includes(decision)) {
    redirect(`/admin?error=${encodeURIComponent(await message("badDecision"))}`);
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
  redirect(`/admin?message=${encodeURIComponent(await message("decisionSaved"))}`);
}
