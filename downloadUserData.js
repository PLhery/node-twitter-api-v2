import { TwitterApi } from 'twitter-api-v2';

const client = new TwitterApi({
  appKey: 'XXX',
  appSecret: 'XXX',
  accessToken: 'XXX',
  accessSecret: 'XXX',
});

async function downloadUserData() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // timeout 15s
    
    // Supponiamo ci sia un metodo per scaricare i dati, con gestione abort signal
    const data = await client.v2.userDownload({ signal: controller.signal });

    clearTimeout(timeout);
    console.log('Download dati completato', data);

    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('Download timeout, aborting to avoid loop');
    } else {
      console.error('Errore durante download dati:', error);
    }
    throw error;
  }
}

// Invoca la funzione
downloadUserData().catch(e => {
  // Qui puoi gestire fallback, retry limitato, o messaggio utente
  console.error('Non è stato possibile completare il download dati.');
});
