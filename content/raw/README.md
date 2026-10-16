# content/raw

Working data downloaded from Alþingi by `npm run fetch-votes`. It is input for writing questions by hand, and is never loaded by the app or the validator.

The JSON files are not committed (see `.gitignore`), because they're large and anyone can regenerate them from Alþingi's open data. See [docs/althingi-data.md](../../docs/althingi-data.md) for what the files contain.

Before using any vote in a question, open its `pageUrl` on althingi.is and check it there. The raw file is a convenience, not a source.
