# Checklist review rezumat capitol

Înainte de `status: published`:

- [ ] Titlul corespunde capitolului din app (`chapterId` + `getChapterTitle`)
- [ ] Fără afirmații medicale neconfirmate sau contradictorii cu itemii de quiz
- [ ] Structura respectă `SUMMARY_TEMPLATE.md` (toate secțiunile)
- [ ] Lungime în intervalul 500–900 cuvinte (sau justificare scurtă dacă e mai scurt pentru capitol introductiv)
- [ ] Limbă română corectă (diacritice, termeni anatomici standard)
- [ ] Nu copiază verbatim text protejat din manual; este sinteză pedagogică
- [ ] `summary_version` incrementat dacă s-a modificat conținutul după publicare
- [ ] Audio (dacă există) citește același text ca rezumatul publicat
- [ ] Capitol free preview: doar `intro-anat-phys`, `chem-basics`, `cell-biology` fără Premium

După review: rulează `bun run study:publish` pentru capitolul respectiv.
