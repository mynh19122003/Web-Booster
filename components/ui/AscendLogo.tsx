import React from "react";

interface AscendLogoProps {
  variant?: "icon" | "horizontal" | "full";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showTagline?: boolean;
}

export function AscendLogo({
  variant = "horizontal",
  size = "md",
  className = "",
  showTagline = true,
}: AscendLogoProps) {
  // Dimensions based on size
  const iconSizes = {
    sm: 26,
    md: 34,
    lg: 48,
    xl: 64,
  };

  const currentIconSize = iconSizes[size];

  if (variant === "icon") {
    return (
      <svg
        width={currentIconSize}
        height={currentIconSize}
        viewBox="0 0 160 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`transition-transform duration-300 drop-shadow-[0_0_12px_rgba(255,159,60,0.45)] ${className}`}
        aria-hidden="true"
      >
        <defs>
          {/* Prime Gold Gradient */}
          <linearGradient id="ascend-gold-light" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F5D7A1" />
            <stop offset="45%" stopColor="#FF9F3C" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>

          {/* Burnt Orange Gradient */}
          <linearGradient id="ascend-burnt" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF9F3C" />
            <stop offset="60%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#8A3E00" />
          </linearGradient>

          {/* Slate Metallic Gradient */}
          <linearGradient id="ascend-slate-left" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3A3A42" />
            <stop offset="50%" stopColor="#25252B" />
            <stop offset="100%" stopColor="#151518" />
          </linearGradient>

          <linearGradient id="ascend-slate-right" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#454550" />
            <stop offset="50%" stopColor="#2C2C33" />
            <stop offset="100%" stopColor="#18181C" />
          </linearGradient>

          {/* Vertical Light Ray */}
          <linearGradient id="ascend-ray" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FF9F3C" stopOpacity="0" />
            <stop offset="25%" stopColor="#FF9F3C" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="75%" stopColor="#FF9F3C" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#D97706" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Central Vertical Light Ray */}
        <line
          x1="80"
          y1="4"
          x2="80"
          y2="156"
          stroke="url(#ascend-ray)"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.85"
        />

        {/* Background Celestial Ring / Halo */}
        <circle
          cx="80"
          cy="72"
          r="46"
          stroke="#FF9F3C"
          strokeWidth="1.2"
          strokeOpacity="0.28"
          strokeDasharray="90 12"
          fill="none"
        />

        {/* Outer Left Wing Blade (Gold Face) */}
        <polygon
          points="80,24 80,68 34,98 58,74"
          fill="url(#ascend-gold-light)"
        />

        {/* Outer Right Wing Blade (Burnt Orange Face) */}
        <polygon
          points="80,24 80,68 126,98 102,74"
          fill="url(#ascend-burnt)"
        />

        {/* Main Central Arrowhead - Left Side */}
        <polygon
          points="80,20 62,72 80,60"
          fill="url(#ascend-gold-light)"
        />

        {/* Main Central Arrowhead - Right Side */}
        <polygon
          points="80,20 98,72 80,60"
          fill="url(#ascend-burnt)"
        />

        {/* Central Diamond Inner Core */}
        <polygon
          points="80,60 62,72 80,108 80,60"
          fill="url(#ascend-gold-light)"
        />
        <polygon
          points="80,60 98,72 80,108 80,60"
          fill="url(#ascend-burnt)"
        />

        {/* Left Lower Wing (Slate Metallic with Gold Trim) */}
        <polygon
          points="80,88 64,88 44,116 66,104"
          fill="url(#ascend-slate-left)"
        />
        <polygon
          points="66,104 44,116 68,136 78,108"
          fill="url(#ascend-slate-right)"
        />
        {/* Left Wing Gold Trim Line */}
        <polyline
          points="44,116 68,136 78,108"
          stroke="#FF9F3C"
          strokeWidth="1.2"
          strokeOpacity="0.8"
          fill="none"
        />

        {/* Right Lower Wing (Slate Metallic with Gold Trim) */}
        <polygon
          points="80,88 96,88 116,116 94,104"
          fill="url(#ascend-slate-right)"
        />
        <polygon
          points="94,104 116,116 92,136 82,108"
          fill="url(#ascend-slate-left)"
        />
        {/* Right Wing Gold Trim Line */}
        <polyline
          points="116,116 92,136 82,108"
          stroke="#FF9F3C"
          strokeWidth="1.2"
          strokeOpacity="0.8"
          fill="none"
        />

        {/* Central Apex Glow Point */}
        <circle cx="80" cy="22" r="2.5" fill="#FFFFFF" />
        <circle cx="80" cy="72" r="3" fill="#FFFFFF" opacity="0.9" />
      </svg>
    );
  }

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Icon Graphic */}
      <svg
        width={currentIconSize}
        height={currentIconSize}
        viewBox="0 0 160 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0 transition-transform duration-300 drop-shadow-[0_0_14px_rgba(255,159,60,0.5)]"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="ascend-h-gold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F5D7A1" />
            <stop offset="45%" stopColor="#FF9F3C" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>

          <linearGradient id="ascend-h-burnt" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF9F3C" />
            <stop offset="60%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#8A3E00" />
          </linearGradient>

          <linearGradient id="ascend-h-slate-l" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3A3A42" />
            <stop offset="50%" stopColor="#25252B" />
            <stop offset="100%" stopColor="#151518" />
          </linearGradient>

          <linearGradient id="ascend-h-slate-r" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#454550" />
            <stop offset="50%" stopColor="#2C2C33" />
            <stop offset="100%" stopColor="#18181C" />
          </linearGradient>

          <linearGradient id="ascend-h-ray" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FF9F3C" stopOpacity="0" />
            <stop offset="30%" stopColor="#FF9F3C" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="70%" stopColor="#FF9F3C" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#D97706" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Central Vertical Light Ray */}
        <line
          x1="80"
          y1="6"
          x2="80"
          y2="154"
          stroke="url(#ascend-h-ray)"
          strokeWidth="2.2"
          strokeLinecap="round"
          opacity="0.85"
        />

        {/* Background Celestial Ring / Halo */}
        <circle
          cx="80"
          cy="72"
          r="46"
          stroke="#FF9F3C"
          strokeWidth="1.2"
          strokeOpacity="0.32"
          fill="none"
        />

        {/* Outer Left Wing Blade */}
        <polygon points="80,24 80,68 34,98 58,74" fill="url(#ascend-h-gold)" />

        {/* Outer Right Wing Blade */}
        <polygon points="80,24 80,68 126,98 102,74" fill="url(#ascend-h-burnt)" />

        {/* Main Central Arrowhead */}
        <polygon points="80,20 62,72 80,60" fill="url(#ascend-h-gold)" />
        <polygon points="80,20 98,72 80,60" fill="url(#ascend-h-burnt)" />

        {/* Central Diamond Inner Core */}
        <polygon points="80,60 62,72 80,108 80,60" fill="url(#ascend-h-gold)" />
        <polygon points="80,60 98,72 80,108 80,60" fill="url(#ascend-h-burnt)" />

        {/* Left Lower Wing (Slate Metallic with Gold Trim) */}
        <polygon points="80,88 64,88 44,116 66,104" fill="url(#ascend-h-slate-l)" />
        <polygon points="66,104 44,116 68,136 78,108" fill="url(#ascend-h-slate-r)" />
        <polyline points="44,116 68,136 78,108" stroke="#FF9F3C" strokeWidth="1.2" strokeOpacity="0.8" fill="none" />

        {/* Right Lower Wing (Slate Metallic with Gold Trim) */}
        <polygon points="80,88 96,88 116,116 94,104" fill="url(#ascend-h-slate-r)" />
        <polygon points="94,104 116,116 92,136 82,108" fill="url(#ascend-h-slate-l)" />
        <polyline points="116,116 92,136 82,108" stroke="#FF9F3C" strokeWidth="1.2" strokeOpacity="0.8" fill="none" />

        {/* Glowing Center Core */}
        <circle cx="80" cy="22" r="2.5" fill="#FFFFFF" />
        <circle cx="80" cy="72" r="3.2" fill="#FFFFFF" opacity="0.9" />
      </svg>

      {/* Wordmark and Tagline */}
      <div className="flex flex-col justify-center leading-none">
        <div className="flex items-center">
          <span
            className={`font-black tracking-[0.14em] text-white font-sans ${
              size === "sm"
                ? "text-lg"
                : size === "lg"
                ? "text-3xl"
                : size === "xl"
                ? "text-4xl"
                : "text-xl"
            }`}
            style={{
              textShadow: "0 0 20px rgba(255, 159, 60, 0.25)",
            }}
          >
            ASCEND
          </span>
          <span className="text-[#FF9F3C] text-[10px] font-bold align-top ml-1">
            ®
          </span>
        </div>

        {showTagline && size !== "sm" && (
          <span className="text-[8px] sm:text-[9px] font-semibold tracking-[0.24em] text-[#F5D7A1]/85 uppercase mt-1">
            BOOST YOUR POTENTIAL
          </span>
        )}
      </div>
    </div>
  );
}
