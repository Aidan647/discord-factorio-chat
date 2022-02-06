import { Message } from "discord.js"
import chat from "./chat"
import online from "./online"

export type Event = {
	name: string
	// function to check if event should be triggered
	check: (message: Message) => boolean
	callback: (message: Message) => Promise<void>
}

const events: Event[] = []

events.push(chat)
events.push(online)


const watchDiscord = async (message: Message) => {
	for (const event of events) {
		if (event.check(message)) {
			await event.callback(message)
		}
	}
}
export default watchDiscord
