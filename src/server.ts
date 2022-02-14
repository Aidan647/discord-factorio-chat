import { exec } from "child_process"
import { Tail } from "tail";
import { delay, logger } from "."
import { config } from "./config"
import { globals } from './index';


export function watchLogs(path: string) {
	return new Tail(path, {encoding: "utf8", });
}
function execShellCommand(cmd: string):Promise<string> {
	return new Promise<string>((resolve, reject) => {
		exec(cmd, (error, stdout, stderr) => {
			if (error) {
				reject(stderr)
			}
			resolve(stdout)
		})
	})
}
async function sendCommand(text: string): Promise<string>
async function sendCommand(address: string, text: string): Promise<string>
async function sendCommand(address: string, text?: string): Promise<string> {
	if (!text) {
		text = address
		address = config.Settings.RconAddress
	}
	//run rcon.exe
	//rcon.exe -a <address> -p <password> <text>
	const cmd = `rcon.exe -a ${address} -p ${process.env.RCON_PASSWORD} "${text}"`
	return execShellCommand(cmd)
}
async function sendToServer(text: string): Promise<string>
async function sendToServer(address: string, text: string): Promise<string>
async function sendToServer(address: string, text?: string): Promise<string> {
	if (!text) {
		text = address
		address = config.Settings.RconAddress
	}
	//run rcon.exe
	//rcon.exe -a <address> -p <password> <text>
	const cmd = `rcon.exe -a ${address} -p ${process.env.RCON_PASSWORD} "${text
		.replaceAll('"', "")
		.replaceAll("/", "")}"`
	return execShellCommand(cmd)
}

async function sendToDiscord(message: string) {
	await globals.channel
		?.send(message)
		.catch(async () => {
			// try again in 2 seconds
			await delay(2000)
			return globals.channel?.send(message)
		})
		.catch((err) => {
			logger.error(`Failed to send message to discord: ${err}`)
		})
	return
}
export { sendToServer, sendCommand, sendToDiscord }