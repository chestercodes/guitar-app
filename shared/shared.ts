export interface SiteConfig {
    apiBaseUrl: string
}

export const siteConfigFileName = "config.json"

export interface GuitarDto {
    id: string
    make: string
    model: string
    imageUrl: string
}

export interface GuitarGetDto {
    items: GuitarDto[]
}