import { Event } from "."
import { format } from "../format"
import { config, globals, logger, saveAllUsers } from "../index"
import { sendToServer } from "../server"
import { setActivity } from "../userActivity"

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
				if (config.InGameWelcome && newUser) sendToServer(config.RconAddress, format(config.InGameMessage, { user }))
				if (config.DiscordWelcome && newUser && globals.channel)
					globals.channel.send(format(config.WelcomeMessage, { user }))
				else if (config.sendJoinLeave && globals.channel)
					globals.channel.send(format(config.JoinMessage, { user }))
			}
		}
	}
}
export default join