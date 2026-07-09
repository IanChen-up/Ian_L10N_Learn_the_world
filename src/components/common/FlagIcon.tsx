import { useState } from "react";

function flagImageUrl(iso: string): string {
  return `https://flagcdn.com/w80/${iso.toLowerCase()}.png`;
}

export default function FlagIcon({
  iso,
  emoji,
  name,
  className = "h-6 w-8",
}: {
  iso: string;
  emoji: string;
  name: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <span className="text-lg leading-none">{emoji}</span>;
  }

  return (
    <img
      src={flagImageUrl(iso)}
      alt={name}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`${className} shrink-0 rounded-[3px] border border-border/70 bg-sunken object-cover shadow-sm`}
    />
  );
}

export { flagImageUrl };

