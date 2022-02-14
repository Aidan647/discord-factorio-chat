import { Event } from "."
import { format } from "../format"
import { globals } from "../index"
import { config } from "../config"
import { sendToDiscord } from "../server"

const reg = new RegExp(/^[0-9]+-[0-9]+-[0-9]+ [0-9]+:[0-9]+:[0-9]+ \[UNBANNED] (.+?) was unbanned by (.+?)\.$/)
const unban: Event = {
	name: "unban",
	check: (line: string) => {
		return reg.test(line)
	},
	callback: async (line: string, silent: boolean) => {
		if (!silent) {
			const exec = reg.exec(line)
			const user = exec?.[1] ?? ""
			const actionAuthor = exec?.[2] ?? ""
			if (user !== "") {
				if (config.Other.Unban && globals.channel)
					sendToDiscord(format(config.Other.UnbanMessage, { user, actionAuthor }))
			}
		}
	},
}
export default unban
