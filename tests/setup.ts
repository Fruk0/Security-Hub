// tests/setup.ts

// Mock básico de crypto.randomUUID si algún lib lo usa
if (typeof globalThis.crypto === 'undefined') {
  // @ts-ignore
  globalThis.crypto = {} as any
}
// @ts-ignore
if (!globalThis.crypto.randomUUID) {
  // @ts-ignore
  globalThis.crypto.randomUUID = () => '00000000-0000-4000-8000-000000000000'
}

// Opcional: silenciar warnings de act() si molestan
// const origError = console.error
// console.error = (...args) => {
//   if (typeof args[0] === 'string' && args[0].includes('act')) return
//   origError(...args)
// }

