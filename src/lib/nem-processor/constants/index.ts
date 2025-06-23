export const NMI_PARSING = Object.freeze({
  SEPARATOR: "_",
  INDICES: {
    BASE_NMI: 0, // "The base NMI is at position 0"
    REGISTER: 1, // "The register suffix is at position 1"
  },
  REGISTER_PREFIX: "R",
} as const);
