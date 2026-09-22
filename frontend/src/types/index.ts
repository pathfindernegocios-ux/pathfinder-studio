export type Status = "STARTING" | "READY" | "BUSY" | "ERROR" | "UNKNOWN";

export type CapabilityId = "image" | "video" | "audio";

export type GenerationJobStatus =
  | "idle"
  | "preparing"
  | "running"
  | "complete"
  | "error"
  | "cancelled";

export type RecoveryState = "checking" | "idle" | "active";

export type AccountStatus =
  | "provisional"
  | "active"
  | "suspended"
  | "deletion_pending"
  | "purged";

export interface Profile {
  id: string;
  email: string | null;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  country: string | null;
  locale: string;
  plan: string;
  account_status: AccountStatus;
  station_id: string | null;
  hours_used: number | null;
  tos_accepted_at: string | null;
  tos_version: string | null;
  privacy_version: string | null;
  onboarding_completed_at: string | null;
  how_it_works_viewed_at: string | null;
  last_seen_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  /**
   * Campo opcional de compatibilidad. No viene de la DB,
   * pero el Sidebar lo consulta como fallback de email.
   * Tipado específico para permitir `.email` sin `any`.
   */
  user_metadata?: { email?: string; [key: string]: unknown };
}

export interface GenerationInfo {
  id?: string;
  capability?: CapabilityId;
  model?: string;
  runtime?: string;
  modelId?: string;
  prompt?: string;
  status?: GenerationJobStatus;
  progress?: number;
  stage?: string;
  started_at?: number;
  finished_at?: number;
  output_url?: string;
  error?: string;
  cancellable?: boolean;
}

export interface AspectOption {
  label: string;
  short: string;
  ratio: number;
}

export interface LogEntry {
  seq: number;
  ts: number;
  msg: string;
}

export interface Creation {
  id: string;
  user_id: string;
  prompt: string;
  seed: number | null;
  duration: string | null;
  resolution: string | null;
  aspect_ratio: string | null;
  guide_scale: number | null;
  match_audio_dur: boolean | null;
  model: string | null;
  engine: string | null;
  input_start_image: string | null;
  input_end_image: string | null;
  input_audio: string | null;
  storage_key: string;
  status: "processing" | "ready" | "failed" | "expired" | "deleted";
  media_type?: "image" | "video" | "audio";
  model_id?: string | null;
  generation_id?: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  expires_at: string;
}
