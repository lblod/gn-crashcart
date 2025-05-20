'use strict';

module.exports = {
  singleQuote: true,
  trailingComma: 'es5',
  overrides: [
    {
      files: '*.hbs',
      options: {
        singlequote: false,
      },
    },
  ],
};
