const { app, BrowserWindow } = require('electron');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

function createWindow () {
  
  win = new BrowserWindow({
    frame: false,
    fullscreen: true,
    transparent: true,
    webPreferences: {
      nodeIntegration: true
    }
  })
  
  win.setAlwaysOnTop(true, "screen-saver");
  win.setIgnoreMouseEvents(true);
  win.loadFile('../assets/index.html');
  
  win.on('closed', () => {
    win = null;
  });
}

app.on('ready', createWindow);


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
})

app.on('activate', () => {
  if (win === null) {
    createWindow();
  }
});

