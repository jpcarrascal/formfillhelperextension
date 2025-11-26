# Band Info Quick Copy - Browser Extension

A Chrome browser extension that helps musicians and bands quickly copy their information for online forms and submissions.

## Features

- **Quick Copy**: Individual copy buttons for each field
- **Auto-Save**: Your data is automatically saved as you type
- **Organized Layout**: Information grouped by category (Basic Info, Bio, Contact, Social Media, Music Links, Video Links)
- **Persistent Storage**: Your data persists across browser sessions

## Included Fields

### Basic Info
- Band name
- Website
- Genre
- Location

### Bio
- Short bio
- Long bio

### Contact
- Contact email
- Booking contact

### Social Media
- Instagram
- Facebook
- Twitter/X

### Music Links
- Spotify
- SoundCloud
- Bandcamp

### Video Links
- YouTube Video 1
- YouTube Video 2

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked"
4. Select the folder containing the extension files
5. The extension icon will appear in your toolbar

## Usage

1. Click the extension icon in your Chrome toolbar
2. Fill in your band information in the popup window
3. Click "Save All Changes" or use Ctrl/Cmd+S to save
4. When filling out online forms, click the copy button next to any field to copy that information to your clipboard
5. Paste the information into the form field

## Technical Details

- **Manifest Version**: 3
- **Permissions**: Storage (for saving your band information)
- **Storage**: Uses Chrome's sync storage to keep data across devices

## Files Structure

```
FormDataBrowserExtension/
├── manifest.json       # Extension configuration
├── popup.html         # Main interface
├── popup.css          # Styling
├── popup.js           # Functionality
├── icons/             # Extension icons
└── README.md          # This file
```

## Future Enhancements (Planned)

- Smart form detection and auto-filling
- Multiple profile support
- Import/export functionality
- Custom field creation
- Form template recognition

## Support

If you encounter any issues or have feature requests, please create an issue in the project repository.

---

Built for musicians, by musicians. Rock on! 🎸