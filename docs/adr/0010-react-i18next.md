# react-i18next for internationalisation

We use react-i18next rather than Paraglide JS. Paraglide was considered for its Vite-native plugin, compile-time type-safe message keys, and tree-shaking per message — all genuine advantages. We chose react-i18next for its broader ecosystem, greater team familiarity, and battle-tested SSR story. At two languages and a small string count the runtime overhead difference is negligible, and the type-safety gap can be partially closed with tooling if it becomes a pain point.
