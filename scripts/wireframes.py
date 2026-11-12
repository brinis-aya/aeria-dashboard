"""Low-fidelity wireframes of the UX case study (docs/wireframes/*.svg).

Grey boxes and labels only: they document layout decisions, not visual design.
"""
from pathlib import Path
from xml.sax.saxutils import escape

OUT = Path(__file__).resolve().parents[1] / "docs" / "wireframes"
INK, INK2, LINE, FILL, NOTE = "#1f2328", "#57606a", "#8c959f", "#eef1f4", "#2a78d6"


class Svg:
    def __init__(self, w, h, title):
        self.w, self.h = w, h
        self.parts = [f'<rect width="{w}" height="{h}" fill="#ffffff" stroke="{LINE}" stroke-width="2" rx="14"/>',
                      f'<text x="{w / 2}" y="{h + 26}" font-size="14" text-anchor="middle" fill="{INK2}">{escape(title)}</text>']

    def box(self, x, y, w, h, label="", fill=FILL, dashed=False, size=12, bold=False):
        dash = ' stroke-dasharray="5 4"' if dashed else ""
        self.parts.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="6" fill="{fill}" stroke="{LINE}"{dash}/>')
        if label:
            for i, line in enumerate(label.split("\n")):
                self.parts.append(f'<text x="{x + w / 2}" y="{y + h / 2 + 4 + (i - (label.count(chr(10))) / 2) * 15}" '
                                  f'font-size="{size}" text-anchor="middle" fill="{INK}"'
                                  f'{" font-weight=\"700\"" if bold else ""}>{escape(line)}</text>')

    def text(self, x, y, s, size=12, color=INK2, anchor="start", bold=False):
        self.parts.append(f'<text x="{x}" y="{y}" font-size="{size}" fill="{color}" text-anchor="{anchor}"'
                          f'{" font-weight=\"700\"" if bold else ""}>{escape(s)}</text>')

    def note(self, x, y, s):
        self.parts.append(f'<circle cx="{x}" cy="{y}" r="11" fill="{NOTE}"/>'
                          f'<text x="{x}" y="{y + 4}" font-size="12" text-anchor="middle" fill="#fff" font-weight="700">{escape(s)}</text>')

    def save(self, name, notes):
        h = self.h + 44 + 18 * len(notes)
        body = "\n".join(self.parts)
        legend = "\n".join(f'<text x="8" y="{self.h + 52 + 18 * i}" font-size="12" fill="{INK2}">{escape(n)}</text>'
                           for i, n in enumerate(notes))
        width = max(self.w + 8, 470)  # room for the notes under narrow (mobile) frames
        svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -4 {width} {h}" width="{width}" height="{h}" '
               f'style="font-family:Segoe UI,Helvetica,Arial,sans-serif">{body}{legend}</svg>')
        OUT.mkdir(parents=True, exist_ok=True)
        (OUT / name).write_text(svg, encoding="utf-8")


def home_mobile():
    s = Svg(300, 600, "Accueil — mobile")
    s.box(0, 0, 300, 44, "Aeria            ☰", size=13, bold=True)
    s.text(16, 72, "QUALITÉ DE L'AIR EN NORMANDIE", 10, NOTE, bold=True)
    s.text(16, 98, "Respirer, ça se mesure.", 18, INK, bold=True)
    s.box(16, 112, 268, 34, "texte d'introduction (2 lignes)")
    s.box(16, 156, 130, 34, "Voir la carte", fill="#cfe0f6")
    s.box(154, 156, 130, 34, "Prévision")
    s.box(16, 206, 268, 104)
    s.text(28, 228, "Observé hier", 13, INK, bold=True)
    s.box(28, 240, 244, 28, "▇▇▇ Bon ▇▇▇▇▇▇ Moyen ▇ Dégr.")
    s.box(16, 322, 268, 124)
    s.text(28, 344, "Prévu demain", 13, INK, bold=True)
    s.box(28, 356, 244, 28, "▇▇ Bon ▇▇▇▇▇ Moyen ▇▇ Dégr.")
    s.text(28, 404, "Plus élevé : Le Havre ville-haute", 11)
    s.box(28, 412, 120, 22, "Dégradé · O₃")
    s.box(16, 458, 268, 60, "Mesurer · Informer · Maintenir")
    s.box(16, 528, 268, 56, "Modules (cartes cliquables)", dashed=True)
    s.note(292, 226, "1")
    s.note(292, 342, "2")
    s.save("accueil-mobile.svg", ["1  Répartition plutôt que carte : lisible sans savoir lire une carte",
                                  "2  « Demain » au même niveau que « aujourd'hui »"])


def map_desktop():
    s = Svg(720, 440, "Carte — bureau")
    s.box(0, 0, 720, 44, "Aeria    Accueil  Carte  Prévision  Capteurs  À propos", size=13)
    s.box(16, 60, 240, 364)
    s.text(28, 84, "Carte de l'indice ATMO", 14, INK, bold=True)
    s.box(28, 96, 216, 26, "[ Observé | Prévu demain ]")
    s.box(28, 130, 216, 20, "☑ Capteurs Aeria")
    s.box(28, 156, 216, 22, "légende ■ ■ ■ ■ ■ ■", size=11)
    for i in range(6):
        s.box(28, 188 + i * 34, 150, 28, f"Station {i + 1} · commune", size=11)
        s.box(184, 192 + i * 34, 60, 20, "indice", size=10)
    s.text(28, 412, "Positions indicatives (centre de la commune)", 10)
    s.box(268, 60, 436, 364, "carte OpenStreetMap\n\n● pastille colorée par station\n○ capteurs Aeria", fill="#e3ecf6")
    s.note(256, 190, "1")
    s.note(700, 72, "2")
    s.save("carte-bureau.svg", ["1  Liste triée (pires d'abord) : alternative accessible à la carte",
                                "2  Survol : nom, indice en toutes lettres, polluant ; clic : page station"])


def station_desktop():
    s = Svg(720, 520, "Station — bureau")
    s.box(0, 0, 720, 44, "Aeria    Accueil  Carte  Prévision  Capteurs  À propos", size=13)
    s.text(16, 70, "Carte / Le Havre ville-haute", 11)
    s.text(16, 94, "Le Havre ville-haute", 18, INK, bold=True)
    for i, label in enumerate(["Observé hier\n[Moyen · PM2.5]", "Prévu demain\n[Dégradé · O₃]", "120 jours\n80 Moyen, 30 Bon…"]):
        s.box(16 + i * 236, 108, 220, 64, label)
    s.box(16, 186, 688, 60)
    s.text(28, 206, "120 derniers jours", 12, INK, bold=True)
    for i in range(60):
        s.box(28 + i * 11, 216, 9, 9, fill="#c8d1da")
    s.box(16, 258, 688, 246)
    s.text(28, 280, "Concentrations", 13, INK, bold=True)
    s.box(480, 266, 212, 24, "[PM2.5|PM10|NO₂|O₃|SO₂]", size=11)
    s.box(28, 298, 664, 110, "barres journalières colorées par sous-indice — seuils en pointillé")
    s.box(28, 416, 664, 78, "courbe horaire, 14 jours")
    s.note(712, 200, "1")
    s.note(712, 320, "2")
    s.save("station-bureau.svg", ["1  Calendrier : « est-ce souvent comme ça ? » sans lire de chiffres",
                                  "2  Une seule échelle de couleur : le sous-indice ATMO, sur les barres aussi"])


if __name__ == "__main__":
    home_mobile()
    map_desktop()
    station_desktop()
    print("wireframes written to", OUT)
