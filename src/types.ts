export type configFile = {
	GuildId: string
	ChannelId: string
	RconAddress: string
	logPath: string

	messageFormat: string
	inGameMessageFormat: string

	sendJoinLeave: boolean
	JoinMessage: string
	LeaveMessage: string

	ServerStatus: boolean
	ServerStarted: string
	ServerStopped: string

	ErrorServerNotRunning: string
	ErrorDelivering: string
	ErrorMessageDeleteTimeout: number

	OnlineCommand: boolean
	OnlineCommandNoPlayers: string
	OnlineCommandReply: string
	OnlineCommandReplyServerOffline: string

	InGameWelcome: boolean
	InGameMessage: string
	DiscordWelcome: boolean
	WelcomeMessage: string
}