import { Router } from "express"

import authRouter from "./auth/routes/auth.routes.js"
import userRouter from "./users/routes/user.routes.js"
import restaurantRouter from "./restaurants/routes/restaurant.routes.js"
import restaurantStaffRouter from "./restaurant-staff/routes/restaurant-staff.routes.js"



const rootRouter = Router()

rootRouter.use("/auth", authRouter)
rootRouter.use("/users", userRouter)
rootRouter.use("/restaurants", restaurantRouter, )
rootRouter.use("/restaurants", restaurantStaffRouter)

export default rootRouter
