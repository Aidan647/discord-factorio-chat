import { Event } from "."
import { format } from "../format"
import { config, globals, logger, saveAllUsers } from "../index"
import { sendToServer } from "../server"

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const online: Event = {
	name: "online",
	check: (message) => {
		if (config.Commands && message.content.startsWith(config.CommandsPrefix)) return false
		return true
	},
	callback: async (message) => {
		if (globals.serverStarted) {
			sendToServer(
				config.RconAddress,
				format(config.inGameMessageFormat, {
					message: message.content.trim(),
					user: message.member?.nickname ?? message.author.username,
				})
			).catch((err) => {
				message
					.reply(
						format(config.ErrorDelivering, {
							message: message.content.trim(),
							user: message.member?.nickname ?? message.author.username,
						})
					)
					.then(async (message) => {
						await delay(config.ErrorMessageDeleteTimeout)
						message.delete()
					})
				logger.error(err)
				return
			})
		} else {
			message
				.reply(
					format(config.ErrorServerNotRunning, {
						message: message.content.trim(),
						user: message.member?.nickname ?? message.author.username,
					})
				)
				.then(async (message) => {
					await delay(config.ErrorMessageDeleteTimeout)
					message.delete()
				})
			return
		}
	},
}

export default online
