import React from 'react';

interface LienChauLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showSlogan?: boolean;
}

export const LienChauLogo: React.FC<LienChauLogoProps> = ({
  className = '',
  size = 'md',
  showText = false,
  showSlogan = false,
}) => {
  const sizeMap = {
    sm: 'h-7 w-7',
    md: 'h-9 w-9',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {/* Emblem SVG */}
      <div
        className={`${sizeMap[size]} shrink-0 rounded-xl bg-white p-1 shadow-xs border border-emerald-100 dark:border-slate-800 dark:bg-slate-900 flex items-center justify-center overflow-hidden`}
      >
        <svg
          viewBox="0 0 400 460"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g fill="#1f8354">
            {/* Outer Left Leaf Blade */}
            <path d="M 268 8 C 236 50 188 112 144 168 C 114 206 94 248 108 288 C 124 334 180 348 250 338 C 215 328 185 308 162 282 C 140 256 136 226 146 196 C 159 156 196 104 239 62 C 249 50 259 38 268 28 Z" />

            {/* Inner Right Leaf Blade */}
            <path d="M 269 8 C 265 26 246 66 220 116 C 190 176 162 242 160 292 C 160 304 163 316 167 328 C 204 338 242 316 265 248 C 262 234 250 238 240 242 C 214 252 186 244 179 204 C 173 166 197 110 233 54 C 249 30 263 16 269 8 Z" />

            {/* Bottom Gentle Underline */}
            <path d="M 136 376 C 172 364 212 360 262 366 C 242 369 202 373 172 380 C 156 383 143 380 136 376 Z" />
          </g>

          {/* LIÊN CHÂU Branding in SVG */}
          <text
            x="200"
            y="416"
            textAnchor="middle"
            fill="#1f8354"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="800"
            fontSize="44"
            letterSpacing="3"
          >
            LIÊN CHÂU
          </text>
        </svg>
      </div>

      {/* Optional Side Text */}
      {showText && (
        <div className="flex flex-col">
          <span className="font-extrabold tracking-wider text-emerald-800 dark:text-emerald-400 text-sm leading-tight uppercase font-sans">
            LIÊN CHÂU
          </span>
          {showSlogan && (
            <span className="text-[10px] text-slate-500 dark:text-slate-400 italic font-serif leading-tight">
              Go With You
            </span>
          )}
        </div>
      )}
    </div>
  );
};
