# starAtlas
Un estensione non ufficiale che aumenta l'esperienza del gioco "Star Atlas" (https://play.staratlas.com) 

Visualizza informazioni aggiuntive, corregge alcuni bug e aggiunge effetti grafici.

Guida:
https://lnk.totemzetasoft.it/starAtlas/guida.html

Elenco funzionalità:
* pulsante re-supply all per rifornire tutte le proprie navi con un click!
* calcolo automatico delle quantità di risorse necessarie da acquistare per il numero di giorni indicato (sezione marketplace/risorse)
* resa netta mensile (nel pannello delle navi in stake)
* totale pending rewards e valore della flotta 
* stima sul tempo di esaurimento risorse (food, fuel, ...) in base al consumo delle proprie navi in stake
* valori vwap, earn e cost per ogni nave nel market
* pannello ROI per misurare il ritorno dell'investimento (premi ALT + g)
* pannello quotazioni (ATLAS, POLIS, SOLANA) (premi ALT + p)
* header animato (nel pannello delle navi in stake)
* fix pannello profilo utente (scrollbar)

Dipendenze:
Il pulsante re-supply all è stato aggiunto grazie al progetto:
https://github.com/ImGroovin/Star-Atlas-Resupply

L'estensione recupera i seguenti script esterni

Solana JavaScript API
https://lnk.totemzetasoft.it/starAtlas/js/web3.js 
(recuperato da https://solana-labs.github.io/solana-web3.js/)

Codice per la scrittura delle transazioni per il rifornimento delle navi
https://lnk.totemzetasoft.it/starAtlas/js/sa_resupply.js

Browserified version of Star Atlas Factory (https://github.com/staratlasmeta/factory)
https://lnk.totemzetasoft.it/starAtlas/js/sa_score.js