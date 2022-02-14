import { Event } from "."
import { format } from "../format"
import { globals } from "../index"
import { setActivity } from "../userActivity"
import { config } from "../config"
import { sendToDiscord } from "../server"

const reg = new RegExp(/^=== Log opened ([0-9]+(-[0-9]+)+) ([0-9]+(:[0-9]+)+) ===$/)
const open: Event = {
	name: "open",
	check: (line: string) => {
		return reg.test(line)
	},
	callback: async (line: string, silent: boolean) => {
		globals.serverStarted = true
		setActivity()
		if (!silent) {
			if (config.ServerStatus.Enable && globals.channel)
				sendToDiscord(format(config.ServerStatus.Started, {}))
		}
	},
}
export default open
