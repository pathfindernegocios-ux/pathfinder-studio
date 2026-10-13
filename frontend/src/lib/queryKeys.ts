// src/lib/queryKeys.ts
// Factory de query keys.
export const queryKeys = {
  models: {
    all: ['models'] as const,
    byId: (id: string) => ['models', id] as const,
  },
  runtimes: {
    all: ['runtimes'] as const,
    byStation: (stationId: string) => ['runtimes', 'station', stationId] as const,
    byModel: (stationId: string, modelId: string) =>
      ['runtimes', 'station', stationId, 'model', modelId] as const,
  },
  creations: {
    all: ['creations'] as const,
    byUser: (userId: string) => ['creations', 'user', userId] as const,
    byId: (id: string) => ['creations', 'id', id] as const,
  },
  profile: {
    all: ['profile'] as const,
    byId: (userId: string) => ['profile', userId] as const,
  },
  userModels: {
    all: ['user_models'] as const,
    byUser: (userId: string) => ['user_models', 'user', userId] as const,
  },
  bootLogs: {
    byStation: (stationId: string) => ['boot_logs', stationId] as const,
  },
} as const;
