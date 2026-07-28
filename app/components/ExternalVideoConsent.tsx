"use client";

import { useState } from "react";

type Props = {
  embedUrl: string;
  notice: string;
  buttonLabel: string;
  provider: string;
  posterUrl: string;
  title: string;
};

export function ExternalVideoConsentView({
  consented,
  onConsent,
  embedUrl,
  notice,
  buttonLabel,
  provider,
  posterUrl,
  title,
}: Props & {
  consented: boolean;
  onConsent: () => void;
}) {
  if (consented) {
    return (
      <iframe
        className="full-video"
        src={embedUrl}
        title={title}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        sandbox="allow-scripts allow-same-origin allow-presentation"
      />
    );
  }

  return (
    <div className="full-video external-video-consent">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={posterUrl} alt="" />
      <div>
        <p>{notice}</p>
        <button
          type="button"
          className="email-link focus-ring"
          onClick={onConsent}
        >
          {buttonLabel} — {provider}
        </button>
      </div>
    </div>
  );
}

export function ExternalVideoConsent(props: Props) {
  const [consented, setConsented] = useState(false);

  return (
    <ExternalVideoConsentView
      {...props}
      consented={consented}
      onConsent={() => setConsented(true)}
    />
  );
}
