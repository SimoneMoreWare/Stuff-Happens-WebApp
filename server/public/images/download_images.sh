#!/bin/bash

# Array degli URL Robohash
urls=(
    "https://robohash.org/oversleep-exam?set=set2"
    "https://robohash.org/laptop-crash?set=set2"
    "https://robohash.org/wrong-thesis?set=set2"
    "https://robohash.org/wrong-class?set=set2"
    "https://robohash.org/surprise-test?set=set2"
    "https://robohash.org/coffee-notes?set=set2"
    "https://robohash.org/wifi-down?set=set2"
    "https://robohash.org/forgot-id?set=set2"
    "https://robohash.org/abandoned-group?set=set2"
    "https://robohash.org/deleted-project?set=set2"
    "https://robohash.org/missed-orientation?set=set2"
    "https://robohash.org/food-poisoning?set=set2"
    "https://robohash.org/bedbugs?set=set2"
    "https://robohash.org/broken-elevator?set=set2"
    "https://robohash.org/locked-out?set=set2"
    "https://robohash.org/scholarship-revoked?set=set2"
    "https://robohash.org/locked-library?set=set2"
    "https://robohash.org/stolen-bike?set=set2"
    "https://robohash.org/wrong-text?set=set2"
    "https://robohash.org/printer-crash?set=set2"
    "https://robohash.org/first-week-sick?set=set2"
    "https://robohash.org/computer-virus?set=set2"
    "https://robohash.org/wrong-registration?set=set2"
    "https://robohash.org/fire-alarm?set=set2"
    "https://robohash.org/wrong-textbook?set=set2"
    "https://robohash.org/broken-backpack?set=set2"
    "https://robohash.org/stuck-elevator?set=set2"
    "https://robohash.org/unknown-group?set=set2"
    "https://robohash.org/no-textbooks?set=set2"
    "https://robohash.org/wrong-room?set=set2"
    "https://robohash.org/changed-exam?set=set2"
    "https://robohash.org/lost-notes?set=set2"
    "https://robohash.org/broken-shuttle?set=set2"
    "https://robohash.org/noisy-roommate?set=set2"
    "https://robohash.org/foreign-language?set=set2"
    "https://robohash.org/no-heating?set=set2"
    "https://robohash.org/forgot-drop?set=set2"
    "https://robohash.org/contaminated-sample?set=set2"
    "https://robohash.org/no-internet?set=set2"
    "https://robohash.org/rough-draft?set=set2"
    "https://robohash.org/dead-calculator?set=set2"
    "https://robohash.org/worst-dorm?set=set2"
    "https://robohash.org/nonexistent-book?set=set2"
    "https://robohash.org/double-poisoning?set=set2"
    "https://robohash.org/rare-class?set=set2"
    "https://robohash.org/slides-wont-load?set=set2"
    "https://robohash.org/wikipedia-source?set=set2"
    "https://robohash.org/gym-closes?set=set2"
    "https://robohash.org/language-barrier?set=set2"
    "https://robohash.org/advisor-leaves?set=set2"
    "https://robohash.org/cc-everyone?set=set2"
    "https://robohash.org/lost-mail?set=set2"
    "https://robohash.org/autocorrect-fail?set=set2"
    "https://robohash.org/missed-graduation?set=set2"
    "https://robohash.org/loan-rejected?set=set2"
)

# Scarica ogni immagine
echo "🚀 Inizio download di ${#urls[@]} immagini..."

for i in "${!urls[@]}"; do
    card_number=$((i + 1))
    # ⚠️ CAMBIATO: Ora salva direttamente nella cartella corrente (images)
    filename="card${card_number}.png"
    
    echo "📥 Scaricando card${card_number}.png..."
    curl -s "${urls[$i]}" -o "$filename"
    
    if [ $? -eq 0 ]; then
        echo "✅ card${card_number}.png scaricata con successo"
    else
        echo "❌ Errore nel scaricare card${card_number}.png"
    fi
done

echo "🎉 Download completato! Controlla la cartella corrente"
echo "📁 Totale file scaricati: $(ls *.png 2>/dev/null | wc -l)"    