// Static variables
const VERSION = '0.2.1 TEST';

// Map of video elements to subtitle containers
const subtitleContainers = new WeakMap();

// Our shadow DOM element
var babblerRootContainer
var babblerRoot;

// Session variables that should remain until a page reload
var primePrompt = ``; // The prompt that is used to prime the AI
var staticPrompt = ``; // The prompt that is used on all requests

var subtitlesActive = false; // TODO: Is this obselete? Investigate and remove if so
var channelIdLookup = {}; // ChannelID cache

// Per-video varables that should be reset on video src change
// Each map is indexed with the subtitle container as the key
// WeakMaps are used so that referenced subtitle containers can be garbage collected
var inFlightRequests = new WeakMap();
var inFlightRecordings = new WeakMap();
var lastText = new WeakMap();
var namePrompt = new WeakMap();

// Create a dummy onSettingsUpdate() function
// Once loadSettings() is called, redefine it so that nothing is executed before settings are available 
function onSettingUpdate() { }

loadSettings().then(() => {
    init();
});

// Proxy document.createElement to mark our elements with the babbler class
function babblerCreateElement(tag, className) {
    const element = document.createElement(tag);
    element.classList.add('babbler');
    if (className) {
        if (Array.isArray(className)) {
            for (const eachClass of className) {
                element.classList.add(eachClass);
            }
        } else if (typeof className === 'string') {
            element.classList.add(className);
        }
    }
    if (getSetting('showBorders')) {
        element.style.outline = '1px solid red';
    }
    return element;
}

function startSubtitles(videoElement, subtitleContainer) {
    if (!getSetting('apiKey')) {
        addSystemSubtitle("[System] Please enter your OpenAI API key. You can create one <a target=\"_blank\" rel=\"noopener noreferrer\" href=\"https://platform.openai.com/account/api-keys\">here</a>", subtitleContainer)
    } else {
        addSystemSubtitle("[System] Subtitles loading...", subtitleContainer)

        subtitleContainer.setAttribute('active', '');

        // Add to in flight request map
        inFlightRequests.set(subtitleContainer, {});

        if (videoElement.readyState < 3) {
            videoElement.addEventListener('canplay', onVideoReady);
        } else {
            startRecordingSnippets(videoElement, subtitleContainer);
        }
        
        function onVideoReady() {
            videoElement.removeEventListener('canplay', onVideoReady);
            startRecordingSnippets(videoElement, subtitleContainer);
        }
    }
}


// Check if the video is eligible for subtitles
// Video should have a populated src and be active
function videoIsEligible(videoElement) {
    return videoElement.readyState > 2 && !videoElement.ended;
}

// WARNING: Called each frame
function matchSubtitlesToVideoPosition(videoElement, subtitleContainer) {
    const rect = videoElement.getBoundingClientRect();
    
    // Account for scorlling
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    subtitleContainer.style.width = rect.width + 'px';
    subtitleContainer.style.height = rect.height + 'px';
    subtitleContainer.style.top = (rect.top + scrollTop) + 'px';
    subtitleContainer.style.left = (rect.left + scrollLeft) + 'px';
}


function detachObservers(observers) {
    //console.log(observers);
    //console.trace();
    for (const observer of observers) {
        observer.disconnect();
    }
}

// Mutation observers
const videoSpawnObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
            let videoElements;
            if (node.tagName === 'VIDEO') {
                videoElements = [node];
            } else {
                videoElements = (node.nodeType === Node.ELEMENT_NODE) ? node.querySelectorAll('video') : [];
            }
            for(const videoElement of videoElements){
                if(!videoElement.babblerProcessed){
                    processVideo(videoElement);
                }
            }
        }
    }
});

function attachVideoRemovedObserver(videoElement, subtitleContainer, observers) {
    const videoRemovedObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList' && mutation.removedNodes.length > 0) {
                for (const removedNode of mutation.removedNodes) {
                    if (removedNode === videoElement) {
                        //console.log(`video element removed, removing corresponding subtitle container and observers`);
                        // detachObservers(observers);
                        removeSubtitleContainer(subtitleContainer);
                    }
                }
            }
        }
    });
    videoRemovedObserver.observe(document.body, {
        childList: true,
        subtree: true
    });

    return videoRemovedObserver;
}


function getVideoSubtitleContainer(videoElement) {
    return subtitleContainers.get(videoElement);
}

function onVideoCanPlay(event) {
    const videoElement = event.target;
    spawnSubtitles(videoElement);
}

// TODO: Kind of a hacky solution, revisit this later
function onVideoCanPlayAfterSeek(event) {
    const videoElement = event.target;
    // Respawn our subtitle container
    const subtitleContainer = spawnSubtitles(videoElement);
    startSubtitles(videoElement, subtitleContainer);
    // Restore original event listener
    event.target.removeEventListener('canplay', onVideoCanPlayAfterSeek);
    event.target.addEventListener('canplay', onVideoCanPlay);
}

function onVideoEnded(event){
    const subtitleContainer = getVideoSubtitleContainer(event.target);
    removeSubtitleContainer(subtitleContainer);
}

function onVideoEmptied(event){
    const subtitleContainer = getVideoSubtitleContainer(event.target);
    removeSubtitleContainer(subtitleContainer);
}

// On seek events, this will trigger before a videoEmpty event
// Lazy way to handle seeking for now
function onVideoSeeked(event){
    // Redefine the canplay callback function for the video element listener to onVideoCanPlayAfterSeek
    // This will ensure that the subtitles are reloaded after a seek
    if(subtitleContainerIsActive(event.target)){
        event.target.removeEventListener('canplay', onVideoCanPlay);
        event.target.addEventListener('canplay', onVideoCanPlayAfterSeek);
    }
}

function removeEventListeners(videoElement){
    videoElement.removeEventListener('canplay', onVideoCanPlay);
    videoElement.removeEventListener('ended', onVideoEnded);
    videoElement.removeEventListener('emptied', onVideoEmptied);
    videoElement.removeEventListener('seeked', onVideoSeeked);
}

function attachEventListeners(videoElement){
    // Clear any existing event listeners before attaching new ones
    removeEventListeners(videoElement);
    videoElement.addEventListener('canplay', onVideoCanPlay);
    videoElement.addEventListener('ended', onVideoEnded);
    videoElement.addEventListener('emptied', onVideoEmptied);
    videoElement.addEventListener('seeked', onVideoSeeked);
}


function subtitleContainerIsActive(videoElement){
    const subtitleContainer = getVideoSubtitleContainer(videoElement);
    return subtitleContainer && subtitleContainer.getAttribute('active') == '';
}

// Spawn, attach and start subtitles for a newly created video element
// Can be called on a video with existing subtitles to respawn them
function spawnSubtitles(videoElement) {
    console.trace();
    // Check if entry exists in subtitleContainers map and remove it if found
    if (subtitleContainers.has(videoElement)) {
        const oldSubtitleContainer = subtitleContainers.get(videoElement);
        removeSubtitleContainer(oldSubtitleContainer);
        subtitleContainers.delete(videoElement);
    }
    const subtitleContainer = createSubtitleContainer(videoElement);
    subtitleContainers.set(videoElement, subtitleContainer);

    // TODO: Find better, event-based way to do this
    function followVideo() {
        if(videoElement && subtitleContainer && document.contains(videoElement) && babblerRoot.contains(subtitleContainer)){
            matchSubtitlesToVideoPosition(videoElement, subtitleContainer);
            requestAnimationFrame(followVideo)
        }
    }

    // Make the subtitle container follow the video element
    requestAnimationFrame(followVideo);

    // attach event listeners
    attachEventListeners(videoElement);

    // Update subtitle colors
    updateSubtitleColor();

    return subtitleContainer;
}

// Trigger the removeEventListeners event for a video element
function triggerRemoveVideoEventListeners(videoElement){
    videoElement.dispatchEvent(new CustomEvent("removeEventListeners"));
}

function processVideo(videoElement){
    if(videoIsEligible(videoElement)){
        spawnSubtitles(videoElement);
    } else {
        // If the video isn't ready, attach event listeners
        attachEventListeners(videoElement);
    }
    videoElement.babblerProcessed = true;
}

function spawnAllSubtitles() {
    // Attatch observers to all video elements on the page, and attach subtitles if eligible
    for (const videoElement of document.querySelectorAll('video')) {
        processVideo(videoElement);
    }
    // Apply default or saved settings (subtitle Colors, consoles, etc.)
    applyGlobalSettings();
}

// Returns the src of the supplied video element, checking for sources in the video element and any child source elements
function getVideoSrc(videoElement) {
    // Check if video element has a src tag present
    if (videoElement.hasAttribute('src')) {
        return videoElement.getAttribute('src');
    } else {
        // Check if video element has a source tag present. If it does, return the current active source of the parent element
        const sourceElement = videoElement.querySelector('source');
        if (sourceElement) {
            return videoElement.currentSrc;
        } else {
            // If no src or source tag is present, return empty string
            return '';
        }
    }
}

function reloadAllSubtitles() {
    removeAllSubtitles();

    // Add a delay before showing subtitles again to allow the page to catch up
    // TODO: Identify an event to trigger this off of instead of a timeout
    setTimeout(() => {
        spawnAllSubtitles();
    }, 500);

}

function removeSubtitleContainer(subtitleContainer) {
    // stopSubtitles(subtitleContainer);
    subtitleContainer.remove();
}

function removeAllSubtitles() {
    for (const subtitleContainer of babblerRoot.querySelectorAll('.babbler-subtitle-container')) {
        removeSubtitleContainer(subtitleContainer);
    }
}


function startup(){
    console.log('[Babbler] Starting Babbler...');
    subtitlesActive = true;

    // Watch for any new video elements that are added to the page
    videoSpawnObserver.observe(document.documentElement, {
        childList: true,
        subtree: true
    })

    // Create shadow root for styles and subtitle containers
    babblerRootContainer = document.createElement('div');
    document.body.appendChild(babblerRootContainer);
    babblerRoot = babblerRootContainer.attachShadow({mode: 'open'});

    // Inject CSS
    injectCSS();

    // Process all current video elements on the page
    spawnAllSubtitles();

    // Apply settings such as subtitle color
    applyGlobalSettings();

    // Redefine function we declared earlier
    onSettingUpdate = (key, value, oldValue) => {
        switch (key) {
            case 'showBorders':
                if (value) {
                    showHTMLBorders();
                } else {
                    hideHTMLBorders();
                }
                break;
            case 'babblerActive':
                if (value) {
                    startup();
                } else {
                    shutdown();
                }
                break;
            case 'apiKey':
                // Reload subtitles if the user enters an API key while on the 'Please enter your API key' message
                if (value !== '' && oldValue === '' && subtitlesActive) {
                    removeAllSubtitles();
                    spawnAllSubtitles();
                }
                break;
            case 'debugConsole':
                if (value) {
                    showDebugConsole();
                } else {
                    hideDebugConsole();
                }
                break;
            case 'errorConsole':
                if (value) {
                    showErrorConsole();
                } else {
                    hideErrorConsole();
                }
                break;
            case 'subtitleColor':
                if (value) {
                    enableSubtitleColor();
                } else {
                    disableSubtitleColor();
                }
                break;
            default:
        }
    }
}

function init() {
    // Entry Point
    console.log(`[Babbler] Babbler ${VERSION} Started`);

    if(getSetting('babblerActive')){
        startup();
    } else {
        onSettingUpdate = (key, value, oldValue) => {
            if(key === 'babblerActive' && value){
                startup();
            }
        }
    }
}

function shutdown() {
    console.log('[Babbler] Stopping Babbler...');
    subtitlesActive = false;
    videoSpawnObserver.disconnect();
    removeAllSubtitles();
}

function toggleSubtitles(videoElement, subtitleContainer){
    // Check if the "active" tag is present on the subtitle container
    if(subtitleContainer.getAttribute('active') === ''){
        // subtitleContainer.removeAttribute('active');
        // stopSubtitles(subtitleContainer);
        spawnSubtitles(videoElement);
    } else {
        startSubtitles(videoElement, subtitleContainer);
    }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message == 'toggleSubtitles') {
        if (subtitlesActive) {
            shutdown();
        } else {
            startup();
        }
    }
});

function applyGlobalSettings() {
    updateSubtitleColor();
    applyConsoles();
}

function applyConsoles(){
    // Spawn any enabled consoles
    if (getSetting('debugConsole')) {
        showDebugConsole();
    }
    if (getSetting('errorConsole')) {
        showErrorConsole();
    }
}


// TODO: These can be moved to util
function showHTMLBorders() {
    const elements = babblerRoot.querySelectorAll(".babbler");
    for (let i = 0; i < elements.length; i++) {
        elements[i].style.outline = '1px solid red';
    }
}

function hideHTMLBorders() {
    const elements = babblerRoot.querySelectorAll(".babbler");
    for (let i = 0; i < elements.length; i++) {
        elements[i].style.outline = '';
    }
}

function showDebugConsole() {
    for (const debugConsole of babblerRoot.querySelectorAll('.babbler-debug-console')) {
        debugConsole.style.display = 'block';
    }
}

function hideDebugConsole() {
    for (const debugConsole of babblerRoot.querySelectorAll('.babbler-debug-console')) {
        debugConsole.style.display = 'none';
    }
}

function showErrorConsole() {
    for (const errorConsole of babblerRoot.querySelectorAll('.babbler-error-console')) {
        errorConsole.style.display = 'block';
    }
}

function hideErrorConsole() {
    for (const errorConsole of babblerRoot.querySelectorAll('.babbler-error-console')) {
        errorConsole.style.display = 'none';
    }
}

// Subtitle Colors

function updateSubtitleColor(){
    if (getSetting('subtitleColor')) {
        enableSubtitleColor();
    } else {
        disableSubtitleColor();
    }
}

async function enableSubtitleColor() {
    const channelId = await getCachedChannelId();
    if (channelId in subtitleColors) {
        applySubtitleColor(subtitleColors[channelId]);
    } else {
        applyDefaultSubtitleColor();
    }
}

function disableSubtitleColor() {
    applyDefaultSubtitleColor();
}

function applyDefaultSubtitleColor() {
    applySubtitleColor(getSetting('defaultSubtitleColor'));
}

function applySubtitleColor(subtitleColor) {
    const BLACK_RGB = "rgb(0, 0, 0)";
    const BLACK_RGBA = "rgba(0, 0, 0, 0.6)";
    const WHITE_RGB = "rgb(255, 255, 255)";
    const WHITE_RGBA = "rgba(255, 255, 255, 0.6)";

    const forceDarkSubtitleBg = getSetting('forceDarkSubtitleBg');
    const forceLightSubtitleBg = getSetting('forceLightSubtitleBg');
    const isDark = isColorDark(subtitleColor);

    const bgColor = forceDarkSubtitleBg ? BLACK_RGB :
        forceLightSubtitleBg ? WHITE_RGB :
            isDark ? WHITE_RGB : BLACK_RGB;

    const bgAColor = forceDarkSubtitleBg ? BLACK_RGBA :
        forceLightSubtitleBg ? WHITE_RGBA :
            isDark ? WHITE_RGBA : BLACK_RGBA;

    babblerRootContainer.style.setProperty('--babbler-fgcolor', subtitleColor);
    babblerRootContainer.style.setProperty('--babbler-bgcolor', bgColor);
    babblerRootContainer.style.setProperty('--babbler-bgacolor', bgAColor);
}

async function getCachedChannelId() {
    const channelIcon = document.querySelector('.ytd-video-owner-renderer');
    const channelUrl = channelIcon ? channelIcon.href : null;
    if (channelUrl) {
        if (channelUrl in channelIdLookup) {
            return channelIdLookup[channelUrl];
        } else {
            const channelId = await getChannelId();
            channelIdLookup[channelUrl] = channelId;
            return channelId;
        }
    } else {
        return null;
    }
}

async function getChannelId() {
    const channelUrl = document.querySelector('.ytd-video-owner-renderer').href;
    if (channelUrl) {
        try {
            const response = await fetch(channelUrl);
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const metaTag = doc.querySelector('meta[itemprop="channelId"]') || doc.querySelector('meta[itemprop="identifier"]');
            if (!metaTag) {
                babblerError('[ERROR] Failed to extract YouTube channelId', { data: `Failed to extract channelID from meta tags for channel ${channelUrl}` });
                return null;
            } else {
                return metaTag.getAttribute('content');
            }

        } catch (error) {
            error.data = 'Failed to fetch channel page';
            babblerError('[ERROR] Failed to fetch YouTube channel page', error);
            return null;
        }
    } else {
        return null;
    }
}

// TODO: This function is growing large, split it up a bit
function createSubtitleContainer(videoElement) {
    if (!videoElement) {
        return null;
    }
    // Create a new div element and reset all inherited styles
    const subtitleContainer = babblerCreateElement('div', 'babbler-subtitle-container');

    // Create the upper panel
    const panelContainer = babblerCreateElement('div', 'babbler-panel-container');
    panelContainer.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent the click from pausing the video
    });
    subtitleContainer.appendChild(panelContainer);

    // Split the upper panel into the right and left sides
    const consoleLeft = babblerCreateElement('div', ['babbler-debug-console', 'babbler-console']);
    panelContainer.appendChild(consoleLeft);

    const panelRight = babblerCreateElement('div', ['babbler-error-console', 'babbler-console']);
    panelContainer.appendChild(panelRight);

    // Create a zone for controls
    const controlZone = babblerCreateElement('div', 'babbler-control-zone');
    // Add start/stop button to control zone
    const startStopButton = babblerCreateElement('button', ['babbler-start-stop-button', 'fade-out']);
    startStopButton.innerHTML = 'Toggle Subtitles';
    startStopButton.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent the click from pausing the video
        toggleSubtitles(videoElement, subtitleContainer);
    });
    controlZone.appendChild(startStopButton);
    subtitleContainer.appendChild(controlZone);

    // Create a zone for the generated subtitles to be placed in
    const subtitleZone = babblerCreateElement('div', 'babbler-subtitle-zone');
    subtitleContainer.appendChild(subtitleZone);

    // Ensure the video element has a relative position so the overlay div is positioned correctly
    // if (window.getComputedStyle(videoElement).position === "static") {
    //     videoElement.style.position = "relative";
    // }

    function flashStartStopButton() {
        //startStopButton.style.display = 'block';
        startStopButton.classList.add('fade-in');
        startStopButton.classList.remove('fade-out');

        clearTimeout(startStopButton.timer);
    
        startStopButton.timer = setTimeout(function() {
            startStopButton.classList.add('fade-out');
            startStopButton.classList.remove('fade-in');
        }, 500);
    }

    // Using the mousemove event listener will prevent it from reaching the video, so we need a custom solution
    document.addEventListener('mousemove', function(event) {
        let x = event.clientX; // X position
        let y = event.clientY; // Y position
    
        let rect = subtitleContainer.getBoundingClientRect();
    
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
            flashStartStopButton();
        }
    });

    // Flash startstop button once on load
    flashStartStopButton();
    
    babblerRoot.appendChild(subtitleContainer);
    // videoElement.parentElement.appendChild(subtitleContainer);

    matchSubtitlesToVideoPosition(videoElement, subtitleContainer);

    // Initialize container-specific settings
    lastText.set(subtitleContainer, primePrompt);
    namePrompt.set(subtitleContainer, '');

    // Hide/show consoles
    applyConsoles();

    return subtitleContainer;
}


// TODO: Find a better way to add CSS to the page
function injectCSS() {
    const css = `
    :host {
        --babbler-fgcolor: #ffeeb2;
        --babbler-bgcolor: rgb(0, 0, 0);
        --babbler-bgacolor: rgba(0, 0, 0, 0.6);
    }

    .babbler-subtitle-container {
        width: 100%;
        text-align: center;
        display: flex;
        position: absolute;
        z-index: 1000;
        pointer-events: none;
        flex-direction: column;
        align-items: center;
        height: 100%
    }

    .babbler-panel-container {
        width: 100%;
        flex-grow: 1;
        display: flex;
        max-height: calc(100% - 140px);
    }

    .babbler-debug-console {
        display: none;
    }

    .babbler-error-console {
        display: none;
    }

    .babbler-console {
        background: rgba(0,0,0,0.3);
        position: relative;
        border: solid;
        border-color: #eee;
        border-width: 1px;
        overflow-y: auto;
        flex-grow: 1;
        text-align: left;
        width: 50%;
        pointer-events: auto;
    }

    pre {
        margin: 0;
    }

    .babbler-invisible {
        display: none;
    }

    .babbler-console-line-log {
        color: #eee;
        margin: 0;
    }

    .babbler-console-line-error {
        color: #ffaaaa;
        margin: 0;
    }

    .babbler-control-zone {
        position: relative;
        width: 100%;
        height: 40px;
        text-align: center;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .babbler-start-stop-button {
        pointer-events: auto;
        position: absolute;
        display: inline-block;
        padding: 5px 10px 5px 10px;
        border-radius: 10px;
        font-size: 24px;
        white-space: pre-wrap;
        transition: all 50ms ease-out;
    }

    .babbler-subtitle-zone {
        position: relative;
        width: 100%;
        height: 140px;
        text-align: center;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .babbler-subtitle-div a {
        color: var(--babbler-fgcolor);
        pointer-events: auto;
    }

    .babbler-subtitle-div {
        position: absolute;
        display: inline-block;
        padding: 5px 10px 5px 10px;
        border-radius: 10px;
        font-size: 24px;
        white-space: pre-wrap;
        color: var(--babbler-fgcolor);
        background: var(--babbler-bgacolor);
        text-shadow: var(--babbler-bgcolor) 0px 0px 1.97188px,
        var(--babbler-bgcolor) 0px 0px 1.97188px,
        var(--babbler-bgcolor) 0px 0px 1.97188px,
        var(--babbler-bgcolor) 0px 0px 1.97188px,
        var(--babbler-bgcolor) 0px 0px 1.97188px;
        font-family: "YouTube Noto", Roboto, "Arial Unicode Ms", Arial, Helvetica, Verdana, "PT Sans Caption", sans-serif;
        transition: all 150ms ease-out;
        opacity: 0;
    }

    .fade-out {
        opacity: 0;
    }

    .fade-in {
        opacity: 1;
    }

    .babbler-zappable {
        pointer-events: auto;
    }

    .babbler-zappable:hover  {
        background-color: red;
    }
    `;

    const style = babblerCreateElement('style');
    style.type = 'text/css';
    style.appendChild(document.createTextNode(css));
    babblerRoot.appendChild(style);
}

function addLineToConsole(text, console) {
    const consoleLine = babblerCreateElement('div', 'babbler-console-line-log');
    const consoleLinePre = babblerCreateElement('pre',);
    consoleLinePre.textContent = text;
    consoleLine.appendChild(consoleLinePre);
    // Only auto-scroll if already at the bottom so the user can read previous logs.
    const shouldScroll = console.scrollHeight - console.scrollTop - console.clientHeight < 40 ? false : true;
    console.appendChild(consoleLine);
    if (shouldScroll) {
        console.scrollTop = console.scrollHeight - console.clientHeight
    }
}

async function babblerLog(text, subtitleContainer) {
    const containers = subtitleContainer ? [subtitleContainer] : babblerRoot.querySelectorAll('.babbler-subtitle-container');

    for (const container of containers) {
        const logConsole = container.querySelector('.babbler-debug-console');
        addLineToConsole(text, logConsole);
    }

    if (!videoIsMembersOnly()) {
        const subtitleLog = getSetting('subtitleLog');
        subtitleLog.push(text);
        await setSetting('subtitleLog', subtitleLog);
    }
}

// babblerError(text to show on subtitle, error object with custom 'data' item)
function babblerError(text, error, subtitleContainer) {
    // Only print to provided subtitleContainer if one is passed. Otherwise, print to all.
    const containers = subtitleContainer ? [subtitleContainer] : babblerRoot.querySelectorAll('.babbler-subtitle-container');

    for (const container of containers) {
        const errorConsole = container.querySelector('.babbler-error-console');

        addLineToConsole(text, errorConsole);
    }

    if (!videoIsMembersOnly() && error) {
        const errorBundle = {
            time: Date.now(),
            message: error.message,
            source: error.filename,
            lineno: error.lineno,
            colno: error.colno,
            stack: error.error && error.error.stack,
            data: error.data
        }
        const errorJSON = JSON.stringify(errorBundle)
        const errorLog = getSetting('errorLog');
        errorLog.push(errorJSON);
        setSetting('errorLog', errorLog);
    }
}

function videoIsMembersOnly() {
    const isMembersOnly = document.querySelector('ytd-badge-supported-renderer.style-scope.ytd-watch-metadata > div.badge.badge-style-type-members-only > span.style-scope.ytd-badge-supported-renderer');
    if (isMembersOnly) {
        return true;
    } else {
        return false;
    }
}

// TODO: Also zap all matching elements in response for repeating text hallucinations
function addBadPhrase(phrase, subtitleDetails) {
    const badPhrases = getSetting('badPhrases');
    const phraseHash = phrase.tokens.join(',');
    if (!(phraseHash in badPhrases)) {
        badPhrases[phraseHash] = {};
        badPhrases[phraseHash].text = phrase.text;
        badPhrases[phraseHash].details = subtitleDetails;
        setSetting('badPhrases', badPhrases);
        // console.log(`Added bad phrase ${phrase.text}`);
    }
}

// Return text of bad phrase if match, otherwise return null
function checkPhrase(tokens) {
    const badPhrases = getSetting('badPhrases');
    const phraseHash = tokens.join(',');
    if (phraseHash in badPhrases) {
        return badPhrases[phraseHash].text;
    } else {
        return null;
    }
}

function createNewSubtitleDiv() {
    const newSubtitleDiv = babblerCreateElement('div', 'babbler-subtitle-div');
    newSubtitleDiv.style.top = `0px`;
    return newSubtitleDiv;
}

function broadcastSubtitle(text){
    const allSubtitleContainers = babblerRoot.querySelectorAll('.babbler-subtitle-container');
    for (const subtitleContainer of allSubtitleContainers) {
        addSystemSubtitle(text, subtitleContainer);
    }
}


function addSystemSubtitle(text, subtitleContainer) {
    // If the page no longer contains subtitleContainer, bail

    if (!babblerRoot.contains(subtitleContainer) && subtitleContainer.getAttribute('active')) { return; }

    // Get our subtitle-zone element
    const subtitleZone = subtitleContainer.querySelector('.babbler-subtitle-zone');

    // Create a new subtitle div
    const newSubtitleDiv = createNewSubtitleDiv();
    

    // Set text content of new subtitle
    // innherHTML is used to allow embedding of links, etc. Only trusted input will be passed to addSystemSubtitle
    newSubtitleDiv.innerHTML = text;

    animateSubtitle(subtitleZone, newSubtitleDiv);
}

// Add new subtitle first to get the height of new div
// Offset divs below by that new div height
// Edge case for late arriving subtitles, go through and find the subtitles that come after it and update their position after text has been filled

// TODO: Merge similar code with addSystemSubtitle
function addSubtitle(subtitleDetails, subtitleContainer) {
    // If the page no longer contains subtitleContainer, bail
    if (!babblerRoot.contains(subtitleContainer) && subtitleContainer.getAttribute('active')) { return; }

    // Get our subtitle-zone element
    const subtitleZone = subtitleContainer.querySelector('.babbler-subtitle-zone');

    // Create a new subtitle div
    const newSubtitleDiv = createNewSubtitleDiv();

    // Prepend an indicator that the text is AI translated
    const aiIndicatorDiv = babblerCreateElement('div');
    aiIndicatorDiv.textContent = '[AI] ';
    aiIndicatorDiv.style.display = 'inline-block';
    newSubtitleDiv.appendChild(aiIndicatorDiv);

    const phrases = Array.from(subtitleDetails.textData);
    // As each request returns multiple phrases, we'll need to loop thought them
    for (const [index, phrase] of phrases.entries()) {
        const segmentDiv = babblerCreateElement('div');
        segmentDiv.style.display = 'inline-block';
        if (index === 0) {
            segmentDiv.textContent = phrase.text.trimStart();
        } else if (index === phrases.length - 1) {
            segmentDiv.textContent = phrase.text.trimEnd();
        } else {
            segmentDiv.textContent = phrase.text;
        }
        if (getSetting('zapper')) {
            segmentDiv.classList.add('babbler-zappable');
        }
        // Element will only be clickable if the zapper class is applied, no additional checks required
        // This also simplifies the enable/disable process for zapping due to not needing the phrase and subtitleDetails references in the enableZapper() function
        segmentDiv.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent the click from pausing the video
            if (!videoIsMembersOnly()) {
                addBadPhrase(phrase, subtitleDetails);
                segmentDiv.remove();
            }
        });
        newSubtitleDiv.appendChild(segmentDiv)
    }
    animateSubtitle(subtitleZone, newSubtitleDiv);
}

function animateSubtitle(subtitleZone, newSubtitleDiv) {
    // Temporarily add the new subtitle div to the DOM to calculate its height
    subtitleZone.appendChild(newSubtitleDiv);
    const newSubtitleHeight = newSubtitleDiv.offsetHeight;
    subtitleZone.removeChild(newSubtitleDiv);
    newSubtitleDiv.style.top = `${0 - newSubtitleHeight - getSetting('subtitleVerticalMargin')}px`;

    // Move existing subtitles down
    let subtitleIndex = 0;
    for (const subtitle of subtitleZone.children) {
        const currentTop = parseFloat(subtitle.style.top) || 0;
        const newTop = currentTop + newSubtitleHeight + getSetting('subtitleVerticalMargin'); // Add a margin between subtitles
        subtitle.style.top = `${newTop}px`;

        // Update the text color
        subtitleIndex++;
        if (subtitleIndex === subtitleZone.childElementCount) {
            //subtitle.style.color = 'lightgray';
            subtitle.style.filter = 'brightness(50%)';
        }
    }

    // Fade out and remove the oldest subtitle row
    if (subtitleZone.childElementCount >= getSetting('numSubtitleRows')) {
        // Loop through all child elements of subtitleZone and find the first one that does not have the 'fade-out' class
        // This will be the oldest subtitle row
        let oldestSubtitle = null;
        for (const subtitle of subtitleZone.children) {
            if (!subtitle.classList.contains('fade-out')) {
                oldestSubtitle = subtitle;
                break;
            }
        }
        oldestSubtitle.classList.remove('fade-in');
        oldestSubtitle.classList.add('fade-out');
        setTimeout(() => {
            subtitleZone.removeChild(oldestSubtitle);
        }, 200);
    }

    // Add the new subtitle div to the subtitle zone in the subtitle container
    subtitleZone.appendChild(newSubtitleDiv);
    // Slide in animation
    requestAnimationFrame(() => { // Wait for next repaint cycle
        newSubtitleDiv.classList.add('fade-in');
        newSubtitleDiv.style.top = '0px';
    });
}

async function getMimeType(videoElement) {
    const src = videoElement.src;

    try {
        const response = await fetch(src, { method: 'HEAD' });
        const contentType = response.headers.get('Content-Type');
        return contentType || 'video/webm; codecs=vp8';
    } catch (error) {
        console.warn('Unable to fetch MIME type, using default:', error);
        return 'video/webm; codecs=vp8';
    }
}

async function startRecordingSnippets(videoElement, subtitleContainer) {
    // inFlightRecordings.set(subtitleContainer, {});
    // const timestampedRecordings = inFlightRecordings.get(subtitleContainer);
    // console.log('timestampedRecordings:');
    // console.log(timestampedRecordings);
    try{
        mediaStream = new MediaStream(videoElement.captureStream().getAudioTracks());

        const recordSnippet = () => {
            const mediaRecorder = new MediaRecorder(mediaStream, { mimeType: 'audio/webm' });
            let audioDataChunks = [];
            // const timestamp = Date.now();
            // timestampedRecordings[timestamp] = mediaRecorder;
            mediaRecorder.start();
    
            mediaRecorder.addEventListener('dataavailable', async (event) => {
                audioDataChunks.push(event.data);
            });
    
            mediaRecorder.addEventListener('stop', async () => {
                // Only proceed if our recording is still in the inFlightRecordings map
                // if(inFlightRecordings.get(subtitleContainer)){
                // only continue if subtitleContainer is still in the babbler shadow DOM
                if (babblerRoot.contains(subtitleContainer)) {
                    const audioBlob = new Blob(audioDataChunks, { type: 'audio/webm' });
    
                    audioDataChunks = [];
                    // Check if blob actually has data
                    if (audioBlob.size > 0) {
                        urlBlob = URL.createObjectURL(audioBlob);
                        sendAudioToAPI(urlBlob, subtitleContainer);
                    }
                    // delete timestampedRecordings[timestamp];
                } else {
                    //console.log('Recording was stopped but the subtitle container no longer exists');
                }
            });
    
            setTimeout(() => {
                if (mediaRecorder.state === 'recording') {
                    mediaRecorder.stop();
                }
            }, (getSetting('snippetLength') + getSetting('overlapLength')) * 1000);
        };
    
        // Call the recordSnippet function immediately for the first time
        recordSnippet();
    
        // Call the recordSnippet function every (snippetDuration - 1) seconds
        const recordInterval = setInterval(() => {
            // Only continue the loop if subtitles are still enabled and our allocated container still exists
            if (shouldContinueRecording(videoElement, subtitleContainer)) {
                recordSnippet();
            } else {
                clearInterval(recordInterval);
            }
        }, getSetting('snippetLength') * 1000);
    } catch (error) {
        babblerError(`Unknown error occurred during recording: ${error.message}`, error, subtitleContainer);
    }
}

// A try/catch block should surround calls of this function
const fetchWithTimeout = async (url, options, timeout) => {
    const controller = new AbortController();
    const { signal } = controller;

    const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), timeout * 1000)
    );

    const fetchPromise = fetch(url, { ...options, signal });

    const response = await Promise.race([
        fetchPromise,
        timeoutPromise,
    ]);

    response.cancel = () => controller.abort();

    return response;
};

function shouldContinueRecording(videoElement, subtitleContainer){
    if(subtitlesActive && babblerRoot.contains(subtitleContainer) && document.contains(videoElement) && videoElement.ended == false && subtitleContainer.getAttribute('active') === ''){
        return true;
    } else {
        return false;
    }
}

function processAPIResponse(apiResult, subtitleContainer, subtitleDetails) {
    //console.log(apiResult);
    if (apiResult.error) {
        // OpenAI API errors
        if (apiResult.error.code == "invalid_api_key") {
            // Invalid API key
            addSystemSubtitle('[System] Invalid OpenAI API Key. You can find your API key at https://platform.openai.com/account/api-keys.', subtitleContainer);
        } else if (apiResult.error.type == "insufficient_quota") {
            // Insufficient OpenAI API quota
            addSystemSubtitle("[System] Insufficient OpenAI API quota. Please check your plan and billing details", subtitleContainer);
        } else if (apiResult.error.type == "server_error") {
            // SOMETHING happened...
            addSystemSubtitle(`[ERROR] OpenAI server error occurred. Please try again later.`, subtitleContainer);
            babblerError(`OpenAI server error occurred: ${apiResult.error.message}`, { message: apiResult });
        } else {
            // unknown error
            addSystemSubtitle(`[ERROR] Unknown OpenAI error occurred`, subtitleContainer);
            babblerError(`Unknown OpenAI error occurred: ${apiResult.error.message}`, { message: apiResult });
        }
    } else {
        let text = apiResult.text;

        let textBuilder = '';
        let debugBuildder = '';
        // {soundBlobURL: blobURL, apiRequest: {JSON}, apiResult: {JSON},
        //  textData: [
        //      {text: string, tokens: []},
        //      {text: string, tokens: []},
        // ]
        //}
        subtitleDetails.apiResult = apiResult;
        //console.log(apiResult);
        const currentTime = Date.now();
        let compressionRatioExceeded = false;

        if (text !== '') {

            //removeRepeatingSequences(text);
            //subtitleDetails.textData.push({text: segment.text, tokens: segment.tokens});
            apiResult.segments.forEach(segment => {
                babblerLog(`Time: ${currentTime}, language: ${apiResult.language}, #Tokens: ${segment.tokens.length}, compression_ratio: ${segment.compression_ratio.toFixed(2)}, temperature: ${getSetting('temperature').toFixed(2)}, avg_logprob: ${segment.avg_logprob.toFixed(2)}, no_speech_prob: ${segment.no_speech_prob.toFixed(2)}, text: ${segment.text}`);
                const badPhrase = checkPhrase(segment.tokens);
                if (badPhrase) {
                    babblerError(`dropping bad phrase: ${badPhrase}`);
                } else if (segment.no_speech_prob > getSetting('noSpeechProb')) {
                    babblerError(`dropping non-speech phrase (no_speech_prob = ${segment.no_speech_prob.toFixed(2)} < ${getSetting('noSpeechProb').toFixed(2)}): ${segment.text}`);
                } else if (segment.avg_logprob > getSetting('avgLogProb')) {
                    babblerError(`dropping hallucinated phrase (avgLogProb = ${segment.avg_logprob.toFixed(2)} < ${getSetting('avgLogProb').toFixed(2)}): ${segment.text}`);
                } else if (segment.compression_ratio > getSetting('compressionCutoff')) {
                    // Break out of loop to handle entire response
                    babblerError(`compression ratio exceeded (compression_ratio = ${segment.compression_ratio.toFixed(2)} > ${getSetting('compressionCutoff').toFixed(2)}): ${segment.text}`);
                    compressionRatioExceeded = true;
                } else {
                    textBuilder += segment.text;
                    subtitleDetails.textData.push({ text: segment.text, tokens: segment.tokens });
                }
            });

            if (compressionRatioExceeded) {
                const processedText = removeRepeatingSequences(text);
                // Replace all subtitleDetails and use dummy tokens as we have modified the text and it is no longer representative of future tokens that may be returned
                subtitleDetails.textData = [{ text: processedText, tokens: [currentTime] }];
                textBuilder = processedText;
            }

            lastText.set(subtitleContainer, textBuilder);

            if (textBuilder != '') {
                addSubtitle(subtitleDetails, subtitleContainer);
            }
        } else {
            //console.log("no audio detected");
        }
    }
}

async function sendAudioToAPI(urlBlob, subtitleContainer) {
    const timestamp = Date.now();
    const formData = new FormData();
    const response = await fetch(urlBlob);
    const audioBlob = await response.blob();
    const prompt = getSetting('promptFeedback') ? lastText.get(subtitleContainer) : '';
    //console.log(`prompt: ${prompt}`);
    const temperature = getSetting('temperature');
    const model = 'whisper-1';
    const response_format = 'verbose_json';

    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', model);
    // json, text, srt, verbose_json, or vtt.
    formData.append('response_format', response_format);
    formData.append('prompt', prompt);
    formData.append('temperature', temperature);
    // Only used for transcription API endpoint. Will cause errors if used with Translations.
    //formData.append('language', 'ja');

    let fetchURL = getSetting('apiURL');
    if (getSetting('transcribe')) {
        fetchURL = 'https://api.openai.com/v1/audio/transcriptions'
    }

    const requestOptions = {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${getSetting('apiKey')}`,
        },
        body: formData,
    };

    // Object containing verbose data on each subtitle to be used with the zapping system later
    const subtitleDetails = {
        apiRequest: {
            temperature: temperature,
            prompt: prompt,
            model: model,
            response_format: response_format,
            audioBlob: await blobToBase64(audioBlob),
        },
        textData: [],
        apiResult: null
    };

    const timestampedPromises = inFlightRequests.get(subtitleContainer)

    try {
        timestampedPromises[timestamp] = fetchWithTimeout(fetchURL, requestOptions, getSetting('timeout'));
        const apiResponse = await timestampedPromises[timestamp];
        const apiResult = apiResponse ? await apiResponse.json() : null;

        // Only continue if subtitles are enabled and our allocated subtitle container still exists and our request was not cancelled
        if (apiResult && subtitlesActive && babblerRoot.contains(subtitleContainer)) {
            processAPIResponse(apiResult, subtitleContainer, subtitleDetails);
        }

    } catch (error) {
        // Network errors
        console.error('Error sending audio to speech-to-text API:', error);
        if (error.message === 'Request timeout') {
            // Handle the case when the fetch request takes too long
            lastText.set(subtitleContainer,primePrompt);
            babblerError("Request timeout - snippet dropped");
        } else {
            addSystemSubtitle(`[ERROR] Unknown network error occurred`, subtitleContainer);
            babblerError(`Unknown network error occurred: ${error.message}`, error)
        }
    }

    URL.revokeObjectURL(urlBlob);
    delete timestampedPromises[timestamp];
}

function downloadBlob(blob, fileName) {
    const link = babblerCreateElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
}

function blobToArrayBuffer(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(blob);
    });
}

function hexToRgb(hex) {
    const rgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return rgb
        ? {
            r: parseInt(rgb[1], 16),
            g: parseInt(rgb[2], 16),
            b: parseInt(rgb[3], 16),
        }
        : null;
}

function isColorDark(hexColor) {
    const { r, g, b } = hexToRgb(hexColor);
    // Calculate the relative luminance using the sRGB color space
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const threshold = 128; // range: 0-255; lower value means darker color
    return luminance < threshold;
}

// Remove repeated sequences
function removeRepeatingSequences(text) {
    // Remove repeating sequences of 4 or more characters that repeat 2 or more times
    const regex = /(.{4,}?)(?=\1{2,})(?:(?=\1+\1))\1+/g;
    const result = text.replace(regex, (match, group1) => group1);
    return result;
}

// Version of the regex that assumes the end of the string is part of the repeated sequence that was cut off
function removeRepeatingSequencesMaxedTokens(text) {
    const regex = /(.{4,}?)(?=\1{2,})(?:(?=\1))\1.*/g;
    const result = text.replace(regex, (match, group1) => group1);
    return result;
}

async function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

