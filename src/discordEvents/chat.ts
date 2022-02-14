import { Event } from "."
import { format } from "../format"
import { globals, logger, saveAllUsers } from "../index"
import { sendCommand, sendToServer } from "../server"
import { config } from "../config"

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
			var msg = message.content
			if (message.mentions.users.size > 0) {
				for (const [key, user] of message.mentions.users.entries()) {
					msg = msg.replace(
						new RegExp(`<@.${user.id}>`, "g"),
						"@" + (await message.guild?.members.fetch(user))?.nickname ?? user.username
					)
				}
			}
			if (message.mentions.roles.size > 0) {
				message.mentions.roles.forEach((role) => {
					msg = msg.replace(new RegExp(`<@.${role.id}>`, "g"), "@" + role.name)
				})
			}
			sendToServer(
				format(config.FactorioMessageFormat, {
					message: msg.trim(),
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
						if (config.Errors.DeleteTimeout <= 0) return
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
					if (config.Errors.DeleteTimeout <= 0) return
					await delay(config.Errors.DeleteTimeout * 1000)
					message.delete()
				})
			return
		}
	}
}

export default online
