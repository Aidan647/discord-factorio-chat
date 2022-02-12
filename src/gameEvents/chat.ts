import { Event } from "."
import { format } from "../format"
import { config, globals, logger, saveAllUsers } from "../index"
import { sendToServer } from "../server"
import { setActivity } from "../userActivity"

const reg = new RegExp(/^[0-9]+-[0-9]+-[0-9]+ [0-9]+:[0-9]+:[0-9]+ \[CHAT] (.+?): (.+)$/)
const chat: Event = {
	name: "chat",
	check: (line: string) => {
		if (reg.test(line)) {
			const user = reg.exec(line)?.[1] ?? "<server>"
			if (user !== "<server>") return true
		}
		return false
	},
	callback: async (line: string, silent: boolean) => {
		if (!silent && globals.channel) {
			const exec = reg.exec(line)
			const user = exec?.[1] ?? ""
			const message = exec?.[2] ?? ""

			globals.channel.send(format(config.DiscordMessageFormat, { user, message }))
		}
	},
}

export default chat
