import { Event } from "."
import { format } from "../format"
import { config, globals } from "../index"
import { setActivity } from "../userActivity"

const reg = new RegExp(
	/^[0-9]+-[0-9]+-[0-9]+ [0-9]+:[0-9]+:[0-9]+ \[KICK] (.+?) was kicked by (.+?)\. Reason: (.+?)\.$/
)
const kick: Event = {
	name: "kick",
	check: (line: string) => {
		return reg.test(line)
	},
	callback: async (line: string, silent: boolean) => {
		const exec = reg.exec(line)
		const user = exec?.[1] ?? ""
		const actionAuthor = exec?.[2] ?? ""
		const reason = exec?.[3] ?? ""
		if (user !== "") {
			//remove user from active users list
			globals.activeUsers = globals.activeUsers.filter((u) => u !== user)
			if (!silent) {
				setActivity()
				if (config.Kick && globals.channel)
					globals.channel.send(format(config.KickMessage, { user, actionAuthor, reason }))
			}
		}
	},
}
export default kick
