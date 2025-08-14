# 🤖 LLM Prompt Manager

Un plugin per Chrome che permette di salvare, gestire e migliorare i prompt utilizzati sui principali siti di intelligenza artificiale.

## ✨ Funzionalità

- **💾 Salvataggio automatico**: Salva i tuoi prompt preferiti con un solo clic
- **🔍 Ricerca avanzata**: Trova rapidamente i prompt salvati tramite ricerca per titolo o contenuto
- **✨ Miglioramento prompt**: Suggerimenti automatici per rendere i prompt più efficaci
- **📋 Copia veloce**: Copia i prompt negli appunti direttamente dal popup
- **📤 Esporta/Importa**: Sincronizza i prompt tra dispositivi diversi
- **📊 Statistiche**: Visualizza statistiche d'uso e prompt più utilizzati

## 🌐 Siti Supportati

- ChatGPT (chat.openai.com)
- Claude (claude.ai)
- Mistral (chat.mistral.ai)
- Gemini (gemini.google.com)
- Microsoft Copilot (copilot.microsoft.com)
- Poe (poe.com)
- Perplexity (perplexity.ai)

## 🚀 Installazione

### Installazione da Chrome Web Store (quando disponibile)
1. Vai al Chrome Web Store
2. Cerca "LLM Prompt Manager"
3. Clicca su "Aggiungi a Chrome"

### Installazione manuale (sviluppo)
1. Clona o scarica questo repository
2. Apri Chrome e vai su `chrome://extensions/`
3. Attiva la "Modalità sviluppatore" in alto a destra
4. Clicca su "Carica estensione non pacchettizzata"
5. Seleziona la cartella del progetto

## 📱 Come Usare

### Su un sito LLM supportato:
1. Scrivi il tuo prompt nella casella di testo
2. Clicca sul pulsante 💾 per salvare il prompt
3. Usa 📁 per caricare un prompt salvato
4. Usa ✨ per ottenere suggerimenti di miglioramento

### Dal popup del plugin:
1. Clicca sull'icona del plugin nella barra degli strumenti
2. Visualizza le statistiche e i prompt recenti
3. Esporta o importa i tuoi prompt
4. Gestisci tutti i prompt salvati

### Menu contestuale:
1. Seleziona del testo su qualsiasi pagina web
2. Clic destro → "Salva come prompt"

## 🔧 Funzionalità Dettagliate

### Salvataggio Prompt
- Salvataggio automatico con titolo generato
- Associazione al sito di origine
- Timestamp di creazione
- Sistema di tag (futuro)

### Gestione Prompt
- Visualizzazione lista completa
- Ricerca per titolo o contenuto
- Ordinamento per data o frequenza d'uso
- Eliminazione selettiva

### Esportazione/Importazione
- Formato JSON standard
- Compatibilità tra dispositivi
- Backup dei dati
- Merge intelligente durante l'importazione

## 🗂️ Struttura del Progetto

```
Plugin_Prompt/
├── manifest.json          # Configurazione del plugin
├── content.js             # Script per l'interazione con le pagine
├── background.js           # Service worker per gestione eventi
├── popup.html/css/js       # Interfaccia popup del plugin
├── styles.css              # Stili per content script
├── welcome.html            # Pagina di benvenuto
├── icons/                  # Icone del plugin
└── README.md              # Documentazione
```

## 🛠️ Sviluppo

### Prerequisiti
- Google Chrome
- Editor di codice

### Setup locale
1. Clona il repository
2. Apri Chrome e attiva la modalità sviluppatore
3. Carica l'estensione non pacchettizzata
4. Le modifiche al codice richiedono il reload dell'estensione

### Testing
- Testa su tutti i siti supportati
- Verifica il salvataggio/caricamento prompt
- Controlla l'esportazione/importazione
- Valida l'interfaccia responsive

## 🔒 Privacy e Sicurezza

- **Dati locali**: Tutti i prompt sono salvati localmente nel browser
- **Nessun server**: Non vengono inviati dati a server esterni
- **Permessi minimi**: L'estensione richiede solo i permessi necessari
- **Open source**: Codice completamente ispezionabile

## 🚧 Roadmap

### Versione 1.1
- [ ] Sistema di tag per i prompt
- [ ] Categorie personalizzabili
- [ ] Modelli di prompt predefiniti
- [ ] Statistiche avanzate

### Versione 1.2
- [ ] Sincronizzazione cloud opzionale
- [ ] Condivisione prompt tra utenti
- [ ] Integrazione con Google Drive
- [ ] Backup automatico

### Versione 2.0
- [ ] AI per miglioramento automatico prompt
- [ ] Template intelligenti
- [ ] Analisi performance prompt
- [ ] Integrazione con API esterne

## 🤝 Contributi

I contributi sono benvenuti! Per contribuire:

1. Fork del repository
2. Crea un branch per la feature (`git checkout -b feature/AmazingFeature`)
3. Commit delle modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## 📄 Licenza

Questo progetto è rilasciato sotto licenza MIT. Vedi il file `LICENSE` per i dettagli.

## 👨‍💻 Autore

Creato con ❤️ per la community AI

## 🆘 Supporto

Per problemi, bug o richieste di funzionalità:
- Apri un'issue su GitHub
- Contatta tramite email
- Documentazione completa disponibile nel wiki

---

**Migliora la tua esperienza con l'AI, un prompt alla volta! 🚀**