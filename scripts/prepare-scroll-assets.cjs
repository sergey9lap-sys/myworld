const sharp = require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const source = 'C:/Users/User/.codex/generated_images/01a004a0-79b1-7bc0-84c2-39e98907cfbe';
const assets = [
  ['exec-967c1a3d-9d4d-418a-8e8c-fe59a092bae7.png', 'japanese-scroll-v1.webp', 1200],
  ['exec-5bc16a08-e2d9-41cd-8e91-5563cae37f45.png', 'tsuba-frame-v1.webp', 1000],
  ['exec-3fc0c170-f034-4893-998e-e875a09339c7.png', 'katana-v1.webp', 1200],
];
(async () => {
  for (const [input, output, width] of assets) {
    await sharp(path.join(source, input)).resize({width, withoutEnlargement:true}).webp({quality:87, alphaQuality:100}).toFile(path.join(root, 'public/media', output));
    console.log(output);
  }
})();
