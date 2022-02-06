import { Client, Intents, TextChannel } from "discord.js"
import dotenv from "dotenv"
import winston from "winston"
import dayjs from "dayjs"
import { watchLogs } from "./server"
import fs from "fs/promises"
import { setActivity } from "./userActivity"
import { readFileSync } from "fs"
import { configFile } from "./types"
import watchGame from "./gameEvents"
import watchDiscord from "./discordEvents/index"

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
export const logger = winston.createLogger({
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

export const globals: {
	serverStarted: boolean
	activeUsers: string[]
	allUsers: string[]
	channel: TextChannel | null
} = {
	serverStarted: false,
	activeUsers: [],
	allUsers: [],
	channel: null,
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
export async function saveAllUsers() {
	await fs.writeFile("allUsers.json", JSON.stringify(globals.allUsers))
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
	globals.channel = channel
	logger.info("Starting...")
	const server = watchLogs(config.logPath)
	server.on("error", (line) => {
		logger.error(line)
	})
	const file = await fs.readFile(config.logPath, "utf8")
	const lines = file.split("\n")
	const openedRegEx = new RegExp(/^=== Log opened ([0-9]+(-[0-9]+)+) ([0-9]+(:[0-9]+)+) ===$/)
	const closedRegEx = new RegExp(/^=== Log closed ([0-9]+(-[0-9]+)+) ([0-9]+(:[0-9]+)+) ===$/)
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
		watchGame(activeServerList[i], true)
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
		if (message.author.bot) return
		watchDiscord(message)
	})

	server.on("line", (line) => {
		watchGame(line)
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
