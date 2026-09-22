import { GraphBuilder } from './GraphBuilder';

async function run() {
  const builder = new GraphBuilder();
  // Hash simulado de nuestras pruebas anteriores
  const hash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
  try {
    await builder.buildFromSearchIndex(hash);
  } catch (e) {
    console.error("Error construyendo el grafo:", e);
  }
}
run();
