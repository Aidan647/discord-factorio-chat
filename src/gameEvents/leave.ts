import { Event } from "."
import { format } from "../format"
import { globals, logger } from "../index"
import { setActivity } from "../userActivity"
import { config } from "../config"
import { sendToDiscord } from "../server"

const reg = new RegExp(/^[0-9]+-[0-9]+-[0-9]+ [0-9]+:[0-9]+:[0-9]+ \[LEAVE] (.+?) left the game$/)
const leave: Event = {
	name: "leave",
	check: (line: string) => {
		return reg.test(line)
	},
	callback: async (line: string, silent: boolean) => {
		const user = reg.exec(line)?.[1] ?? ""
		if (user !== "") {
			//remove user from active users list
			if (!globals.activeUsers.includes(user))
				logger.warn(`${user} was not in the active users list`)
			else
				globals.activeUsers = globals.activeUsers.filter(u => u !== user)
			if (!silent) {
				setActivity()
				if (config.JoinLeave.Enable && globals.channel)
					sendToDiscord(format(config.JoinLeave.LeaveMessage, { user }))
			}
		}
	},
}
export default leave
