// Static settings reference object. Live varables are stored in localStorage
const setting = {
  // Setting Name             UI Element ID                 UI Element type     Data Type         Default Value
  'babblerActive':            {id: 'startButton',           ui: 'button',       type: 'bool',     default: true},
  'subtitleColor':            {id: 'subtitleColorButton',   ui: 'button',       type: 'bool',     default: true},
  'transcribe':               {id: 'transcribeButton',      ui: 'button',       type: 'bool',     default: false},
  'experimental':             {id: 'experimentalButton',    ui: 'button',       type: 'bool',     default: false},
  'debug':                    {id: 'debugButton',           ui: 'button',       type: 'bool',     default: false},
  'subtitleAlign':            {id: 'subtitleAlignButton',   ui: 'button',       type: 'bool',     default: false},
  'gpt4Translation':          {id: 'gpt4TranslationButton', ui: 'button',       type: 'bool',     default: false},
  'tlNote':                   {id: 'tlNoteButton',          ui: 'button',       type: 'bool',     default: false},
  'learningMode':             {id: 'learningModeButton',    ui: 'button',       type: 'bool',     default: false},
  'compression':              {id: 'compressionButton',     ui: 'button',       type: 'bool',     default: false},
  'antimass':                 {id: 'antimassButton',        ui: 'button',       type: 'bool',     default: false},
  'sideBySide':               {id: 'sideBySideButton',      ui: 'button',       type: 'bool',     default: false},
  'showBorders':              {id: 'showBordersButton',     ui: 'button',       type: 'bool',     default: false},
  'autoDub':                  {id: 'autoDubButton',         ui: 'button',       type: 'bool',     default: false},
  'forceDarkSubtitleBg':      {id: null,                    ui: 'button',       type: 'bool',     default: false},
  'forceLightSubtitleBg':     {id: null,                    ui: 'button',       type: 'bool',     default: false},
  'overlapLength':            {id: 'overlapLengthSlider',   ui: 'range',        type: 'float',    default: 0.5},
  'snippetLength':            {id: 'snippetLengthSlider',   ui: 'range',        type: 'float',    default: 5},
  'apiKey':                   {id: 'apiKey',                ui: 'apiKey',       type: 'string',   default: ''},
  'timeout':                  {id: 'timeoutLengthSlider',   ui: 'range',        type: 'float',    default: 9.50},
  'numSubtitleRows':          {id: null,                    ui: 'range',        type: 'int',      default: 2},
  'subtitleVerticalMargin':   {id: null,                    ui: 'range',        type: 'int',      default: 2},
  'subtitleOffset':           {id: null,                    ui: 'range',        type: 'int',      default: 0},
  'temperature':              {id: 'temperatureSlider',     ui: 'range',        type: 'float',    default: 0.30},
  'noSpeechProb':             {id: 'noSpeechSlider',        ui: 'range',        type: 'float',    default: 1.00},
  'avgLogProb':               {id: 'probSlider',            ui: 'range',        type: 'float',    default: 0.00},
  'mode':                     {id: null,                    ui: null,           type: 'string',   default: 'NORMAL'},
  'apiURL':                   {id: null,                    ui: null,           type: 'string',   default: 'https://api.openai.com/v1/audio/translations'},
  'zapper':                   {id: 'zapperButton',          ui: 'button',       type: 'bool',     default: false},
  'badPhrases':               {id: null,                    ui: null,           type: 'object',   default: {}},
  'debugConsole':             {id: 'debugConsoleButton',    ui: 'button',       type: 'bool',     default: false},
  'errorConsole':             {id: 'errorConsoleButton',    ui: 'button',       type: 'bool',     default: false},
  'compressionCutoff':        {id: 'compressionSlider',     ui: 'range',        type: 'float',    default: 2.70},
  'errorLog':                 {id: null,                    ui: null,           type: 'table',    default: []},
  'subtitleLog':              {id: null,                    ui: null,           type: 'table',    default: []},
  'defaultSubtitleColor':     {id: null,                    ui: null,           type: 'string',   default: '#ffeeb2'},
  'promptFeedback':           {id: 'promptFeedbackButton',  ui: 'button',       type: 'bool',     default: false},
};

// Settings that should not be cleared by restoreDefaultSettings
const persist = ['badPhrases', 'apiKey', 'errorLog', 'subtitleLog'];

// channelId: color
const subtitleColors = {
  'UCajhBT4nMrg3DLS-bLL2RCg': "#ffeeb2", // pika
  'UC3vzVK_N_SUVKqbX69L_X4g': "#ff807e", // tmsk
  'UCivDgaCAh7WPBoKA24WNwJQ': "#61cc62", // dmj
  'UCE5VgVGRPfNCjXPeTe1QJHA': "#274374", // miu
  'UC0ZTVxCHkZanT5dnP2FZD4Q': "#8ba9e1", // yura
  'UC9ruVYPv7yJmV0Rh0NKA-Lw': "#dab1d9", // kson
  'UCp6993wxpyDPHUpavwDFqgg': "#008bd8", // sora
  'UCD8HOxPs4Xvsm8H0ZxXGiBw': "#fed600", // mel
  'UCp-5t9SrOQwXMU7iIjQfARg': "#c7001e", // mio
  'UC1DCedRgGHBdm81E1llLhOQ': "#c7e5fe", // pekora
  'UCZlDXzGoo7d44bwdNObFacg': "#95ccfe", // kanata
  'UCFKOVgVbGmX65RxO3EtH3iw': "#a0f9fe", // lamy
  'UCDqI2jOz0weumE8s7paEk6g': "#f90000", // roboco
  'UCdn5BQ06XqgXoAxIhbqw5Rg': "#00b8ea", // fubuki
  'UCXTpFs_3PqI41qX2d9tL2Rw': "#884df6", // shion
  'UCvaTdHTWBGv3MKj3KVqJVCw': "#bd34a4", // okayu
  'UCl_gCybOJRIgOXw6Qb4qJzQ': "#00d1bd", // rushia
  'UCS9uQI-jC3DE0L4IpXyvr6w': "#fe9532", // coco
  'UCAWSyEs_Io8MtpY3m-zqILA': "#feb55d", // nene
  'UC-hM6YJuNYVAmUWxeIr9FeA': "#feb8b8", // miko
  'UCQ0UDLQCjY0rmuxCDE38FGg': "#f97d00", // matsuri
  'UC7fk0CB07ly8oSl0aqKkqFg': "#fe415a", // ayame
  'UChAnqc_AY5_I3Px5dig3X1Q': "#febd00", // korone
  'UCvInZx9h3jC2JzsIzoOebWg': "#f96432", // flare
  'UCqm3BQLlJfvkTsX_hvm0UmA': "#fef09d", // watame
  'UCUKD-uaobj9jiqB-VXt71mA': "#a2e4ce", // botan
  'UC5CwaMl1eIgY8h02uZw7u8A': "#5ab3f4", // suisei
  'UC1CfXB_kRs3C-zaeTG3oGyg': "#95fe37", // akirose
  'UC1suqwovbL1kzsoaZgFzLKg': "#fe64a9", // choco
  'UCdyqAaZDKHXg4Ahi7VENThQ': "#d1dbdb", // noel
  'UC1uv2Oq6kNxgATlCiez59hw': "#b395e0", // towa
  'UCK9V2B22uJYu3N7eR_BT9QA': "#fe0f80", // polka
  'UC0TXe_LYZ4scaW2XMyi5_kw': "#fe003c", // azki
  'UC1CfXB_kRs3C-zaeTG3oGyg': "#e00019", // haato
  'UCvzGlP9oQwU--Y0r9id_jnA': "#00e5ea", // subaru
  'UCCzUftO8KOVkV4wQG1vkUvg': "#ea0a5a", // marine
  'UCa9Y57gfeY0Zro_noHRVrnw': "#fe95de", // luna
  'UC6t3-_N8A6ME1JShZHHqOMw': "#fe2f3f", // miyabi
  'UCNVEsYbiZjH5QLmGeSgTSzg': "#f4bf0c", // astel
  'UCOyYb1c43VlX9rc_lT6NKQw': "#f5baba", // risu
  'UCYz_5n-uDuChHtLo7My1HnQ': "#d50e54", // ollie
  'UCL_qhgtOy0dy1Agp8vkySQg': "#c80d40", // calli
  'UCZgOv3YDEs-ZnZWDYVwJdmA': "#5164fe", // izuru
  'UCGNI4MENvnsymYjKiZwv9eg': "#fef698", // temma
  'UCP0BspO_AMEe3aQqqpo89Dg': "#b09cdb", // moona
  'UC727SQYUvx5pDDGQpTICNWg': "#f1c85c", // anya
  'UCHsx4Hqa-1ORjQTh9TYDhww': "#fe511c", // kiara
  'UCKeAhJvy8zgXWbh9duVjIaQ': "#2f6f4f", // ararun
  'UCANDOlYTJT7N5jlRC3zfzVA': "#ea6e00", // roberu
  'UCAoy6rzhSf4ydcYjJw3WoVg': "#b2ed55", // iofi
  'UChgTyjG-pdNvxxhdsXfHQ5Q': "#0f52b9", // reine
  'UCMwGHR0BTZuLsmjY_NT5Pwg': "#9575e2", // ina
  'UC9mf_ZVpouoILRY9NUIaK-w': "#feb6de", // rikka
  'UChSvpZYRPh0FvG4SJGSga3g': "#7a559a", // shien
  'UCoSrY_IQQVpmIRZ9Xf-y93g': "#5d80c9", // gura
  'UCwL7dgTxKo8Y4RFIKWaf8gA': "#92eb2d", // oga
  'UCyl1z3jo3XHR1riLFKG5UAg': "#f7da91", // watson
  'UCDRWSO281bIHYVi-OV3iFYA': "#61cc62", // vesper
  'UCLGaPXIpe67JWtwlrXZwTvw': "#1423d4", // ebosi
  'UCXuqSBlHAE6Xw-yeJA0Tunw': "#FF4D00", // ltt
};

// HOW TO USE
// If you load this as part of another script, include these two things:
// Call loadSettings() to initialize settings and return execution once things are ready
// loadSettings().then(() => {
//   yourCodeHere();
// });
//
// Have a onSettingUpdate(key, newValue, oldValue) function to react to settings changes
// onSettingUpdate(key, newValue, oldValue);

// Listen for setting updates and reflect them in the settings object
chrome.storage.onChanged.addListener((changes, namespace) => {
  for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
    if(setting[key].value != newValue){
      setting[key].value = newValue;
      onSettingUpdate(key, newValue, oldValue);
    }
  }
});

// Populate chrome.storage and settings object to provide synchronous storage
function loadSettings() {
  return new Promise(async (resolve) => {
    let keys = Object.keys(setting);
    for (const key of keys) {
      const storage = await new Promise((resolve) => {
        chrome.storage.local.get(key, (result) => {
          resolve(result);
        });
      });
      if (key in storage) {
        setting[key].value = storage[key];
      } else {
        await new Promise((resolve) => {
          chrome.storage.local.set({ [key]: setting[key].default }, () => {
            resolve();
          });
        });
        setting[key].value = setting[key].default;
      }
    }
    resolve();
  });
}

function getSetting(key) {
  switch(setting[key].type){
    case 'string':
      return String(setting[key].value);
    case 'bool':
      return Boolean(setting[key].value);
    case 'int':
      return parseInt(setting[key].value);
    case 'float':
      return parseFloat(setting[key].value);
    default:
      return setting[key].value;
  }
}

async function restoreDefaultSettings(){
  for(const key in setting){
    if(!persist.includes(key)){
      await setDefaultSetting(key);
    }
  }
}


async function setDefaultSetting(key){
  await setSetting(key, getDefaultSetting(key));
}

async function clearApiKey(){
  await setDefaultSetting('apiKey');
}

// TODO: Error checking for attempting to use wrong data type
async function setSetting(key, value) {
  setting[key].value = value;
  await syncSetting(key, value);
}

// Sync a setting to chrome.storage
async function syncSetting(key, value){
  new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, () => {
      resolve();
    });
  });
}

// Read from static setting object
function getSettingUI(key) {
  return setting[key].ui;
}
function getSettingID(key) {
  return setting[key].id;
}
function getDefaultSetting(key) {
  return setting[key].default;
}


// Move these to util.js later

function downloadFile(data, filename, type) {
  const file = new Blob([data], { type: type });
  const url = URL.createObjectURL(file);
  
  chrome.downloads.download({
    url: url,
    filename: filename,
    saveAs: true
  }, () => {
    URL.revokeObjectURL(url);
  });
}

function exportDebugData(){
  const badPhrases = getSetting('badPhrases');
  const errorLog = getSetting('errorLog');
  const subtitleLog = getSetting('subtitleLog');
  const debugData = {
    badPhrases: badPhrases,
    errorLog: errorLog,
    subtitleLog: subtitleLog
  }
  const jsonString = JSON.stringify(debugData);
  downloadFile(jsonString, "data.json", "application/json");
}


