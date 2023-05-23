// button name => content script setting convertion is done within each individual button's onclick event listener

document.addEventListener('DOMContentLoaded', () => {
  const startButton = document.getElementById('startButton');
  const subtitleColorButton = document.getElementById('subtitleColorButton');
  const transcribeButton = document.getElementById('transcribeButton');
  const experimentalButton = document.getElementById('experimentalButton');
  const debugButton = document.getElementById('debugButton');
  const subtitleAlignButton = document.getElementById('subtitleAlignButton');
  const gpt4TranslationButton = document.getElementById('gpt4TranslationButton');
  const tlNoteButton = document.getElementById('tlNoteButton');
  const learningModeButton = document.getElementById('learningModeButton');
  const sideBySideButton = document.getElementById('sideBySideButton');
  const compressionButton = document.getElementById('compressionButton');
  const apiKey = document.getElementById('apiKey');
  const showBordersButton = document.getElementById('showBordersButton');
  const autoDubButton = document.getElementById('autoDubButton');
  const overlapLengthSlider = document.getElementById('overlapLengthSlider')
  const snippetLengthSlider = document.getElementById('snippetLengthSlider')
  const overlapLengthSliderText = document.getElementById('overlapLengthSliderText');
  const snippetLengthSliderText = document.getElementById('snippetLengthSliderText');
  const timeoutLengthSlider = document.getElementById('timeoutLengthSlider');
  const timeoutLengthSliderText = document.getElementById('timeoutLengthSliderText');
  const temperatureSlider = document.getElementById('temperatureSlider');
  const temperatureSliderText = document.getElementById('temperatureSliderText');
  const zapperButton = document.getElementById('zapperButton');
  const noSpeechSlider = document.getElementById('noSpeechSlider');
  const noSpeechSliderText = document.getElementById('noSpeechSliderText');
  const probSlider = document.getElementById('probSlider');
  const probSliderText = document.getElementById('probSliderText');
  const debugConsoleButton = document.getElementById('debugConsoleButton');
  const errorConsoleButton = document.getElementById('errorConsoleButton');
  const restoreDefaultSettingsButton = document.getElementById('restoreDefaultSettingsButton');
  const compressionSlider = document.getElementById('compressionSlider');
  const compressionSliderText = document.getElementById('compressionSliderText');
  const exportDataButton = document.getElementById('exportDataButton');
  const clearDebugLogsButton = document.getElementById('clearDebugLogsButton');
  const clearErrorLogsButton = document.getElementById('clearErrorLogsButton');
  const phraseManagerButton = document.getElementById('phraseManagerButton');
  const promptFeedbackButton = document.getElementById('promptFeedbackButton');

  // Overlap Length
  overlapLengthSliderText.addEventListener('keydown', overlapLengthSliderDirectInput);
  overlapLengthSliderText.addEventListener('blur', overlapLengthSliderDirectInput);
  overlapLengthSlider.addEventListener('input', function (event) {
    document.getElementById('overlapLengthSliderText').style.filter = 'brightness(65%)';
    setOverlapLengthSliderText(event.target.value);
  });
  overlapLengthSlider.addEventListener('change', function (event) {
    document.getElementById('overlapLengthSliderText').style.filter = 'brightness(100%)';
    setSetting('overlapLength', event.target.value);
  });
  function overlapLengthSliderDirectInput(event){
    if (event.type === 'blur' || event.key === 'Enter') {
      setOverlapLengthSliderText(event.target.value);
    }
  }
  function setOverlapLengthSliderText(number){
    overlapLengthSliderText.value = `${parseFloat(number).toFixed(2)}s`;
  }

  // Snippet Length
  snippetLengthSliderText.addEventListener('keydown', snippetLengthSliderDirectInput);
  snippetLengthSliderText.addEventListener('blur', snippetLengthSliderDirectInput);
  snippetLengthSlider.addEventListener('input', function (event) {
    document.getElementById('snippetLengthSliderText').style.filter = 'brightness(65%)';
    setSnippetLengthSliderText(event.target.value);
  });
  snippetLengthSlider.addEventListener('change', function (event) {
    document.getElementById('snippetLengthSliderText').style.filter = 'brightness(100%)';
    setSetting('snippetLength', event.target.value);
  });
  function snippetLengthSliderDirectInput(event){
    if (event.type === 'blur' || event.key === 'Enter') {
      setSnippetLengthSliderText(event.target.value);
    }
  }
  function setSnippetLengthSliderText(number){
    snippetLengthSliderText.value = `${parseFloat(number).toFixed(2)}s`;
  }
  

  // Timeout Length
  timeoutLengthSliderText.addEventListener('keydown', timeoutLengthSliderDirectInput);
  timeoutLengthSliderText.addEventListener('blur', timeoutLengthSliderDirectInput);
  timeoutLengthSlider.addEventListener('input', function (event) {
    document.getElementById('timeoutLengthSliderText').style.filter = 'brightness(65%)';
    setTimeoutLengthSliderText(event.target.value);
  });
  timeoutLengthSlider.addEventListener('change', function (event) {
    document.getElementById('timeoutLengthSliderText').style.filter = 'brightness(100%)';
    setSetting('timeout', event.target.value);
  });
  function timeoutLengthSliderDirectInput(event){
    if (event.type === 'blur' || event.key === 'Enter') {
      setTimeoutLengthSliderText(event.target.value);
    }
  }
  function setTimeoutLengthSliderText(number){
    timeoutLengthSliderText.value = `${parseFloat(number).toFixed(2)}s`;
  }
  
  // Temperature
  temperatureSliderText.addEventListener('keydown', temperatureSliderDirectInput);
  temperatureSliderText.addEventListener('blur', temperatureSliderDirectInput);
  temperatureSlider.addEventListener('input', function (event) {
    document.getElementById('temperatureSliderText').style.filter = 'brightness(65%)';
    setTemperatureSliderText(event.target.value);
  });
  temperatureSlider.addEventListener('change', function (event) {
    document.getElementById('temperatureSliderText').style.filter = 'brightness(100%)';
    setSetting('temperature', event.target.value);
  });
  function temperatureSliderDirectInput(event){
    if (event.type === 'blur' || event.key === 'Enter') {
      setTemperatureSliderText(event.target.value);
    }
  }
  function setTemperatureSliderText(number){
    temperatureSliderText.value = `${parseFloat(number).toFixed(2)}`;
  }

  // No speech prob slider
  noSpeechSliderText.addEventListener('keydown', noSpeechSliderDirectInput);
  noSpeechSliderText.addEventListener('blur', noSpeechSliderDirectInput);
  noSpeechSlider.addEventListener('input', function (event) {
    document.getElementById('noSpeechSliderText').style.filter = 'brightness(65%)';
    setNoSpeechSliderText(event.target.value);
  });
  noSpeechSlider.addEventListener('change', function (event) {
    document.getElementById('noSpeechSliderText').style.filter = 'brightness(100%)';
    setSetting('noSpeechProb', event.target.value);
  });
  function noSpeechSliderDirectInput(event){
    if (event.type === 'blur' || event.key === 'Enter') {
      setNoSpeechSliderText(event.target.value);
    }
  }
  function setNoSpeechSliderText(number){
    console.log(typeof(number));
    noSpeechSliderText.value = `${parseFloat(number).toFixed(2)}`;
  }

  // Avg log prob slider
  probSliderText.addEventListener('keydown', probSliderDirectInput);
  probSliderText.addEventListener('blur', probSliderDirectInput);
  probSlider.addEventListener('input', function (event) {
    document.getElementById('probSliderText').style.filter = 'brightness(65%)';
    setProbSliderText(event.target.value);
  });
  probSlider.addEventListener('change', function (event) {
    document.getElementById('probSliderText').style.filter = 'brightness(100%)';
    setSetting('avgLogProb', event.target.value);
  });
  function probSliderDirectInput(event){
    if (event.type === 'blur' || event.key === 'Enter') {
      setProbSliderText(event.target.value);
    }
  }
  function setProbSliderText(number){
    probSliderText.value = `${parseFloat(number).toFixed(2)}`;
  }

  // compression slider with special case for inf
  compressionSliderText.addEventListener('keydown', compressionSliderDirectInput);
  compressionSliderText.addEventListener('blur', compressionSliderDirectInput);
  compressionSlider.addEventListener('input', function (event) {
    document.getElementById('compressionSliderText').style.filter = 'brightness(65%)';
    if(event.target.value === compressionSlider.max){
      compressionSliderText.value = 'inf';
    } else{
      setCompressionSliderText(event.target.value);
    }
  });
  compressionSlider.addEventListener('change', function (event) {
    document.getElementById('compressionSliderText').style.filter = 'brightness(100%)';
    if(event.target.value === compressionSlider.max){
      setSetting('compressionCutoff', 5000000000003.0);
    } else{
      setSetting('compressionCutoff', event.target.value);
    }
  });
  function compressionSliderDirectInput(event){
    if (event.type === 'blur' || event.key === 'Enter') {
      setCompressionSliderText(event.target.value);
    }
  }
  function setCompressionSliderText(number){
    compressionSliderText.value = `${parseFloat(number).toFixed(2)}`;
  }
  


  // Subtitles Enabled button
  startButton.addEventListener('click', () => {
    // global toggle method
    const settingValue = toggleButton('startButton');
    setSetting('babblerActive', settingValue);
    // individual method
    //momentaryButtonPress('startButton');
    //toggleSubtitles();
  });
  // Themed Subtitle Colors button
  subtitleColorButton.addEventListener('click', () => {
    const settingValue = toggleButton('subtitleColorButton');
    setSetting('subtitleColor', settingValue);
  });
  // 
  transcribeButton.addEventListener('click', () => {
    const settingValue = toggleButton('transcribeButton');
    setSetting('transcribe', settingValue);
  });
  // Experimental Features button
  experimentalButton.addEventListener('click', () => {
    const settingValue = toggleButton('experimentalButton');
    setSetting('experimental', settingValue);
    toggleExperimental();
  });
  // Debug/Testing Mode Button
  debugButton.addEventListener('click', () => {
    const settingValue = toggleButton('debugButton');
    setSetting('debug', settingValue);
    toggleDebug();
  });

  subtitleAlignButton.addEventListener('click', () => {
    const settingValue = toggleButton('subtitleAlignButton');
    setSetting('subtitleAlign', settingValue);
  });

  autoDubButton.addEventListener('click', () => {
    const settingValue = toggleButton('autoDubButton');
    setSetting('autoDub', settingValue);
  });

  gpt4TranslationButton.addEventListener('click', () => {
    const settingValue = toggleButton('gpt4TranslationButton');
    setSetting('gpt4Translation', settingValue);
  });

  tlNoteButton.addEventListener('click', () => {
    const settingValue = toggleButton('tlNoteButton');
    setSetting('tlNote', settingValue);
  });

  learningModeButton.addEventListener('click', () => {
    const settingValue = toggleButton('learningModeButton');
    setSetting('learningMode', settingValue);
  });

  sideBySideButton.addEventListener('click', () => {
    const settingValue = toggleButton('sideBySideButton');
    setSetting('sideBySide', settingValue);
  });

  compressionButton.addEventListener('click', () => {
    const settingValue = toggleButton('compressionButton');
    setSetting('compression', settingValue);
  });

  const apiKeyDiv = document.getElementById('apiKeyDiv');
  apiKeyDiv.addEventListener('mouseover', () => {
    if(getSetting('apiKey')){
      spinner.src = './reset.svg'
    }
  });
  apiKeyDiv.addEventListener('mouseout', () => {
    if(getSetting('apiKey')){
      spinner.src = './check.svg'
    }
  });

  spinner.addEventListener('click', async () => {
    await clearApiKey();
    clearApiKeyBox();
  });

  apiKey.addEventListener('input', () => {
    validateAPIKey(apiKey.value);
  });
  // Show HTML Borders Button
  showBordersButton.addEventListener('click', () => {
    const settingValue = toggleButton('showBordersButton');
    setSetting('showBorders', settingValue);
    if(settingValue){
      showHTMLBorders();
    } else {
      hideHTMLBorders();
    }
  });
  // Prompt feedback loop button
  promptFeedbackButton.addEventListener('click', () => {
    const settingValue = toggleButton('promptFeedbackButton');
    setSetting('promptFeedback', settingValue);
  });
  // Zapper Button
  zapperButton.addEventListener('click', () => {
    const settingValue = toggleButton('zapperButton');
    setSetting('zapper', settingValue);
    toggleZapper();
  });
  debugConsoleButton.addEventListener('click', () => {
    const settingValue = toggleButton('debugConsoleButton');
    setSetting('debugConsole', settingValue);
  });
  errorConsoleButton.addEventListener('click', () => {
    const settingValue = toggleButton('errorConsoleButton');
    setSetting('errorConsole', settingValue);
  });
  // Reset settings button
  restoreDefaultSettingsButton.addEventListener('click', async () => {
    momentaryButtonPress('restoreDefaultSettingsButton');
    // Block execution until all settings have been defaulted, then reload
    await restoreDefaultSettings();
    location.reload();
  });
  // Export data button
  exportDataButton.addEventListener('click', () => {
    momentaryButtonPress('exportDataButton');
    exportDebugData();
  });
  // Phrase manager
  phraseManagerButton.addEventListener('click', () => {
    momentaryButtonPress('phraseManagerButton');
    chrome.tabs.create({ url: 'phrases.html' });
  })

  clearDebugLogsButton.addEventListener('click', () => {
    momentaryButtonPress('clearDebugLogsButton');
    clearDebugLogs();
  });
  clearErrorLogsButton.addEventListener('click', () => {
    momentaryButtonPress('clearErrorLogsButton');
    clearErrorLogs();
  });

  // Need to wait for the async settings to load before trying to udpdate the menu state
  loadSettings().then(() => {
    loadMenuState();
    // Set slider text brigtnesses to 100%
    const sliderTexts = document.getElementsByClassName('sliderText');
    for(const slider of sliderTexts){
      slider.style.filter = 'brightness(100%)';
    }
  });
});

function momentaryButtonPress(buttonId){
  const button = document.getElementById(buttonId);
  button.classList.toggle("enabled");
  setTimeout( () => {
    button.classList.toggle("enabled");
  }, 150)
}

function toggleSubtitles(){
  console.log('Sending message');
  // Get the currently active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTabId = tabs[0].id;
    // Send toggle command
    chrome.tabs.sendMessage(activeTabId, 'toggleSubtitles');
  });
}

function onSettingUpdate(key, value){
}

function toggleZapper(){
  
}

function clearDebugLogs(){
  setDefaultSetting('subtitleLog');
}

function clearErrorLogs(){
  setDefaultSetting('errorLog');
}

function toggleDebug() {
  const elements = document.getElementsByClassName("debug");
  for (let i = 0; i < elements.length; i++) {
    elements[i].style.display = elements[i].style.display === "table-row" ? "none" : "table-row";
  }
}

function toggleExperimental(){
  const elements = document.getElementsByClassName("experimental");
  for (let i = 0; i < elements.length; i++) {
    elements[i].style.display = elements[i].style.display === "table-row" ? "none" : "table-row";
  }
}

function toggleButton(buttonId) {
  const button = document.getElementById(buttonId);
  return button.classList.toggle("enabled");
}

async function loadMenuState() {
  for (const key in setting) {
    const value = getSetting(key);
    const id = getSettingID(key);
    if(id && (value !== null)){
      applyMenuState(key, value);
    }
  }
}

function applyMenuState(key, value) {
  switch (setting[key].ui) {
    case 'button':
      console.log(`${key}: ${value}`);
      setButton(setting[key].id, value);
      if(key === 'debug' && value){
        toggleDebug();
      } else if(key === 'experimental' && value){
        toggleExperimental();
      }
      break;
    case 'range':
      const slider = document.getElementById(setting[key].id)
      slider.value = value;
      // Trigger the input event listener to update text boxes
      const inputEvent = new Event('input');
      slider.dispatchEvent(inputEvent);
      break;
    case 'text':
      // TODO
      break;
    case 'value':
      // TODO
      break;
    case 'apiKey':
      // Only validated API keys will be saved
      if(value !== ''){
        // Fill in the API key text field with a visual indicator
        fillApiKeyBox();
      }
    break;
  }
}

function fillApiKeyBox(){
  const apiKeyField = document.getElementById('apiKey');
  apiKeyField.placeholder = "●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●";
  const spinner = document.getElementById('spinner');
  spinner.src = "./check.svg";
}

function clearApiKeyBox(){
  const apiKeyField = document.getElementById('apiKey');
  apiKeyField.placeholder = 'Enter API key here';
  const spinner = document.getElementById('spinner');
  spinner.src = "./warning.svg";
}

function setButton(buttonId, savedValue) {
  let button = document.getElementById(buttonId);
  if(button){
    let buttonEnabled = button.classList.contains('enabled');
  
    if (buttonEnabled ^ savedValue) {
      button.classList.add('enabled');
    }
  }
}

// This function will validate and apply the supplied key
async function validateAPIKey(input){
  let spinner = document.getElementById('spinner');
  const key = input.trim();
  // API key lengths are 51 chars
  if(key.length != 51){
    spinner.src = "./warning.svg";
    return;
  }
  spinner.src = "./gear.svg";
  const apiURL = 'https://api.openai.com/v1/models/whisper-1';
  const timeout = getSetting('timeout');
  const requestOptions = {
    method: 'GET',
    headers: {'Authorization': `Bearer ${key}`}
  };

  try {
    const apiResponse = await fetchWithTimeout(apiURL, requestOptions, timeout);
    const apiResult = await apiResponse.json();

    if (apiResult) {
      // OpenAI related errors
      if(apiResult.error){
        if(apiResult.error.code == "invalid_api_key"){
          // Invalid API key
          spinner.src = "./cross.svg";
        } else if(apiResult.error.code == "something"){
          // 
          spinner.src = "./cross.svg";
        } else {
          // unknown error
          //alert(`Unknown OpenAI error occurred: ${error.message}. Please tell Alex!`);
          console.error(apiResult);
          spinner.src = "./warning.svg";
        }
      } else {
          // API key successfully validated
          spinner.src = "./check.svg";
          setSetting('apiKey', key);
        }
    }
    // Network related errors
  } catch (error){
    if (error.message === 'Request timeout') {
      console.log('dropping slow request');
      // TODO: Communicate a warning message
      spinner.src = "./warning.svg";
    } else{
    // TODO: Indicate different error types
      //alert(`Unknown network error occurred: ${error.message}. Please tell Alex!`);
      console.error(error);
      spinner.src = "./warning.svg";
    }
  }
}

const fetchWithTimeout = async (url, options, timeout) => {
  const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout * 1000)
  );

  try {
      const response = await Promise.race([
          fetch(url, options),
          timeoutPromise,
      ]);
      return response;
  } catch (error) {
    return error;
  }
};

function showHTMLBorders(){
  const elements = document.querySelectorAll('*');
  for (let i = 0; i < elements.length; i++) {
      elements[i].style.outline = '1px solid red';
  }
}
function hideHTMLBorders(){
  const elements = document.querySelectorAll('*');
  for (let i = 0; i < elements.length; i++) {
      elements[i].style.outline = '';
  }
}