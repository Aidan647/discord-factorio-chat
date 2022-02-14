import { Event } from "."
import { format } from "../format"
import { globals, logger, saveAllUsers } from "../index"
import { sendToDiscord, sendToServer } from "../server"
import { setActivity } from "../userActivity"
import { config } from "../config"

const reg = new RegExp(/^[0-9]+-[0-9]+-[0-9]+ [0-9]+:[0-9]+:[0-9]+ \[JOIN] (.+?) joined the game$/)
const join: Event = {
	name: "join",
	check: (line: string) => {
		return reg.test(line)
	},
	callback: async (line: string, silent: boolean) => {
		const user = reg.exec(line)?.[1] ?? ""
		var newUser = false
		if (user !== "") {
			if (globals.activeUsers.includes(user))
				logger.warn(`${user} was already in the active users list`)
			else
				globals.activeUsers.push(user)
			if (!globals.allUsers.includes(user)) {
				newUser = true
				globals.allUsers.push(user)
				saveAllUsers()
			}
			if (!silent) {
				setActivity()
				if (config.Welcome.InGame && newUser) sendToServer(format(config.Welcome.InGameMessage, { user })).catch((err) => {
					logger.error(err)
				})
				if (config.Welcome.Discord && newUser && globals.channel)
					sendToDiscord(format(config.Welcome.DiscordMessage, { user }))
				else if (config.JoinLeave.Enable && globals.channel)
					sendToDiscord(format(config.JoinLeave.JoinMessage, { user }))
			}
		}
	}
}
export default join