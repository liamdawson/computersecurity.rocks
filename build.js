const fs = require('fs');

const Handlebars = require('handlebars');
const PostCSS = require('postcss');
const PostCSSPresetEnv = require('postcss-preset-env');
const PostCSSImport = require('postcss-import');
const CSSNano = require('cssnano');

// const template = Handlebars.compile(fs.readFileSync('src/template.hbs', { encoding: 'utf8' }));

/* build all css */

const cssProcessor = PostCSS(
  PostCSSImport(),
  PostCSSPresetEnv({ stage: 3 }),
  CSSNano());

const sourceCSS = fs.readFileSync('src/style.pcss', { encoding: 'utf8' });

cssProcessor.process(sourceCSS, { from: 'src/style.pcss', to: 'dist/style.css'})
  .then(result => {
    fs.writeFileSync('dist/style.css', result.css, { encoding: 'utf8' });
    if (result.map) {
      fs.writeFileSync('dist/style.css.map', result.map, { encoding: 'utf8' });
    }
  });
