import { Event } from "."
import { format } from "../format"
import { globals } from "../index"
import { config } from "../config"
import { sendToDiscord } from "../server"

const reg = new RegExp(/^[0-9]+-[0-9]+-[0-9]+ [0-9]+:[0-9]+:[0-9]+ \[DEMOTE] (.+?) was demoted from (.+?) by (.+?)\.$/)
const demote: Event = {
	name: "demote",
	check: (line: string) => {
		return reg.test(line)
	},
	callback: async (line: string, silent: boolean) => {
		if (!silent) {
			const exec = reg.exec(line)
			const user = exec?.[1] ?? ""
			const role = exec?.[2] ?? ""
			const actionAuthor = exec?.[3] ?? ""
			if (user !== "") {
				if (config.Other.Demote && globals.channel)
					sendToDiscord(format(config.Other.DemoteMessage, { user, role, actionAuthor }))
			}
		}
	},
}
export default demote
