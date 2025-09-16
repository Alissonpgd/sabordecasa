// eslint.config.mjs

import next from "next/core-web-vitals";

/** @type {import('eslint').Linter.FlatConfig[]} */
const config = [
  // A configuração padrão do Next.js
  next,

  // Nosso objeto de regras personalizadas
  {
    rules: {
      // Desliga a regra que proíbe o uso de 'any'
      "@typescript-eslint/no-explicit-any": "off",

      // Transforma o erro de "variável não usada" em um aviso (não quebra a build)
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
];

export default config;