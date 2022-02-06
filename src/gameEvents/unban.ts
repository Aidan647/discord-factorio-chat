import { Event } from "."
import { format } from "../format"
import { config, globals } from "../index"

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
				if (config.Unban && globals.channel)
					globals.channel.send(format(config.UnbanMessage, { user, actionAuthor }))
			}
		}
	},
}
export default unban
