import { dumpUi, getDeviceInfo, loadConfig, screencap } from "./adb.mjs";

const config = await loadConfig();
const now = new Date().toISOString().replace(/[:.]/g, "-");
const imagePath = `captures/debug/${now}-screen.png`;
const xmlPath = `captures/debug/${now}-window.xml`;

console.log(await getDeviceInfo(config));
console.log(`Screenshot: ${await screencap(config, imagePath)}`);
console.log(`UI dump: ${await dumpUi(config, xmlPath)}`);
