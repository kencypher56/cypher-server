# ⚔️ Cypher Server

> *"Shall we begin?"* - A sophisticated file server with an animated, modern web interface.

Cypher Server is your witcher in the realm of file management—navigating treacherous directories and taming wild files with style. A sleek, intuitive way to browse, preview, and download files from your system with a beautifully designed UI that would make even the most discerning mage jealous.

## ⚡ Features & Powers

- **🎨 Modern Web Interface** - *"The better the thinker, the better the warrior"* - Beautiful, animated UI with multiple theme options
- **📁 File Management** - Navigate directories with an intuitive sidebar, like tracking monsters through the wilds
- **🎬 Media Viewers** - Preview before you act, like scouting before battle
  - 📄 PDF viewer with page navigation
  - 🎥 Video player with cinematic controls
  - 🔊 Audio player with timeline scrubbing
  - 🖼️ Image gallery with full preview
- **⬇️ Advanced Download Manager** - *"Time to earn some coin"*
  - 📊 Progress tracking with speed and ETA
  - ↩️ Resume capability for interrupted downloads
  - 📦 Batch download with compression
  - 📜 Download history and clear functionality
- **🎭 Theme Support** - *Four unique faces for different times:* Dark, Light, Kuromi, and Cyberpunk
- **🌐 Responsive Design** - Adapts seamlessly on desktop and tablet devices
- **💾 Service Worker** - *"Preparation is everything"* - Offline-first architecture for superior performance
- **✨ Animated Background** - Three.js powered dynamic 3D background that dances like a siren's song
- **🔄 Real-time Updates** - Live file system monitoring—no monster escapes your sight
- **🗜️ File Compression** - Archive and compress multiple files with the precision of a master craftsman

## 📋 Prerequisites: Sharpen Your Tools

> *"One sword, one shield, one path."* - Geralt of Rivia

Before the hunt begins, you'll need these essentials:

- ⚙️ **Node.js** 16.0.0 or higher - *The forges of code*
- 📦 **npm** (comes with Node.js) - *Your quartermaster*

## 🚀 The Hunt Begins: Installation & Setup

> *"Winds howling... time to get to work."*

### 1️⃣ Find Your Lair
```bash
cd cypher-server
```

### 2️⃣ Gather Your Supplies
```bash
npm install
```

Or summon the installer directly:
```bash
npm run install-deps
```

*"Preparation is everything."* - Your dependencies are now at hand.

## ⚔️ Quick Start: Drawing Your Sword

> *"Let's try some moves."* - Time to dance with destiny.

### ⚡ Ignite the Server
```bash
npm start
```

The ritual begins:
1. ✨ Displays a banner with ASCII art (our sigil)
2. 📂 Prompts you to select a directory to serve
3. 🔌 Asks for a port number (default: 3000)

**Example Incantation:**
```
📁 Directory to serve: /home/user/Documents
🔌 Port number (default 3000): 3000

⚔️ Cypher Server awakens at http://localhost:3000
```

### 🌐 Enter the Realm
Open your browser and venture to:
```
http://localhost:3000
```

*"Here lies my salvation... or doom."*

## 🎮 The Art of War: Usage Guide

> *"I'll prepare those tools. At any moment."* - Master the interface like a true witcher.

### 🗺️ Navigation - Reading the Map
- Click folders in the sidebar to stalk new territories
- Use the breadcrumb at the top to retrace your steps
- Press Tab to autocomplete paths—*like an instinct honed by years of hunting*

### 📥 File Operations - The Hunt
- **👁️ Preview** - Examine files before action (PDFs, images, videos, audio)
- **⬇️ Download** - Claim individual trophies
- **📦 Batch Download** - Bundle multiple prizes into a compressed archive
- **🔄 Refresh** - Scout the current territory anew

### 🎭 Themes - Change Your Armor
*"Witchers are murderers. But murderers are necessary sometimes."* - Each theme reflects a different path:
- **🌙 Dark** - The path of shadows (default)
- **☀️ Light** - The path of revelation
- **🐱 Kuromi** - The path of the adorably dark
- **⚡ Cyberpunk** - The path of future ruin

Access the theme switcher in the top-right corner.

### 📊 Download Panel - Your War Table
- 🔓 Open the download panel from the top bar
- 📈 Watch progress bars like tracking monster movements
- ⏱️ Monitor speed and ETA—patience is a virtue
- 🗑️ Clear completed downloads when the fight is won

## 🏗️ The Architecture: Blueprint of Power

```
⚔️ CYPHER SERVER - The Complete Armory
│
├── 🖥️ BACKEND (Node.js & Express)
│   └── server.js              # The beating heart—Express server
│
├── 🎨 FRONTEND (HTML, CSS, JavaScript)
│   ├── index.html             # The grand tapestry of HTML
│   ├── styles.css             # CSS artistry and theme spellcasting
│   ├── design.js              # Theme management & animations
│   ├── download.js            # Download manager—the quartermaster
│   ├── background.js          # Three.js: Building worlds in canvas
│   ├── video_player.js        # The cinematic viewer
│   ├── audio_player.js        # The acoustic companion
│   ├── pdf_viewer.js          # Scrolls and manuscripts
│   ├── picture_viewer.js      # Gallery of captured moments
│   └── theme.js               # Theme configuration
│
├── 📱 PWA & SERVICE WORKER
│   └── sw.js                  # Service Worker—guardian of offline realms
│
├── ⚙️ CONFIGURATION
│   ├── package.json           # Dependencies manifest
│   ├── design.html            # Design reference grimoire
│   └── README.md              # This tome of knowledge
```

## 📦 Arsenal: Tech Stack & Dependencies

> *"You need the right tools for the right job."*

### 🔧 Core Technologies

**Backend Runtime:**
- ⚙️ **Node.js** (v16+) - JavaScript runtime engine, the forge where this server is tempered

**Web Framework:**
- 🚀 **Express.js** (^4.18.2) - Lightweight, flexible web application framework

**File Operations:**
- 📦 **Archiver** (^6.0.1) - Creates archives and compressed files like a master blacksmith
- 🏷️ **MIME-types** (^2.1.35) - Detects file types with the precision of a witcher's medallion

### 🎨 Frontend Technologies

**Markup & Structure:**
- 📄 **HTML5** - The skeleton of our digital beast (semantic, responsive, PWA-ready)

**Styling & Design:**
- 🎨 **CSS3** - Crafted visual masterpiece with custom properties and animations
- 🌈 **Tailwind CSS** - Utility-first CSS framework for rapid UI development
- 🎭 **CSS Variables (CSS Custom Properties)** - Dynamic theming system for 4 distinct theme variants

**Client-Side JavaScript:**
- ⚡ **Vanilla JavaScript (ES6+)** - Pure, uncluttered code—a witcher needs no spells
- 🎬 **PDF.js** - PDF rendering engine (CDN: 3.11.174)
- 🌍 **Three.js** - 3D graphics library for animated background (r128 from CDN)
- 🎨 **Lucide Icons** - Modern icon library for UI elements

**Progressive Web App (PWA):**
- 💾 **Service Worker (sw.js)** - Offline-first caching strategy
- 📱 **Cache API** - Browser caching for static assets
- 🔄 **Fetch API** - Advanced network request handling

### 📚 Complete Tech Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Backend** | Node.js + Express | Server runtime & API |
| **Frontend** | HTML5 + CSS3 + JavaScript ES6+ | User interface |
| **Styling** | Tailwind CSS + CSS Variables | Responsive design & theming |
| **3D Graphics** | Three.js | Animated background effects |
| **Document Viewing** | PDF.js | PDF rendering |
| **Icons** | Lucide Icons | UI iconography |
| **PWA** | Service Worker + Cache API | Offline support |
| **Compression** | Archiver | File bundling |
| **Type Detection** | MIME-types | Content negotiation |

## ⚙️ Forging Your Path: Configuration

> *"Knowledge is power, but power can be dangerous."*

### 🎮 Interactive Setup
When you invoke `npm start`, the server prompts you for:
- **📂 ROOT_DIR** - The directory to serve (chosen at startup)
- **🔌 PORT** - Server port (default: 3000, customizable)

### 🎨 Styling the Realm: CSS Customization
Modify theme colors and styles in [styles.css](styles.css):

```css
/* The Four Paths of Style */
[data-theme="dark"] { /* Dark like a monster hunter's heart */ }
[data-theme="light"] { /* Light to banish shadows */ }
[data-theme="kuromi"] { /* The adorably dark path */ }
[data-theme="cyberpunk"] { /* Future chaos */ }
```

**CSS Variables Available for Customization:**
```css
--color-primary      /* Main theme color */
--color-accent       /* Accent highlights */
--color-background   /* Background shade */
--color-surface      /* Surface elements */
--color-text         /* Text color */
--color-muted        /* Muted/secondary text */
--shadow-sm          /* Small shadows */
--shadow-md          /* Medium shadows */
--radius-sm          /* Small border radius */
--radius-md          /* Medium border radius */
```

## 🔌 The Spells: API Endpoints

> *"Magic's unpredictable. Even for a witcher."* - But these endpoints are predictable.

### 📂 File Management Incantations
- `GET /api/list` - List directory contents (scout the territory)
- `GET /api/file/:path` - Get file details (examine the beast)
- `GET /download/*` - Download file or directory as trophy

### 📊 Server Information Spells
- `GET /api/config` - Server configuration (know thyself)
- `GET /api/themes` - Available theme roster

## 🌐 Vessels of War: Browser Support

> *"Every warrior must choose their weapon wisely."*

- 🔷 **Chrome/Chromium** (recommended) - The warrior's choice
- 🔶 **Firefox** - The clever scout
- 🍎 **Safari** - The distant traveler
- 🔵 **Edge** - The reformed ally

## 🔒 The Contract: Security Precautions

> *"Never ever turn your back on a foe, no matter how small."* - Especially with security.

- 🛡️ **Scope**: Cypher Server serves files from the specified directory and subdirectories only
- 🚨 **Authentication**: No built-in auth (deploy behind a proxy for secure environments)
- 💾 **Caching**: Service Worker caches static assets locally—trust but verify
- 📋 **Permissions**: Ensure proper file permissions on the served directory
- ⚠️ **Public Deployment**: Never expose this server directly to the internet without authentication

## 🛠️ Smithing Custom Blades: Development

> *"Can't have him perched on my shoulder."* - Same with development—keep it organized.

### ⚡ Fire Up the Furnace
```bash
npm start
```

### 🎨 Forging the Interface
1. **📄 HTML** - Edit [index.html](index.html) for structure
2. **🎨 CSS** - Update [styles.css](styles.css) for visual styling
3. **⚡ JavaScript** - Modify [design.js](design.js), [download.js](download.js), etc.
4. **🔄 Refresh** - Ctrl+Shift+R to reload without browser cache

**The Frontend Trinity:**
- **index.html** - The skeleton (HTML5 semantic structure)
- **styles.css** - The skin (Responsive design with CSS3 animations)
- **design.js** - The muscles (JavaScript logic and interactivity)

## 🎨 The Art of Creation: Customization Guide

> *"What do you know... a witcher needs to keep learning."*

### 🎭 Crafting a New Theme
The path to new visual realms:

1. 📝 Open [styles.css](styles.css)
2. 🖌️ Add your theme CSS block:
   ```css
   [data-theme="mytheme"] {
     --color-primary: #FF6B9D;
     --color-accent: #C44569;
     --color-background: #1A1A2E;
     --color-surface: #2D2D44;
     --color-text: #E0E0E0;
     --color-muted: #888888;
     /* ... define all color variables ... */
   }
   ```
3. 📝 Update `THEMES` array in [design.js](design.js):
   ```javascript
   const THEMES = ['dark', 'light', 'kuromi', 'cyberpunk', 'mytheme'];
   ```
4. 🖲️ Add theme button in [index.html](index.html):
   ```html
   <button class="theme-btn" data-theme="mytheme" title="My Theme">
     <i data-lucide="palette"></i>
   </button>
   ```

### 📺 Creating Custom File Viewers
Extend the viewer system—follow the pattern in [pdf_viewer.js](pdf_viewer.js), [video_player.js](video_player.js), etc.

**Viewer Template Structure:**
```javascript
const CustomViewer = (() => {
  function init(containerSelector) { /* Setup */ }
  function load(filePath) { /* Load file */ }
  function unload() { /* Cleanup */ }
  return { init, load, unload };
})();
```

## 📱 Honing Your Blade: Performance Optimization

> *"A witcher's only as good as his blade."* - Same applies to servers.

- ⚡ **Service Worker** - Caches static assets for lightning-fast loads
- 📦 **Compression** - Uses archiver for efficient file transfers
- 🎮 **Three.js Disabling** - Disable animated background on low-end devices (JavaScript toggle)
- ↩️ **Resume Downloads** - Large files support resumable downloads
- 🗜️ **Browser Caching** - HTTP cache headers optimize repeat visits
- 📊 **Live Compression** - Files compressed on-the-fly for bandwidth savings

## 🐛 When Beasts Rise: Troubleshooting

> *"Something doesn't feel right... I'd be careful if I were you."*

### 🔌 Port Already Besieged
**Problem:** Port 3000 is already occupied
**Solution:** Enter a different port when prompted at startup (try 3001, 8000, 8080)

### 👁️ Files Vanished from View
**Problem:** Directory contents not displaying
**Solutions:**
- Verify the directory path is correct
- Check file system permissions (chmod)
- Hard refresh: Ctrl+Shift+R (clears browser cache)
- Check browser console for errors (F12)

### 🐢 Server Moving Like a Troll
**Problem:** Slow performance issues
**Cures:**
- Reduce files in the current directory
- Disable the animated Three.js background
- Close unnecessary browser tabs
- Use a modern browser (Chrome/Firefox recommended)
- Check server CPU/RAM usage

### ⬇️ Downloads Failing the Hunt
**Problem:** Download interruptions or failures
**Remedies:**
- Verify available disk space
- Ensure download directory is writable
- Check network stability
- Try resuming the interrupted download
- Check server logs for errors

##  Witcher's Wisdom: Tips & Tricks

> *"In the right hands, magic is powerful, in the wrong hands, it's downright dangerous."*

### ⌨️ Keyboard Incantations
- **Ctrl+Shift+R** - Hard refresh (bypass browser cache—clear the fog)
- **Tab** - Autocomplete directory paths in terminal (a witcher's shortcut)
- **F12** - Open browser developer tools (diagnose like a monster hunter)

### ⚡ Performance Enchantments
- 💾 Service Worker improves offline performance significantly
- 🗜️ Static assets cached in browser for repeat visits
- 📊 Large files use streaming downloads (never load entire file in memory)
- 🔄 Real-time directory monitoring catches new files instantly

### 🎭 Theme Mastery
- 💾 Theme preference saved to localStorage (persists across sessions)
- 🔄 Switch themes instantly from top-right menu
- 🎨 Create custom themes by modifying CSS variables
- 📱 Themes auto-adapt to system dark mode preference

### 🐉 Advanced Tactics
- Use absolute paths: `/home/user/documents` vs relative paths
- Symlinks work if properly configured in Node.js
- Environment variables can be used for ROOT_DIR in production
- Nginx reverse proxy recommended for public deployment

## 🤝 The Witcher's Code: Contributing

> *"A contract is a contract. One must honor their word."*

To strengthen Cypher Server's arsenal:

1. 🧪 Test the application rigorously (play-test like a true witcher)
2. 📝 Report issues with crystal-clear descriptions
3. 💡 Submit improvements and feature suggestions that enhance the whole
4. 📋 Ensure code follows the existing structure and conventions
5. 🔍 Review changes against the project's vision
6. 🚀 Help others learn and improve the codebase

## 📞 Seek Counsel: Support & Help

> *"I've heard tell of a witcher..."*

For issues, questions, or guidance:
- 📖 Read the full project documentation
- 🔍 Check browser console (F12) for error clues
- 🖥️ Review server logs in terminal
- 💬 Examine [package.json](package.json) for configuration details
- 🐛 Debug using Chrome DevTools or Firefox Developer Edition

---

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [Three.js Documentation](https://threejs.org/docs/)
- [PDF.js API](https://mozilla.github.io/pdf.js/)
- [Service Workers & PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/)
- [Tailwind CSS](https://tailwindcss.com/)

---

**⚔️ Cypher Server v1.0.0**

*Advanced File Serving Made Beautiful ✨*

*"May your download speeds be swift, your files forever found, and your themes forever beautiful."*

---

### 📄 License

**MIT License** - The path is open to all.

You are free to:
- ✅ Use commercially
- ✅ Modify the code
- ✅ Distribute copies
- ✅ Include in larger works

Simply include the original license notice.

---

**Built with ⚔️ by witchers, for witchers.**

*Winds howling... but your files are safe.*
