// Keeps `firebase emulators:exec` alive for `npm run serve` until Ctrl+C.
console.log(
  '\n  Production build served by the Hosting emulator: http://localhost:5000\n  Emulator UI: http://localhost:4000\n  Press Ctrl+C to stop.\n',
)
setInterval(() => {}, 1 << 30)
