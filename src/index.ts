import { Client, Intents } from "discord.js"
import dotenv from "dotenv"
import winston from "winston"
import dayjs from "dayjs"
import { sendToServer, watchLogs } from "./server"
import fs from "fs/promises"
import { setActivity } from "./userActivity"
import { readFileSync } from "fs"
import { configFile } from "./types"
import { format } from "./format"
dotenv.config()

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const stripJSONComments = (data: string) => {
	var re = new RegExp("//(.*)", "g")
	return data.replace(re, "")
}

const jsonData = readFileSync("config.jsonc", "utf8")
export const config = JSON.parse(stripJSONComments(jsonData)) as configFile

// setup winston
const my_format = winston.format.printf(({ level, message, label, timestamp }) => {
	return `${dayjs(timestamp).format("HH:mm:ss")} [${level}]: ${message}`
})
const logLevels = {
	levels: {
		error: 0,
		warn: 1,
		info: 2,
	},
	colors: {
		error: "red",
		warn: "yellow",
		info: "white",
	},
}
winston.addColors(logLevels.colors)
const logger = winston.createLogger({
	levels: logLevels.levels,
	format: winston.format.combine(
		winston.format.colorize(),
		winston.format.timestamp(),
		winston.format.json(),
		my_format
	),
	transports: [
		new winston.transports.Console(),
		// new winston.transports.File({ filename: "logs/error.log", level: "error" }),
	],
})

export const globals = {
	serverStarted: false,
	activeUsers: [] as string[],
	allUsers: [] as string[],
}
//check if file exists
fs.stat("allUsers.json").then(
	() => {
		fs.readFile("allUsers.json", "utf8").then((data) => {
			globals.allUsers = JSON.parse(data)
		})
	},
	() => {}
)
function saveAllUsers() {
	fs.writeFile("allUsers.json", JSON.stringify(globals.allUsers))
}

export const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] })

client.on("ready", async () => {
	logger.info(`Logged in as ${client.user?.tag}!`)
	// run function start and close bot after it finishes
	start().then(() => client.destroy())
})
async function start() {
	if (config.logPath === undefined || config.logPath === "") {
		logger.error("logPath is not set")
		return
	}
	if (config.RconAddress === undefined || config.RconAddress === "") {
		logger.error("RconAddress is not set")
		return
	}
	if (process.env.RCON_PASSWORD === undefined || process.env.RCON_PASSWORD === "") {
		logger.error("RCON_PASSWORD is not set")
		return
	}
	const guild = client.guilds.cache.get(config.GuildId) ?? null
	if (!guild) {
		logger.error("Could not find guild!")
		return
	}
	const channel = guild.channels.cache.get(config.ChannelId) ?? null
	if (!channel) {
		logger.error("Could not find channel!")
		return
	}
	if (channel.type !== "GUILD_TEXT") {
		logger.error("Channel is not a guild text channel!")
		return
	}
	logger.info("Starting...")
	const server = watchLogs(config.logPath)
	server.on("error", (line) => {
		logger.error(line)
	})
	const file = await fs.readFile(config.logPath, "utf8")
	const lines = file.split("\n")
	const openedRegEx = new RegExp(/^=== Log opened ([0-9]+(-[0-9]+)+) ([0-9]+(:[0-9]+)+) ===$/)
	const closedRegEx = new RegExp(/^=== Log closed ([0-9]+(-[0-9]+)+) ([0-9]+(:[0-9]+)+) ===$/)
	const userJoined = new RegExp(/^[0-9]+-[0-9]+-[0-9]+ [0-9]+:[0-9]+:[0-9]+ \[JOIN] (.+?) joined the game$/)
	const userLeft = new RegExp(/^[0-9]+-[0-9]+-[0-9]+ [0-9]+:[0-9]+:[0-9]+ \[LEAVE] (.+?) left the game$/)
	const activeServerList: string[] = []
	// find last line matching openedRegEx or closedRegEx
	while (lines.length > 0) {
		const line = lines.pop() ?? ""
		if (openedRegEx.test(line)) {
			globals.serverStarted = true
			break
		}
		if (closedRegEx.test(line)) {
			globals.serverStarted = false
			break
		}
		// fill array from start
		activeServerList.unshift(line)
	}
	// use activeServerList
	for (var i = 0; i < activeServerList.length; i++) {
		const line = activeServerList[i]
		if (userJoined.test(line)) {
			const user = userJoined.exec(line)?.[1] ?? ""
			if (user !== "") {
				globals.activeUsers.push(user)
			}
		}
		if (userLeft.test(line)) {
			const user = userLeft.exec(line)?.[1] ?? ""
			if (user !== "") {
				globals.activeUsers.splice(globals.activeUsers.indexOf(user), 1)
			}
		}
	}
	if (!globals.serverStarted) {
		logger.info("Server is offline")
	}
	if (globals.serverStarted) {
		logger.info("Server is running")
	}
	setActivity()

	const collector = channel.createMessageCollector({ filter: (m) => !m.author.bot })
	collector.on("collect", async (message) => {
		const user = message.member?.nickname ?? message.author.username
		const onlinePlayers = globals.activeUsers.join(", ")
		const onlinePlayersCount = globals.activeUsers.length
		const formatData = {
			user,
			online: onlinePlayersCount.toString(),
			onlineList: onlinePlayers,
			message: message.content.trim(),
		}
		if (config.OnlineCommand && message.content.toLowerCase().startsWith("!o")) {
			if (globals.serverStarted) {
				// return online players
				if (onlinePlayersCount === 0) message.channel.send(format(config.OnlineCommandNoPlayers, formatData))
				else message.channel.send(format(config.OnlineCommandReply, formatData))
				return
			} else {
				message.reply(format(config.OnlineCommandReplyServerOffline, formatData)).then(async (message) => {
					//delete message after 10 seconds
					await delay(config.ErrorMessageDeleteTimeout)
					message.delete()
				})
				return
			}
		}

		// logger.info(`Message from ${message.author.tag}`)
		if (!globals.serverStarted) {
			message.reply(format(config.ErrorServerNotRunning, formatData)).then(async (message) => {
				//delete message after 10 seconds
				await delay(config.ErrorMessageDeleteTimeout)
				message.delete()
			})
			return
		}
		sendToServer(config.RconAddress, format(config.inGameMessageFormat, formatData)).catch((err) => {
			message.reply(format(config.ErrorDelivering, formatData)).then(async (message) => {
				//delete message after 10 seconds
				await delay(config.ErrorMessageDeleteTimeout)
				message.delete()
			})
			logger.error(err)
			return
		})
	})

	server.on("line", (line) => {
		if (config.ServerStatus) {
			if (openedRegEx.test(line)) {
				globals.serverStarted = true
				setActivity()
				channel.send(format(config.ServerStarted))
				logger.info("Server started")
				return
			}
			if (closedRegEx.test(line)) {
				globals.serverStarted = false
				setActivity()
				channel.send(format(config.ServerStopped))
				logger.info("Server stopped")
				return
			}
		}
		if ((config.InGameWelcome || config.DiscordWelcome) && userJoined.test(line)) {
			const user = userJoined.exec(line)?.[1] ?? ""
			if (user !== "") {
				// if user is in allUsers array, ignore
				if (!globals.allUsers.includes(user)) {
					globals.activeUsers.push(user)
					globals.allUsers.push(user)
					setActivity()
					if (config.InGameWelcome) sendToServer(config.RconAddress, format(config.InGameMessage, { user }))
					if (config.DiscordWelcome) channel.send(format(config.WelcomeMessage, { user }))
					// add user to activeUsers array and save to file
					saveAllUsers()
					return
				}
			}
		}
		if (config.sendJoinLeave) {
			if (userJoined.test(line)) {
				const user = userJoined.exec(line)?.[1] ?? ""
				if (user !== "") {
					globals.activeUsers.push(user)
					setActivity()
					channel.send(format(config.JoinMessage, { user }))
				}
				return
			}
			if (userLeft.test(line)) {
				const user = userLeft.exec(line)?.[1] ?? ""
				if (user !== "") {
					globals.activeUsers.splice(globals.activeUsers.indexOf(user), 1)
					setActivity()
					channel.send(format(config.LeaveMessage, { user }))
				}
				return
			}
		}

		const textReg = new RegExp(/^[0-9]+-[0-9]+-[0-9]+ [0-9]+:[0-9]+:[0-9]+ \[CHAT] (.+?): (.+)$/)
		const textMatch = textReg.exec(line)
		if (textMatch) {
			const user = textMatch[1]
			if (user === "<server>") return
			const message = textMatch[2]
			channel.send(format(config.messageFormat, { user, message }))
		}
	})

	return new Promise<void>((resolve, reject) => {
		collector.on("end", () => {
			logger.info("Stopping...")
			resolve()
		})
	})
}

logger.info("Logging...")
client.login(process.env.DISCORD_TOKEN)
