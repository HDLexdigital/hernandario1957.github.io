const { iniciarWatchdog } = require('./watchdog');

iniciarWatchdog();

process.on('SIGINT', () => {
  console.log('\n[watchdog-runner] Señal SIGINT recibida. Apagando servicio...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n[watchdog-runner] Señal SIGTERM recibida. Apagando servicio...');
  process.exit(0);
});
