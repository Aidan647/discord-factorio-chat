import { Event } from "."
import { format } from "../format"
import { globals, logger, saveAllUsers } from "../"
import { config } from "../config"
import { setActivity } from "../userActivity"

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const customFields: {
	aliases: string[]
} = {
	aliases: []
}

const online: Event = {
	name: "online",
	init: async () => {
		customFields.aliases = [...new Set(config.Commands.Online.Aliases)]
		customFields.aliases.push(config.Commands.Online.Request)
	},
	check: (message) => {
		if (config.Commands.Enable && config.Commands.Online.Enable && message.content.trim().startsWith(config.Commands.Prefix)) {
			const command = message.content.trim().substring(config.Commands.Prefix.length).split(" ")
			//config.Commands.Prefix + config.Commands.Online.Request
			// return true if if first word is prefix + alias
			for (const alias of customFields.aliases) {
				if (command[0] === alias) return true
			}
		}
		return false
	},
	callback: async (message) => {
		if (globals.serverStarted) {
			// get unique active users
			//just in case
			const users = [...new Set(globals.activeUsers)]
			const onlinePlayersCount = users.length
			const data = { online: onlinePlayersCount.toString(), onlineList: users.join(", ") }
			if (onlinePlayersCount === 0) message.channel.send(format(config.Commands.Online.NoPlayers, data))
			else message.channel.send(format(config.Commands.Online.Reply, data))
			return
		} else {
			message.reply(format(config.Commands.Online.ReplyServerOffline, {})).then(async (message) => {
				if (config.Errors.DeleteTimeout <= 0) return
				await delay(config.Errors.DeleteTimeout * 1000)
				message.delete()
			})
			return
		}
	},
}

export default online
