import { Event } from "."
import { format } from "../format"
import { config, globals, logger, saveAllUsers } from "../index"
import { sendToServer } from "../server"
import { setActivity } from "../userActivity"

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const chat: Event = {
	name: "chat",
	check: (message) => {
		if (config.Commands && message.content.startsWith(config.CommandsPrefix))
			return message.content === config.CommandsPrefix + config.OnlineCommandMessage
		return false
	},
	callback: async (message) => {
		if (globals.serverStarted) {
			// get unique active users
			//just in case
			const users = [...new Set(globals.activeUsers)]
			const onlinePlayersCount = users.length
			const data = { online: onlinePlayersCount.toString(), onlineList: users.join(", ") }
			if (onlinePlayersCount === 0) message.channel.send(format(config.OnlineCommandNoPlayers, data))
			else message.channel.send(format(config.OnlineCommandReply, data))
			return
		} else {
			message.reply(format(config.OnlineCommandReplyServerOffline, {})).then(async (message) => {
				await delay(config.ErrorMessageDeleteTimeout)
				message.delete()
			})
			return
		}
	},
}

export default chat
