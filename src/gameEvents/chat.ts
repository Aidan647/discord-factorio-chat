import { Event } from "."
import { config } from "../config"
import { format } from "../format"
import { delay, globals, logger, saveAllUsers } from "../index"
import { items } from "../locale"
import { sendToDiscord, sendToServer } from "../server"
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
			var message = exec?.[2] ?? ""
			if (config.Chat.ResolveItems) {
				message = message
					.replace(/\[special-item=internal_\d+\]/gm, "*[Blueprint]*")
				// if message contains key from items list, replace it with value
				for (const [key, value] of Object.entries(items)) {
					if (message.includes(key)) {
						message = message.replace(new RegExp(`\\[[^[\\]]+?=${key}\\]`, "gm"), `***[${value}]*** `)
					}
				}
				
			}
			await sendToDiscord(format(config.DiscordMessageFormat, { user, message }))
		}
	},
}

export default chat
