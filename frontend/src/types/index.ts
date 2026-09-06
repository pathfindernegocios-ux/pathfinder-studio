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

export interface GenerationInfo {
  id?: string;
  capability?: CapabilityId;
  model?: string;
  runtime?: string;
  modelId?: string;
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