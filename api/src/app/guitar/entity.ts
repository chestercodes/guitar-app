import { AttributeValue } from "@aws-sdk/client-dynamodb";
import { Guitar } from "./model";

export const toDynamoItem = (model: Guitar) => {
    return {
        id: { S: model.Id },
        make: { S: model.Make },
        model: { S: model.Model },
        imageurl: { S: model.ImageUrl },
    }
}

export const itemToModel = (table: Record<string, AttributeValue>): Guitar => {
    const getRequiredCol = (name: string) => {
        const v = table[name]
        if(!v){
            throw Error(`Cannot find ${name}`)
        }
        return v.S!
    }
    return {
        Id: getRequiredCol("id"),
        Make: getRequiredCol("make"),
        Model: getRequiredCol("model"),
        ImageUrl: getRequiredCol("imageurl"),
    }
}
