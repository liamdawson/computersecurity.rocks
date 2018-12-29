const fs = require('fs');

const Handlebars = require('handlebars');
const PostCSS = require('postcss');
const PostCSSPresetEnv = require('postcss-preset-env');
const PostCSSImport = require('postcss-import');
const CSSNano = require('cssnano');

// const template = Handlebars.compile(fs.readFileSync('src/template.hbs', { encoding: 'utf8' }));

function buildCSS(from, to) {
  const cssProcessor = PostCSS(
    PostCSSImport(),
    PostCSSPresetEnv({ stage: 3 }),
    CSSNano());

  const sourceCSS = fs.readFileSync(from, { encoding: 'utf8' });

  cssProcessor.process(sourceCSS, { from, to })
    .then(result => {
      fs.writeFileSync(to, result.css, { encoding: 'utf8' });
      if (result.map) {
        fs.writeFileSync(`${to}.map`, result.map, { encoding: 'utf8' });
      }
    });
}

console.info(" - Building CSS");
buildCSS('src/style.pcss', 'dist/style.css');
