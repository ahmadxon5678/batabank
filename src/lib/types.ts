export type InstitutionType = "school" | "university" | "government" | "other";
export type ProfileRole = "institution" | "admin";
export type ProfileApprovalStatus = "pending" | "approved" | "rejected";
export type SubmissionStatus = "pending" | "approved" | "rejected";
export type PickupStatus =
  | "not_requested"
  | "requested"
  | "scheduled"
  | "picked_up"
  | "delivered_to_partner"
  | "cancelled";

export type Profile = {
  id: string;
  institution_name: string;
  institution_type: InstitutionType;
  region_city: string;
  contact_person: string;
  contact: string;
  role: ProfileRole;
  approval_status: ProfileApprovalStatus;
  approval_note: string | null;
  approved_by: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Submission = {
  id: string;
  profile_id: string;
  containers_count: number;
  estimated_battery_count: number;
  estimated_weight_kg: number | null;
  collection_date: string;
  status: SubmissionStatus;
  admin_note: string | null;
  message: string | null;
  pickup_requested: boolean;
  pickup_status: PickupStatus;
  pickup_address: string | null;
  pickup_note: string | null;
  pickup_updated_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export type SubmissionPhoto = {
  id: string;
  submission_id: string;
  profile_id: string;
  storage_path: string;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Profile, "id" | "created_at" | "updated_at">>;
      };
      submissions: {
        Row: Submission;
        Insert: Omit<
          Submission,
          "id" | "status" | "admin_note" | "reviewed_by" | "reviewed_at" | "created_at"
        > & {
          id?: string;
          status?: SubmissionStatus;
          admin_note?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Omit<Submission, "id" | "profile_id" | "created_at">>;
      };
      submission_photos: {
        Row: SubmissionPhoto;
        Insert: Omit<SubmissionPhoto, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<SubmissionPhoto, "id" | "created_at">>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      institution_type: InstitutionType;
      profile_role: ProfileRole;
      profile_approval_status: ProfileApprovalStatus;
      submission_status: SubmissionStatus;
      pickup_status: PickupStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
