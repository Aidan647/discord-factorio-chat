export type configFile = {
	Settings: {
		GuildId: string
		ChannelId: string

		RconAddress: string
		LogPath: string
	}

	DiscordMessageFormat: string
	FactorioMessageFormat: string

	Chat: {
		ResolveItems: boolean
	}

	Players: {
		VerifyInterval: number
	}

	JoinLeave: {
		Enable: boolean
		JoinMessage: string
		LeaveMessage: string
	}

	ServerStatus: {
		Enable: boolean
		Started: string
		Stopped: string
	}

	Errors: {
		ErrorServerNotRunning: string
		ErrorDelivering: string

		DeleteTimeout: number
	}

	Bot: {
		AllowOtherBots: boolean
	}

	Commands: {
		Enable: boolean
		Prefix: string

		Online: {
			Enable: boolean
			Request: string
			Aliases: string[]
			NoPlayers: string
			Reply: string
			ReplyServerOffline: string
		}
	}

	Welcome: {
		InGame: boolean
		InGameMessage: string
		Discord: boolean
		DiscordMessage: string
	}

	Other: {
		Kick: boolean
		KickMessage: string

		Ban: boolean
		BanMessage: string

		Unban: boolean
		UnbanMessage: string

		Promote: boolean
		PromoteMessage: string

		Demote: boolean
		DemoteMessage: string
	}
}

export const defaultConfig: configFile = {
	Settings: {
		GuildId: "684508139646877708",
		ChannelId: "690218013865017361",

		RconAddress: "localhost:65535",

		LogPath: "E:/Factorio/log.txt",
	},

	DiscordMessageFormat: "**{user}:** {message}",
	FactorioMessageFormat: "[{user}]: {message}",

	Chat: {
		ResolveItems: true,
	},

	Players: {
		VerifyInterval: 60,
	},

	JoinLeave: {
		Enable: true,
		JoinMessage: "**{user}** joined the server",
		LeaveMessage: "**{user}** left the server.",
	},

	ServerStatus: {
		Enable: true,
		Started: "Server started",
		Stopped: "Server stopped",
	},

	Errors: {
		ErrorServerNotRunning: "Server is not running! Your message will not be sent to the server.",
		ErrorDelivering: "Could not send message to server!",

		DeleteTimeout: 15,
	},

	Bot: {
		AllowOtherBots: false,
	},

	Commands: {
		Enable: true,
		Prefix: "!",

		Online: {
			Enable: true,
			Request: "online",
			Aliases: ["o", "on", "who"],
			NoPlayers: "No players online",
			Reply: "Online players: {onlineList}",
			ReplyServerOffline: "Server is offline",
		},
	},

	Welcome: {
		InGame: true,
		InGameMessage: "Welcome to the server {user}!",
		Discord: true,
		DiscordMessage: "**{user}** joined the server for the first time!",
	},
	Other: {
		Kick: true,
		KickMessage: "**{user}** was kicked by **{actionAuthor}**. Reason: **{reason}**.",

		Ban: true,
		BanMessage: "**{user}** was banned by **{actionAuthor}**. Reason: **{reason}**.",

		Unban: true,
		UnbanMessage: "**{user}** was unbanned by **{actionAuthor}**.",

		Promote: true,
		PromoteMessage: "**{user}** was promoted to {role} by **{actionAuthor}**.",

		Demote: true,
		DemoteMessage: "**{user}** was demoted from {role} by **{actionAuthor}**.",
	},
}
