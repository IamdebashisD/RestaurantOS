export default function validate (schema) {
    return (req, res, next) => {
        // GET requests use req.query, mutations use req.body
        const targetData = req.method === "GET" ? req.query : req.body

        const validationResult = schema.safeParse(targetData)

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed!',
                errors: validationResult.error.flatten().fieldErrors,
            })
        }

        if (req.method === "GET") {
            for (const key in req.query) {
                delete req.query[key]
            }
            Object.assign(req.query, validationResult.data)
        } else {
            req.body = validationResult.data
        }

        next()
    }
}