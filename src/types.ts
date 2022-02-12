export type configFile = {
	Settings: {
		GuildId: string
		ChannelId: string

		RconAddress: string
		LogPath: string
	}

	DiscordMessageFormat: string
	FactorioMessageFormat: string

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

	Bot:{
		AllowOtherBots: boolean
	}

	Commands: {
		Enable: boolean
		Prefix: string

		Online: {
			enable: boolean
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
