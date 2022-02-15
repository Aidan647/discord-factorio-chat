import { awaitConfig, config } from "./config"
import { Client, Guild, Intents, TextChannel } from "discord.js"
import dotenv from "dotenv"
import winston from "winston"
import dayjs from "dayjs"
import { watchLogs } from "./server"
import fs from "fs/promises"
import { setActivity } from "./userActivity"
import { readFileSync } from "fs"
import watchGame from "./gameEvents"
import { watchDiscord, initDiscord } from "./discordEvents/index"
import { awaitLocale } from "./locale"
import { verifyPlayerCount } from "./lib/online"

dotenv.config()

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

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
winston.format.colorize()
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
export const fileExists = async (path: string) => {
	return fs.stat(path).then(
		() => true,
		() => false
	)
}

export const globals: {
	serverStarted: boolean
	activeUsers: string[]
	allUsers: string[]
	channel: TextChannel | null
	guild: Guild | null
} = {
	serverStarted: false,
	activeUsers: [],
	allUsers: [],
	channel: null,
	guild: null,
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
	const guild = client.guilds.cache.get(config.Settings.GuildId) ?? null
	if (!guild) {
		logger.error("Could not find guild!")
		return process.exit(1)
	}
	const channel = guild.channels.cache.get(config.Settings.ChannelId) ?? null
	if (!channel) {
		logger.error("Could not find channel!")
		return process.exit(1)
	}
	if (channel.type !== "GUILD_TEXT") {
		logger.error("Channel is not a guild text channel!")
		return process.exit(1)
	}
	globals.channel = channel
	globals.guild = guild
	logger.info("Starting...")
	const server = watchLogs(config.Settings.LogPath)
	server.on("error", (line) => {
		logger.error(line)
	})
	const file = await fs.readFile(config.Settings.LogPath, "utf8")
	const lines = file.split("\n")
	const openedRegEx = new RegExp(/^=== Log opened ([0-9]+(-[0-9]+)+) ([0-9]+(:[0-9]+)+) ===$/)
	const closedRegEx = new RegExp(/^=== Log closed ([0-9]+(-[0-9]+)+) ([0-9]+(:[0-9]+)+) ===$/)
	const activeServerList: string[] = []
	await initDiscord()
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
	await verifyPlayerCount(true).catch((e) => {
		logger.error("Initial player count check failed:" + e)
	})
	setActivity()
	// verifyPlayerCount every minute
	// if server is running
	if (config.Players.VerifyInterval > 0)
		setInterval(() => {
			if (globals.serverStarted) {
				verifyPlayerCount().catch((e) => {
					logger.error("Player count check failed" + e)
				})
			}
		}, config.Players.VerifyInterval * 1000)

	const collector = channel.createMessageCollector({ filter: (m) => !m.author.bot })
	collector.on("collect", async (message) => {
		if (!config.Bot.AllowOtherBots && message.author.bot) return
		if (message.author.id === client.user?.id) return
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
;(async () => {
	// load config
	logger.info("Loading config...")
	await awaitConfig
	if (config.Settings.LogPath === undefined || config.Settings.LogPath === "") {
		logger.error("logPath is not set")
		return process.exit(1)
	}
	if (!await fileExists(config.Settings.LogPath)) {
		logger.error("Log file does not exist. Check LogPath in config.json")
		return process.exit(1)
	}
	if (config.Settings.RconAddress === undefined || config.Settings.RconAddress === "") {
		logger.error("RconAddress is not set")
		return process.exit(1)
	}
	if (process.env.RCON_PASSWORD === undefined || process.env.RCON_PASSWORD === "") {
		logger.error("RCON_PASSWORD is not set")
		return process.exit(1)
	}
	await awaitLocale
	client.login(process.env.DISCORD_TOKEN)
})()
