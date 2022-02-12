import { Event } from "."
import { format } from "../format"
import { config, globals, logger, saveAllUsers } from "../index"
import { sendToServer } from "../server"

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const online: Event = {
	name: "online",
	check: (message) => {
		if (config.Commands && message.content.startsWith(config.Commands.Prefix)) return false
		return true
	},
	callback: async (message) => {
		if (globals.serverStarted) {
			console.log(message)
			sendToServer(
				format(config.FactorioMessageFormat, {
					message: message.content.trim(),
					user: message.member?.nickname ?? message.author.username,
				})
			).catch((err) => {
				message
					.reply(
						format(config.Errors.ErrorDelivering, {
							message: message.content.trim(),
							user: message.member?.nickname ?? message.author.username,
						})
					)
					.then(async (message) => {
						await delay(config.Errors.DeleteTimeout * 1000)
						message.delete()
					})
				logger.error(err)
				return
			})
		} else {
			message
				.reply(
					format(config.Errors.ErrorServerNotRunning, {
						message: message.content.trim(),
						user: message.member?.nickname ?? message.author.username,
					})
				)
				.then(async (message) => {
					await delay(config.Errors.DeleteTimeout * 1000)
					message.delete()
				})
			return
		}
	},
}

export default online
