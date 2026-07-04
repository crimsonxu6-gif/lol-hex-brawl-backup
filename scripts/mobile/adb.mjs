import { execFile } from "node:child_process";
import { mkdir, readFile, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const moduleDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(moduleDir, "../..");
const configPath = resolve(moduleDir, "config.json");

export async function loadConfig() {
  const raw = await readFile(configPath, "utf8");
  const config = JSON.parse(raw);
  return {
    ...config,
    adbPath: resolvePath(config.adbPath),
    outputRoot: resolvePath(config.outputRoot)
  };
}

function resolvePath(path) {
  if (/^[a-zA-Z]:[\\/]/.test(path)) return path;
  return resolve(repoRoot, path);
}

export function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

export async function adb(config, args, options = {}) {
  const finalArgs = options.withoutDevice ? args : ["-s", config.deviceId, ...args];
  const { stdout, stderr } = await execFileAsync(config.adbPath, finalArgs, {
    cwd: repoRoot,
    windowsHide: true,
    maxBuffer: 1024 * 1024 * 8
  });
  return `${stdout}${stderr}`.trim();
}

export async function shell(config, command) {
  return adb(config, ["shell", command]);
}

export async function tap(config, x, y) {
  await shell(config, `input tap ${Math.round(x)} ${Math.round(y)}`);
}

export async function swipe(config, from, to, durationMs = 500) {
  await shell(
    config,
    `input swipe ${Math.round(from[0])} ${Math.round(from[1])} ${Math.round(to[0])} ${Math.round(to[1])} ${Math.round(durationMs)}`
  );
}

export async function inputText(config, text) {
  const escaped = text
    .replace(/\\/g, "\\\\")
    .replace(/ /g, "%s")
    .replace(/"/g, '\\"')
    .replace(/'/g, "\\'");
  await shell(config, `input text "${escaped}"`);
}

export async function press(config, keyCode) {
  await shell(config, `input keyevent ${keyCode}`);
}

export async function launchApp(config) {
  if (config.appActivity) {
    await shell(config, `am start -n ${config.appPackage}/${config.appActivity}`);
    return;
  }

  await shell(config, `cmd package resolve-activity --brief ${config.appPackage} | tail -n 1 | xargs am start -n`);
}

export async function getDeviceInfo(config) {
  const [size, density, focus] = await Promise.all([
    shell(config, "wm size"),
    shell(config, "wm density"),
    shell(config, "dumpsys window | grep -E 'mCurrentFocus|mFocusedApp'")
  ]);
  return { size, density, focus };
}

export async function screencap(config, localPath) {
  const target = resolvePath(localPath);
  const remotePath = `/sdcard/lol_capture_${Date.now()}.png`;
  await mkdir(dirname(target), { recursive: true });
  await shell(config, `screencap -p ${remotePath}`);
  await adb(config, ["pull", remotePath, target]);
  await shell(config, `rm ${remotePath}`);
  return target;
}

export async function dumpUi(config, localPath) {
  const target = resolvePath(localPath);
  await mkdir(dirname(target), { recursive: true });

  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const remotePath = `/sdcard/lol_window_${Date.now()}_${attempt}.xml`;
    try {
      await shell(config, `uiautomator dump ${remotePath}`);
      await adb(config, ["pull", remotePath, target]);
      await shell(config, `rm ${remotePath}`).catch(() => {});
      return target;
    } catch (error) {
      lastError = error;
      await shell(config, `rm ${remotePath}`).catch(() => {});
      await sleep(700);
    }
  }

  throw lastError;
}

export function findAllTextBounds(xml, text) {
  const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`text="${escaped}"[^>]*bounds="\\[(\\d+),(\\d+)\\]\\[(\\d+),(\\d+)\\]"`, "g");
  const candidates = [];
  let match;

  while ((match = pattern.exec(xml))) {
    const [, leftText, topText, rightText, bottomText] = match;
    const left = Number(leftText);
    const top = Number(topText);
    const right = Number(rightText);
    const bottom = Number(bottomText);
    const width = right - left;
    const height = bottom - top;

    if (width <= 0 || height <= 0) continue;
    if (right <= 0 || bottom <= 0) continue;

    candidates.push({
      left,
      top,
      right,
      bottom,
      center: [Math.round((left + right) / 2), Math.round((top + bottom) / 2)]
    });
  }

  candidates.sort((a, b) => a.top - b.top || a.left - b.left);
  return candidates;
}

export function findTextBounds(xml, text) {
  return findAllTextBounds(xml, text)[0] || null;
}

export async function readCurrentUi(config, localPath = "captures/debug/current-window.xml") {
  const target = await dumpUi(config, localPath);
  return readFile(target, "utf8");
}

export async function tapVisibleText(config, text, options = {}) {
  const xml = await readCurrentUi(config, options.xmlPath);
  const bounds = findTextBounds(xml, text);
  if (!bounds) return false;

  await tap(config, bounds.center[0], bounds.center[1]);
  return bounds;
}

export async function resetDirectory(path) {
  const target = resolvePath(path);
  await rm(target, { recursive: true, force: true });
  await mkdir(target, { recursive: true });
  return target;
}

export { repoRoot, resolvePath };
