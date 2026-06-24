# سیستمِ طراحیِ همیار — منبعِ مرجعِ واحد (استخراجِ جز‌به‌جز)

> **منبع:** `Hm/hamyar.html` (خط‌به‌خط استخراج‌شده).
> **قاعده (DECISION-130):** ملاکِ مطلقِ استایلِ همسو = همیار. کلِ پروژه (اپ + پابلیک) از **همین یک منبع** استایل می‌گیرد؛ هیچ توکنی از دو جا خوانده نمی‌شود. مهاجرت فاز‌به‌فاز: **فاز ۱ لایت · فاز ۲ دارک · فاز ۳ ایندیگو**.
> این فایل = مقادیرِ دقیقِ همیار برای هر توکن و کامپوننت. هنگامِ بازنویسی همیشه به این رجوع کن.

---

## ۱. توکن‌های پایه (ثابت در هر سه تم) — `Hm/hamyar.html:34-40`
```
شعاع‌ها:  xs 6 · sm 10 · md 14 · lg 18 · xl 26 · 2xl 34 · pill 9999
تایپو:    h1 clamp(26,3vw,38) · h2 clamp(22,2.2vw,30) · h3 20 · h4 17
          body-lg 17 · body 15 · body-sm 14 · caption 13 · micro 12
ایزینگ:   calm cubic(0.25,0.46,0.45,0.94) · expo cubic(0.19,1,0.22,1)
          quiet cubic(0.4,0,0.2,1) · spring cubic(0.34,1.3,0.64,1)
مدت‌ها:    instant 120 · fast 220 · base 360 · slow 500 · deep 700
```

## ۲. توکن‌های هر تم (مقادیرِ دقیق)

### Phase 1 — Warm Light — `Hm/hamyar.html:61-78`
```
surface: canvas #F2EEE4 · base #F7F4ED · raised #FFFFFF · raised-2 #FBFAF5
         overlay rgba(247,244,237,.82) · sunken #EAE4D6
         glass rgba(255,255,255,.7) · glass-strong rgba(255,255,255,.9)
         tint-accent rgba(122,132,113,.07) · gradient linear(160deg,#FFF,#F2EEE4)
text:    primary #1A1A1F · secondary #3E3B36 · tertiary #6B6657 · disabled #BDB6A7
         on-accent #FFFFFF · mirror #5C6555
border:  subtle rgba(26,26,31,.06) · default .10 · strong .20 · glow rgba(122,132,113,.35) · focus #7A8471
accent:  #7A8471 · bright #8C967F · hover #5C6555 · pressed #4D5447 · muted rgba(122,132,113,.13)
         gradient linear(135deg,#8C967F,#5C6555)
feedback: success #5C6555 · warning #9C7B33 · error #A04428 · info #6E8FA5
shadow:  soft 0 1px 2px rgba(46,44,40,.05) · low 0 2px 10px .07
         mid 0 10px 30px .10,0 2px 8px .05 · high 0 28px 64px .14,0 8px 18px .07
         glow 0 8px 32px rgba(122,132,113,.22) · glow-focus 0 0 0 4px rgba(122,132,113,.22)
ambient: 1 rgba(122,132,113,.4) · 2 rgba(155,180,199,.32) · 3 rgba(193,154,74,.14)
grain-opacity: .04
```

### Phase 2 — Warm Dark — `Hm/hamyar.html:79-96`
```
surface: canvas #100F0B · base #16140F · raised #201E18 · raised-2 #2A2820
         overlay rgba(22,20,15,.82) · sunken #0A0906
         glass rgba(32,30,24,.6) · glass-strong rgba(32,30,24,.85)
         tint-accent rgba(164,173,156,.09) · gradient linear(160deg,#252218,#1A1812)
text:    primary #EFE9DB · secondary #BDB6A7 · tertiary #8A8472 · disabled #4A463D
         on-accent #14130F · mirror #B0B8A6
border:  subtle rgba(234,228,214,.07) · default .11 · strong .20 · glow rgba(164,173,156,.4) · focus #A4AD9C
accent:  #A4AD9C · bright #BDC6B4 · hover #BDC6B4 · pressed #7A8471 · muted rgba(164,173,156,.14)
         gradient linear(135deg,#BDC6B4,#7A8471)
feedback: success #A4AD9C · warning #D4B05E · error #E07A5C · info #B5C9DC
shadow:  soft 0 1px 3px rgba(0,0,0,.45) · low 0 2px 10px .4
         mid 0 10px 30px .45,0 2px 8px .3 · high 0 28px 64px .55,0 8px 18px .4
         glow 0 8px 32px rgba(122,132,113,.25) · glow-focus 0 0 0 4px rgba(164,173,156,.25)
ambient: 1 rgba(164,173,156,.26) · 2 rgba(155,180,199,.2) · 3 rgba(193,154,74,.12)
grain-opacity: .06
```

### Phase 3 — Indigo Dark — `Hm/hamyar.html:43-60`
```
surface: canvas #0B0A18 · base #100E22 · raised #171533 · raised-2 #1E1B3D
         overlay rgba(16,14,34,.82) · sunken #0A0918
         glass rgba(23,21,51,.6) · glass-strong rgba(23,21,51,.85)
         tint-accent rgba(142,131,217,.10) · gradient linear(160deg,#1A1740,#131129)
text:    primary #ECEAF6 · secondary #B5AEE4 · tertiary #776EA6 · disabled #403A66
         on-accent #0B0A18 · mirror #9D93E4
border:  subtle rgba(232,230,240,.07) · default .11 · strong .18 · glow rgba(142,131,217,.4) · focus #8E83D9
accent:  #8E83D9 · bright #A89FE5 · hover #A89FE5 · pressed #6B5DD3 · muted rgba(142,131,217,.14)
         gradient linear(135deg,#8E83D9,#6B5DD3)
feedback: success #8E83D9 · warning #D4B05E · error #E07A5C · info #9BB4C7
shadow:  soft 0 1px 3px rgba(0,0,0,.5) · low 0 2px 10px .45
         mid 0 10px 30px .5,0 2px 8px .35 · high 0 28px 64px .6,0 8px 18px .45
         glow 0 8px 32px rgba(107,93,211,.3) · glow-focus 0 0 0 4px rgba(142,131,217,.28)
ambient: 1 rgba(107,93,211,.4) · 2 rgba(142,131,217,.28) · 3 rgba(155,180,199,.14)
grain-opacity: .05
```

## ۳. کامپوننت‌ها (CSS دقیق از همیار)

**body** `:100`: `background:var(--surface-canvas); color:var(--text-primary); line-height:1.7; transition: background/color base calm`.
**grain** `:109`: `::before fixed inset-0 z1 opacity:var(--grain-opacity)` نویزِ SVG fractalNoise.
**amb (اورا)** `:111`: `fixed radius50% blur(100px) z0 animation:amb-drift 40s calm infinite alternate`؛ drift `translate(50px,-40px) scale(1.1)`. هر اورا `radial-gradient(circle,var(--ambient-N),transparent 70%)`.
**focus-visible** `:113`: `box-shadow:var(--shadow-glow-focus); radius sm`.

**card** `:194`: `background:var(--surface-raised); border:1px var(--border-subtle); radius lg; box-shadow:var(--shadow-low)`.
**btn** `:195`: `inline-flex gap8 pad 11/22 radius pill size14 wt500 border1px transparent; trans fast calm`.
- **btn-primary** `:196`: `background:var(--accent-gradient); color:#fff; box-shadow:var(--shadow-glow)`؛ hover `translateY(-1) brightness(1.06) shadow-high`.
- **btn-secondary** `:199`: `bg raised-2; color primary; border default`؛ hover `border/color accent`.
- **btn-ghost** `:201`: `transparent; color secondary`؛ hover `bg tint-accent; color primary`.
**pill** `:203`: `pad 5/12 radius pill; bg tint-accent; color accent; size12 wt500; border1px accent-muted`.

**glass (mr-glass / hero)** `:1746`: `background:var(--surface-glass); backdrop-filter:blur(30px) saturate(150%); border:1px var(--border-glow); box-shadow: inset 0 1px 0 rgba(255,255,255,.08), var(--shadow-glow)`.
**glass-card (mr-card)** `:1757`: `bg surface-glass; blur(20px) saturate(140%); border subtle; radius xl; pad22; shadow-low`.

**modal-overlay** `:1116`: `fixed inset0 flex-center pad20; bg rgba(5,4,15,.6); blur(8px); anim overlay-in fast quiet`.
**modal** `:1119`: `max-w520 max-h90vh radius xl; bg surface-raised; border1px border-glow; shadow-high; anim modal-in base spring (translateY(24) scale.97 → none)`.
**modal-close** `:1126`: `34×34 circle; bg surface-sunken; color secondary`؛ hover `bg tint-accent color accent`.
**input/textarea (compose)** `:1139`: `bg surface-sunken; border1px default; radius md; pad14/16; color primary; size15`؛ focus `border accent; box-shadow var(--shadow-glow-focus)`.
**chip (chal/dur)** `:1145`: `pad8/14 radius pill bg sunken border subtle color secondary size13 wt500`؛ active `bg accent-muted; border accent; color accent`.
**segmented (feed-filter/ff-tab)** `:1293`: track `bg sunken radius pill border subtle`؛ tab active `bg accent-gradient; color#fff; shadow-glow`.
**ctype/sc-bg-type (تب‌های آیکونی)** `:1132`: active `bg accent-gradient color#fff shadow-glow`.

**avatar .av** `:180`: circle؛ xs26/sm34/md46/lg60/xl88. حلقهٔ زنده **presence-live** `:1244`: `conic-gradient(from 210deg, accent, mist, violet, accent)`.

**تایم‌لاینِ آینه** `:1779-1794`:
- خطِ رابط `mr-tl-item::before`: `linear-gradient(to bottom, var(--accent), var(--accent-muted))`، عرض 2px.
- مارکر `mr-tl-marker`: `background:var(--accent-gradient); color#fff; box-shadow:var(--shadow-glow)`.
- هاله `mr-tl-glow`: `inset-4 circle bg accent opacity.25 blur(8px) animation:pulse-soft 3s calm infinite`؛ pulse-soft `opacity .15↔.35`.
- آغاز `mr-tl-start`: `bg raised-2; color accent; border accent-muted`.
- زمان `mr-tl-time`: `color accent wt500`.

**hero-challenge** `:1264`: `bg surface-gradient; border1px border-glow; shadow-glow`؛ `hc-bg` دو `radial-gradient(ambient-1/2)` opacity.5؛ `hc-pulse` نقطهٔ `pulse 2.4s`؛ حلقهٔ پیشرفت `stroke:url(#grad)`.
**post** `:1301`: `bg raised border subtle radius lg pad20 shadow-low`؛ hover `shadow-mid border default`.
**quote-commit** `:1313`: `border-inline-start 3px accent; bg linear(90deg,tint-accent,transparent); color text-mirror wt300`.

## ۴. انیمیشن‌ها
`amb-drift 40s` · `page-in slow expo (translateY12→0)` · `overlay-in fast` · `modal-in base spring` · `story-fill 4s linear` · `pulse 2.4s` (حلقهٔ تابش) · `pulse-soft 3s` (هالهٔ تایم‌لاین) · `tl-rise slow expo` (ورودِ پلکانیِ آیتم‌ها) · `aura-float 18–26s`.
