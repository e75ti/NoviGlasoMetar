# GlasoMetar BiH

GlasoMetar BiH je web aplikacija sa interaktivnim političkim kompasom i 8values testom, prilagođena političkoj sceni Bosne i Hercegovine. Aplikacija pozicionira korisnike i političke stranke na osnovu stvarnih historijskih podataka o glasanjima u parlamentarnim skupštinama. **Obavezno pročitajte disclaimer na dnu.**

## Mogućnosti

- **Interaktivni kviz**: Pitanja zasnovana na stvarnim zakonima i odlukama iz parlamentarne prakse.
- **Dvostruka vizuelizacija**: Prikaz rezultata kroz standardni politički kompas (ekonomska i društvena os) i 8values raspodjelu.
- **Obrada podataka**: Automatsko mapiranje političara i stranaka pomoću Python skripte (`auto_stranke_fix3.py`) i JSON baza podataka.
- **Instagram Story eksport**: Mogućnost generisanja i preuzimanja rezultata u 9:16 formatu visoke rezolucije (`html2canvas`).
- **Responzivan dizajn**: Prilagođeno za rad na desktop i mobilnim uređajima sa optimizovanim prikazom grafikona.

## Struktura projekta

```text
├── css/
│   └── style.css
├── data/
│   ├── parties.json
│   ├── questions.json
│   └── reality_full.json
├── img/
├── js/
│   ├── kviz.js
│   └── rezultati.js
├── index.html
├── kviz.html
├── LICENSE
├── README.md
└── rezultati.html
```

## Kako je došlo do ovoga?

Pa, praktično sam se opredijelio, kao i svi mi pred same izbore i pitanja: "Hm, za koga glasati, ko je onako meni najsličniji, koje su nam bitne stvari?" i počeo sam istraživati i kroz dan dva je nastao ovaj projekat nakon obrade podataka (veliko hvala gianniravioli), program je klasični politički kompas i 8values logika (Manhattan distance algoritam) plus lokalna glasanja s Parlamenta i slično, te poređenje kroz Manhattan "kome sam najsličniji". Ovo me je dosta podsjećalo na [glasometar.ba](https://glasometar.ba] koji je lijepo napravljen od strane Udruženja Zašto Ne, pa razmišljajući kako da ovo nazovem rekoh - NoviGlasoMetar! Svježija edicija!

Kako volim što jednostavnije stranice, praktične, brze, nema robots, nema ništa posebno na njoj;
- Frontend: HTML5, CSS3, Vanilla JavaScript
- Biblioteke: Chart.js (renderovanje kompasa), html2canvas (generisanje slika)
- Za lokalnu obrada podataka: Python / json manipulacije, pandas

To je to otprilike.

## Pokretanje lokalno
git clone [https://github.com/e75ti/NoviGlasoMetar.git](https://github.com/e75ti/NoviGlasoMetar.git)
cd NoviGlasoMetar

## Attribution

Podaci su masovno došli s online resursa, a velika pomoć je bila stranica [GianniRavioli](https://gianniravioli.com/) - fantastičan API, odlično agregirani podaci pod CC4.0 licencom. Hvala mnogo!

## Licenca

Podaci su originalnim izvorom manje-više pod CC4.0 licencom, a ovaj program je pod GLPv3 licencom.

## Napomena / disclaimer

GlasoMetar BiH je nezavisan edukativni i analitički projekat. Pozicioniranje stranaka i političara izvedeno je iz javno dostupnih podataka o glasanjima i služi isključivo u informativne svrhe. Take with a grain of salt. Nemojte uzimati zdravo za gotovo. Edukujte se, čitajte, izvucite svoje mišljenje. Nisam pronašao Političi kompas, 8values ili bilo šta ovako, osim glasometra online, pa sam odlučio da napravim nešto, čisto onako iz zabave.
Kao što piše na kraju, molim vas ako bilo koja greška ima da podignete issues i/ili pošaljete pull request da se to riješi što prije. Ispričavam se ako je gdje greška, nije namjerna. Znam da je politika osjetljiva tema, nije pravljeno da bilo koga stavi u povoljniji/nepovoljniji položaj, te je za izradu u brzini za neke dijelove i korišten Gemini LLM, iako sam ja naknadno se potrudio isčitati cjelokupni kod i potvrditi da je sve ok.

## ToDo:

- Dodati ikonice stranki

----------------

To je to! Hvala puno! See ya :)
