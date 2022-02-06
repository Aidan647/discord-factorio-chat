import { Event } from "."
import { format } from "../format"
import { config, globals } from "../index"

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
				if (config.Demote && globals.channel)
					globals.channel.send(format(config.DemoteMessage, { user, role, actionAuthor }))
			}
		}
	},
}
export default demote
