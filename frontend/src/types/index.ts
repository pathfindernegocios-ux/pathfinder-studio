export type Status = "STARTING" | "READY" | "BUSY" | "ERROR" | "UNKNOWN";

export interface AspectOption {
  label: string;
  short: string;
  ratio: number;
}

export interface GenerationInfo {
  id?: string;
  status?: string;
  progress?: number;
  stage?: string;
  started_at?: number;
  finished_at?: number;
  output_url?: string;
  error?: string;
  cancellable?: boolean;
}

export interface LogEntry {
  seq: number;
  ts: number;
  msg: string;
}