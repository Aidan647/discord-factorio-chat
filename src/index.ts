import { Client, Intents } from "discord.js"
import { config } from "dotenv"
import winston from "winston"
import dayjs from "dayjs"
import { sendToServer, watchLogs } from "./server"
import fs from "fs/promises"
import { setActivity } from './userActivity';
import { readFileSync } from "fs"
config()

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const stripJSONComments = (data: string) => {
	var re = new RegExp("//(.*)", "g")
	return data.replace(re, "")
}

const jsonData = readFileSync("config.jsonc", "utf8")
export const configData = JSON.parse(stripJSONComments(jsonData)) as {
	GuildId: string
	ChannelId: string
	RconAddress: string
	logPath: string
}

export const guildId = configData.GuildId ?? ""
export const channelId = configData.ChannelId ?? ""

export const SERVERLOGS = configData.logPath ?? ""
export const RCON_ADDRESS = configData.RconAddress ?? ""
export const RCON_PASSWORD = process.env.RCON_PASSWORD ?? ""
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
	activeUsers: [] as string[]
}

export const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] })

client.on("ready", async () => {
	logger.info(`Logged in as ${client.user?.tag}!`)
	// run function start and close bot after it finishes
	start().then(() => client.destroy())
})
async function start() {
	// check if SERVERLOGS RCON_PASSWORD RCON_ADDRESS are not ""
	if (SERVERLOGS === "") {
		logger.error("logPath is not set")
		return
	}
	if (RCON_ADDRESS === "") {
		logger.error("RconAddress is not set")
		return
	}
	if (RCON_PASSWORD === "") {
		logger.error("RCON_PASSWORD is not set")
		return
	}
	const guild = client.guilds.cache.get(guildId) ?? null
	if (!guild) {
		logger.error("Could not find guild!")
		return
	}
	const channel = guild.channels.cache.get(channelId) ?? null
	if (!channel) {
		logger.error("Could not find channel!")
		return
	}
	if (channel.type !== "GUILD_TEXT") {
		logger.error("Channel is not a guild text channel!")
		return
	}
	logger.info("Starting...")
	const server = watchLogs(SERVERLOGS)
	server.on("error", (line) => {
		logger.error(line)
	})
	const file = await fs.readFile(SERVERLOGS, "utf8")
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
		logger.info("Server is already running")
	}
	setActivity()

	const collector = channel.createMessageCollector({ filter: (m) => !m.author.bot })
	collector.on("collect", async (message) => {
		if (message.content.toLowerCase().startsWith("!o")) {
			if (globals.serverStarted) {
				// return online players
				const onlinePlayers = globals.activeUsers.join(", ")
				if (onlinePlayers === "") message.channel.send("No players online")
				else message.channel.send(`Online players: ${onlinePlayers}`)
				return
			} else {
				message
					.reply("Server is offline")
					.then(async (message) => {
						//delete message after 10 seconds
						await delay(10000)
						message.delete()
					})
				return
			}
		}

		// logger.info(`Message from ${message.author.tag}`)
		if (!globals.serverStarted) {
			message
				.reply("Server is not running! Your message will not be sent to the server.")
				.then(async (message) => {
					//delete message after 10 seconds
					await delay(10000)
					message.delete()
				})
			return
		}
		const content = message.content.trim()
		sendToServer(
			RCON_ADDRESS,
			`[${message.member?.nickname ?? message.author.username}]: ${content}`
		).catch((err) => {
			message.reply("Could not send message to server!").then(async (message) => {
				//delete message after 10 seconds
				await delay(10000)
				message.delete()
			})
			logger.error(err)
			return
		})
	})

	server.on("line", (line) => {
		if (openedRegEx.test(line)) {
			globals.serverStarted = true
			setActivity()
			channel.send("Server started")
			logger.info("Server started")
			return
		}
		if (closedRegEx.test(line)) {
			globals.serverStarted = false
			setActivity()
			channel.send("Server stopped")
			logger.info("Server stopped")
			return
		}
		if (userJoined.test(line)) {
			const user = userJoined.exec(line)?.[1] ?? ""
			if (user !== "") {
				globals.activeUsers.push(user)
				setActivity()
				channel.send(`**${user}** joined the server`)
			}
			return
		}
		if (userLeft.test(line)) {
			const user = userLeft.exec(line)?.[1] ?? ""
			if (user !== "") {
				globals.activeUsers.splice(globals.activeUsers.indexOf(user), 1)
				setActivity()
				channel.send(`**${user}** left the server`)
			}
			return
		}
		const textReg = new RegExp(/^[0-9]+-[0-9]+-[0-9]+ [0-9]+:[0-9]+:[0-9]+ \[CHAT] (.+?): (.+)$/)
		const textMatch = textReg.exec(line)
		if (textMatch) {
			const user = textMatch[1]
			if (user === "<server>") return
			const message = textMatch[2]
			channel.send(`**[${user}]: **\`${message}\``)
		}
	})

	return new Promise<void>((resolve, reject) => {
		collector.on("end", () => {
			logger.info("Stopping...")
			resolve()
		})
	})
}

// // Await !vote messages
// const filter = m => m.content.startsWith('!vote');
// // Errors: ['time'] treats ending because of the time limit as an error
// channel.awaitMessages({ filter, max: 4, time: 60_000, errors: ['time'] })
// 	.then(collected => console.log(collected.size))
// 	.catch(collected => console.log(`After a minute, only ${collected.size} out of 4 voted.`));

logger.info("Logging...")
client.login(process.env.DISCORD_TOKEN)
