import { cx } from '@/lib/util'
import type { MascotMood } from '@/lib/gamification'

export function Mascot({
  stage = 1,
  mood = 'content',
  size = 140,
  className,
}: {
  /** 0 Seed · 1 Sprout · 2 Bud (two leaves) · 3 Bud (flower bud) · 4 Flourish */
  stage?: number
  mood?: MascotMood
  size?: number
  className?: string
}) {
  const happy = mood === 'happy'
  const sleepy = mood === 'sleepy'

  return (
    <svg
      viewBox="0 0 120 128"
      width={size}
      height={(size * 128) / 120}
      className={cx(className, happy ? 'mascot-bounce' : 'mascot-float')}
      aria-hidden
    >
      {/* ground shadow */}
      <ellipse cx="60" cy="114" rx="30" ry="6" fill="#2E2A26" opacity="0.05" />

      {/* growth on head, by stage */}
      {stage >= 1 && (
        <g className="sway">
          {stage === 1 && (
            <>
              <path d="M60 26v-9" stroke="#7FA98B" strokeWidth="2.5" strokeLinecap="round" />
              <ellipse cx="64.5" cy="14" rx="6" ry="3.6" fill="#9CC5A5" transform="rotate(-24 64.5 14)" />
            </>
          )}
          {stage === 2 && (
            <>
              <path d="M60 26v-11" stroke="#7FA98B" strokeWidth="2.5" strokeLinecap="round" />
              <ellipse cx="53" cy="14.5" rx="6" ry="3.6" fill="#9CC5A5" transform="rotate(-155 53 14.5)" />
              <ellipse cx="67" cy="14.5" rx="6" ry="3.6" fill="#8FBC9A" transform="rotate(-25 67 14.5)" />
            </>
          )}
          {stage === 3 && (
            <>
              <path d="M60 26v-10" stroke="#7FA98B" strokeWidth="2.5" strokeLinecap="round" />
              <ellipse cx="60" cy="11" rx="4.6" ry="6.4" fill="#F0B7C3" />
              <path d="M55.5 16c1.7 2.2 7.3 2.2 9 0" stroke="#8FBC9A" strokeWidth="2.2" fill="none" strokeLinecap="round" />
            </>
          )}
          {stage >= 4 && (
            <>
              <path d="M60 26v-8" stroke="#7FA98B" strokeWidth="2.5" strokeLinecap="round" />
              <g transform="translate(60 12)">
                {[0, 72, 144, 216, 288].map((a) => (
                  <ellipse
                    key={a}
                    cx="0"
                    cy="-5.2"
                    rx="3.6"
                    ry="5.4"
                    transform={`rotate(${a})`}
                    fill="#F0B7C3"
                    stroke="#E29FB0"
                    strokeWidth="0.8"
                  />
                ))}
                <circle r="3.4" fill="#E8C36B" />
              </g>
            </>
          )}
        </g>
      )}

      {/* body */}
      <path
        d="M60 24c24 0 40 17 40 42 0 26-16 40-40 40S20 92 20 66c0-25 16-42 40-42Z"
        fill="#EAF3EA"
        stroke="#A8C6AF"
        strokeWidth="2.5"
      />

      {/* arms */}
      <path d="M23 68c-5 1.5-8 5.5-7 10" stroke="#A8C6AF" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path
        d="M97 68c5 1.5 8 5.5 7 10"
        stroke="#A8C6AF"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        className={happy ? 'arm-wave' : ''}
      />

      {/* cheeks */}
      <ellipse cx="43" cy="73" rx="5.2" ry="3.1" fill="#F3C6B4" opacity="0.85" />
      <ellipse cx="77" cy="73" rx="5.2" ry="3.1" fill="#F3C6B4" opacity="0.85" />

      {/* eyes */}
      {sleepy ? (
        <>
          <path d="M41 63q4 3.5 8 0" stroke="#41503F" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <path d="M71 63q4 3.5 8 0" stroke="#41503F" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <g className="blink">
          <ellipse cx="46" cy="63" rx="3.2" ry="4.1" fill="#41503F" />
          <ellipse cx="74" cy="63" rx="3.2" ry="4.1" fill="#41503F" />
          <circle cx="47.2" cy="61.4" r="1.05" fill="#fff" />
          <circle cx="75.2" cy="61.4" r="1.05" fill="#fff" />
        </g>
      )}

      {/* mouth */}
      {happy ? (
        <path d="M50 74 Q60 78.5 70 74 Q60 88 50 74 Z" fill="#D98E7E" />
      ) : sleepy ? (
        <path d="M55 77.5q5 2.2 10 0" stroke="#41503F" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      ) : (
        <path d="M54 75.5q6 5 12 0" stroke="#41503F" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      )}

      {/* sleepy zzz */}
      {sleepy && (
        <g fontWeight="700" fill="#9D92C7">
          <text x="92" y="46" className="zz" fontSize="11">z</text>
          <text x="98" y="35" className="zz zz2" fontSize="13">z</text>
          <text x="105" y="23" className="zz zz3" fontSize="15">z</text>
        </g>
      )}
    </svg>
  )
}
