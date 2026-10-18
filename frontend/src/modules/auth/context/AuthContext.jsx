import { 
    createContext, 
    useContext, 
    useState, 
    useEffect 
} from "react"
import { api } from "../../../lib/axios"


const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [activeRestaurant, setActiveRestaurant] = useState(null)
    const [loading, setLoading] = useState(true)
    // console.log(user)

    async function checkSession() {
        try {
            const response = await api.get("/users/profile")

            if (response && response?.data?.success === true) {
                const authenticatedUser = response.data.data.user
                setUser(authenticatedUser)
                console.log(authenticatedUser)

                // ⚡ SECURE SESSION AUTO-RESTORATION MATRIX:
                const backendRestaurantId = authenticatedUser.restaurantId
                const backendRestaurantName = authenticatedUser.restaurantName

                if (backendRestaurantId && backendRestaurantName) {
                    setActiveRestaurant({ id: backendRestaurantId, name: backendRestaurantName })

                    localStorage.setItem("active_restaurant_id", backendRestaurantId)
                    localStorage.setItem("active_restaurant_name", backendRestaurantName)
                    return
                }
            }

            const savedRestaurantId = localStorage.getItem("active_restaurant_id")
            const savedRestaurantName = localStorage.getItem("active_restaurant_name")

            if (savedRestaurantId && savedRestaurantName) {
                setActiveRestaurant({ id: savedRestaurantId, name: savedRestaurantName })
            }


        } catch (err) {
            console.error("🔴 Global context verification pass rejected:", err.message)
            setUser(null)
            setActiveRestaurant(null)
        } finally {
            setLoading(false)
        }
    }
    

    useEffect(() => {
        checkSession()
    }, [])

    return (
        <AuthContext.Provider 
            value={{ 
                user, 
                setUser, 
                activeRestaurant, 
                setActiveRestaurant, 
                loading, 
                checkSession 
            }}
        >
            { children }
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)

