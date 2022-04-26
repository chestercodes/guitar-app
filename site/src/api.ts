import { getConfig } from "./config"

export const getGuitars = async () => {
  try {
    const config = await getConfig()
    const getGuitarsUrl = `${config.apiBaseUrl}guitar/`
    const response = await fetch(getGuitarsUrl)
    const json = await response.json()
    return json
  } catch (error) {
    console.log(error)
  }
}
