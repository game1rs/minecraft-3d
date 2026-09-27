// Tiny ESM resolve hook: appends .js to extensionless relative imports
// so plain Node can run the Vite-style source files (test-only helper).
export async function resolve(specifier, context, next) {
  if ((specifier.startsWith('./') || specifier.startsWith('../')) && !/\.[mc]?js$/.test(specifier)) {
    try {
      return await next(specifier + '.js', context)
    } catch {
      /* fall through */
    }
  }
  return next(specifier, context)
}
