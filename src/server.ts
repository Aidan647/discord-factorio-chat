import { exec } from "child_process"
import { Tail } from "tail";
import { RCON_PASSWORD } from "."
export function watchLogs(path: string) {
	return new Tail(path, {encoding: "utf8", });
}
function execShellCommand(cmd: string) {
	return new Promise((resolve, reject) => {
		exec(cmd, (error, stdout, stderr) => {
			if (error) {
				reject(stderr)
			}
			resolve(stdout)
		})
	})
}
export function sendToServer(address: string, text: string) {
	//run rcon.exe
	//rcon.exe -a <address> -p <password> <text>
	const cmd = `rcon.exe -a ${address} -p ${RCON_PASSWORD} "${text.replaceAll('"', "").replaceAll('/', "")}"`
	return execShellCommand(cmd)
}