# CONTIN Tech — nástřel webu

Nástřel webové prezentace pro novou technologickou divizi CONTIN s.r.o.
Divize se zaměřuje na **nezávislý expertní audit investic do AI, automatizace a robotizace**.

Vychází z designu hlavního webu contin.cz, ale překlápí ho do hi-tech podoby:
černo-šedo-stříbrná paleta místo modré, technické fonty, živá 3D síť v hero sekci,
viditelný help desk.

---

## Struktura

```
contin-tech/
├── index.html          # hlavní stránka, celý obsah
├── css/
│   └── style.css        # paleta, typografie, layout, modal, animace
├── js/
│   ├── network.js       # 3D síť (Three.js) v hero sekci
│   └── app.js           # help desk modal, scroll reveal, mobilní menu
├── assets/              # (zatím prázdné — pro loga, obrázky)
└── README.md
```

## Jak spustit

Statický web, žádný build. Stačí otevřít `index.html`, nebo lokální server:

```bash
cd contin-tech
python3 -m http.server 8000
# pak http://localhost:8000
```

## Design

- **Paleta:** uhlově černá `#0a0b0d` → grafit → ocel → stříbro `#c7ccd6` → chrom `#f4f6fa`. Zvýraznění je studené stříbrné, žádná modrá. Vše v `:root` v `css/style.css`.
- **Typografie:** Space Grotesk (display, nadpisy) + Inter (tělo). Načítáno z Google Fonts.
- **Signature prvek:** 3D síť uzlů a datových toků v hero sekci (Three.js r128), reaguje na pohyb myši, respektuje `prefers-reduced-motion`.
- **Help desk:** plovoucí tlačítko vpravo dole + modální formulář. Otevírá ho jakýkoli prvek s atributem `data-open-help`.

---

## Co dořešit (TODO)

1. **Napojit formulář na backend.** Teď je v `js/app.js` jen front-end simulace (hledej `TODO`). Možnosti: odeslání na e-mail (`tech@contin.cz`), napojení na CRM, nebo serverless endpoint.
2. **Logo CONTIN.** Teď je textové. Vložit oficiální SVG logo do `assets/` a nahradit `.brand`.
3. **Obsah a copy.** Texty jsou nástřel, projít s vedením a doladit. Zejména sekce Metodika je zatím krátká.
4. **Vlastní metodika auditu.** Klíčový dlouhodobý úkol — vytvořit „amortizační stupnici pro AI", obdobu KVM. Až bude, rozpracovat do samostatné stránky pod `#metodika`.
5. **Případové studie / reference.** Až budou první zakázky.
6. **Responzivita.** Základ hotový, projít na reálných zařízeních a doladit hero na malých displejích.
7. **SEO + Open Graph.** Doplnit meta tagy, og:image, favicon.

## Poznámky pro pokračování (Claude Code)

- Veškeré barvy ber z CSS proměnných v `:root`, nikdy nehardcoduj hex přímo do komponent.
- Animace vždy obal do ohledu na `prefers-reduced-motion` (vzor je v `network.js` i `style.css`).
- Sekce střídají pozadí: `.carbon` třída = tmavší pruh, bez ní = nejtmavší. Drž to střídání kvůli rytmu.
- Při přidávání nových sekcí přidej prvkům třídu `.reveal` pro plynulý nájezd při scrollu.
