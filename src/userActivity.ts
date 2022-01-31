import { Client } from "discord.js"
import { client, globals } from "."

export function setActivity() {
	const users = globals.activeUsers.length
	client.user?.setPresence({
		status: globals.serverStarted ? "online" : "idle", // You can show online, idle... Do not disturb is dnd
		activities: globals.serverStarted
			? [
					{
						name: users !== 0 ? `${users} active player${users > 1 ? "s" : ""}` : "Empty server",
						type: "WATCHING",
					},
			  ]
			: [
					{
						name: "Offline server",
						type: "WATCHING",
					},
			  ],
	})
}
