# babbler
### Realtime video translation on any website using OpenAI's Whisper API.
## Description
This is a chrome web extension that provides realtime translated subtitles on any website by using OpenAI's Whisper web API.

Currently, only translations to English are supported. A transcription mode to any language is available too.

This extension requires you to generate an OpenAI API key to use. At the moment, OpenAI will provide $5.00 USD free credit on any new accounts, which is enough for roughtly 12 hours of translated audio

This extension is still in early testing, so many debug settings are exposed and debug logs are locally collected.

### Limitations
The subtitles produced by Whisper can often contain hallucinations when the AI tries to process background noise as voice audio. Please be aware that not all translations will be accurate, and that it may show some phrases that were never said.
These hallucinations are usually phrases like "Thanks for watching", "Please subscribe", etc. due to these phrases being most commonly spoken in the YouTube videos that the Whisper AI was trained on.

### Install
Download the latest release and extract it to a folder, or clone the repo to a location
Then load the unpacked extension from the Chrome extensions page  at chrome://extensions/

### Usage
Click on the addon icon to open the menu and enter your OpenAI API key.
Whenever the addon is active, a button to enable subtitles will appear on videos when you mouse over them.
The "Themed Subtitle Colors" option will enable unique subtitle colors for YouTube channels. This will be expanded in the future to automatically detect colors, and a hardcoded list of some vtuber channels is used for now.

### Licence
Licenced under the MIT License. Please refer to the LICENSE file in the repo.
