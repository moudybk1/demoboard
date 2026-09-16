"use client";

import { useState } from "react";

import { PixelButton } from "@/components/ui/pixel-button";
import {
  PixelPanel,
  PixelPanelHeader,
  PixelPanelTitle,
} from "@/components/ui/pixel-panel";
import { MOCK_ACCOUNT, PIXEL_AVATARS } from "@/lib/mock/account";
import { cn } from "@/lib/utils";

/**
 * Profile editor with a pixel avatar picker (mock save).
 */
export function ProfileAvatarForm() {
  const [username, setUsername] = useState(MOCK_ACCOUNT.username);
  const [avatarId, setAvatarId] = useState(MOCK_ACCOUNT.avatarId);
  const [saved, setSaved] = useState(false);

  const selected =
    PIXEL_AVATARS.find((item) => item.id === avatarId) ?? PIXEL_AVATARS[0];

  return (
    <PixelPanel tone="raised" className="overflow-hidden">
      <PixelPanelHeader>
        <PixelPanelTitle>Pixel avatar</PixelPanelTitle>
      </PixelPanelHeader>

      <div className="space-y-6 p-5">
        <div className="flex items-center gap-4">
          <span
            aria-hidden
            className="pixel-corners grid size-16 place-items-center border-2 border-gold-deep font-pixel text-base text-void shadow-pixel-sm"
            style={{ backgroundColor: selected.tint }}
          >
            {username.slice(0, 2).toUpperCase() || "??"}
          </span>
          <div>
            <p className="font-pixel text-sm font-bold text-parchment">{username || "…"}</p>
            <p className="mt-1 text-xs text-muted">{selected.label}</p>
          </div>
        </div>

        <label className="block">
          <span className="font-pixel text-xs uppercase text-muted">
            Display name
          </span>
          <input
            value={username}
            onChange={(event) => {
              setUsername(event.target.value);
              setSaved(false);
            }}
            className="mt-2 w-full border-2 border-edge bg-void px-3 py-3 text-sm text-parchment outline-none focus:border-gold"
          />
        </label>

        <fieldset>
          <legend className="font-pixel text-xs uppercase text-muted">
            Choose avatar
          </legend>
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {PIXEL_AVATARS.map((avatar) => {
              const active = avatar.id === avatarId;
              return (
                <button
                  key={avatar.id}
                  type="button"
                  aria-pressed={active}
                  aria-label={avatar.label}
                  onClick={() => {
                    setAvatarId(avatar.id);
                    setSaved(false);
                  }}
                  className={cn(
                    "pixel-corners aspect-square border-2 transition-colors",
                    active
                      ? "border-gold shadow-pixel-sm"
                      : "border-edge hover:border-edge-bright",
                  )}
                  style={{ backgroundColor: avatar.tint }}
                />
              );
            })}
          </div>
        </fieldset>

        <div className="flex flex-wrap items-center gap-3">
          <PixelButton
            type="button"
            size="lg"
            onClick={() => setSaved(true)}
          >
            Save profile
          </PixelButton>
          {saved ? (
            <p className="font-pixel text-xs uppercase text-success">
              Saved (mock)
            </p>
          ) : null}
        </div>
      </div>
    </PixelPanel>
  );
}
