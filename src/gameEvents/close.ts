import { Event } from "."
import { format } from "../format"
import { globals } from "../index"
import { setActivity } from "../userActivity"
import { config } from "../config"
import { sendToDiscord } from "../server"

const reg = new RegExp(/^=== Log closed ([0-9]+(-[0-9]+)+) ([0-9]+(:[0-9]+)+) ===$/)
const close: Event = {
	name: "close",
	check: (line: string) => {
		return reg.test(line)
	},
	callback: async (line: string, silent: boolean) => {
		globals.serverStarted = false
		globals.activeUsers = []
		setActivity()
		if (!silent) {
			if (config.ServerStatus && globals.channel)
				sendToDiscord(format(config.ServerStatus.Stopped, {}))
		}
	},
}
export default close
