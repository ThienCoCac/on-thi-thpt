import type { SVGProps } from 'react';

interface DogMascotProps extends SVGProps<SVGSVGElement> {
  title?: string;
}

// Linh vật vector lấy cảm hứng từ ảnh chú chó đội mũ NICE.
// Dùng hình khối đơn giản để vẫn đọc được ở kích thước 36px trên header.
export function DogMascot({ title, className, ...props }: DogMascotProps) {
  return (
    <svg
      viewBox="0 0 128 128"
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      {...props}
    >
      {title ? <title>{title}</title> : null}

      <circle cx="64" cy="64" r="62" fill="#EAF1FD" />

      <g stroke="none">
        <ellipse
          cx="32"
          cy="71"
          rx="15"
          ry="27"
          transform="rotate(16 32 71)"
          fill="#D9A066"
        />
        <ellipse
          cx="32"
          cy="71"
          rx="8"
          ry="16"
          transform="rotate(16 32 71)"
          fill="#B97A4A"
          opacity="0.55"
        />
        <ellipse
          cx="96"
          cy="71"
          rx="15"
          ry="27"
          transform="rotate(-16 96 71)"
          fill="#D9A066"
        />
        <ellipse
          cx="96"
          cy="71"
          rx="8"
          ry="16"
          transform="rotate(-16 96 71)"
          fill="#B97A4A"
          opacity="0.55"
        />

        <ellipse cx="64" cy="69" rx="33" ry="31" fill="#F6E0BE" />
        <ellipse cx="64" cy="83" rx="20" ry="14" fill="#FFF9F0" />

        <circle cx="52" cy="66" r="3.6" fill="#26262E" />
        <circle cx="76" cy="66" r="3.6" fill="#26262E" />
        <circle cx="53.2" cy="64.8" r="1.2" fill="#FFFFFF" />
        <circle cx="77.2" cy="64.8" r="1.2" fill="#FFFFFF" />

        <circle cx="42" cy="81" r="3.6" fill="#F2A9A2" opacity="0.55" />
        <circle cx="86" cy="81" r="3.6" fill="#F2A9A2" opacity="0.55" />

        <ellipse cx="64" cy="78" rx="7" ry="5" fill="#26262E" />
        <ellipse cx="61.8" cy="76.4" rx="2.2" ry="1.3" fill="#5B5B66" />

        <path
          d="M64 83v3M64 86q-6 5-11 1M64 86q6 5 11 1"
          fill="none"
          stroke="#26262E"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path d="M56 91q8 10 16 0q-2 9-8 9t-8-9Z" fill="#F28C94" />
        <path
          d="M64 93v6"
          fill="none"
          stroke="#D96973"
          strokeWidth="1.4"
          strokeLinecap="round"
        />

        <path d="M34 47q2-28 30-28t30 28Z" fill="#1E3A8A" />
        <text
          x="64"
          y="39"
          textAnchor="middle"
          fontFamily="inherit"
          fontSize="11"
          fontWeight="800"
          letterSpacing="0.6"
          fill="#FFFFFF"
        >
          NICE
        </text>
        <path d="M33 40h62v5q0 4-4 4H37q-4 0-4-4Z" fill="#16295E" />
        <path
          d="M29 50q35-7 70 0q3 6-7 7H36q-10-1-7-7Z"
          fill="#16295E"
        />
        <circle cx="64" cy="20" r="2.8" fill="#F97316" />
      </g>
    </svg>
  );
}
