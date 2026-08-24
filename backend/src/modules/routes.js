import { Router } from "express"

import authRouter from "./auth/routes/auth.routes.js"
import userRouter from "./users/routes/user.routes.js"
import restaurantRouter from "./restaurants/routes/restaurant.routes.js"
import restaurantStaffRouter from "./restaurant-staff/routes/restaurant-staff.routes.js"
import restaurantTableRouter from "./restaurant-tables/routes/restaurant-table.routes.js"
import menuItemRouter from "./restaurant-menu/routes/menu-item.routes.js"


const rootRouter = Router()

rootRouter.use("/auth", authRouter)
rootRouter.use("/users", userRouter)
rootRouter.use("/restaurants", restaurantRouter, )
rootRouter.use("/restaurants", restaurantStaffRouter)
rootRouter.use("/restaurants", restaurantTableRouter)
rootRouter.use("/restaurants", menuItemRouter)

export default rootRouter
