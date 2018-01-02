# autobabel

_Zero-install babel dev environment._

## What does it do?

When you `npx autobabel`:

- your `src/` directory will be babelified to `src-es5/`, in watch-mode.
- if you don't have a `.babelrc`, an empty one is created for you.
- babel presets and plugins are automatically installed for you. Just add them to your `.babelrc` and `autobabel` takes care of the rest.
- if one of your js modules tries to import / require a package that can't be found, `autobabel` will try to install it for you.

## Are there bugs

Yes!


