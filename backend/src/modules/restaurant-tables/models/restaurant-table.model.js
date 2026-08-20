import mongoose, { Schema } from "mongoose";

const restaurantTableSchema = new mongoose.Schema(
    {
        restaurant: {
            type: mongoose.Schema.Types.ObjectId,
            res: "Restaurant",
            required: true,
        },
        tableNumber: {
            type: Number,
            required: true,
            min: 1,
        },
        capacity: {
            type: Number,
            required: true,
            min: 1
        },
        status: {
            type: String,
            enum: [
                "AVAILABLE",
                "OCCUPIED",
                "RESERVED",
                "INACTIVE",
            ],
            default: "AVAILABLE"
        }
    },
    { timestamps: true }
)

/** 
 |===============================================================================|
 | Why the compound unique index?                                                |
 |                                                                               |
 | This is important:                                                            |
 |                                                                               |
 |{ restaurant: 1, tableNumber: 1 }                                              |
 |                                                                               |     
 | It means the same table number cannot exist twice inside the same restaurant. |
 |       Restaurant A                                                            |
 |       ├── Table 1 ✅                                                          | 
 |       ├── Table 2 ✅                                                          |
 |       └── Table 3 ✅                                                          |
 |                                                                               |
 |       Restaurant B                                                            |               
 |       ├── Table 1 ✅                                                          |   
 |       ├── Table 2 ✅                                                          |       
 |  That's allowed because Table 1 in Restaurant A and Table 1 in Restaurant     |
 |  B are different physical tables.                                             |   
 |                                                                               |           
 |   But:                                                                        |
 |   Restaurant A                                                                |     
 |   ├── Table 1                                                                 |   
 |   └── Table 1 ❌                                                              |    
 |   will be rejected by MongoDB.                                                |
 |===============================================================================|
*/

restaurantTableSchema.index({ restaurant: 1, tablenumber: 1 }, { unique: true })

export const RestaurantTable = mongoose.model("RestaurantTable", restaurantTableSchema)