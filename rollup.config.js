import svelte from "rollup-plugin-svelte";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";

export default {
  input: "embed.js",
  output: {
    format: "iife",
    name: "AIChatWidget",
    file: "dist/chat-widget.min.js",
    sourcemap: true,
  },
  plugins: [
    svelte({
      compilerOptions: {
        dev: false,
        customElement: true,
      },
      emitCss: false,
    }),
    resolve({
      browser: true,
      dedupe: ["svelte"],
    }),
    commonjs(),
    terser(),
  ],
};
