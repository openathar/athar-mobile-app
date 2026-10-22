# Earth sprites

The same planet as the website's 3D scene (`web/public/textures`: day map,
night map with city lights, clouds — NASA data via Solar System Scope,
CC BY 4.0), pre-rendered by `scripts/render-earth.mjs` into sprite sheets
(36 frames = one turn, 10° apart, 6×6 grid of 340 px, 2040 px per side).

| Files | Content |
| --- | --- |
| `earth-d{-23,-12,0,12,23}.jpg` | Lit from the right, day/night line and city lights baked in, one sheet per solar declination (the season: the day/night line leans with it). |
| `earth-L-d*.jpg` | Same, lit from the left — used when the viewer's place is east of the sun, so it stays on the visible half. |
| `earth-plain.jpg` | Evenly lit, no day/night line — for the Qibla map, which can turn to any meridian. |

The app picks the sheet nearest today's declination and the frame for the
real time of day (`src/lib/globe.ts`), and draws pins and the Qibla arc on
top with the matching projection (`src/components/earth.tsx`).
