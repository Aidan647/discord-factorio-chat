import { Event } from "."
import { format } from "../format"
import { config, globals } from "../index"
import { setActivity } from "../userActivity"

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
				globals.channel.send(format(config.ServerStatus.Stopped, {}))
		}
	},
}
export default close
