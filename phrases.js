document.addEventListener('DOMContentLoaded', () => {
    loadSettings().then(() => {
      populatePhraseList();
    });
  });


  
function onSettingUpdate(key, newValue, oldValue){
    if(key === 'badPhrases'){
        // Remove entire table and rebuild on each change. Not elegant but it works for now. TODO: Improve this
        const phraseTable = document.getElementById('badPhraseTable');
        phraseTable.innerHTML = '';
        populatePhraseList();
    }
}

function populatePhraseList(){
    const phrases = getSetting('badPhrases');
    const phraseTable = document.getElementById('badPhraseTable');
    console.log(phrases);
    for(const key in phrases){
        const phrase = phrases[key];
        console.log(phrase);
        const audioBlobUrl = base64ToBlobUrl(phrase.details.apiRequest.audioBlob);

        const tr = document.createElement('tr');
        
        const textCell = document.createElement('td');
        textCell.classList.add('text-cell');
        textCell.title = key;
        const textDiv = document.createElement('div');
        textCell.appendChild(textDiv);

        const audioCell = document.createElement('td');
        audioCell.classList.add('audio-cell');
        const audioDiv = document.createElement('div');
        const playButton = document.createElement('button');
        const playImg = document.createElement('img');
        playImg.src = './play.svg';
        playButton.appendChild(playImg);
        const audioElement = document.createElement('audio');
        audioDiv.append(playButton, audioElement);
        audioCell.appendChild(audioDiv);

        const deleteCell = document.createElement('td');
        deleteCell.classList.add('delete-cell');
        const deleteDiv = document.createElement('div');
        const deleteButton = document.createElement('button');
        const deleteImg = document.createElement('img');
        deleteImg.src = './cross.svg';
        deleteButton.appendChild(deleteImg);
        deleteDiv.appendChild(deleteButton);
        deleteCell.appendChild(deleteDiv);

        tr.append(textCell, audioCell, deleteCell);

        audioElement.src = audioBlobUrl;
        textDiv.textContent = phrase.text;
        playButton.addEventListener('click', () => {
            audioElement.play();
        });
        deleteButton.addEventListener('click', async() => {
            await removeBadPhrase(key);
            URL.revokeObjectURL(audioBlobUrl);
            tr.remove();
        });

        phraseTable.appendChild(tr);
    }
}


async function removeBadPhrase(tokenString){
    const phrases = getSetting('badPhrases');
    delete phrases[tokenString];
    await setSetting('badPhrases', phrases);
}


function base64ToBlobUrl(base64Audio) {
    // Remove the data type prefix and keep only the base64 data
    const base64Data = base64Audio.split(",")[1];
  
    // Convert base64 to ArrayBuffer
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
  
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
  
    const byteArray = new Uint8Array(byteNumbers);
  
    // Create a blob from the ArrayBuffer and set the mime type
    const blob = new Blob([byteArray], { type: "audio/webm" });
  
    // Generate a blob URL from the blob
    const blobUrl = URL.createObjectURL(blob);
  
    return blobUrl;
  }
  