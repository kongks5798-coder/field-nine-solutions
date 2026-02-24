/**
 * Simulates build output for mock mode.
 * Returns an AsyncGenerator yielding build log lines with ANSI colors.
 */
import type { FilesMap } from "../workspace.constants";
import type { FrameworkType } from "./frameworkDetector";
import { getFrameworkLabel } from "./frameworkDetector";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Simulate a full build process with realistic output.
 */
export async function* simulateBuild(
  files: FilesMap,
  framework: FrameworkType,
): AsyncGenerator<string> {
  const label = getFrameworkLabel(framework);
  const fileNames = Object.keys(files);
  const totalSize = fileNames.reduce((acc, f) => acc + (files[f]?.content.length ?? 0), 0);

  yield `\x1b[36m> dalkak-ide@1.0.0 build\x1b[0m`;
  yield `\x1b[36m> ${label} production build\x1b[0m`;
  yield "";
  await delay(300);

  yield `\x1b[1m\u25B6 Environment check\x1b[0m`;
  yield `  \x1b[32m\u2713\x1b[0m Node.js 20.x`;
  yield `  \x1b[32m\u2713\x1b[0m ${fileNames.length} source files`;
  yield "";
  await delay(400);

  yield `\x1b[1m\u25B6 Compiling...\x1b[0m`;
  await delay(200);

  for (const name of fileNames) {
    const size = files[name].content.length;
    const sizeStr = size < 1024 ? `${size} B` : `${(size / 1024).toFixed(1)} kB`;
    yield `  \x1b[32m\u2713\x1b[0m ${name} \x1b[2m(${sizeStr})\x1b[0m`;
    await delay(80);
  }
  yield "";
  await delay(300);

  yield `\x1b[1m\u25B6 Optimizing...\x1b[0m`;
  await delay(400);
  yield `  \x1b[32m\u2713\x1b[0m Minification complete`;
  yield `  \x1b[32m\u2713\x1b[0m Tree-shaking applied`;
  if (framework !== "vanilla") {
    yield `  \x1b[32m\u2713\x1b[0m Code splitting done`;
  }
  yield "";
  await delay(300);

  yield `\x1b[1m\u25B6 Generating output...\x1b[0m`;
  await delay(300);

  const outputSize = totalSize < 1024 ? `${totalSize} B` : `${(totalSize / 1024).toFixed(1)} kB`;
  yield `  Total output: \x1b[38;5;208m${outputSize}\x1b[0m`;
  yield "";
  await delay(200);

  yield `\x1b[32m\u2713 Build completed successfully\x1b[0m`;
  yield `\x1b[2m  ${fileNames.length} files \u2022 ${outputSize} total \u2022 ${label}\x1b[0m`;
}

/**
 * Simulate a deployment upload process.
 */
export async function* simulateDeploy(
  target: string,
): AsyncGenerator<string> {
  yield "";
  yield `\x1b[1m\u25B6 Deploying to ${target}...\x1b[0m`;
  await delay(500);
  yield `  \x1b[32m\u2713\x1b[0m Uploading build artifacts`;
  await delay(600);
  yield `  \x1b[32m\u2713\x1b[0m Configuring edge network`;
  await delay(400);
  yield `  \x1b[32m\u2713\x1b[0m SSL certificate provisioned`;
  await delay(300);
  yield `  \x1b[32m\u2713\x1b[0m DNS propagation complete`;
  yield "";
  yield `\x1b[32m\u2713 Deployment successful!\x1b[0m`;
}
