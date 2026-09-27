# 02 — HMTI Polinema: Social Presence & Visual Identity

Recon of HMTI Polinema's public social channels and the visual language each one
uses. Every factual claim below is followed by the URL it came from.

**Org under study:** Himpunan Mahasiswa Teknologi Informasi (HMTI), Jurusan
Teknologi Informasi, Politeknik Negeri Malang.

- Harvest window: **2026-09-27** (machine clock; all "recent" dates are relative to
  this).
- Method: headless Chromium (`agent-browser`, isolated session
  `social-4014bfb1490a`) + `curl`. Instagram and LinkedIn serve full metadata to a
  Googlebot user-agent; the browser was used where a JS render was needed
  (screenshots, DOM extraction, HAR capture of image bytes).
- Instagram's CDN rejects non-browser TLS fingerprints (`403`, `http_request_error`
  from `proxygen-bolt`), so IG images were captured as base64 bodies out of a
  Chrome DevTools HAR rather than fetched with `curl`.

---

## 1. Instagram — `@hmtipolinema`

Source: <https://www.instagram.com/hmtipolinema/>

| Field | Value | Source |
| --- | --- | --- |
| Username | `hmtipolinema` | <https://www.instagram.com/hmtipolinema/> |
| Display name | `HMTI Polinema` | <https://www.instagram.com/hmtipolinema/> |
| Followers | **6,820** (crawler metadata) / **6,818** (rendered page header) | <https://www.instagram.com/hmtipolinema/> |
| Following | **152** (crawler metadata) / **144** (rendered page header) | <https://www.instagram.com/hmtipolinema/> |
| Posts | **1,858** | <https://www.instagram.com/hmtipolinema/> (`og:description`) |
| Link in bio | **<https://linktr.ee/hmti_polinema>** | <https://www.instagram.com/hmtipolinema/> |

The follower/following pair disagrees between Instagram's crawler-rendered
`og:description` and its own client-rendered header on the same day; both numbers
are recorded verbatim above. The post count is only exposed through
`og:description`.

### Bio (verbatim)

Source: `og:description` / `meta[name=description]` on
<https://www.instagram.com/hmtipolinema/>

```
Official Account of Himpunan Mahasiswa Teknologi Informasi Politeknik Negeri Malang
🛒merch: @hmti.goods
#PROUDTOBEINFORMATICS
#TI_FAST #TI_BRAVO
```

So the canonical self-description uses the full expansion **"Himpunan Mahasiswa
Teknologi Informasi Politeknik Negeri Malang"** (no "Jurusan"), the merch account
**`@hmti.goods`**, and the three hashtags that recur on every channel.

### Story highlights (5 visible)

Screenshot: `research-shots/instagram-profile-header.png`

| # | Title (verbatim) | Cover art |
| --- | --- | --- |
| 1 | `Tenda MABA` | black checklist-in-square pictogram on white |
| 2 | `Ketum Terpilih` | black silhouette at a podium, yellow disc |
| 3 | `Bunga Wisuda` | black graduation cap, yellow disc |
| 4 | `Live Report` | black `LIVE` badge over a microphone, yellow disc |
| 5 | `INFO SKKM` | black document stack, yellow disc |

Cover titles and order: rendered DOM at <https://www.instagram.com/hmtipolinema/>.
The icon-to-title assignment is inferred from DOM order and confirmed visually
against the header screenshot — see `research-shots/instagram-highlights-montage.png`.

The highlight covers are the **most brand-true artifact on Instagram**: flat black
pictograms over a pure yellow disc on white. Measured palette across the five
covers: `#FFFFFF` dominant, `#FDE605`, `#FEE602`, `#FDEA4F`, `#EDDB4E` (yellow),
`#232114` (near-black). Analysis: Pillow `quantize(MEDIANCUT)` over
`assets/brand/social/instagram-highlight-*.png`.

### Pinned posts (top row of the grid)

Screenshot: `research-shots/instagram-feed-grid.png`

Confirmed in the rendered grid at <https://www.instagram.com/hmtipolinema/>:

1. **Malam Keakraban** teaser — candy/glassmorphism treatment
2. **TI-COMPSTREAM** — glass card with a magnifying glass over a sponsor site
3. **Selamat Memperingati Maulid Nabi MUHAMMAD SAW 12 Rabiul Awal 1448H** —
   lanterns + mosque, credited `Kabinet Adhigana / KOMINFO`

### Recent posts (12 harvested, with captions)

Captions are the full `og:description` served to a crawler UA at each permalink
(the same endpoint that is login-walled in a normal browser session).

| Date | Permalink | Headline | Local asset |
| --- | --- | --- | --- |
| 2026-09-24 | <https://www.instagram.com/hmtipolinema/p/DdsdhOGAdAM/> | `[EXTENDED REGISTRATION SEMINAR NASIONAL & WORKSHOP …]` | `instagram-post-2026-09-24-seminar-nasional-extended.jpg` |
| 2026-09-24 | <https://www.instagram.com/hmtipolinema/p/DdsTLlCgalJ/> | `[OPEN PRE-ORDER OFFICIAL T-SHIRT TEKNOLOGI INFORMASI]` | `instagram-post-2026-09-24-preorder-official-tshirt.jpg` |
| 2026-09-15 | <https://www.instagram.com/hmtipolinema/p/DdVpiPrFDrq/> | `[PENGUMUMAN KOMANDAN TINGKAT JURUSAN TEKNOLOGI INFORMASI ANGKATAN 2024]` | `instagram-post-2026-09-15-komandan-tingkat-2024.jpg` |
| 2026-09-11 | <https://www.instagram.com/hmtipolinema/p/DdJhuF0lH3A/> | `[TEASER OPEN RECRUITMENT … TAHUN 2026]` | `instagram-post-2026-09-11-teaser-open-recruitment.jpg` |
| 2026-09-10 | <https://www.instagram.com/hmtipolinema/p/DdIvQf7FCPT/> | `[SEMINAR NASIONAL & WORKSHOP … TAHUN 2026]` | `instagram-post-2026-09-10-seminar-nasional-workshop.jpg` |
| 2026-09-10 | <https://www.instagram.com/hmtipolinema/p/DdId0lVgRHQ/> | `[TI-COMPSTREAM]` | `instagram-post-2026-09-10-ti-compstream.jpg` |
| 2026-08-31 | <https://www.instagram.com/hmtipolinema/p/Dcs7rvjlHcZ/> | `[EXPO KELEMBAGAAN HMTI POLINEMA 2026]` | `instagram-post-2026-08-31-expo-kelembagaan.jpg` |
| 2026-08-28 | <https://www.instagram.com/hmtipolinema/p/Dck7uqslPrg/> | `[OPEN RECRUITMENT … TAHUN 2026]` | `instagram-post-2026-08-28-open-recruitment.jpg` |
| 2026-08-27 | <https://www.instagram.com/hmtipolinema/reel/DckhVtQhfD8/> | `[TEASER MALAM KEAKRABAN … ANGKATAN 2026]` (reel) | `instagram-post-2026-08-27-teaser-malam-keakraban.jpg` |
| 2026-08-26 | <https://www.instagram.com/hmtipolinema/p/Dcf2zpqFGCn/> | `[MALAM KEAKRABAN MAHASISWA BARU … ANGKATAN 2026]` | `instagram-post-2026-08-26-malam-keakraban-dharmasena.jpg` |
| 2026-08-25 | <https://www.instagram.com/hmtipolinema/p/DcdgMGdlAad/> | `[TI-COMPSTREAM]` | `instagram-post-2026-08-25-ti-compstream-competitions.jpg` |
| 2026-08-24 | <https://www.instagram.com/hmtipolinema/p/DccljYXhb1m/> | `[MAULID NABI MUHAMMAD SAW 1448]` | `instagram-post-2026-08-24-maulid-nabi.jpg` |

Engagement counts recorded from the same permalink metadata, e.g. `55 likes, 0
comments` on <https://www.instagram.com/hmtipolinema/p/DdsdhOGAdAM/>, `276 likes,
10 comments` on <https://www.instagram.com/hmtipolinema/p/DdVpiPrFDrq/>, `214
likes, 1 comments` on <https://www.instagram.com/hmtipolinema/reel/DckhVtQhfD8/>.

### Instagram's actual visual language (2026 "Kabinet Adhigana" era)

Contact sheet: `research-shots/instagram-posts-montage.png`

The feed does **not** use the yellow/blue logo palette. All twelve recent posts
sit on a **deep maroon / oxblood gradient** ground (the `2026-08-27` reel teaser
skews magenta), most with a low-opacity photo of JTI students composited behind
the type. Quantised dominant colours per post land in `#5C1A1C … #805954`
(aggregate leaders: `#6D3C3B`, `#612426`, `#5C1C1E`, `#47252D`). Analysis: Pillow
`quantize(MEDIANCUT)` over the twelve downloaded post images.

Recurring template furniture, consistent across the twelve:

- **Header strip** — three small social glyphs top-left (Instagram / LINE / X),
  and `HIMPUNAN MAHASISWA TEKNOLOGI INFORMASI POLITEKNIK NEGERI MALANG` in small
  caps top-right.
- **Headline lockup** — an italic script word (`Candy` / `Teaser` / `Extended` /
  `Open` / `Are You Ready?` / `It's Your Time`) set over a bold condensed
  uppercase word (`MALAM KEAKRABAN`, `OPEN RECRUITMENT`, `SEMINAR NASIONAL`,
  `EXPO KELEMBAGAAN`, `TI-COMPSTREAM`), both in a white→gold gradient with a
  sparkle glint and light streaks.
- **Footer strip** — `[IG│X / FB│TikTok] │ @hmtipolinema │ Kabinet Adhigana <DEPARTEMEN> │ HMTI Polinema hmti.polinema.ac.id │ [YouTube│LinkedIn / globe]`.

The footer's department field names the owning departemen. Read from upscaled
footer crops (`research-shots/instagram-departemen-by-post.png`):

| Post | Departemen on poster |
| --- | --- |
| Maulid Nabi (2026-08-24) | `KOMINFO` |
| TI-COMPSTREAM competitions (2026-08-25) | `RMB` |
| Malam Keakraban Dharmasena (2026-08-26) | `EKSTERNAL` |
| Open Recruitment (2026-08-28) | `PSDM` |
| Seminar Nasional & Workshop (2026-09-10) | `RMB` |
| Komandan Tingkat 2024 (2026-09-15) | `EKSTERNAL` |
| Expo Kelembagaan (2026-08-31) | `KOMINFO` |
| Teaser Open Recruitment (2026-09-11) | `PSDM` |
| Seminar Nasional, extended registration (2026-09-24) | `RMB` |

Nine of the twelve posters were cropped and read at 300% to confirm the field.
Primary evidence is the artwork footer (`research-shots/instagram-departemen-by-post.png`,
`research-shots/instagram-departemen-verify.png`); Instagram's own auto-generated
alt text on some posts independently repeats the same strings (e.g.
`Kabinet Adhigana EKSTERNAL` inside the alt of
<https://www.instagram.com/hmtipolinema/p/Dcs7rvjlHcZ/>), but the artwork is the
cleaner source.

### Instagram audience vocabulary (from captions)

- Address form: **"Halo, Sobat Informatics!"** / **"Hai Sobat Informatics"** —
  <https://www.instagram.com/hmtipolinema/p/Dcs7rvjlHcZ/>,
  <https://www.instagram.com/hmtipolinema/p/Dck7uqslPrg/>
- Angkatan nickname: **"Dharmasena"** for the 2026 intake — `Malam Keakraban
  DHARMASENA'26`, <https://www.instagram.com/hmtipolinema/p/Dcf2zpqFGCn/>
- Angkatan nickname: **"Rasendriya'22"** — <https://www.youtube.com/@HMTIPolinemaa>
  (video "Ucapan Selamat Datang Kepada Mahasiswa Baru … angkatan 2022")
- Angkatan nickname: **"Arshaknife'24"** — `AFTER MOVIE ARSHAKNIFE'24`, playlist
  `2024/2025` at <https://www.youtube.com/@HMTIPolinemaa/playlists>
- Pronoun/collective: **"Angkatan'24"** —
  <https://www.instagram.com/hmtipolinema/p/DdVpiPrFDrq/>

---

## 2. TikTok — `@hmtipolinema`

Source: <https://www.tiktok.com/@hmtipolinema>

| Field | Value |
| --- | --- |
| Display name | `HMTI Polinema` |
| Handle | `hmtipolinema` |
| Following | `5` |
| Followers | `1727` |
| Likes | `15.5K` |
| Link | <https://linktr.ee/hmti_polinema> |
| Video count | **not published / login-walled** |

All of the above from the rendered profile header, screenshot
`research-shots/tiktok-profile-header.png` (`data-e2e` profile fields), and from
`meta[name=description]` on <https://www.tiktok.com/@hmtipolinema>.

### Bio (verbatim)

```
Official Account Of Himpunan Mahasiswa Teknologi Informasi.
KABINET ADHIGANA 2026/2027
#SatuKolaborasiSeribuKontribusi
#PROUDTOBEINFORMATICS
#TI_FAST #TI_BRAVO
linktr.ee/hmti_polinema
```

Source: rendered header + `og:description` on <https://www.tiktok.com/@hmtipolinema>.

This is the **only channel that states the cabinet term explicitly**:
`KABINET ADHIGANA 2026/2027`.

### Avatar / banner

- Avatar is the HMTI seal, circular, on a light background — captured at 300×300
  as `assets/brand/social/tiktok-profile-picture.jpg` from the `og:image` URL
  `https://p16-common-sign.tiktokcdn.com/tos-alisg-avt-0068/7324653737925394450~tplv-tiktokx-cropcenter:720:720.jpeg…`
  (declared `og:image:width/height` 360×360).
- **No profile banner exists** on the TikTok web profile layout; the visible
  chrome is the default black TikTok shell (`research-shots/tiktok-profile-header.png`).
- Avatar palette: `#EDD316` yellow, `#322261` navy, plus white — Pillow quantise
  over the downloaded JPEG.

### Video grid

**Not retrievable.** TikTok served a slider-puzzle captcha on every load
(`research-shots/tiktok-captcha-wall.png`), and after dismissing it the video grid
still rendered empty behind an auth requirement. Thumbnail style for TikTok is
therefore **unverified** — see §7.

---

## 3. LinkedIn — `hmti-polinema`

Source: <https://www.linkedin.com/company/hmti-polinema/>

| Field | Value | Source |
| --- | --- | --- |
| Name | `Himpunan Mahasiswa Teknologi Informasi (HMTI) Polinema` | `json-ld Organization.name` |
| Followers | `447 followers` | page HTML |
| Tagline / slogan | `#TI_FAST #TI_BRAVO` | `json-ld Organization.slogan` |
| Industry | `Information Technology & Services` | page HTML |
| Company size | `51-200 employees` | page HTML |
| Employees (`numberOfEmployees`) | `23` | `json-ld Organization.numberOfEmployees` |
| Headquarters | `Malang, Jawa Timur` | page HTML |
| Street address | `Jl. Soekarno Hatta no. 9`, `65141`, `ID` | `json-ld Organization.address` |
| Founded | `2015` | page HTML |
| Website | `http://hmti.polinema.ac.id/` | `json-ld Organization.url` / page HTML |
| Specialties | **none published** | page HTML (no Specialties block) |

### Description (verbatim)

`json-ld Organization.description` on
<https://www.linkedin.com/company/hmti-polinema/>:

```
Official LinkedIn Account of
Himpunan Mahasiswa Teknologi Informasi💻
Politeknik Negeri Malang
👉#TI_FAST #TI_BRAVO
```

Company logo captured at 200×200 as `assets/brand/social/linkedin-company-logo.png`
(palette `#1D1873` navy, `#FDE306`/`#FEE704` yellow, white) from the `json-ld
Organization.logo.contentUrl`.

`https://www.linkedin.com/company/hmti-polinema/about/` is **login-walled** even
for a crawler UA and returns only `Login to LinkedIn to keep in touch…`.

---

## 4. YouTube — `@HMTIPolinemaa`

> **Correction to prior recon.** `https://www.youtube.com/@HMTIPolinema` returns
> **HTTP 404**. The live channel handle is **`@HMTIPolinemaa`** (double `a`),
> found via <https://www.youtube.com/results?search_query=HMTI+Polinema>. Variants
> `@hmtipolinema`, `@HMTIPOLINEMA`, `@HmtiPolinema`, `@HMTI_Polinema` all 404.

Source: <https://www.youtube.com/@HMTIPolinemaa> and
<https://www.youtube.com/@HMTIPolinemaa/about>

| Field | Value |
| --- | --- |
| Channel name | `HMTI Polinema` |
| Handle | `@HMTIPolinemaa` |
| Channel ID | `UCjgtMBk9D1YM3lWbuEW_q2A` |
| Subscribers | `2.3K` |
| Videos | `136` |
| Links | `hmti.polinema.ac.id` and 2 more |

### Channel description (verbatim)

```
Saluran Resmi Himpunan Mahasiswa Teknologi Informasi
POLITEKNIK NEGRI MALANG

Media HMTI POLINEMA
All Right Reserved
```

Source: `og:description` on <https://www.youtube.com/@HMTIPolinemaa/about>.
Note the channel spells it **`POLITEKNIK NEGRI MALANG`** (missing an `E` in
`NEGERI`) — a real, live typo in the organisation's own copy. The same description
ends with a Solomonic media list:

```
#PROUDTOBEINFORMATICS
===========================
More media visit :
Fb : HMTI Polinema
Twitter : @HMTIpolinema
Ig : @hmtipolinema
Line…
```

and a long block reproducing **Jurusan Teknologi Informasi's visi, misi and
tujuan** (verbatim on
<https://www.youtube.com/@HMTIPolinemaa>), including the JTI vision string:
*"Jurusan Teknologi Informasi Polinema sebagai pusat unggulan di bidang teknologi
informasi dan rekayasa perangkat lunak di tingkat nasional maupun internasional."*

### Channel keyword tags (verbatim)

`meta[name=keywords]` on <https://www.youtube.com/@HMTIPolinemaa/about>:

```
"HMTI POLINEMA" "TEKNIK INFORMATIKA POLINEMA" "MANAJEMEN INFORMATIKA POLINEMA"
"JTI POLINEMA" "SISTEM INFORMASI BISNIS POLINEMA"
```

These are the JTI study programmes the audience is drawn from, and the search
terms the org wants to rank for.

### Banner and avatar

- Banner: 2560×424, `assets/brand/social/youtube-banner.jpg` (from the
  `w2560` variant of the `pageHeaderRenderer` banner source). Design: solid royal
  blue `#1F4681` field, organic yellow blobs in the lower corners (`#F0D738`
  measured), white condensed `HMTI`, a yellow pill reading `Himpunan Mahasiswa
  Teknologi Informasi / Politeknik Negeri Malang` in dark text, `Official Youtube
  Channel` in yellow script, `#TI_FAST #TI_BRAVO` underneath, plus the JTI and
  HMTI seals. View: `research-shots/youtube-banner-view.png`.
- Avatar: 900×900, `assets/brand/social/youtube-avatar.png` — the HMTI seal
  (`#FEE81D` yellow, `#130A4B` navy, white).

### Playlists (all 5 public playlists — named after cabinet terms)

Screenshot: `research-shots/youtube-playlists.png`

| Playlist | Content name shown | Playlist ID | URL |
| --- | --- | --- | --- |
| `2024/2025` | `AFTER MOVIE ARSHAKNIFE'24`, 1 video | `PLYCPCmXsgaRjbprDpDWmQGgNP9RDWL9CC` | <https://www.youtube.com/playlist?list=PLYCPCmXsgaRjbprDpDWmQGgNP9RDWL9CC> |
| `2022/2023` | `UCAPAN SELAMAT DIES NATALIS HMTI KE 11`, 13 videos | `PLYCPCmXsgaRgaisQYBXL-ANOdsgxyGZtH` | <https://www.youtube.com/playlist?list=PLYCPCmXsgaRgaisQYBXL-ANOdsgxyGZtH> |
| `2021/2022` | `Dialog Dosen Mahasiswa 2021`, 1 video | `PLYCPCmXsgaRiR_bQp--bc16ILPCgWj9Pf` | <https://www.youtube.com/playlist?list=PLYCPCmXsgaRiR_bQp--bc16ILPCgWj9Pf> |
| `2020/2021` | 3 videos | `PLYCPCmXsgaRgxSecUVDVw64ko-_djs3V9` | <https://www.youtube.com/playlist?list=PLYCPCmXsgaRgxSecUVDVw64ko-_djs3V9> |
| `2019/2020` | 1 video | `PLYCPCmXsgaRizz88d0NWWYOkG_iSHPcFW` | <https://www.youtube.com/playlist?list=PLYCPCmXsgaRizz88d0NWWYOkG_iSHPcFW> |

Playlist titles + IDs parsed from the channel's `ytInitialData` at
<https://www.youtube.com/@HMTIPolinemaa/playlists>.

**Playlists are named by governing period, not by event** — there is no
"Seminar Nasional" or "Malam Keakraban" playlist. Event series are only visible as
flat video titles.

### Video catalogue (30 most recent titles)

Parsed from `ytInitialData` at <https://www.youtube.com/@HMTIPolinemaa/videos>.
Titles are reproduced verbatim (including the org's own typos):

- `TEASER OPEN RECRUITMENT HIMPUNAN MAHASISWA TEKNOLOGI INFORMASI POLITEKNIK NEGERI MALANG TAHUN 2026`
- `AFTER MOVIE STUDY EXCURSIE JURUSAN TEKNOLOGI INFORMASI POLITEKNIK NEGERI MALANG TAHUN 2026`
- `VLOG KELILING KAMPUS POLITEKNIK NEGERI MALANG 2026`
- `AFTER MOVIE DIALOG DOSEN MAHASISWA JURUSAN TEKNOLOGI INFORMASI TAHUN 2026`
- `TEASER DIALOG DOSEN MAHASISWA JURUSAN TEKNOLOGI INFORMASI 2026`
- `AFTER MOVIE DIES NATALIS HIMPUNAN MAHASISWA TEKNOLOGI INFORMASI KE-11`
- `TEASER DIES NATALIS HIMPUNAN MAHASISWA TEKNOLOGI INFORMASI KE-11`
- `AFTER MOVIE MUSYAWARAH KERJA HMTI POLITEKNIK NEGERI MALANG TAHUN 2026`
- `AFTER MOVIE PEMILIHAN KETUA UMUM DAN WAKIL KETUA UMUM HMTI PERIODE 2026/2027`
- `AFTER MOVIE SEMARAK PEKAN OLAHRAGA JURUSAN TEKNOLOGI INFORMASI TAHUN 2025`
- `AFTER MOVIE PRASTUDI MAHASISWA BARU JURUSAN TEKNOLOGI INFORMASI 2025`
- `AFTER MOVIE MALAM KEAKRABAN JURUSAN TEKNOLOGI INFORMASI ANGKATAN 2025`
- `AFTER MOVIE DINASTI 10`
- `AFTER MOVIE DIAOG DOSEN MAHASISWA …` (sic — `DIAOG`)
- `AFTER MOVIE INTERNAL COMPETITION TAHUN 2024`
- `AFTER MOVIE SPORTIF 2024`
- `ORASI EKSTERNAL | PEMILIHAN KETUA UMUM HMTI PERIODE 2025/2026`

### YouTube thumbnail style

Contact sheet: `research-shots/youtube-thumbnails-montage.png`

Photographic, not poster-based. Eight sampled thumbnails are 1280×720 and are
dominated by **candid event photography** (360°-sports, audiences, group shots,
certificate handovers) with a small HMTI seal plus a name/angle badge stamped on
top. Title typography, where present, is a heavy condensed uppercase
(`MUSYAWARAH KERJA`) on a dark scrim. Two outliers use the brand palette
literally:

- Musker 2026 — `#1E4593` blue field with cyan shapes
- Dies Natalis ke-11 — `#40445B`/`#1F2E5A` with an illustrated underwater scene;
  animation-style, not photographic

Per-thumbnail quantised colours (Pillow): sportif `#1B2731/#68818E`, dialog dosen
`#888787/#2E292D`, musker `#1E4593/#48CFE7`, pemilihan ketua umum
`#0F1111/#212321`, study excursie `#282127/#63525F`, teaser oprec
`#1C2022/#5D6050`, vlog kampus `#635851/#374082`, dies natalis `#40445B/#1F85E8`.

---

## 5. Cross-channel organisation vocabulary

Everything in this section is a verbatim string from a cited source.

### Hashtags

| Hashtag | Meaning | Where observed |
| --- | --- | --- |
| `#PROUDTOBEINFORMATICS` | Primary org tag; on Instagram, YouTube, TikTok | Bio at <https://www.instagram.com/hmtipolinema/>, <https://www.youtube.com/@HMTIPolinemaa>, <https://www.tiktok.com/@hmtipolinema> |
| `#TI_FAST` | Half of the recurring mantra | Bio, every Instagram post caption (12/12), YouTube banner |
| `#TI_BRAVO` | Other half | Same |
| `#HMTI12Polinema` | Cabinet counter — "HMTI 12" | <https://www.instagram.com/hmtipolinema/p/Dcs7rvjlHcZ/> — carried by **11 of 11** fetched permalink captions |
| `#JTIPolinema` | Jurusan tag | Same; printed `#jtipolinema` (all lower) on <https://www.instagram.com/hmtipolinema/p/DdsdhOGAdAM/> |
| `#SatuKolaborasiSeribuKontribusi` | Cabinet slogan, *"One Collaboration, A Thousand Contributions"* | TikTok bio only, <https://www.tiktok.com/@hmtipolinema> |

`#PROUDTOBEINFORMATICS`, `#TI_FAST` and `#TI_BRAVO` also appear at the end of
**every** harvested Instagram caption body, immediately before a `=====` rule and
the media-visit block. The house tail is, verbatim:

```
=============================
#TI_FAST #TI_BRAVO
#HMTI12Polinema
#jtipolinema
```

(that exact tail from <https://www.instagram.com/hmtipolinema/p/DdsdhOGAdAM/>;
the capitalization of the last tag varies by post).

### Taglines and slogans

- `#TI_FAST #TI_BRAVO` — LinkedIn declares this the company **slogan**
  (`json-ld Organization.slogan` at <https://www.linkedin.com/company/hmti-polinema/>)
  and the YouTube banner prints it under the channel strapline.
- `#SatuKolaborasiSeribuKontribusi` — current cabinet slogan
  (<https://www.tiktok.com/@hmtipolinema>).
- `Stay in the Flow. Stay Competitive` — sign-off on TI-COMPSTREAM posts,
  <https://www.instagram.com/hmtipolinema/p/DcdgMGdlAad/>
- `HMTI bukan sekadar organisasi, tapi tempat untuk tumbuh bersama!` —
  <https://www.instagram.com/hmtipolinema/p/Dcs7rvjlHcZ/>
- `The Regeneration of Himpunan Mahasiswa Teknologi Informasi, Discovering
  Potential, and Forging the Bond of Solid Functionaries.` — Open Recruitment
  2026 theme, <https://www.instagram.com/hmtipolinema/p/DdJhuF0lH3A/>
- `Collaborating Human with AI for Unlocking Growth Opportunities and Maximizing
  Business Efficiency` — Seminar Nasional & Workshop 2026 theme,
  <https://www.instagram.com/hmtipolinema/p/DdIvQf7FCPT/>

### Cabinet / executive

- **`Kabinet Adhigana`** — printed in every Instagram poster footer
  (`research-shots/instagram-departemen-by-post.png`) and in the
  `Malam Keakraban` teaser alt text at
  <https://www.instagram.com/hmtipolinema/reel/DckhVtQhfD8/>.
- **`KABINET ADHIGANA 2026/2027`** — full term, TikTok bio,
  <https://www.tiktok.com/@hmtipolinema>.
- Server-rendered pages carry author/creator `KOMINFO XI`
  (parent-thread finding). `KOMINFO` is confirmed as a departemen name here; the
  `XI` roman numeral is **not** corroborated anywhere in this harvest.

### Departemen (department) names

Read from the poster footer template — `research-shots/instagram-departemen-by-post.png`
and `research-shots/instagram-footer-depts-all.png`, sources listed in §1:

- `KOMINFO` (media/information — also the site author tag)
- `PSDM`
- `RMB` (expansion unknown; the common Indonesian reading is *Riset, Minat, dan
  Bakat*, but the posters only print the acronym)
- `EKSTERNAL`

No other departemen names were observed. There is no public list of departemen on
any channel reviewed here.

### Flagship events and programmes

| Programme | Evidence |
| --- | --- |
| `Open Recruitment HMTI` (Oprec) — with `Diklat Ruang`, `Diklat Lapang`, `Interview` stages | <https://www.instagram.com/hmtipolinema/p/Dck7uqslPrg/>, <https://www.instagram.com/hmtipolinema/p/DdJhuF0lH3A/> |
| `Malam Keakraban Mahasiswa Baru` (`DHARMASENA'26`) | <https://www.instagram.com/hmtipolinema/p/Dcf2zpqFGCn/> |
| `Seminar Nasional & Workshop` (theme above) | <https://www.instagram.com/hmtipolinema/p/DdIvQf7FCPT/> |
| `Ekstended/Batch` registration, `Official T-Shirt` pre-order merch | <https://www.instagram.com/hmtipolinema/p/DdsdhOGAdAM/>, <https://www.instagram.com/hmtipolinema/p/DdsTLlCgalJ/> |
| `Expo Kelembagaan HMTI Polinema` | <https://www.instagram.com/hmtipolinema/p/Dcs7rvjlHcZ/> |
| `TI-COMPSTREAM` — recurring competition bulletin | <https://www.instagram.com/hmtipolinema/p/DdId0lVgRHQ/>, <https://www.instagram.com/hmtipolinema/p/DcdgMGdlAad/> |
| `Prastudi Mahasiswa Baru` | <https://www.youtube.com/@HMTIPolinemaa/videos> |
| `Dies Natalis HMTI ke-11` | <https://www.youtube.com/@HMTIPolinemaa/videos> |
| `Musyawarah Kerja` (Musker) | <https://www.youtube.com/@HMTIPolinemaa/videos> |
| `Pemilihan Ketua Umum dan Wakil Ketua Umum` / `Orasi Eksternal` | <https://www.youtube.com/@HMTIPolinemaa/videos> |
| `Dialog Dosen Mahasiswa` | <https://www.youtube.com/@HMTIPolinemaa/videos> |
| `Study Excursie` | <https://www.youtube.com/@HMTIPolinemaa/videos> |
| `Semarak Pekan Olahraga JTI` / `Sportif` | <https://www.youtube.com/@HMTIPolinemaa/videos> |
| `Internal Competition` | <https://www.youtube.com/@HMTIPolinemaa/videos> |
| `Vlog Keliling Kampus Polinema` | <https://www.youtube.com/@HMTIPolinemaa/videos> |
| `DINASTI 10` | <https://www.youtube.com/@HMTIPolinemaa/videos> |

### Angkatan-level roles

`Komandan Tingkat` and `Wakil Komandan Tingkat` — elected per intake, e.g.
`Komandan Tingkat 2024: Raihan Akbar Putra Prasetyo`, `Wakil Komandan Tingkat
2024: Mohammad Ariq Baihaqi`, at
<https://www.instagram.com/hmtipolinema/p/DdVpiPrFDrq/>.

### The media-visit contact block (verbatim, pre-rolled into posts)

Source: <https://www.instagram.com/hmtipolinema/p/Dcs7rvjlHcZ/>

```
More media visit:
Fb: HMTI Polinema
Twitter: @HMTlpolinema
Ig: @hmtipolinema
Line: @ili6934s
Tiktok: @hmtipolinema
LinkedIn: HMTI Polinema
Youtube: HMTI Polinema
Wa: 085166643421
Website: hmti.polinema.ac.id
```

Note the Twitter handle is written `@HMTlpolinema` in this template — lowercase
`L`, i.e. it is **not** the same string as `@hmtipolinema` and should not be
normalised without checking.

### Audience address forms

`Sobat Informatics` (generic), `Dharmasena` (angkatan 2026), `Rasendriya'22`
(angkatan 2022), `Arshaknife'24` (angkatan 2024), `Angkatan'24`.

---

## 6. Colour evidence, per channel

All values measured with Pillow `quantize(MEDIANCUT)` on the downloaded files in
`assets/brand/social/`.

| Surface | Dominant colours | Reads as |
| --- | --- | --- |
| Official seal (IG pfp) | `#FCE805`, `#041584`, `#04010B`, white | brand yellow + deep royal blue + black |
| Official seal (YouTube avatar 900px) | `#FEE81D`, `#130A4B`, white | same |
| Official seal (LinkedIn 200px) | `#1D1873`, `#FDE306`, `#FEE704`, white | same |
| Official seal (TikTok 300px) | `#EDD316`, `#322261`, white | same |
| YouTube banner | `#1F4681` (60% of pixels), `#F0D738` blobs | royal blue field, yellow accents |
| Instagram highlight covers | white, `#FDE605`/`#FDEA4F`, near-black | flat black-on-yellow-on-white |
| Instagram feed posts (12) | `#5C1A1C … #805954` (maroon/oxblood family) | **divergent** — poster template palette |
| YouTube thumbnails (8) | grey/desaturated photo tones, `#1E4593` & `#1F85E8` where graphic | photographic, occasionally brand blue |

Conclusions that matter for a design system:

1. The **yellow is stable across every official surface** (`#FCE805` → `#FEE81D`
   depending on JPEG/PNG compression and surface), which corroborates the live
   site's `--primary: #FFE600` as a reasonable single token.
2. The **blue reads as a deep navy-indigo around `#041584`–`#1D1873`** on the
   seals, but the YouTube banner uses a much lighter **`#1F4681`**. These are two
   different blues in production; treat `#041686` as the seal blue and do not
   assume it is the banner blue.
3. **Instagram's 2026 feed is maroon/gold, not yellow/blue.** Anyone deriving a
   design system from the Instagram grid alone would get the wrong palette. The
   maroon is a per-cabinet campaign theme (Kabinet Adhigana), not the brand.
4. Highlight covers are the single best in-repo reference for the *brand* flat
   style: flat black pictogram + yellow disc + white ground.

---

## 7. UNVERIFIED / login-walled

| Item | Why it is missing | What would unblock it |
| --- | --- | --- |
| Instagram post count on-page | Only present in crawler `og:description`; the rendered profile hides it behind login | logged-in session |
| Instagram follower/following exact values | crawler metadata says `6,820 / 152`, the rendered header says `6,818 / 144`, same day | logged-in session |
| Instagram per-post comments, saves, carousel slides 2..n | only `og:description` reachable; multi-image slides not enumerated | logged-in session |
| Instagram higher-resolution images | CDN is TLS-fingerprint-locked (`403` via curl) and refuses cross-origin `fetch()` from a non-instagram origin; grid thumbnails are 480×640 (profile/highlights 150×150) | logged-in session, or a real-user browser profile |
| Instagram post-date ordering vs grid order | pins reorder the grid; mapping post→thumbnail was reconstructed from the `a[href]`→`img` DOM pairs, which is reliable, but pin state is inferred from the screenshot | logged-in session |
| Instagram highlight cover→title assignment | not labelled in the DOM; inferred from order + visual match | logged-in session |
| TikTok video count, video titles, thumbnail/banner style | hard slider CAPTCHA on every load (`research-shots/tiktok-captcha-wall.png`); grid stays empty after dismissal | logged-in session, or a mobile-app capture |
| TikTok "1727 Followers" formatting | rendered without a thousands separator — reproduced verbatim, not reformatted | — |
| LinkedIn `/about/` page: Specialties, exact founding date, affiliated pages | returns only a login interstitial to crawler UA | logged-in session |
| LinkedIn company size (`51-200`) vs `numberOfEmployees` (`23`) | both served by the same page; the two numbers are not reconciled by LinkedIn | — |
| YouTube: subscriber/date/views per video | the current channel layout serves them client-side; the lockup payload had empty metadata rows | authenticated YouTube API |
| YouTube playlists beyond the 5 public ones | none exist publicly or all are private | channel owner |
| Whether the cabinet is "the 12th" | `#HMTI12Polinema` (Instagram, Aug 2026) + `KABINET ADHIGANA 2026/2027` (TikTok) + LinkedIn `Founded 2015` imply cabinet 12 in 2026/2027, but no channel states the ordinal. `KOMINFO XI` on the website metadata points at the *previous* cabinet. | owner confirmation |
| `RMB` expansion | only the acronym is printed | owner confirmation |
| `hmtipolinema.org` | does not resolve (parent-thread finding, not re-tested here) | — |
| Crawler-UA fidelity | Instagram and LinkedIn HTML served to a Googlebot UA may differ from the live logged-out page; every such claim above is labelled with its source URL | live logged-out render |

---

## 8. Downloaded assets

Repo-relative paths. All images were captured `2026-09-27`. IG images are grid
thumbnails (480×640) except the pfp and highlight covers (150×150) — see the
resolution limitation in §7.

### `assets/brand/social/`

| Path | Pixels | What it shows |
| --- | --- | --- |
| `assets/brand/social/instagram-profile-picture.png` | 150×150 | HMTI seal, circular, presented inside Instagram's story ring |
| `assets/brand/social/instagram-highlight-tenda-maba.png` | 150×150 | Cover: black checklist pictogram, yellow disc, white ground |
| `assets/brand/social/instagram-highlight-ketum-terpilih.png` | 150×150 | Cover: black figure at a podium on a yellow disc |
| `assets/brand/social/instagram-highlight-bunga-wisuda.png` | 150×150 | Cover: black graduation cap over a yellow disc |
| `assets/brand/social/instagram-highlight-live-report.png` | 150×150 | Cover: black `LIVE` badge over a mic, yellow disc |
| `assets/brand/social/instagram-highlight-info-skk.png` | 150×150 | Cover: black document stack over a yellow disc |
| `assets/brand/social/instagram-post-2026-09-24-seminar-nasional-extended.jpg` | 480×640 | Poster: `Extended` / `Seminar Nasional`, maroon + gold, footer dept `RMB` |
| `assets/brand/social/instagram-post-2026-09-24-preorder-official-tshirt.jpg` | 480×640 | Poster: `Open Pre-Order`, two black `informatic` tees |
| `assets/brand/social/instagram-post-2026-09-15-komandan-tingkat-2024.jpg` | 480×640 | Poster: `Pengumuman Pergantian Komandan Tingkat`, crowd photo, footer `EKSTERNAL` |
| `assets/brand/social/instagram-post-2026-09-11-teaser-open-recruitment.jpg` | 480×640 | Poster: `Teaser Open Recruitment`, campus building, footer `PSDM` |
| `assets/brand/social/instagram-post-2026-09-10-seminar-nasional-workshop.jpg` | 480×640 | Poster: `Seminar Nasional`, audience photo, JTI crest chip, footer `RMB` |
| `assets/brand/social/instagram-post-2026-09-10-ti-compstream.jpg` | 480×640 | Poster: `TI-COMPSTREAM` with a cartoon mascot in a Polinema uniform |
| `assets/brand/social/instagram-post-2026-08-31-expo-kelembagaan.jpg` | 480×640 | Poster: `Expo Kelembagaan`, `Are You Ready?`, dept banners, footer `KOMINFO` |
| `assets/brand/social/instagram-post-2026-08-28-open-recruitment.jpg` | 480×640 | Poster: `It's Your Time to Take Part! Open Recruitment`, footer `PSDM` |
| `assets/brand/social/instagram-post-2026-08-27-teaser-malam-keakraban.jpg` | 360×640 | Reel cover: `Teaser Malam Keakraban` (vertical) |
| `assets/brand/social/instagram-post-2026-08-26-malam-keakraban-dharmasena.jpg` | 480×640 | Poster: `Candy` / `Malam Keakraban` over a packed hall, footer `EKSTERNAL` |
| `assets/brand/social/instagram-post-2026-08-25-ti-compstream-competitions.jpg` | 480×640 | Poster: `TI-COMPSTREAM` with a magnifier over `berday.id 2026`, footer `RMB` |
| `assets/brand/social/instagram-post-2026-08-24-maulid-nabi.jpg` | 480×640 | Poster: Maulid Nabi, lanterns + mosque, footer `KOMINFO` |
| `assets/brand/social/youtube-avatar.png` | 900×900 | HMTI seal, high resolution |
| `assets/brand/social/youtube-banner.jpg` | 2560×424 | Channel banner: royal blue, yellow blobs, `HMTI` wordmark, yellow info pill, JTI + HMTI seals |
| `assets/brand/social/youtube-thumb-2026-teaser-open-recruitment.jpg` | 1280×720 | Candid group photo, badge overlay |
| `assets/brand/social/youtube-thumb-2026-after-movie-study-excursie.jpg` | 1280×720 | Speaker mid-talk, seated audience |
| `assets/brand/social/youtube-thumb-2026-vlog-keliling-kampus.jpg` | 1280×720 | Two students walking, HMTI badge overlay |
| `assets/brand/social/youtube-thumb-2026-after-movie-dialog-dosen-mahasiswa.jpg` | 1280×720 | Audience in a lecture theatre |
| `assets/brand/social/youtube-thumb-dies-natalis-hmti-ke-11.jpg` | 1280×720 | Illustrated underwater scene, `Dies Natalis ke-11` in white |
| `assets/brand/social/youtube-thumb-2026-after-movie-musker.jpg` | 1280×720 | `Musyawarah Kerja` condensed type on a blue/cyan graphic |
| `assets/brand/social/youtube-thumb-2026-after-movie-pemilihan-ketua-umum.jpg` | 1280×720 | Two students on a stage handing over a token |
| `assets/brand/social/youtube-thumb-2025-after-movie-sportif.jpg` | 1280×720 | Two-panel indoor sports action shots |
| `assets/brand/social/tiktok-profile-picture.jpg` | 300×300 | HMTI seal on a light background (TikTok `og:image`) |
| `assets/brand/social/linkedin-company-logo.png` | 200×200 | HMTI seal, LinkedIn company logo |

### `research-shots/`

| Path | Pixels | What it shows |
| --- | --- | --- |
| `research-shots/instagram-profile-header.png` | 1280×577 | Clean profile header: pfp, name, `6,818 followers / 144 following`, full bio, 5 highlight covers with titles |
| `research-shots/instagram-feed-grid.png` | 1280×577 | Feed grid with the three pinned posts + the first post row |
| `research-shots/instagram-profile-full.png` | 1280×2353 | Full-page capture of the logged-out profile |
| `research-shots/instagram-login-modal.png` | 1280×577 | The login modal Instagram shows over the profile on first load |
| `research-shots/instagram-profile-login-walled.png` | 1280×577 | Profile as rendered before dismissing the login modal |
| `research-shots/instagram-posts-montage.png` | 1232×1224 | Contact sheet of all 12 harvested feed posts |
| `research-shots/instagram-highlights-montage.png` | 810×162 | The 5 highlight covers side by side (title assignment evidence) |
| `research-shots/instagram-footer-depts.png` | 1924×752 | 4× zoomed poster footers showing `EKSTERNAL`, `KOMINFO`, `RMB` |
| `research-shots/instagram-footer-depts-all.png` | 1818×608 | All 12 poster footers, zoomed |
| `research-shots/instagram-departemen-by-post.png` | 2004×510 | Numbered, order-pinned evidence for the departemen-per-post table |
| `research-shots/instagram-departemen-verify.png` | 710×597 | Follow-up crops confirming Expo Kelembagaan → `KOMINFO`, Teaser Oprec → `PSDM`, Seminar Nasional Extended → `RMB` |
| `research-shots/tiktok-profile-header.png` | 1280×577 | TikTok profile: avatar, name, `5 / 1727 / 15.5K`, bio, `linktr.ee/hmti_polinema` |
| `research-shots/tiktok-captcha-wall.png` | 1280×577 | The slider CAPTCHA that hides the TikTok video grid |
| `research-shots/youtube-playlists.png` | 1280×965 | Channel banner + avatar + name + all 5 playlists with thumbnails |
| `research-shots/youtube-thumbnails-montage.png` | 1312×376 | Contact sheet of 8 YouTube thumbnails |
| `research-shots/youtube-banner-view.png` | 1200×199 | Channel banner, readable scale |

---

## 9. Corrections and open items raised by this recon

1. **YouTube handle is `@HMTIPolinemaa`, not `@HMTIPolinema`.**
   <https://www.youtube.com/@HMTIPolinema> → HTTP 404. The repo `README.md`
   currently lists the wrong URL.
2. **The site's `KOMINFO XI` author tag does not match the current cabinet.**
   Every live channel says `Kabinet Adhigana` / `2026/2027`, and the cabinet has
   its own slogan `#SatuKolaborasiSeribuKontribusi` that appears nowhere on the
   website.
3. **The Instagram feed palette (maroon/oxblood) contradicts the logo palette
   (yellow/royal blue).** Any design system written off the feed grid will be
   wrong.
4. **A departemen taxonomy is partially recoverable**: `KOMINFO`, `PSDM`, `RMB`,
   `EKSTERNAL` — but no channel publishes the full list.
5. **`@hmtipolinema` is not one account, it is at least six.** Instagram, TikTok;
   Twitter is printed as `@HMTlpolinema`; plus Facebook, LINE `@ili6934s`,
   WhatsApp `085166643421`, LinkedIn `HMTI Polinema`, YouTube `HMTI Polinema`.
   There is also a merch account `@hmti.goods` and a Linktree
   `linktr.ee/hmti_polinema` used as the single link-in-bio on both Instagram and
   TikTok.
