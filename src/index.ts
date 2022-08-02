import { readFileSync } from 'fs';

import glob from 'glob';
import ts from 'typescript';

const ssgContentPlugin = async () => {
  const contentCollection = (
    process.env.NODE_ENV !== 'production'
  ) ? (
    {}
  ) : (
    await glob.sync(
      `${__dirname}/src/pages/**/content.ts`,
      {},
    ).reduce(async (a, b) => {
      const c = await a;

      const pathParts = b.split(/\/|\\/);
      const pageName = pathParts[pathParts.length - 2];

      const contentLoader = readFileSync(b).toString();
      const transpiledContentLoader = ts.transpileModule(
        contentLoader,
        {
          compilerOptions: {
            target: 1,
            module: 1,
          }
        },
      ).outputText;

      // @ts-ignore
      const m = new module.constructor();
      m.paths = module.paths;
      m._compile(transpiledContentLoader, '');

      // eslint-disable-next-line no-param-reassign
      c[pageName] = await m.exports.default();

      return Promise.resolve(c);
    }, Promise.resolve({} as any))
  );

  // console.log(contentCollection);

  return {
    name: 'ssg-content-plugin',
    enforce: 'pre' as 'pre',
    transform(code: string, id: string) {
      if (process.env.NODE_ENV !== 'production' || !(/\.(ts|vue)$/).test(id)) {
        return {
          code,
          map: null,
        };
      }

      const pathParts = id.split(/\/|\\/);
      const pageName = pathParts[pathParts.length - 2];

      const content = contentCollection[pageName];

      // console.log(pageName, content);

      let modifiedCode = code;

      modifiedCode = modifiedCode.replace(/import\s+content\s+from\s+['"]\.\/content['"];/g, '');
      modifiedCode = modifiedCode.replace(/(await\s+){0,1}content\(\)/g, JSON.stringify(content));

      return {
        code: modifiedCode,
        map: null,
      };
    }
  }
};

export default ssgContentPlugin;
