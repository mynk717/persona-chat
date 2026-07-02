"use client";

import type { Persona } from "@/types/persona";

interface PersonaSelectorProps {
  personas: Persona[];
  selectedPersonaId: string;
  onSelect: (personaId: string) => void;
}

function hexToRgba(hexColor: string, alpha: number): string {
  const normalized = hexColor.replace("#", "");
  const value = normalized.length === 3
    ? normalized
        .split("")
        .map((char) => char + char)
        .join("")
    : normalized;

  const numeric = Number.parseInt(value, 16);
  const r = (numeric >> 16) & 255;
  const g = (numeric >> 8) & 255;
  const b = numeric & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getInitials(fullName: string): string {
  return fullName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function PersonaSelector({
  personas,
  selectedPersonaId,
  onSelect
}: PersonaSelectorProps): JSX.Element {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {personas.map((persona) => {
        const isSelected = persona.id === selectedPersonaId;

        return (
          <button
            key={persona.id}
            type="button"
            onClick={() => onSelect(persona.id)}
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-left transition duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.05]"
            style={{
              borderColor: isSelected ? persona.meta.theme_color : undefined,
              boxShadow: isSelected
                ? `0 0 0 1px ${hexToRgba(persona.meta.theme_color, 0.45)}, 0 0 30px ${hexToRgba(
                    persona.meta.theme_color,
                    0.2
                  )}`
                : undefined
            }}
          >
            <div
              className="absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100"
              style={{
                background: `linear-gradient(135deg, ${hexToRgba(
                  persona.meta.theme_color,
                  0.12
                )}, transparent 48%)`
              }}
            />
            <div className="relative flex items-center gap-4">
              <div
                className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl text-sm font-semibold text-white"
                style={{
                  background: `linear-gradient(135deg, ${hexToRgba(
                    persona.meta.theme_color,
                    0.75
                  )}, ${hexToRgba(persona.meta.theme_color, 0.35)})`
                }}
              >
                <span>{getInitials(persona.meta.full_name)}</span>
                <img
                  src={persona.meta.avatar_url}
                  alt={persona.meta.full_name}
                  className="absolute inset-0 h-full w-full object-cover"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              </div>
              <div className="min-w-0">
                <div className="font-display text-lg font-semibold text-white">
                  {persona.meta.full_name}
                </div>
                <div
                  className="mt-1 inline-flex rounded-full px-3 py-1 text-xs font-medium"
                  style={{
                    backgroundColor: hexToRgba(persona.meta.theme_color, 0.16),
                    color: persona.meta.theme_color
                  }}
                >
                  {persona.meta.profession}
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
