const fs = require('fs');
const path = require('path');

const glob = require('fast-glob');

const Pug = require('pug');
const PostCSS = require('postcss');
const PostCSSPresetEnv = require('postcss-preset-env');
const PostCSSImport = require('postcss-import');
const CSSNano = require('cssnano');

// TODO: env var
const baseUrl = '';
const langBasePath = (langCode) => langCode === 'en' ? '' : `/${langCode}`;
const baseUrlForLang = (langCode) => `${baseUrl}${langBasePath(langCode)}`;

const isDevBuild = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';

const langUrlForPath = (langCode) => (path) => `${baseUrlForLang(langCode)}${path}`;

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
  // fast-glob always uses `/`, probably because that's in the input
  const pathParts = source.split('/');
  const langCode = pathParts[1];
  const destination = `${path.join.apply(undefined, [destDir, ...pathParts.slice(2)])}`
    .replace(/pug$/, 'html');

  const template = Pug.compileFile(source, {
    encoding: 'utf8',
    pretty: isDevBuild
  });

  const out = template({
    langUrlForPath: langUrlForPath(langCode),
    site: {
      baseUrl: baseUrl,
      langUrl: baseUrlForLang(langCode),
      stylesheet: `${baseUrl}/style.css`,
    }
  });

  if (!fs.existsSync(path.dirname(destination))) {
    fs.mkdirSync(path.dirname(destination), { recursive: true });
  }

  fs.writeFileSync(destination, out, {encoding: 'utf8'});
}

console.info(" - Building HTML");
buildHTML("src", "dist");

console.info(" - Building CSS");
buildCSS('src/style.pcss', 'dist/style.css');
