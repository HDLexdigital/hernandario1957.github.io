const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PUBLIC_DIR = path.join(__dirname, '..', '..', '..', 'public');
const OUTPUT_PATH = path.join(PUBLIC_DIR, 'anchors.json');

describe('MVP-047 Anchors Builder', () => {
  beforeAll(() => {
    execSync('node scripts/build-anchors.js', { stdio: 'ignore' });
  });

  test('genera public/anchors.json', () => {
    expect(fs.existsSync(OUTPUT_PATH)).toBe(true);
  });

  test('el contenido es un array', () => {
    const data = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf8'));
    expect(Array.isArray(data)).toBe(true);
  });

  test('cada ancla tiene las propiedades requeridas', () => {
    const data = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf8'));
    if (data.length > 0) {
      const first = data[0];
      expect(first).toHaveProperty('documentId');
      expect(first).toHaveProperty('url');
      expect(first).toHaveProperty('id');
      expect(first).toHaveProperty('level');
      expect(first).toHaveProperty('text');
    }
  });

  test('las URLs de las anclas contienen el símbolo # y el id', () => {
    const data = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf8'));
    data.forEach(anchor => {
      expect(anchor.url).toContain('#');
      expect(anchor.url).toContain(anchor.id);
    });
  });
});
