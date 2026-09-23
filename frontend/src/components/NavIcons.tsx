// src/components/NavIcons.tsx
//
// Iconos de navegación del Sidebar.
// Usamos lucide-react para consistencia con el resto de la app.
import React from 'react';
import {
  Sparkles,
  LayoutGrid,
  Server,
  GraduationCap,
  Settings as SettingsLucide,
  HelpCircle,
  Folder,
  Box,
} from 'lucide-react';

interface IconProps {
  className?: string;
  size?: number;
}

const DEFAULT_SIZE = 18;
const DEFAULT_STROKE = 1.8;

export const StudioIcon: React.FC<IconProps> = ({ className, size = DEFAULT_SIZE }) => (
  <Sparkles className={className} size={size} strokeWidth={DEFAULT_STROKE} />
);

export const ProjectsIcon: React.FC<IconProps> = ({ className, size = DEFAULT_SIZE }) => (
  <Folder className={className} size={size} strokeWidth={DEFAULT_STROKE} />
);

export const CreationsIcon: React.FC<IconProps> = ({ className, size = DEFAULT_SIZE }) => (
  <LayoutGrid className={className} size={size} strokeWidth={DEFAULT_STROKE} />
);

export const AssetsIcon: React.FC<IconProps> = ({ className, size = DEFAULT_SIZE }) => (
  <Box className={className} size={size} strokeWidth={DEFAULT_STROKE} />
);

export const AcademyIcon: React.FC<IconProps> = ({ className, size = DEFAULT_SIZE }) => (
  <GraduationCap className={className} size={size} strokeWidth={DEFAULT_STROKE} />
);

export const StationIcon: React.FC<IconProps> = ({ className, size = DEFAULT_SIZE }) => (
  <Server className={className} size={size} strokeWidth={DEFAULT_STROKE} />
);

export const SettingsIcon: React.FC<IconProps> = ({ className, size = DEFAULT_SIZE }) => (
  <SettingsLucide className={className} size={size} strokeWidth={DEFAULT_STROKE} />
);

export const HowItWorksIcon: React.FC<IconProps> = ({ className, size = DEFAULT_SIZE }) => (
  <HelpCircle className={className} size={size} strokeWidth={DEFAULT_STROKE} />
);
