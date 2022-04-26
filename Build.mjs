const fs = require("fs")

const sharedPath = "./shared/shared.ts"

const dirs = [
  "./api/src/app",
  "./deploy",
  "./site/src",
  "./tests",
]

for (const dir of dirs) {
  const dest = `${dir}/shared.ts`
  console.log(`Copying ${sharedPath} to ${dest}`)
  fs.copyFileSync(sharedPath, dest)
}

await $`docker-compose -f Build.yml build --parallel`