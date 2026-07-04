import { getDeviceInfo, loadConfig, screencap } from "./adb.mjs";

const config = await loadConfig();
const info = await getDeviceInfo(config);
console.log(info.size);
console.log(info.density);
console.log(info.focus);
console.log(`Saved ${await screencap(config, "captures/debug/smoke-test.png")}`);
