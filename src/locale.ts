import fs from "fs/promises"
import { logger } from "./index"

export type itemsType = {
	[key: string]: string
}

const fileExists = async (path: string) => {
	return fs.stat(path).then(
		() => true,
		() => false
	)
}
export const items: itemsType = {}

async function loadLocale() {
	if (!await fileExists("./locale/items.json")) {
		logger.error("items.json not found")
		return process.exit(1)
	}
	return fs.readFile("./locale/items.json", "utf8").then((data) => {
		Object.entries(JSON.parse(data) as itemsType).forEach(([key, value]) => {
			items[key] = value
		})
		return
	})
}

export const awaitLocale = loadLocale()
