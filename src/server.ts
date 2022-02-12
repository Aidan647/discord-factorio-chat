import { exec } from "child_process"
import { Tail } from "tail";
import { config, logger } from "."


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
	return execShellCommand(cmd).catch(err => {
		logger.error(err)
		return ""
	})
}

export {sendToServer}