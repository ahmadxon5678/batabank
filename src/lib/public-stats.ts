import { getBadgeForContainers } from "@/lib/badges";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";
import type { PickupStatus, Profile, Submission } from "@/lib/types";

type ApprovedRow = Pick<
  Submission,
  | "profile_id"
  | "containers_count"
  | "estimated_battery_count"
  | "estimated_weight_kg"
  | "collection_date"
  | "reviewed_at"
  | "pickup_status"
> & {
  profiles: Pick<Profile, "institution_name" | "institution_type" | "region_city" | "approval_status"> | null;
};

export type PublicInstitutionStat = {
  profileId: string;
  name: string;
  type: Profile["institution_type"];
  region: string;
  containers: number;
  batteries: number;
  weight: number | null;
  latestActivity: string | null;
  badgeLabel: string;
  badgeKey: string;
};

export type RegionStat = {
  region: string;
  institutions: number;
  containers: number;
  batteries: number;
  weight: number | null;
  latestActivity: string | null;
};

export async function getApprovedStats() {
  if (!hasSupabaseEnv()) {
    return {
      rows: [] as ApprovedRow[],
      institutions: [] as PublicInstitutionStat[],
      regions: [] as RegionStat[],
      pickup: {} as Record<PickupStatus, number>,
    };
  }

  try {
    const supabase = await createClient();
    const { data: rpcRows, error: rpcError } = await supabase.rpc("public_leaderboard");

    if (!rpcError && rpcRows) {
      const institutions = ((rpcRows ?? []) as {
        profile_id: string;
        institution_name: string;
        institution_type: Profile["institution_type"];
        region_city: string;
        approved_containers: number;
        approved_batteries: number;
        approved_weight: number | null;
        latest_activity_date: string | null;
      }[]).map((row) => {
        const badge = getBadgeForContainers(Number(row.approved_containers));
        return {
          profileId: row.profile_id,
          name: row.institution_name,
          type: row.institution_type,
          region: row.region_city,
          containers: Number(row.approved_containers),
          batteries: Number(row.approved_batteries),
          weight: row.approved_weight === null ? null : Number(row.approved_weight),
          latestActivity: row.latest_activity_date,
          badgeLabel: badge.label,
          badgeKey: badge.key,
        } satisfies PublicInstitutionStat;
      });

      const { data: recentRows } = await supabase.rpc("public_recent_activity");
      const { data: pickupRows } = await supabase.rpc("public_pickup_stats");
      const rows = ((recentRows ?? []) as {
        profile_id: string;
        institution_name: string;
        institution_type: Profile["institution_type"];
        region_city: string;
        containers_count: number;
        estimated_battery_count: number;
        estimated_weight_kg: number | null;
        collection_date: string;
        reviewed_at: string | null;
        pickup_status: PickupStatus;
      }[]).map((row) => ({
        profile_id: row.profile_id,
        containers_count: Number(row.containers_count),
        estimated_battery_count: Number(row.estimated_battery_count),
        estimated_weight_kg: row.estimated_weight_kg === null ? null : Number(row.estimated_weight_kg),
        collection_date: row.collection_date,
        reviewed_at: row.reviewed_at,
        pickup_status: row.pickup_status,
        profiles: {
          institution_name: row.institution_name,
          institution_type: row.institution_type,
          region_city: row.region_city,
          approval_status: "approved",
        },
      })) satisfies ApprovedRow[];
      const pickup = ((pickupRows ?? []) as { pickup_status: PickupStatus; total: number }[]).reduce((acc, row) => {
        acc[row.pickup_status] = Number(row.total);
        return acc;
      }, {} as Record<PickupStatus, number>);

      return {
        rows,
        institutions,
        regions: groupRegions(institutions),
        pickup,
      };
    }

    const { data } = await supabase
      .from("submissions")
      .select(
        "profile_id, containers_count, estimated_battery_count, estimated_weight_kg, collection_date, reviewed_at, pickup_status, profiles(institution_name, institution_type, region_city, approval_status)",
      )
      .eq("status", "approved");

    const rows = ((data ?? []) as unknown as ApprovedRow[]).filter((row) => row.profiles?.approval_status === "approved");
    const institutions = groupInstitutions(rows);
    const regions = groupRegions(institutions);
    const pickup = rows.reduce((acc, row) => {
      acc[row.pickup_status] = (acc[row.pickup_status] ?? 0) + 1;
      return acc;
    }, {} as Record<PickupStatus, number>);

    return { rows, institutions, regions, pickup };
  } catch {
    return {
      rows: [] as ApprovedRow[],
      institutions: [] as PublicInstitutionStat[],
      regions: [] as RegionStat[],
      pickup: {} as Record<PickupStatus, number>,
    };
  }
}

function groupInstitutions(rows: ApprovedRow[]) {
  const grouped = new Map<string, PublicInstitutionStat>();

  rows.forEach((row) => {
    if (!row.profiles) return;
    const current =
      grouped.get(row.profile_id) ??
      ({
        profileId: row.profile_id,
        name: row.profiles.institution_name,
        type: row.profiles.institution_type,
        region: row.profiles.region_city,
        containers: 0,
        batteries: 0,
        weight: null,
        latestActivity: null,
        badgeLabel: "",
        badgeKey: "",
      } satisfies PublicInstitutionStat);

    current.containers += row.containers_count;
    current.batteries += row.estimated_battery_count;
    current.weight =
      current.weight === null && row.estimated_weight_kg === null
        ? null
        : (current.weight ?? 0) + (row.estimated_weight_kg ?? 0);
    current.latestActivity = latestDate(current.latestActivity, row.reviewed_at ?? row.collection_date);

    const badge = getBadgeForContainers(current.containers);
    current.badgeLabel = badge.label;
    current.badgeKey = badge.key;
    grouped.set(row.profile_id, current);
  });

  return [...grouped.values()].sort((a, b) => b.containers - a.containers || b.batteries - a.batteries);
}

function groupRegions(institutions: PublicInstitutionStat[]) {
  const grouped = new Map<string, RegionStat>();

  institutions.forEach((institution) => {
    const current =
      grouped.get(institution.region) ??
      ({
        region: institution.region,
        institutions: 0,
        containers: 0,
        batteries: 0,
        weight: null,
        latestActivity: null,
      } satisfies RegionStat);

    current.institutions += 1;
    current.containers += institution.containers;
    current.batteries += institution.batteries;
    current.weight =
      current.weight === null && institution.weight === null
        ? null
        : (current.weight ?? 0) + (institution.weight ?? 0);
    current.latestActivity = latestDate(current.latestActivity, institution.latestActivity);
    grouped.set(institution.region, current);
  });

  return [...grouped.values()].sort((a, b) => b.containers - a.containers || b.batteries - a.batteries);
}

function latestDate(a: string | null, b: string | null) {
  if (!a) return b;
  if (!b) return a;
  return new Date(a).getTime() >= new Date(b).getTime() ? a : b;
}
