import join from "./join"
import leave from "./leave"
import kick from "./kick"
import ban from "./ban"
import unban from "./unban"
import promote from "./promote"
import demote from "./demote"
import open from "./open"
import close from "./close"
import chat from "./chat"


export type Event = {
	name: string
	// function to check if event should be triggered
	check: (line: string) => boolean
	callback: (line: string, silent: boolean) => Promise<void>
}

const events: Event[] = []

events.push(join)
events.push(leave)
events.push(kick)
events.push(ban)
events.push(unban)
events.push(promote)
events.push(demote)
events.push(open)
events.push(close)
events.push(chat)


const watchLogs = async (line: string, silent = false) => {
	for (const event of events) {
		if (event.check(line)) {
			await event.callback(line, silent)
		}
	}
}
export default watchLogs

