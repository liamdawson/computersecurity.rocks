const fs = require('fs');
const path = require('path');

const glob = require('fast-glob');

const Pug = require('pug');
const Handlebars = require('handlebars');
const PostCSS = require('postcss');
const PostCSSPresetEnv = require('postcss-preset-env');
const PostCSSImport = require('postcss-import');
const CSSNano = require('cssnano');

const baseUrl = '';
const langBasePath = (langCode) => langCode === 'en' ? '/' : `/${langCode}`;
const baseUrlForLang = (langCode) => `${baseUrl}${langBasePath(langCode)}`;

const isDevBuild = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';

function buildCSS(from, to) {
  const plugins = [
    PostCSSImport(),
    PostCSSPresetEnv({ stage: 3 })
  ];

  if (!isDevBuild) {
    plugins.push(CSSNano());
  }

  const cssProcessor = PostCSS(plugins);

  const sourceCSS = fs.readFileSync(from, { encoding: 'utf8' });

  cssProcessor.process(sourceCSS, { from, to })
    .then(result => {
      fs.writeFileSync(to, result.css, { encoding: 'utf8' });
      if (result.map) {
        fs.writeFileSync(`${to}.map`, result.map, { encoding: 'utf8' });
      }
    });
}

function buildHTML(sourceDir, destDir) {
  glob
    .sync([`${sourceDir}/**/*.pug`, `!${sourceDir}/**/_*.pug`])
    .forEach(buildHTMLFile(destDir));
}

const buildHTMLFile = (destDir) => (source) => {
  const template = Pug.compileFile(source, { encoding: 'utf8', pretty: isDevBuild });
  // const template = Handlebars.compile(fs.readFileSync(source, {encoding: 'utf8'}));
  // fast-glob always uses `/`, probably because that's in the input
  const pathParts = source.split('/');
  const langCode = pathParts[1];
  const destination = `${path.join.apply(undefined, [destDir, ...pathParts.slice(2)])}`
    .replace(/pug$/, 'html');

  const out = template({
    site: {
      baseUrl: baseUrl,
      langUrl: baseUrlForLang(langCode),
      stylesheet: `${baseUrl}/style.css`,
      langCode
    }
  });

  fs.writeFileSync(destination, out, {encoding: 'utf8'});
}

console.info(" - Building HTML");
buildHTML("src", "dist");

console.info(" - Building CSS");
buildCSS('src/style.pcss', 'dist/style.css');
