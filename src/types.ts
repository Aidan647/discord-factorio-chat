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

	Commands: boolean
	CommandsPrefix: string

	OnlineCommand: boolean
	OnlineCommandMessage: string
	OnlineCommandNoPlayers: string
	OnlineCommandReply: string
	OnlineCommandReplyServerOffline: string

	InGameWelcome: boolean
	InGameMessage: string
	DiscordWelcome: boolean
	WelcomeMessage: string

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