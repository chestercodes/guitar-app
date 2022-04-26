export interface Config {
  baseApiUrl: string
}

export const getConfig = async () => {
  try {
    const response = await fetch("config.json")
    const config = await response.json()
    return config
  } catch (error) {
    console.log(error)
  }
}
