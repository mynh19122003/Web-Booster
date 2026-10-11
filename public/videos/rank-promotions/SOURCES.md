# Rank promotion assets

## Active UI assets: native transparent client video

Source: League of Legends client assets mirrored by CommunityDragon, pinned to patch 16.3. These files already contain a VP9 alpha channel; they are not screen recordings and require no chroma key or screen blending.

- Master: https://raw.communitydragon.org/16.3/plugins/rcp-fe-lol-static-assets/global/default/videos/ranked/tier-promotion-to-master.webm
- Grandmaster: https://raw.communitydragon.org/16.3/plugins/rcp-fe-lol-static-assets/global/default/videos/ranked/tier-promotion-to-grandmaster.webm
- Challenger: https://raw.communitydragon.org/16.3/plugins/rcp-fe-lol-static-assets/global/default/videos/ranked/tier-promotion-to-challenger.webm
- Asset directory: https://raw.communitydragon.org/16.3/plugins/rcp-fe-lol-static-assets/global/default/videos/ranked/
- Riot's explanation of transparent video in the client: https://www.riotgames.com/en/news/animation-league-legends-client

The UI maps the three apex ranks to `*-smooth.webm` and uses `*-smooth-rest.png` as resting artwork. All are served locally. The original downloads are retained under `outputs/rank-native-source/` for editing. The intermediate `*-client` and `*-clear` assets are retained for editing but are no longer displayed.

Editing pipeline:

- Decode using `libvpx-vp9` to preserve alpha (FFmpeg's native VP9 decoder can discard it).
- Keep source 0.15–5.65s, excluding the secondary light pulse at the end. Apply `setpts=0.9*(PTS-STARTPTS)` and output at 30fps. Finally trim the encoded timeline to 5s.
- Center crop 640×640 at x=320, y=40; scale to 480×480.
- Apply a light 0.3px blur to RGB only and highlight compression: `curves=all='0/0 0.25/0.25 0.5/0.49 0.75/0.68 1/0.78'`.
- Encode VP9 (`yuva420p`, `auto-alt-ref=0`, CRF 28, no audio).
- Clean the native alpha haze using `clip((alpha-24)*255/231,0,255)`. Native source edge pixels could retain alpha values of 3–19/255 during the animation, revealing a faint rectangular surface on a dark card.
- Bake a circular feather into the alpha: full opacity multiplier through normalized radius 0.6, smooth linear falloff to zero at radius 0.95. The outer border is fully transparent on every frame. RGB is unchanged during this pass.
- Smooth transient light bursts using a weighted five-frame temporal blend (`tmix=frames=5:weights='1 2 3 2 1'`) on RGB and alpha. This softens single-frame luminance spikes around 2.6–2.8s while retaining the original video animation and fully transparent borders. The five-frame filter produces 146 frames / 4.87s.
- Extract each resting PNG at output 4.8s using the alpha-aware decoder. Video and still use identical dimensions, grading and baked alpha.

Playback uses a 450ms crossfade, starts after the first decoded video frame and after decoding the ending artwork, plays once per committed tier increase and honors reduced motion. Video-frame callbacks track the end rather than relying only on sparse timeupdate events. The player pauses on a decoded tail frame before the fade, preventing a stopped video surface from flashing through. The ending phase is locked so buffering/playing events cannot reveal the video again. Cleanup pauses abandoned players and cancels their callbacks. There is no CSS mask on the video or still; the feather lives in the media alpha. No opaque backdrop is added. The isolated presentation stage keeps artwork compositing inside the rank stage.

The crossfade pair has its own isolated compositing group and uses normal alpha compositing throughout playback. Avoid additive `plus-lighter` blending on the video surface over the card's backdrop blur: it can expose a bright rectangular layer during transitions. The existing opacity fade and transparent media borders are preserved.

Artwork is owned by Riot Games; CommunityDragon is a community asset mirror, not a Riot endorsement.

## Previous editing sources (not used by the UI)

Source: user supplied local MP4 of https://www.youtube.com/watch?v=SomgtSsA2EI

| Clip | Source start | Duration |
| --- | --- | --- |
| master.mp4 | 01:02.0 | 6.8 seconds |
| grandmaster.mp4 | 01:12.7 | 6.8 seconds |
| challenger.mp4 | 01:22.6 | 7.0 seconds |

Center crop: 640×640 at x=320, y=40 from 1280×720. Output: 480×480, 30fps H.264, no audio, MP4 faststart.

The previous `-refined.webm` versions (VP9 with alpha) were derived from these MP4 clips. They skip 0.6s / 0.25s / 0.2s of the respective input clips, play at approximately 1.18× speed and finish at 4.6s. The original navy background was keyed with `colorkey=0x081a2b:0.14:0.06`. The matte received a 1.4px Gaussian blur, and RGB a light 0.45px blur at 480×480 to soften keyed edges and compression artifacts. These versions are retained as editing sources.

Playback crossfades over 450ms. The return to the static emblem starts within the final 500ms of footage, preserving the last decoded frame during the fade.

Highlight grading is baked into the footage: `curves=all='0/0 0.25/0.25 0.5/0.46 0.75/0.55 1/0.62'`. This preserves darker rank colors while compressing bright bursts. CSS no longer dims the whole video. A feathered elliptical mask attenuates outer beams and particles. Artwork width is capped at 240px and constrained to the card width.

The old `-rest.png` assets come from the decoded frame at 4.5s in each refined clip. They have been replaced in the UI by the native client resting frames above.

The footage contains the League of Legends emblems. It is mapped only to League of Legends; other games retain their own static emblems. Playback finishes on the native video ended event, falls back on error, and honors reduced motion.
