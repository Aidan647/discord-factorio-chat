import { globals, logger, saveAllUsers } from ".."
import { sendCommand } from "../server"

export async function verifyPlayerCount(log = false) {
	// get player and fix globals.players if needed
	var failed = null
	const players = await getPlayers().catch((e) => {
		failed = e
	})
	if (failed !== null) {
		throw failed
	}
	if (!players) throw null
	Object.entries(players).forEach(([player, online]) => {
		// add player if not in allUsers 
		if (!globals.allUsers.includes(player)) {
			globals.allUsers.push(player)
			if (log) logger.info(`Added ${player} to allUsers`)
		}
		if (globals.activeUsers.includes(player) !== online)
			if (online) {
				globals.activeUsers.push(player)
				if (log) logger.info(`Added ${player} to activeUsers`)
			} else {
				globals.activeUsers = globals.activeUsers.filter((p) => p !== player)
				if (log) logger.info(`Removed ${player} from activeUsers`)
			}
	})
	// save all users
	saveAllUsers()
}

export async function getPlayers() {
	return sendCommand("/p").then((response) => {
		const players = response.split("\n")
		const playerStatus: { [name: string]: boolean } = {}
		players.forEach((player) => {
			if (/\s\s(.+?) \(online\)/.test(player))
				playerStatus[/\s\s(.+?) \(online\)/.exec(player)?.[1] ?? "<server>"] = true
			else if (/\s\s(.+?)$/.test(player)) playerStatus[/\s\s(.+?)$/.exec(player)?.[1] ?? "<server>"] = false
		})
		// remove <server> from playerStatus
		delete playerStatus["<server>"]
		return playerStatus
	})
}
