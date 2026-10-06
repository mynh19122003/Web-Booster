# Glass surface audit

Shared recipes are defined in `app/glass.css` and loaded after `globals.css` in `app/layout.tsx`. Major panels have ambient underlays; cards use interactive frosted surfaces; controls use sunken glass; overlays use 95% smoked glass. The rank configurator uses equal minmax tracks, and feature cards retain equal heights. The currency slider and gold primary actions retain their brand gradients. Footer payment marks use the shared 7xl bounds.

Additional component refinements: `ServiceConfigurator.tsx` (elevated panel and symmetric grid), `RecruitmentSection.tsx`, `FAQ.tsx`, and `FeatureShowcase.tsx` (isolated ambient glow stacking), `Currency.tsx` (frosted switch backing), `RegionSelector.module.css` (sunken trigger and smoked modal), and `Footer.tsx` (shared width).

Line numbers refer to the source before this refactor. The document canvas, brand accents, status indicators, imagery and tier colors are not container fills. Native option menus use smoked glass where supported by the browser.

| File | Line | Removed | Replacement |
| --- | ---: | --- | --- |
| app/globals.css | 481 | `background: #0b0b0f;` | `background: rgba(18, 19, 22, 0.4);` |
| app/globals.css | 590 | `background: #121212;` | `background: rgba(18, 19, 22, 0.4);` |
| app/globals.css | 625 | `background-color: #0F0F10;` | `background-color: rgba(18, 19, 22, 0.4);` |
| app/globals.css | 671 | `background: #0d1115;` | `background: rgba(18, 19, 22, 0.4);` |
| app/globals.css | 682 | `background: #171d23;` | `background: rgba(18, 19, 22, 0.4);` |
| app/globals.css | 698 | `background: #202a31;` | `background: rgba(18, 19, 22, 0.4);` |
| app/globals.css | 705 | `background: #1d252c;` | `background: rgba(18, 19, 22, 0.4);` |
| app/globals.css | 707 | `background: #1d272e;` | `background: rgba(18, 19, 22, 0.4);` |
| app/globals.css | 714 | `background: #202830;` | `background: rgba(18, 19, 22, 0.4);` |
| app/globals.css | 718 | `background: #29343d;` | `background: rgba(18, 19, 22, 0.4);` |
| app/globals.css | 738 | `background: #15151a;` | `background: rgba(18, 19, 22, 0.4);` |
| app/globals.css | 755 | `background: #09090b;` | `background: rgba(18, 19, 22, 0.4);` |
| app/globals.css | 1520 | `background: #09090d;` | `background: rgba(18, 19, 22, 0.4);` |
| app/globals.css | 1532 | `background: #292322;` | `background: rgba(18, 19, 22, 0.4);` |
| app/globals.css | 1554 | `background: #0c0c11;` | `background: rgba(18, 19, 22, 0.4);` |
| app/globals.css | 1657 | `background: #131317;` | `background: rgba(18, 19, 22, 0.4);` |
| app/globals.css | 1844 | `background: #24222a;` | `background: rgba(18, 19, 22, 0.4);` |
| app/globals.css | 1882 | `background: #827987;` | `background: rgba(18, 19, 22, 0.4);` |
| app/globals.css | 1897 | `background: #34303a;` | `background: rgba(18, 19, 22, 0.4);` |
| app/globals.css | 1907 | `background: #fff0df;` | `background: rgba(255, 255, 255, 0.06);` |
| app/globals.css | 2088 | `background: #121216;` | `background: rgba(18, 19, 22, 0.4);` |
| app/globals.css | 2312 | `background: #111116;` | `background: rgba(18, 19, 22, 0.4);` |
| app/globals.css | 2389 | `background: #19171a;` | `background: rgba(18, 19, 22, 0.4);` |
| app/globals.css | 2480 | `background: #08080a;` | `background: rgba(18, 19, 22, 0.4);` |
| app/globals.css | 2511 | `background: #121216;` | `background: rgba(18, 19, 22, 0.4);` |
| app/globals.css | 2588 | `background: #151419;` | `background: rgba(18, 19, 22, 0.4);` |
| app/globals.css | 3552 | `background: #111216;` | `background: rgba(18, 19, 22, 0.4);` |
| app/globals.css | 3568 | `background: #303238;` | `background: rgba(18, 19, 22, 0.4);` |
| app/globals.css | 3781 | `background: #0e1015;` | `background: rgba(18, 19, 22, 0.4);` |
| app/globals.css | 4056 | `background: #f4f5f7;` | `background: rgba(255, 255, 255, 0.06);` |
| app/globals.css | 4066 | `background: #fff;` | `background: rgba(255, 255, 255, 0.06);` |
| app/globals.css | 4104 | `background: #eaf4f0;` | `background: rgba(255, 255, 255, 0.06);` |
| app/globals.css | 4130 | `background: #fff;` | `background: rgba(255, 255, 255, 0.06);` |
| app/globals.css | 4142 | `background: #f5f6f8;` | `background: rgba(255, 255, 255, 0.06);` |
| app/globals.css | 4153 | `background: #eef2f1;` | `background: rgba(255, 255, 255, 0.06);` |
| app/globals.css | 4157 | `background: #fff;` | `background: rgba(255, 255, 255, 0.06);` |
| app/globals.css | 4160 | `background: #fff;` | `background: rgba(255, 255, 255, 0.06);` |
| app/globals.css | 4161 | `background: #fff;` | `background: rgba(255, 255, 255, 0.06);` |
| app/globals.css | 4163 | `background: #fff;` | `background: rgba(255, 255, 255, 0.06);` |
| app/globals.css | 4168 | `background: #eaf4f0;` | `background: rgba(255, 255, 255, 0.06);` |
| app/globals.css | 4173 | `background: #101317;` | `background: rgba(18, 19, 22, 0.4);` |
| app/globals.css | 4174 | `background: #171b20;` | `background: rgba(18, 19, 22, 0.4);` |
| app/globals.css | 4178 | `background: #1c3a35;` | `background: rgba(18, 19, 22, 0.4);` |
| app/globals.css | 4180 | `background: #1e242a;` | `background: rgba(18, 19, 22, 0.4);` |
| app/globals.css | 4182 | `background: #242c33;` | `background: rgba(18, 19, 22, 0.4);` |
| app/globals.css | 4183 | `background: #171b20;` | `background: rgba(18, 19, 22, 0.4);` |
| app/globals.css | 4186 | `background: #1c3a35;` | `background: rgba(18, 19, 22, 0.4);` |
| app/globals.css | 4215 | `background: #fff;` | `background: rgba(255, 255, 255, 0.06);` |
| app/globals.css | 4220 | `background: #edf1f3;` | `background: rgba(255, 255, 255, 0.06);` |
| app/globals.css | 4329 | `background: #e5efeb;` | `background: rgba(255, 255, 255, 0.06);` |
| app/globals.css | 4346 | `background: #fff;` | `background: rgba(255, 255, 255, 0.06);` |
| app/globals.css | 4368 | `background: #fff;` | `background: rgba(255, 255, 255, 0.06);` |
| app/globals.css | 4378 | `background: #fff;` | `background: rgba(255, 255, 255, 0.06);` |
| app/globals.css | 4390 | `background: #f8f9fb;` | `background: rgba(255, 255, 255, 0.06);` |
| app/globals.css | 4426 | `background: #eaf1ef;` | `background: rgba(255, 255, 255, 0.06);` |
| app/globals.css | 4430 | `background: #eaf4f0;` | `background: rgba(255, 255, 255, 0.06);` |
| app/globals.css | 4432 | `background: #1c3a35;` | `background: rgba(18, 19, 22, 0.4);` |
| app/globals.css | 4461 | `background: #fff;` | `background: rgba(255, 255, 255, 0.06);` |
| app/globals.css | 5018 | `background: #27272d;` | `background: rgba(18, 19, 22, 0.4);` |
| app/globals.css | 5229 | `background: #0b0c10;` | `background: rgba(18, 19, 22, 0.4);` |
| app/globals.css | 5386 | `background-color: #fff;` | `background-color: rgba(255, 255, 255, 0.06);` |
| app/globals.css | 5446 | `background-color: #fff;` | `background-color: rgba(255, 255, 255, 0.06);` |
| app/globals.css | 5482 | `background: #fff;` | `background: rgba(255, 255, 255, 0.06);` |
| app/globals.css | 5511 | `background: #f0f1f3;` | `background: rgba(255, 255, 255, 0.06);` |
| app/globals.css | 5516 | `background: #f7e8dc;` | `background: rgba(255, 255, 255, 0.06);` |
| app/globals.css | 5526 | `background: #fff;` | `background: rgba(255, 255, 255, 0.06);` |
| app/globals.css | 5534 | `background: #eceef1;` | `background: rgba(255, 255, 255, 0.06);` |
| app/globals.css | 5542 | `background: #fff;` | `background: rgba(255, 255, 255, 0.06);` |
| app/globals.css | 5545 | `background: #f3f4f6;` | `background: rgba(255, 255, 255, 0.06);` |
| app/globals.css | 5556 | `background: #fff;` | `background: rgba(255, 255, 255, 0.06);` |
| app/globals.css | 5571 | `background: #fff;` | `background: rgba(255, 255, 255, 0.06);` |
| app/globals.css | 5576 | `background: #f3f4f6;` | `background: rgba(255, 255, 255, 0.06);` |
| app/globals.css | 5580 | `background: #fafafa;` | `background: rgba(255, 255, 255, 0.06);` |
| app/globals.css | 5603 | `background: #fff;` | `background: rgba(255, 255, 255, 0.06);` |
| app/globals.css | 5611 | `background: #fff;` | `background: rgba(255, 255, 255, 0.06);` |
| app/globals.css | 5619 | `background: #fff;` | `background: rgba(255, 255, 255, 0.06);` |
| app/globals.css | 5626 | `background: #f3f4f6;` | `background: rgba(255, 255, 255, 0.06);` |
| components/ui/RegionSelector.module.css | 3 | `background: #0e0e10;` | `background: rgba(18, 19, 22, 0.4);` |
| components/ui/RegionSelector.module.css | 7 | `background: #121212;` | `background: rgba(18, 19, 22, 0.4);` |
| components/careers/RecruitmentForm.tsx | 145 | `bg-[#121316]` | `bg-[#121316]/95 backdrop-blur-2xl` |
| components/careers/RecruitmentForm.tsx | 163 | `bg-[#121316]` | `bg-[#121316]/95 backdrop-blur-2xl` |
| components/home/ServiceConfigurator.tsx | 126 | `bg-[#121316]` | `bg-[#121316]/95 backdrop-blur-2xl` |
| components/home/ServiceConfigurator.tsx | 274 | `bg-[#121316]` | `bg-[#121316]/95 backdrop-blur-2xl` |
| components/layout/Header.tsx | 275 | `bg-[#16161a]` | `bg-[#121316]/95 backdrop-blur-2xl` |
| components/layout/Header.tsx | 449 | `bg-[#16161a]` | `bg-[#121316]/95 backdrop-blur-2xl` |
