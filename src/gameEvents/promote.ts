import { Event } from "."
import { format } from "../format"
import { globals } from "../index"
import { config } from "../config"
import { sendToDiscord } from "../server"

const reg = new RegExp(/^[0-9]+-[0-9]+-[0-9]+ [0-9]+:[0-9]+:[0-9]+ \[PROMOTE] (.+?) was promoted to (.+?) by (.+?)\.$/)
const promote: Event = {
	name: "promote",
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
				if (config.Other.Promote && globals.channel)
					sendToDiscord(format(config.Other.PromoteMessage, { user, role, actionAuthor }))
			}
		}
	},
}
export default promote
